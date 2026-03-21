const { getFullMLResult } = require('./mlservice')
const LoanEligibilityCheck = require('../models/LoanEligibilityCheck')
const FinancialProfile = require('../models/FinancialProfile')

// Helpers
const calculateTotalMonthlyObligations = (profile) => {
    const emiTotal = profile.existingEmis.reduce((sum, e) => sum + e.monthlyAmount, 0)
    const ccTotal = profile.creditCardDues.reduce((sum, c) => sum + c.minimumDue, 0)
    const loanTotal = profile.otherLoans.reduce((sum, l) => sum + l.monthlyEMI, 0)
    return emiTotal + ccTotal + loanTotal
}

const calculateEMI = (principal, annualRatePercent, tenureMonths) => {
    const r = annualRatePercent / 12 / 100
    if (r === 0) return principal / tenureMonths
    return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1)
}


// ML scoring — calls Python microservices
// Returns { score, riskScore } or falls back to 50/50 if service is down
const computeMLScores = async (profile, requestedLoanAmount, tenureMonths, hasCoApplicant) => {
    try {
        const { prediction } = await getFullMLResult(profile, requestedLoanAmount, tenureMonths, hasCoApplicant)
        return {
            eligibilityScore: prediction.score,
            riskScore: prediction.score,        // use same score; risk category comes from ML
            mlPrediction: prediction,
            mlAvailable: true
        }
    } catch (err) {
        console.warn("ML service unavailable, using fallback scores:", err.message)
        return { eligibilityScore: 50, riskScore: 50, mlPrediction: null, mlAvailable: false }
    }
}


// Offer generation — derives approved amount, tenure, rate, and EMI from scores

const LOAN_TYPE_CONFIG = {
    "Personal Loan":   { baseRate: 12, maxTenureMonths: 60,   maxAmount: 4000000  },
    "Education Loan":  { baseRate: 9,  maxTenureMonths: 120,  maxAmount: 10000000 },
    "Home Loan":       { baseRate: 8,  maxTenureMonths: 300,  maxAmount: 100000000},
    "Vehicle Loan":    { baseRate: 10, maxTenureMonths: 84,   maxAmount: 10000000 },
    "Business Loan":   { baseRate: 14, maxTenureMonths: 60,   maxAmount: 20000000 }
}

const generateOffer = (requestedLoanAmount, loanType, eligibilityScore, riskScore) => {
    const config = LOAN_TYPE_CONFIG[loanType]

    // Risk premium on interest rate — higher risk = higher rate
    const riskPremium = riskScore > 70 ? 3 : riskScore > 50 ? 2 : riskScore > 30 ? 1 : 0
    const approvedRate = config.baseRate + riskPremium

    // Approved amount — reduce if risk is high
    const amountMultiplier = riskScore > 70 ? 0.6 : riskScore > 50 ? 0.75 : riskScore > 30 ? 0.9 : 1
    const approvedAmount = Math.min(
        Math.round(requestedLoanAmount * amountMultiplier),
        config.maxAmount
    )

    // Approved tenure — reduce if eligibility score is low
    const tenureMultiplier = eligibilityScore > 70 ? 1 : eligibilityScore > 50 ? 0.85 : 0.7
    const approvedTenure = Math.round(config.maxTenureMonths * tenureMultiplier)

    const emi = Math.round(calculateEMI(approvedAmount, approvedRate, approvedTenure))

    return {
        maxApprovedLoanAmount: approvedAmount,
        maxApprovedTenureMonths: approvedTenure,
        maxApprovedInterestRatePercent: approvedRate,
        emi
    }
}


// Rule engine — hard rejections
const runRuleEngine = (profile, requestedLoanAmount, loanType, loanDetails) => {
    const rejectionReasons = []
    const totalObligations = calculateTotalMonthlyObligations(profile)
    const income = profile.monthlyNetIncome

    // ── Universal rules (apply to all loan types) ──────────────────────────

    // Credit score — thin file (0) is only allowed for education loans
    if (profile.creditScore === 0 && loanType !== "Education Loan") {
        rejectionReasons.push("No credit history found. A credit score is required for this loan type.")
    }
    if (profile.creditScore > 0 && profile.creditScore < 600) {
        rejectionReasons.push(`Credit score of ${profile.creditScore} is below the minimum required score of 600.`)
    }

    // Payment history
    if (profile.paymentHistoryFlag === "Serious Default") {
        rejectionReasons.push("Serious default found in payment history.")
    }

    // FOIR check — total obligations after new EMI should not exceed 50% of income
    // Skip FOIR for education loans since income is 0 (co-applicant income used instead)
    if (loanType !== "Education Loan" && income > 0) {
        const estimatedNewEMI = calculateEMI(
            requestedLoanAmount,
            LOAN_TYPE_CONFIG[loanType].baseRate,
            LOAN_TYPE_CONFIG[loanType].maxTenureMonths
        )
        const foir = (totalObligations + estimatedNewEMI) / income
        if (foir > 0.5) {
            rejectionReasons.push(`FOIR of ${(foir * 100).toFixed(1)}% exceeds the maximum allowed limit of 50%.`)
        }
    }

    // Requested amount exceeds loan type maximum
    if (requestedLoanAmount > LOAN_TYPE_CONFIG[loanType].maxAmount) {
        rejectionReasons.push(`Requested amount exceeds the maximum allowed limit of ₹${LOAN_TYPE_CONFIG[loanType].maxAmount.toLocaleString('en-IN')} for ${loanType}.`)
    }

    // Excessive recent loan inquiries
    const recentInquiries = profile.recentLoanInquiries.filter(i => i.monthsAgo <= 6)
    if (recentInquiries.length >= 3) {
        rejectionReasons.push("Too many loan inquiries in the last 6 months.")
    }

    // Loan type specific rules
    if (loanType === "Personal Loan") {
        if (profile.employmentType === "Unemployed") {
            rejectionReasons.push("Unemployed applicants are not eligible for personal loans.")
        }
        if (profile.employmentType === "Student") {
            rejectionReasons.push("Student applicants are not eligible for personal loans.")
        }
        if (income < 25000) {
            rejectionReasons.push("Minimum monthly income of ₹25,000 is required for personal loans.")
        }
    }

    if (loanType === "Education Loan") {
        const coApplicant = loanDetails.coApplicant
        // Co-applicant is enforced at validator level too, but double-check here
        if (!coApplicant) {
            rejectionReasons.push("A co-applicant is required for education loans.")
        } else {
            const coTotalObligations = coApplicant.existingEmis.reduce((sum, e) => sum + e.monthlyAmount, 0)
                + coApplicant.otherLoans.reduce((sum, l) => sum + l.monthlyEMI, 0)
            const coIncome = coApplicant.monthlyNetIncome
            if (coIncome === 0) {
                rejectionReasons.push("Co-applicant must have a monthly income greater than 0.")
            } else {
                const estimatedNewEMI = calculateEMI(
                    requestedLoanAmount,
                    LOAN_TYPE_CONFIG["Education Loan"].baseRate,
                    LOAN_TYPE_CONFIG["Education Loan"].maxTenureMonths
                )
                const coFoir = (coTotalObligations + estimatedNewEMI) / coIncome
                if (coFoir > 0.5) {
                    rejectionReasons.push(`Co-applicant FOIR of ${(coFoir * 100).toFixed(1)}% exceeds the maximum allowed limit of 50%.`)
                }
            }
        }
        if (loanDetails.totalCourseFee && requestedLoanAmount > loanDetails.totalCourseFee) {
            rejectionReasons.push("Requested loan amount cannot exceed total course fee for education loans.")
        }
    }

    if (loanType === "Home Loan") {
        if (income < 35000) {
            rejectionReasons.push("Minimum monthly income of ₹35,000 is required for home loans.")
        }
        // LTV check — loan should not exceed 80% of property value
        if (loanDetails.propertyValue) {
            const ltv = requestedLoanAmount / loanDetails.propertyValue
            if (ltv > 0.8) {
                rejectionReasons.push(`Loan-to-value ratio of ${(ltv * 100).toFixed(1)}% exceeds the maximum allowed limit of 80%.`)
            }
        }
    }

    if (loanType === "Vehicle Loan") {
        // LTV check — loan should not exceed 85% of vehicle price
        if (loanDetails.vehiclePrice) {
            const ltv = requestedLoanAmount / loanDetails.vehiclePrice
            if (ltv > 0.85) {
                rejectionReasons.push(`Loan-to-value ratio of ${(ltv * 100).toFixed(1)}% exceeds the maximum allowed limit of 85%.`)
            }
        }
        // Used vehicles older than 5 years are not eligible
        if (loanDetails.vehicleAge && loanDetails.vehicleAge > 5) {
            rejectionReasons.push("Vehicles older than 5 years are not eligible for vehicle loans.")
        }
    }

    if (loanType === "Business Loan") {
        if (loanDetails.businessVintageMonths < 12) {
            rejectionReasons.push("Business must be at least 12 months old to be eligible for a business loan.")
        }
        if (loanDetails.annualTurnover < 1200000) {
            rejectionReasons.push("Minimum annual turnover of ₹12,00,000 is required for business loans.")
        }
        if (loanDetails.GSTFilingHistory === "Defaulted") {
            rejectionReasons.push("Defaulted GST filing history makes the applicant ineligible for a business loan.")
        }
    }

    return rejectionReasons
}

const createLoanEligibilityCheckService = async (userID, data) => {
    const { requestedLoanAmount, loanType, loanDetails } = data

    // Rule 1 — financial profile must exist
    const profile = await FinancialProfile.findOne({ userID })
    if (!profile) {
        throw new Error("Financial profile not found. Please complete your financial profile before checking loan eligibility.")
    }

    // Rule engine — hard rejections
    const rejectionReasons = runRuleEngine(profile, requestedLoanAmount, loanType, loanDetails)
    const eligible = rejectionReasons.length === 0

    // Default tenure per loan type for ML input
    const defaultTenure = {
        "Personal Loan": 60, "Education Loan": 120,
        "Home Loan": 240, "Vehicle Loan": 84, "Business Loan": 60
    }
    const tenureMonths = loanDetails.totalWorkExperienceMonths
        ? defaultTenure[loanType]
        : defaultTenure[loanType]
    const hasCoApplicant = !!loanDetails.coApplicant

    // Call ML service (runs even on rejection — for explanation)
    const { eligibilityScore, riskScore, mlPrediction, mlAvailable } =
        await computeMLScores(profile, requestedLoanAmount, tenureMonths, hasCoApplicant)

    // Get SHAP explanation separately if ML is available
    let mlExplanation = null
    if (mlAvailable) {
        try {
            const { getFullMLResult } = require('./mlservice')
            const payload = {
                age: profile.age,
                employment_type: profile.employmentType,
                city_tier: profile.cityTier,
                has_coapplicant: hasCoApplicant ? 1 : 0,
                monthly_income: profile.monthlyNetIncome,
                credit_score: profile.creditScore,
                total_existing_emi:
                    profile.existingEmis.reduce((s, e) => s + e.monthlyAmount, 0) +
                    profile.creditCardDues.reduce((s, c) => s + c.minimumDue, 0) +
                    profile.otherLoans.reduce((s, l) => s + l.monthlyEMI, 0),
                requested_loan_amount: requestedLoanAmount,
                loan_tenure_months: tenureMonths,
                work_experience_years: profile.employmentTenureMonths / 12,
            }
            const axios = require('axios')
            const { data } = await axios.post(
                (process.env.SHAP_SERVICE_URL || 'http://localhost:8001') + '/explain',
                payload, { timeout: 15000 }
            )
            mlExplanation = data
        } catch (e) {
            console.warn("SHAP service unavailable:", e.message)
        }
    }

    let results = {
        eligible,
        rejectionReasons,
        eligibilityScore: eligible ? eligibilityScore : null,
        riskScore: eligible ? riskScore : null,
        riskCategory: null,
        maxApprovedLoanAmount: null,
        maxApprovedTenureMonths: null,
        maxApprovedInterestRatePercent: null,
        emi: null
    }

    if (eligible) {
        const riskCategory =
            riskScore <= 20 ? "Very Low" :
            riskScore <= 40 ? "Low" :
            riskScore <= 60 ? "Medium" :
            riskScore <= 80 ? "High" : "Very High"

        const offer = generateOffer(requestedLoanAmount, loanType, eligibilityScore, riskScore)

        results = {
            eligible: true,
            rejectionReasons: [],
            eligibilityScore,
            riskScore,
            riskCategory,
            ...offer
        }
    }

    const check = await LoanEligibilityCheck.create({
        userID,
        requestedLoanAmount,
        loanType,
        loanDetails,
        results,
        mlResult: mlPrediction ? {
            probability:  mlPrediction.probability,
            score:        mlPrediction.score,
            riskCategory: mlPrediction.risk_category,
            verdict:      mlPrediction.verdict,
            confidence:   mlPrediction.confidence,
        } : null,
        mlExplanation: mlExplanation ? {
            summary:     mlExplanation.summary,
            topPositive: mlExplanation.top_positive,
            topNegative: mlExplanation.top_negative,
            baseValue:   mlExplanation.base_value,
        } : null,
    })

    return check
}

const getLoanEligibilityChecksService = async (userID) => {
    const checks = await LoanEligibilityCheck.find({ userID }).sort({ createdAt: -1 })
    return checks
}

const getLoanEligibilityCheckByIdService = async (userID, checkID) => {
    const check = await LoanEligibilityCheck.findOne({ _id: checkID, userID })
    if (!check) {
        throw new Error("Loan eligibility check not found.")
    }
    return check
}

module.exports = {
    createLoanEligibilityCheckService,
    getLoanEligibilityChecksService,
    getLoanEligibilityCheckByIdService
}
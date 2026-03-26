const { getFullMLResult } = require('./mlservice');
const LoanEligibilityCheck = require('../models/LoanEligibilityCheck');
const FinancialProfile = require('../models/FinancialProfile');
const { recordDataOnChain } = require('./blockchainservice'); 

// --- Helpers ---
const calculateTotalMonthlyObligations = (profile) => {
    const emiTotal  = profile.existingEmis.reduce((sum, e) => sum + e.monthlyAmount, 0);
    const ccTotal   = profile.creditCardDues.reduce((sum, c) => sum + c.minimumDue, 0);
    const loanTotal = profile.otherLoans.reduce((sum, l) => sum + l.monthlyEMI, 0);
    return emiTotal + ccTotal + loanTotal;
};

const calculateEMI = (principal, annualRatePercent, tenureMonths) => {
    const r = annualRatePercent / 12 / 100;
    if (r === 0) return principal / tenureMonths;
    return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
};

// ML scoring — calls Python microservices
const computeMLScores = async (profile, requestedLoanAmount, tenureMonths, hasCoApplicant) => {
    try {
        const { prediction } = await getFullMLResult(profile, requestedLoanAmount, tenureMonths, hasCoApplicant);
        return {
            eligibilityScore: prediction.score,
            riskScore:        prediction.risk_score,  // ✅ fixed: was prediction.score
            mlPrediction:     prediction,
            mlAvailable:      true,
        };
    } catch (err) {
        console.warn("ML service unavailable, using fallback scores:", err.message);
        return { eligibilityScore: 50, riskScore: 50, mlPrediction: null, mlAvailable: false };
    }
};

// Offer generation
const LOAN_TYPE_CONFIG = {
    "Personal Loan":  { baseRate: 12, maxTenureMonths: 60,  maxAmount: 4000000   },
    "Education Loan": { baseRate: 9,  maxTenureMonths: 120, maxAmount: 10000000  },
    "Home Loan":      { baseRate: 8,  maxTenureMonths: 300, maxAmount: 100000000 },
    "Vehicle Loan":   { baseRate: 10, maxTenureMonths: 84,  maxAmount: 10000000  },
    "Business Loan":  { baseRate: 14, maxTenureMonths: 60,  maxAmount: 20000000  },
};

const generateOffer = (requestedLoanAmount, loanType, eligibilityScore, riskScore) => {
    const config          = LOAN_TYPE_CONFIG[loanType];
    const riskPremium     = riskScore > 70 ? 3 : riskScore > 50 ? 2 : riskScore > 30 ? 1 : 0;
    const approvedRate    = config.baseRate + riskPremium;
    const amountMultiplier = riskScore > 70 ? 0.6 : riskScore > 50 ? 0.75 : riskScore > 30 ? 0.9 : 1;
    const approvedAmount  = Math.min(Math.round(requestedLoanAmount * amountMultiplier), config.maxAmount);
    const tenureMultiplier = eligibilityScore > 70 ? 1 : eligibilityScore > 50 ? 0.85 : 0.7;
    const approvedTenure  = Math.round(config.maxTenureMonths * tenureMultiplier);
    const emi             = Math.round(calculateEMI(approvedAmount, approvedRate, approvedTenure));

    return {
        maxApprovedLoanAmount:        approvedAmount,
        maxApprovedTenureMonths:      approvedTenure,
        maxApprovedInterestRatePercent: approvedRate,
        emi,
    };
};

// Rule engine — hard rejections
const runRuleEngine = (profile, requestedLoanAmount, loanType) => {
    const rejectionReasons  = [];
    const totalObligations  = calculateTotalMonthlyObligations(profile);
    const income            = profile.monthlyNetIncome;

    if (profile.creditScore === 0 && loanType !== "Education Loan") {
        rejectionReasons.push("No credit history found. A credit score is required.");
    }
    if (profile.creditScore > 0 && profile.creditScore < 600) {
        rejectionReasons.push(`Credit score of ${profile.creditScore} is below 600.`);
    }
    if (profile.paymentHistoryFlag === "Serious Default") {
        rejectionReasons.push("Serious default found in payment history.");
    }
    if (loanType !== "Education Loan" && income > 0) {
        const estimatedNewEMI = calculateEMI(
            requestedLoanAmount,
            LOAN_TYPE_CONFIG[loanType].baseRate,
            LOAN_TYPE_CONFIG[loanType].maxTenureMonths,
        );
        const foir = (totalObligations + estimatedNewEMI) / income;
        if (foir > 0.5) rejectionReasons.push(`FOIR of ${(foir * 100).toFixed(1)}% exceeds 50%.`);
    }
    if (requestedLoanAmount > LOAN_TYPE_CONFIG[loanType].maxAmount) {
        rejectionReasons.push(`Requested amount exceeds ₹${LOAN_TYPE_CONFIG[loanType].maxAmount.toLocaleString('en-IN')}.`);
    }

    return rejectionReasons;
};

const createLoanEligibilityCheckService = async (userID, data) => {
    const { requestedLoanAmount, loanType, loanDetails } = data;

    const profile = await FinancialProfile.findOne({ userID });
    if (!profile) throw new Error("Financial profile not found.");

    const rejectionReasons = runRuleEngine(profile, requestedLoanAmount, loanType);
    const eligible         = rejectionReasons.length === 0;

    const defaultTenure = {
        "Personal Loan": 60, "Education Loan": 120,
        "Home Loan": 240,    "Vehicle Loan": 84, "Business Loan": 60,
    };
    const tenureMonths    = defaultTenure[loanType];
    const hasCoApplicant  = !!loanDetails.coApplicant;

    const { eligibilityScore, riskScore, mlPrediction, mlAvailable } =
        await computeMLScores(profile, requestedLoanAmount, tenureMonths, hasCoApplicant);

    // SHAP explanation
    let mlExplanation = null;
    if (mlAvailable) {
        try {
            const axios   = require('axios');
            const payload = {
                age:                  profile.age,
                employment_type:      profile.employmentType,
                city_tier:            profile.cityTier,
                has_coapplicant:      hasCoApplicant ? 1 : 0,
                monthly_income:       profile.monthlyNetIncome,
                credit_score:         profile.creditScore,
                total_existing_emi:   calculateTotalMonthlyObligations(profile),
                requested_loan_amount: requestedLoanAmount,
                loan_tenure_months:   tenureMonths,
                work_experience_years: profile.employmentTenureMonths / 12,
            };
            const { data: shapData } = await axios.post(
                (process.env.SHAP_SERVICE_URL || 'http://localhost:8001') + '/explain',
                payload,
                { timeout: 15000 },
            );
            mlExplanation = shapData;
        } catch (e) {
            console.warn("SHAP service unavailable:", e.message);
        }
    }

    // Build results
    let results = {
        eligible,
        rejectionReasons,
        eligibilityScore: eligible ? eligibilityScore : null,
        riskScore:        eligible ? riskScore        : null,
        riskCategory:     null,
        maxApprovedLoanAmount:          null,
        maxApprovedTenureMonths:        null,
        maxApprovedInterestRatePercent: null,
        emi:              null,
    };

    if (eligible) {
        const riskCategory =
            riskScore <= 20 ? "Very Low" :
            riskScore <= 40 ? "Low"      :
            riskScore <= 60 ? "Medium"   :
            riskScore <= 80 ? "High"     : "Very High";

        const offer = generateOffer(requestedLoanAmount, loanType, eligibilityScore, riskScore);
        results = { eligible: true, rejectionReasons: [], eligibilityScore, riskScore, riskCategory, ...offer };
    }

    // Blockchain audit payload
    const auditData = {
        userID,
        timestamp:    new Date().toISOString(),
        loanType,
        requestedAmount: requestedLoanAmount,
        eligible,
        mlVerdict:    mlPrediction ? mlPrediction.verdict : (eligible ? "Manual Approval" : "Rule Rejection"),
        shapSummary:  mlExplanation ? mlExplanation.summary : "No explanation available",
    };

    // Save to DB first (need real _id for blockchain anchor)
    const check = await LoanEligibilityCheck.create({
        userID,
        requestedLoanAmount,
        loanType,
        loanDetails,
        results,
        mlResult: mlPrediction ? {
            probability:  mlPrediction.probability,
            score:        mlPrediction.score,
            riskScore:    mlPrediction.risk_score,    // ✅ fixed: was missing entirely
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
    });

    // Anchor to blockchain using real MongoDB _id
    try {
        console.log("🚀 Starting Blockchain Anchor for User:", userID);
        const anchorResult = await recordDataOnChain(check._id.toString(), auditData);
        if (anchorResult.success) {
            await LoanEligibilityCheck.findByIdAndUpdate(check._id, {
                blockchainTxHash: anchorResult.txHash,
                ipfsMetadataHash: anchorResult.ipfsHash,
            });
            check.blockchainTxHash = anchorResult.txHash;
            check.ipfsMetadataHash = anchorResult.ipfsHash;
            console.log("✅ Blockchain Anchor Successful:", anchorResult.txHash);
        }
    } catch (bcError) {
        console.error("❌ Blockchain Anchor Failed:", bcError.message);
    }

    return check;
};

const getLoanEligibilityChecksService = async (userID) => {
    return await LoanEligibilityCheck.find({ userID }).sort({ createdAt: -1 });
};

const getLoanEligibilityCheckByIdService = async (userID, checkID) => {
    const check = await LoanEligibilityCheck.findOne({ _id: checkID, userID });
    if (!check) throw new Error("Loan eligibility check not found.");
    return check;
};

module.exports = {
    createLoanEligibilityCheckService,
    getLoanEligibilityChecksService,
    getLoanEligibilityCheckByIdService,
};

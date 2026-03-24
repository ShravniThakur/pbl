const { z } = require("zod")

const {
    LOAN_TYPES,
    SALARY_MODE,
    PROPERTY_TYPE,
    CITY_TIER,
    COURSE_TYPE,
    COLLATERAL_TYPE,
    OWNERSHIP_TYPE,
    VEHICLE_TYPE,
    DEALER_TYPE,
    BUSINESS_TYPE,
    GST_FILING_HISTORY,
    EMPLOYMENT_TYPE,
    RELATIONSHIP,
    JOB_ROLE,
    INSTITUTION_TYPE
} = require("../constants/enums")

const ExistingEmiSchema = z.object({
    monthlyAmount: z.number().positive(),
    remainingTenureMonths: z.number().int().nonnegative()
})

const OtherLoanSchema = z.object({
    monthlyEMI: z.number().positive(),
    remainingTenureMonths: z.number().int().nonnegative()
})

const CoApplicantSchema = z.object({
    name: z.string().min(1),
    relationship: z.enum(RELATIONSHIP),
    age: z.number().int().min(18).max(100),
    employmentType: z.enum(EMPLOYMENT_TYPE),
    monthlyNetIncome: z.number().nonnegative(),
    creditScore: z.number().int().min(0).max(900),  
    existingEmis: z.array(ExistingEmiSchema).default([]),
    otherLoans: z.array(OtherLoanSchema).default([]),
    isPrimaryEarner: z.boolean().default(false)
}).strict()

const CollateralSchema = z.object({
    collateralType: z.enum(COLLATERAL_TYPE),
    assetValue: z.number().positive(),
    ownershipType: z.enum(OWNERSHIP_TYPE)
}).strict()

const LoanDetailsSchema = z.object({

    // Personal Loan
    employerName: z.string().optional(),
    jobRole: z.enum(JOB_ROLE).optional(),
    salaryMode: z.enum(SALARY_MODE).optional(),
    totalWorkExperienceMonths: z.number().int().nonnegative().optional(),

    // Home Loan
    propertyValue: z.number().positive().optional(),
    propertyType: z.enum(PROPERTY_TYPE).optional(),
    downPaymentAmount: z.number().nonnegative().optional(),
    propertyLocation: z.enum(CITY_TIER).optional(),
    collateralDetails: CollateralSchema.optional(),

    // Education Loan
    courseType: z.enum(COURSE_TYPE).optional(),
    institutionName: z.string().optional(),
    institutionType: z.enum(INSTITUTION_TYPE).optional(),
    institutionLocation: z.enum(CITY_TIER).optional(),
    isAbroadCourse: z.boolean().default(false),
    courseDurationMonths: z.number().int().positive().optional(),
    annualTuitionFee: z.number().positive().optional(),
    totalCourseFee: z.number().positive().optional(),
    moratoriumMonths: z.number().int().nonnegative().optional(),
    expectedSalaryAfterCourse: z.number().nonnegative().optional(),

    // Vehicle Loan
    vehiclePrice: z.number().positive().optional(),
    vehicleType: z.enum(VEHICLE_TYPE).optional(),
    downPayment: z.number().nonnegative().optional(),
    dealerType: z.enum(DEALER_TYPE).optional(),
    vehicleAge: z.number().int().nonnegative().optional(),

    // Business Loan
    businessType: z.enum(BUSINESS_TYPE).optional(),
    businessVintageMonths: z.number().int().nonnegative().optional(),
    annualTurnover: z.number().nonnegative().optional(),
    profitMarginPercent: z.number().min(0).max(100).optional(),
    GSTFilingHistory: z.enum(GST_FILING_HISTORY).optional(),

    // Co-applicant (required for Education Loan, optional for others)
    coApplicant: CoApplicantSchema.optional()

}).strict()

const LoanEligibilitySchema = z.object({
    loanType: z.enum(LOAN_TYPES),
    requestedLoanAmount: z.number().positive(),
    loanDetails: LoanDetailsSchema
}).strict()

const loanEligibilityValidator = (req, res, next) => {
    const result = LoanEligibilitySchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.format()
        })
    }

    // Always read from result.data, not req.body
    const { loanType, loanDetails } = result.data

    if (loanType === "Personal Loan") {
        if (
            loanDetails.employerName === undefined ||
            loanDetails.jobRole === undefined ||
            loanDetails.salaryMode === undefined ||
            loanDetails.totalWorkExperienceMonths === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Personal loan requires: employerName, jobRole, salaryMode, totalWorkExperienceMonths"
            })
        }
    }

    else if (loanType === "Home Loan") {
        if (
            loanDetails.propertyValue === undefined ||
            loanDetails.propertyType === undefined ||
            loanDetails.downPaymentAmount === undefined ||
            loanDetails.propertyLocation === undefined ||
            loanDetails.collateralDetails === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Home loan requires: propertyValue, propertyType, downPaymentAmount, propertyLocation, collateralDetails"
            })
        }
    }

    else if (loanType === "Education Loan") {
        if (
            loanDetails.courseType === undefined ||
            loanDetails.institutionName === undefined ||
            loanDetails.institutionType === undefined ||
            loanDetails.institutionLocation === undefined ||
            loanDetails.courseDurationMonths === undefined ||
            loanDetails.annualTuitionFee === undefined ||
            loanDetails.totalCourseFee === undefined ||
            loanDetails.moratoriumMonths === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Education loan requires: courseType, institutionName, institutionType, institutionLocation, courseDurationMonths, annualTuitionFee, totalCourseFee, moratoriumMonths"
            })
        }
        // Co-applicant is mandatory for education loans
        if (loanDetails.coApplicant === undefined) {
            return res.status(400).json({
                success: false,
                message: "A co-applicant is required for education loans"
            })
        }
    }

    else if (loanType === "Vehicle Loan") {
        if (
            loanDetails.vehiclePrice === undefined ||
            loanDetails.vehicleType === undefined ||
            loanDetails.downPayment === undefined ||
            loanDetails.dealerType === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Vehicle loan requires: vehiclePrice, vehicleType, downPayment, dealerType"
            })
        }
    }

    else if (loanType === "Business Loan") {
        if (
            loanDetails.businessType === undefined ||
            loanDetails.businessVintageMonths === undefined ||
            loanDetails.annualTurnover === undefined ||
            loanDetails.profitMarginPercent === undefined ||
            loanDetails.GSTFilingHistory === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Business loan requires: businessType, businessVintageMonths, annualTurnover, profitMarginPercent, GSTFilingHistory"
            })
        }
    }

    req.body = result.data
    next()
}

module.exports = {
    loanEligibilityValidator
}
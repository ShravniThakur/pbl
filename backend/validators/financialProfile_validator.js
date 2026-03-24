const { z } = require("zod")
const {
    GENDER,
    MARITAL_STATUS,
    CITY_TIER,
    RESIDENTIAL_STATUS,
    RESIDENT_TYPE,
    EMPLOYMENT_TYPE,
    EMPLOYER_TYPE,
    STATUS,
    PAYMENT_HISTORY_FLAG
} = require("../constants/enums")

const NON_EARNERS = ["Student", "Unemployed", "Retired"]

const ExistingEmiSchema = z.object({
    monthlyAmount: z.number().positive(),
    remainingTenureMonths: z.number().int().nonnegative()
})

const CreditCardDueSchema = z.object({
    outstandingBalance: z.number().nonnegative(),
    minimumDue: z.number().nonnegative()
})

const OtherLoanSchema = z.object({
    principalOutstanding: z.number().positive(),
    monthlyEMI: z.number().positive(),
    remainingTenureMonths: z.number().int().nonnegative(),
    interestRate: z.number().min(0).max(100)
})

const LoanInquirySchema = z.object({
    monthsAgo: z.number().int().nonnegative(),
    status: z.enum(STATUS)
})

const CreateFinancialProfileSchema = z.object({

    age: z.number().int().min(18).max(100),
    gender: z.enum(GENDER).optional(),
    maritalStatus: z.enum(MARITAL_STATUS),
    cityTier: z.enum(CITY_TIER),
    residentialStatus: z.enum(RESIDENTIAL_STATUS),
    residentType: z.enum(RESIDENT_TYPE),

    employmentType: z.enum(EMPLOYMENT_TYPE),
    monthlyNetIncome: z.number().nonnegative(),
    employmentTenureMonths: z.number().int().nonnegative(),
    employerType: z.enum(EMPLOYER_TYPE),

    existingEmis: z.array(ExistingEmiSchema).default([]),
    creditCardDues: z.array(CreditCardDueSchema).default([]),
    otherLoans: z.array(OtherLoanSchema).default([]),

    creditScore: z.number().int().min(0).max(900),
    recentLoanInquiries: z.array(LoanInquirySchema).default([]),
    paymentHistoryFlag: z.enum(PAYMENT_HISTORY_FLAG),

}).strict()

const UpdateFinancialProfileSchema = z.object({

    age: z.number().int().min(18).max(100).optional(),
    gender: z.enum(GENDER).optional(),
    maritalStatus: z.enum(MARITAL_STATUS).optional(),
    cityTier: z.enum(CITY_TIER).optional(),
    residentialStatus: z.enum(RESIDENTIAL_STATUS).optional(),
    residentType: z.enum(RESIDENT_TYPE).optional(),

    employmentType: z.enum(EMPLOYMENT_TYPE).optional(),
    monthlyNetIncome: z.number().nonnegative().optional(),
    employmentTenureMonths: z.number().int().nonnegative().optional(),
    employerType: z.enum(EMPLOYER_TYPE).optional(),

    existingEmis: z.array(ExistingEmiSchema).optional(),
    creditCardDues: z.array(CreditCardDueSchema).optional(),
    otherLoans: z.array(OtherLoanSchema).optional(),

    creditScore: z.number().int().min(0).max(900).optional(),
    recentLoanInquiries: z.array(LoanInquirySchema).optional(),
    paymentHistoryFlag: z.enum(PAYMENT_HISTORY_FLAG).optional(),

}).strict()

const createFinancialProfileValidator = (req, res, next) => {
    const result = CreateFinancialProfileSchema.safeParse(req.body)
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.format()
        })
    }

    const { employmentType, monthlyNetIncome, employerType } = result.data

    if (!NON_EARNERS.includes(employmentType)) {
        if (monthlyNetIncome === 0) {
            return res.status(400).json({
                success: false,
                message: "Monthly income must be greater than 0 for employed applicants"
            })
        }
        if (employerType === "Not Applicable") {
            return res.status(400).json({
                success: false,
                message: "Employer type cannot be 'Not Applicable' for employed applicants"
            })
        }
    }

    if (NON_EARNERS.includes(employmentType) && employerType !== "Not Applicable") {
        return res.status(400).json({
            success: false,
            message: "Employer type must be 'Not Applicable' for students, unemployed, or retired applicants"
        })
    }

    req.body = result.data
    next()
}

const updateFinancialProfileValidator = (req, res, next) => {
    const result = UpdateFinancialProfileSchema.safeParse(req.body)
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: result.error.format()
        })
    }

    const { employmentType, monthlyNetIncome, employerType } = result.data

    if (employmentType) {
        if (!NON_EARNERS.includes(employmentType)) {
            if (monthlyNetIncome === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Monthly income must be greater than 0 for employed applicants"
                })
            }
            if (employerType === "Not Applicable") {
                return res.status(400).json({
                    success: false,
                    message: "Employer type cannot be 'Not Applicable' for employed applicants"
                })
            }
        }
        if (NON_EARNERS.includes(employmentType) && employerType && employerType !== "Not Applicable") {
            return res.status(400).json({
                success: false,
                message: "Employer type must be 'Not Applicable' for students, unemployed, or retired applicants"
            })
        }
    }

    req.body = result.data
    next()
}

module.exports = {
    createFinancialProfileValidator,
    updateFinancialProfileValidator
}
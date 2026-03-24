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
    RISK_CATEGORY,
    EMPLOYMENT_TYPE,
    RELATIONSHIP,
    JOB_ROLE,
    INSTITUTION_TYPE
} = require('../constants/enums')

const mongoose = require('mongoose')

const coApplicantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    relationship: { type: String, enum: RELATIONSHIP, required: true },
    age: { type: Number, required: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPE, required: true },
    monthlyNetIncome: { type: Number, required: true },
    creditScore: { type: Number, required: true },
    existingEmis: {
        type: [{
            monthlyAmount: { type: Number, required: true },
            remainingTenureMonths: { type: Number, required: true }
        }],
        default: []
    },
    otherLoans: {
        type: [{
            monthlyEMI: { type: Number, required: true },
            remainingTenureMonths: { type: Number, required: true }
        }],
        default: []
    },
    isPrimaryEarner: { type: Boolean, default: false }
}, { _id: false })

const LoanEligibilityCheckSchema = new mongoose.Schema({

    userID: { type: String, required: true },

    requestedLoanAmount: { type: Number, required: true },
    loanType: { type: String, enum: LOAN_TYPES, required: true },

    loanDetails: {

        // Personal Loan
        employerName: String,
        jobRole: { type: String, enum: JOB_ROLE },
        salaryMode: { type: String, enum: SALARY_MODE },
        totalWorkExperienceMonths: Number,   

        // Home Loan
        propertyValue: Number,
        propertyType: { type: String, enum: PROPERTY_TYPE },
        downPaymentAmount: Number,
        propertyLocation: { type: String, enum: CITY_TIER },
        collateralDetails: {
            collateralType: { type: String, enum: COLLATERAL_TYPE },
            assetValue: Number,
            ownershipType: { type: String, enum: OWNERSHIP_TYPE }
        },

        // Education Loan
        courseType: { type: String, enum: COURSE_TYPE },
        institutionName: String,
        institutionType: { type: String, enum: INSTITUTION_TYPE },   
        institutionLocation: { type: String, enum: CITY_TIER },
        isAbroadCourse: { type: Boolean, default: false },          
        courseDurationMonths: Number,                               
        annualTuitionFee: Number,                                   
        totalCourseFee: Number,                                     
        moratoriumMonths: Number,                                   
        expectedSalaryAfterCourse: Number,                         

        // Vehicle Loan 
        vehiclePrice: Number,
        vehicleType: { type: String, enum: VEHICLE_TYPE },
        downPayment: Number,
        dealerType: { type: String, enum: DEALER_TYPE },
        vehicleAge: Number,                                        

        // Business Loan 
        businessType: { type: String, enum: BUSINESS_TYPE },
        businessVintageMonths: Number,                          
        annualTurnover: Number,
        profitMarginPercent: Number,
        GSTFilingHistory: { type: String, enum: GST_FILING_HISTORY },

        coApplicant: {
            type: coApplicantSchema,
            default: null
        }
    },

    results: {
        eligible: Boolean,
        eligibilityScore: Number,                    
        maxApprovedLoanAmount: Number,
        maxApprovedTenureMonths: Number,
        maxApprovedInterestRatePercent: Number,
        emi: Number,
        riskScore: Number,
        riskCategory: { type: String, enum: RISK_CATEGORY },
        rejectionReasons: [String]
    },

    // Blockchain fields
    blockchainTxHash:  { type: String, default: null },
    ipfsMetadataHash:  { type: String, default: null },

    // ML Result
    mlResult: {
        probability:  Number,
        score:        Number,
        riskCategory: String,
        verdict:      String,
        confidence:   String,
    },

    // SHAP Explanation
    mlExplanation: {
        summary:     String,
        topPositive: [{
            feature:    String,
            label:      String,
            shap_value: Number,
            magnitude:  String
        }],
        topNegative: [{
            feature:    String,
            label:      String,
            shap_value: Number,
            magnitude:  String
        }],
        baseValue: Number,
    },

}, { timestamps: true })

const LoanEligibilityCheck = mongoose.model('LoanEligibilityCheck', LoanEligibilityCheckSchema)

module.exports = LoanEligibilityCheck
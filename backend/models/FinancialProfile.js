const {
    GENDER,
    MARITAL_STATUS,
    CITY_TIER,
    RESIDENTIAL_STATUS,
    EMPLOYMENT_TYPE,
    EMPLOYER_TYPE,
    STATUS,
    RESIDENT_TYPE,
    PAYMENT_HISTORY_FLAG
} = require('../constants/enums')

const mongoose = require('mongoose')

const FinancialProfileSchema = new mongoose.Schema({

    userID: { type: String, required: true },

    age: { type: Number, required: true },
    gender: { type: String, enum: GENDER },
    maritalStatus: { type: String, enum: MARITAL_STATUS, required: true },
    cityTier: { type: String, enum: CITY_TIER, required: true },
    residentialStatus: { type: String, enum: RESIDENTIAL_STATUS, required: true },
    residentType: { type: String, enum: RESIDENT_TYPE, required: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPE, required: true }, 
    monthlyNetIncome: { type: Number, required: true, default: 0 },          
    employmentTenureMonths: { type: Number, default: 0 },                   
    employerType: {
        type: String,
        enum: EMPLOYER_TYPE,
        default: 'Not Applicable'                                            
    },

    existingEmis: {
        type: [{
            monthlyAmount: { type: Number, required: true },
            remainingTenureMonths: { type: Number, required: true }
        }],
        default: []
    },

    creditCardDues: {
        type: [{
            outstandingBalance: { type: Number, required: true },
            minimumDue: { type: Number, required: true }
        }],
        default: []
    },

    otherLoans: {
        type: [{
            principalOutstanding: { type: Number, required: true },
            monthlyEMI: { type: Number, required: true },
            remainingTenureMonths: { type: Number, required: true },
            interestRate: { type: Number, required: true }
        }],
        default: []
    },
    creditScore: { type: Number, required: true, default: 0 },

    recentLoanInquiries: {
        type: [{
            monthsAgo: { type: Number, required: true },
            status: { type: String, enum: STATUS, required: true }
        }],
        default: []
    },

    paymentHistoryFlag: { type: String, enum: PAYMENT_HISTORY_FLAG, required: true },

    financialProfileCompleted: { type: Boolean, default: false }

}, { timestamps: true })

const FinancialProfile = mongoose.model('FinancialProfile', FinancialProfileSchema)

module.exports = FinancialProfile
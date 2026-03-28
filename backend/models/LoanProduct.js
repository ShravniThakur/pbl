const mongoose = require('mongoose')
const { LOAN_TYPES } = require('../constants/enums')

const LoanProductSchema = new mongoose.Schema({

    // ── Lender Info ────────────────────────────────────────────────────────────
    bankName:    { type: String, required: true, trim: true },
    logoUrl:     { type: String, default: null },          // Cloudinary / any CDN URL
    productName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    features:    { type: [String], default: [] },          // bullet-point highlights

    // ── Loan Type ──────────────────────────────────────────────────────────────
    loanType: { type: String, enum: LOAN_TYPES, required: true },

    // ── Amount Range (₹) ──────────────────────────────────────────────────────
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },

    // ── Interest Rate Range (% per annum) ─────────────────────────────────────
    minInterestRate: { type: Number, required: true },
    maxInterestRate: { type: Number, required: true },

    // ── Tenure Range (months) ─────────────────────────────────────────────────
    minTenureMonths: { type: Number, required: true },
    maxTenureMonths: { type: Number, required: true },

    // ── Eligibility Criteria ──────────────────────────────────────────────────
    minCreditScore:    { type: Number, required: true, default: 600 },
    minMonthlyIncome:  { type: Number, required: true, default: 0 },

    // ── Visibility ────────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },

}, { timestamps: true })

const LoanProduct = mongoose.model('LoanProduct', LoanProductSchema)
module.exports = LoanProduct

const LoanProduct = require('../models/LoanProduct')

// ── CRUD ───────────────────────────────────────────────────────────────────────

const createLoanProductService = async (data) => {
    const product = await LoanProduct.create(data)
    return product
}

const getAllLoanProductsService = async (filters = {}) => {
    const query = { isActive: true }
    if (filters.loanType) query.loanType = filters.loanType
    return await LoanProduct.find(query).sort({ createdAt: -1 })
}

// Admin-only: returns all products including inactive ones
const getAllLoanProductsAdminService = async () => {
    return await LoanProduct.find({}).sort({ createdAt: -1 })
}

const getLoanProductByIdService = async (id) => {
    const product = await LoanProduct.findById(id)
    if (!product) throw new Error('Loan product not found.')
    return product
}

const updateLoanProductService = async (id, data) => {
    const product = await LoanProduct.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    if (!product) throw new Error('Loan product not found.')
    return product
}

const deleteLoanProductService = async (id) => {
    const product = await LoanProduct.findByIdAndDelete(id)
    if (!product) throw new Error('Loan product not found.')
}

// ── Recommendation Engine ──────────────────────────────────────────────────────

/**
 * Score a single product against the user's profile and check results.
 *
 * Scoring weights:
 *   Rate fit     50%  — lower minInterestRate relative to peers is better
 *   Amount fit   30%  — how well the product covers the approved loan amount
 *   Tenure flex  20%  — how much headroom the product offers on tenure
 *
 * Raw scores are 0–1; final fitScore is 0–100.
 *
 * @param {Object} product          - LoanProduct document
 * @param {Object} approvedOffer    - { maxApprovedLoanAmount, maxApprovedTenureMonths, maxApprovedInterestRatePercent }
 * @param {Object} rateContext      - { globalMinRate, globalMaxRate } across candidate products
 * @returns {number} fitScore 0–100
 */
const _scoreProduct = (product, approvedOffer, rateContext) => {
    const { maxApprovedLoanAmount, maxApprovedTenureMonths } = approvedOffer
    const { globalMinRate, globalMaxRate } = rateContext

    // 1. Rate fit — product with the lowest minInterestRate scores highest
    const rateRange  = globalMaxRate - globalMinRate || 1
    const rateFit    = 1 - (product.minInterestRate - globalMinRate) / rateRange // 0–1, higher = better

    // 2. Amount fit — does the product's range comfortably cover the approved amount?
    const amountMid  = (product.minAmount + product.maxAmount) / 2
    const amountDiff = Math.abs(amountMid - maxApprovedLoanAmount) / (product.maxAmount - product.minAmount || 1)
    const amountFit  = Math.max(0, 1 - amountDiff)                              // 0–1

    // 3. Tenure flex — extra months the product can offer beyond the approved tenure
    const tenureHeadroom = Math.max(0, product.maxTenureMonths - maxApprovedTenureMonths)
    const tenureFit      = Math.min(1, tenureHeadroom / 120)                     // normalise to 10 years

    const raw = rateFit * 0.5 + amountFit * 0.3 + tenureFit * 0.2
    return Math.round(raw * 100)
}

/**
 * Given a completed LoanEligibilityCheck result + the user's FinancialProfile,
 * returns the top 3 matching LoanProduct documents sorted by fitScore.
 *
 * Hard filters (a product must pass ALL of these):
 *   • loanType matches
 *   • approvedAmount ≥ product.minAmount
 *   • approvedAmount ≤ product.maxAmount
 *   • profile.creditScore ≥ product.minCreditScore
 *   • profile.monthlyNetIncome ≥ product.minMonthlyIncome
 *   • product.isActive === true
 */
const getRecommendedProductsService = async (results, profile, loanType) => {
    if (!results.eligible) return []   // no recommendations for rejected applications

    const { maxApprovedLoanAmount, maxApprovedTenureMonths, maxApprovedInterestRatePercent } = results
    const { creditScore, monthlyNetIncome } = profile

    // 1. Load all active products of the matching loan type
    const candidates = await LoanProduct.find({
        isActive:        true,
        loanType:        loanType,
        minAmount:       { $lte: maxApprovedLoanAmount },
        maxAmount:       { $gte: maxApprovedLoanAmount },
        minCreditScore:  { $lte: creditScore },
        minMonthlyIncome:{ $lte: monthlyNetIncome },
    })

    if (candidates.length === 0) return []

    // 2. Build rate context for normalised scoring
    const rates         = candidates.map(p => p.minInterestRate)
    const globalMinRate = Math.min(...rates)
    const globalMaxRate = Math.max(...rates)
    const rateContext   = { globalMinRate, globalMaxRate }

    const approvedOffer = { maxApprovedLoanAmount, maxApprovedTenureMonths, maxApprovedInterestRatePercent }

    // 3. Score & sort
    const scored = candidates.map(product => ({
        product,
        fitScore: _scoreProduct(product, approvedOffer, rateContext),
    }))

    scored.sort((a, b) => b.fitScore - a.fitScore)

    // 4. Return top 3 with fitScore attached
    return scored.slice(0, 3).map(({ product, fitScore }) => ({
        ...product.toObject(),
        fitScore,
    }))
}

module.exports = {
    createLoanProductService,
    getAllLoanProductsService,
    getAllLoanProductsAdminService,
    getLoanProductByIdService,
    updateLoanProductService,
    deleteLoanProductService,
    getRecommendedProductsService,
}

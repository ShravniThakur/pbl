const express = require('express')
const loanProductRouter = express.Router()
const { requireAdmin } = require('../services/adminService')

const {
    getLoanProducts,
    getLoanProductById,
    getLoanProductsAdmin,
    createLoanProduct,
    updateLoanProduct,
    deleteLoanProduct,
} = require('../controllers/loanProductController')

// ── Public ─────────────────────────────────────────────────────────────────────
// GET /api/loan-products           → all active products (optional ?loanType=)
// GET /api/loan-products/:id       → single product
loanProductRouter.get('/', getLoanProducts)
loanProductRouter.get('/:id', getLoanProductById)

// ── Admin ──────────────────────────────────────────────────────────────────────
// GET  /api/loan-products/admin/all      → all products incl. inactive
// POST /api/loan-products/admin          → create
// PUT  /api/loan-products/admin/:id      → update
// DELETE /api/loan-products/admin/:id   → delete
loanProductRouter.get('/admin/all', requireAdmin, getLoanProductsAdmin)
loanProductRouter.post('/admin', requireAdmin, createLoanProduct)
loanProductRouter.put('/admin/:id', requireAdmin, updateLoanProduct)
loanProductRouter.delete('/admin/:id', requireAdmin, deleteLoanProduct)

module.exports = loanProductRouter

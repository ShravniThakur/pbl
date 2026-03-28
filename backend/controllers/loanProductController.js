const {
    createLoanProductService,
    getAllLoanProductsService,
    getAllLoanProductsAdminService,
    getLoanProductByIdService,
    updateLoanProductService,
    deleteLoanProductService,
} = require('../services/loanProductService')

// ── Public ─────────────────────────────────────────────────────────────────────

const getLoanProducts = async (req, res) => {
    try {
        const { loanType } = req.query
        const products = await getAllLoanProductsService({ loanType })
        res.status(200).json({ success: true, data: products })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}

const getLoanProductById = async (req, res) => {
    try {
        const product = await getLoanProductByIdService(req.params.id)
        res.status(200).json({ success: true, data: product })
    } catch (err) {
        res.status(404).json({ success: false, message: err.message })
    }
}

// ── Admin ──────────────────────────────────────────────────────────────────────

const getLoanProductsAdmin = async (req, res) => {
    try {
        const products = await getAllLoanProductsAdminService()
        res.status(200).json({ success: true, data: products })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}

const createLoanProduct = async (req, res) => {
    try {
        const product = await createLoanProductService(req.body)
        res.status(201).json({ success: true, data: product })
    } catch (err) {
        res.status(400).json({ success: false, message: err.message })
    }
}

const updateLoanProduct = async (req, res) => {
    try {
        const product = await updateLoanProductService(req.params.id, req.body)
        res.status(200).json({ success: true, data: product })
    } catch (err) {
        res.status(400).json({ success: false, message: err.message })
    }
}

const deleteLoanProduct = async (req, res) => {
    try {
        await deleteLoanProductService(req.params.id)
        res.status(200).json({ success: true, message: 'Loan product deleted successfully.' })
    } catch (err) {
        res.status(404).json({ success: false, message: err.message })
    }
}

module.exports = {
    getLoanProducts,
    getLoanProductById,
    getLoanProductsAdmin,
    createLoanProduct,
    updateLoanProduct,
    deleteLoanProduct,
}

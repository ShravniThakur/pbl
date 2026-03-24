const {
    createLoanEligibilityCheckService,
    getLoanEligibilityChecksService,
    getLoanEligibilityCheckByIdService
} = require('../services/loanEligibilityService')

// create loan eligibility check
const createLoanEligibilityCheckController = async (req, res) => {
    console.log("🚀 Controller: Received loan check request for user:", req.userId);
    try {
        const check = await createLoanEligibilityCheckService(req.userId, req.body)
        return res.status(201).json({
            success: true,
            message: "Loan eligibility check completed!",
            check
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

// get all loan eligibility checks for a user
const getLoanEligibilityChecksController = async (req, res) => {
    try {
        const checks = await getLoanEligibilityChecksService(req.userId)
        return res.status(200).json({
            success: true,
            checks
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

// get a single loan eligibility check by id
const getLoanEligibilityCheckByIdController = async (req, res) => {
    try {
        const check = await getLoanEligibilityCheckByIdService(req.userId, req.params.id)
        return res.status(200).json({
            success: true,
            check
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

module.exports = {
    createLoanEligibilityCheckController,
    getLoanEligibilityChecksController,
    getLoanEligibilityCheckByIdController
}
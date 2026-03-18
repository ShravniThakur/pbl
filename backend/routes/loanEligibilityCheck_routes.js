const { loanEligibilityValidator } = require('../validators/loanEligibilityCheck_validator')
const { createLoanEligibilityCheckController, getLoanEligibilityChecksController, getLoanEligibilityCheckByIdController } = require('../controllers/loanEligibilityCheckController')
const authentication = require('../middlewares/auth.middleware')
const express = require('express')
const loanEligibilityRouter = express.Router()

loanEligibilityRouter.post('/', authentication, loanEligibilityValidator, createLoanEligibilityCheckController)
loanEligibilityRouter.get('/', authentication, getLoanEligibilityChecksController)
loanEligibilityRouter.get('/:id', authentication, getLoanEligibilityCheckByIdController)

module.exports = loanEligibilityRouter
const { createFinancialProfileValidator, updateFinancialProfileValidator } = require('../validators/financialProfile_validator')
const { createFinancialProfileController, getFinancialProfileController, updateFinancialProfileController, deleteFinancialProfileController } = require('../controllers/financialProfile_controller')
const authentication = require('../middlewares/auth.middleware')
const express = require('express')
const financialProfileRouter = express.Router()

financialProfileRouter.post('/', authentication, createFinancialProfileValidator, createFinancialProfileController)
financialProfileRouter.get('/', authentication, getFinancialProfileController)
financialProfileRouter.patch('/', authentication, updateFinancialProfileValidator, updateFinancialProfileController)
financialProfileRouter.delete('/', authentication, deleteFinancialProfileController)

module.exports = financialProfileRouter
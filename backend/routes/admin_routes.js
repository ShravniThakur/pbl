const express = require('express')
const adminRouter = express.Router()
const { adminLoginController } = require('../controllers/adminController')

// POST /api/admin/login
adminRouter.post('/login', adminLoginController)

module.exports = adminRouter

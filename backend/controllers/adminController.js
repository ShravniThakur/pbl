const { adminLogin } = require('../services/adminService')

const adminLoginController = (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' })
        }
        const result = adminLogin(email, password)
        res.status(200).json({ success: true, data: result })
    } catch (err) {
        res.status(401).json({ success: false, message: err.message })
    }
}

module.exports = { adminLoginController }

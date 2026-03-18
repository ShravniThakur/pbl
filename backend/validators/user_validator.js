const validator = require('validator')

// sign up validator
const validateSignUp = (req, res, next) => {
    try {
        let { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required!"
            })
        }
        name = name.trim()
        if (name.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must have atleast 2 characters!"
            })
        }
        email = email.trim().toLowerCase()
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email id!"
            })
        }
        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a strong password! A strong password contains atleast one lowercase character, uppercase character, number, and a symbol."
            })
        }
        req.body.name = name
        req.body.email = email
        next()
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}
// login validator
const validateLogin = (req, res, next) => {
    try {
        let { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required!"
            })
        }
        email = email.trim().toLowerCase()
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email id!"
            })
        }
        next()
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

// update profile validator
const validateUpdateProfile = (req, res, next) => {
    try {
        let { name, email } = req.body
        if (name) name = name.trim()
        if (name && name.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must have atleast 2 characters!"
            })
        }
        if (email) email = email.trim().toLowerCase()
        if (email && !validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email id!"
            })
        }
        if(name) req.body.name = name
        if(email) req.body.email = email
        next()
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}
// change password validator
const validateChangePassword = (req, res, next) => {
    try {
        const { password } = req.body
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required!"
            })
        }
        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a strong password! A strong password contains atleast one lowercase character, uppercase character, number, and a symbol."
            })
        }
        next()
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}
// delete account validator
const validateDeleteAccount = (req, res, next) => {
    try {
        const { password } = req.body
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required!"
            })
        }
        next()
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}
module.exports = {
    validateSignUp,
    validateLogin,
    validateUpdateProfile,
    validateChangePassword,
    validateDeleteAccount
}
const { signUpService, loginService, getProfileService, updateProfileService, changePasswordService, deleteAccountService } = require('../services/user_service')

// sign-up controller
const signUpController = async (req, res) => {
    try {
        const token = await signUpService(req.body)
        return res.status(201).json({
            success: true,
            message: "User registered successfully!",
            token
        })
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

// login controller 
const loginController = async (req, res) => {
    try {
        const token = await loginService(req.body)
        return res.status(200).json({
            success: true,
            message: "User logged in successfully!",
            token
        })
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

// get profile controller
const getProfileController = async (req, res) => {
    try {
        const user = await getProfileService({ id: req.userId })
        return res.status(200).json({
            success: true,
            user
        })
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

// update profile controller
const updateProfileController = async (req, res) => {
    try {
        const { name, email } = req.body
        const profilePic = req.file
        const updatedUser = await updateProfileService({ id: req.userId, name, email, profilePic })
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully!",
            updatedUser
        })
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

// change password controller
const changePasswordController = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body
        await changePasswordService({ id: req.userId, oldPassword, newPassword })
        return res.status(200).json({
            success: true,
            message: "Password changed successfully!"
        })
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

// delete account controller
const deleteAccountController = async (req, res) => {
    try {
        const { password } = req.body
        await deleteAccountService({ id: req.userId, password })
        return res.status(200).json({
            success: true,
            message: "Account deleted successfully!"
        })
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

module.exports = {
    signUpController,
    loginController,
    getProfileController,
    updateProfileController,
    changePasswordController,
    deleteAccountController
}
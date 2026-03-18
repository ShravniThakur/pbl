const User = require('../models/User')
const FinancialProfile = require('../models/FinancialProfile')
const LoanEligibilityCheck = require('../models/LoanEligibilityCheck')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cloudinary = require('cloudinary').v2

// sign-up service
const signUpService = async ({ name, email, password }) => {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
        throw new Error("Email id already exists!")
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({
        name,
        email,
        password: hashedPassword
    })
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1w" })
    return token
}

// login service
const loginService = async ({ email, password }) => {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error("Invalid Credentials!")
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error("Invalid Credentials!")
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1w" })
    return token
}

// get profile service
const getProfileService = async ({ id }) => {
    const user = await User.findById(id).select('-password')
    if (!user) {
        throw new Error("User not found!")
    }
    return user
}

// update profile service
const updateProfileService = async ({ id, name, email, profilePic }) => {
    const user = await User.findById(id)
    if (!user) {
        throw new Error("User not found!")
    }
    if (name) user.name = name
    if (email && email !== user.email) {
        const exists = await User.findOne({ email })
        if (exists) {
            throw new Error("Email ID already exists!")
        }
        user.email = email
    }
    if (profilePic) {
        const profileUpload = await cloudinary.uploader.upload(profilePic.path, { resource_type: 'image' })
        user.profilePic = profileUpload.secure_url
    }
    await user.save()
    const updatedUser = await User.findById(id).select('-password')
    return updatedUser
}

// change password service
const changePasswordService = async ({ id, oldPassword, newPassword }) => {
    const user = await User.findById(id)
    if (!user) {
        throw new Error("User not found!")
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
        throw new Error("Old password doesn't match!")
    }
    const isSame = await bcrypt.compare(newPassword, user.password)
    if (isSame) {
        throw new Error("New password cannot be the same as old password!")
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()
}

const deleteAccountService = async ({ id, password }) => {
    const user = await User.findById(id)
    if (!user) {
        throw new Error("User not found!")
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error("Invalid Password!")
    }
    await User.findByIdAndDelete(id)
    await FinancialProfile.deleteOne({ userID: id })
    await LoanEligibilityCheck.deleteMany({ userID: id })

}

module.exports = {
    signUpService,
    loginService,
    getProfileService,
    updateProfileService,
    changePasswordService,
    deleteAccountService
}
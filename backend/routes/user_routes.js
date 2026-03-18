const { validateSignUp, validateLogin, validateUpdateProfile, validateChangePassword, validateDeleteAccount } = require('../validators/user_validator')
const { signUpController, loginController, getProfileController, updateProfileController, changePasswordController, deleteAccountController } = require('../controllers/user_controller')
const authentication = require('../middlewares/auth.middleware')
const uploads = require('../middlewares/uploads.middleware')
const express = require('express')
const userRouter = express.Router()

userRouter.post('/sign-up', validateSignUp, signUpController)
userRouter.post('/login', validateLogin, loginController)
userRouter.get('/profile', authentication, getProfileController)
userRouter.patch('/profile', authentication, uploads.single('profilePic'), validateUpdateProfile, updateProfileController)
userRouter.patch('/change-password', authentication, validateChangePassword, changePasswordController)
userRouter.delete('/account', authentication, validateDeleteAccount, deleteAccountController)

module.exports = userRouter
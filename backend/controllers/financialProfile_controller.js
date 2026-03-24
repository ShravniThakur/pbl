const {createFinancialProfileService, getFinancialProfileService, updateFinancialProfileService, deleteFinancialProfileService} = require('../services/financialProfile_service')

const createFinancialProfileController = async (req,res) => {
    try{
        const profile = await createFinancialProfileService(req.user.id, req.body)
        return res.status(400).json({
            success: true,
            message: "Financial Profile created successfully!",
            profile
        })
    }
    catch(err){
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

const getFinancialProfileController = async (req, res) => {
    try {
        const profile = await getFinancialProfileService(req.user.id)
        return res.status(200).json({
            success: true,
            profile
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

const updateFinancialProfileController = async (req, res) => {
    try {
        const profile = await updateFinancialProfileService(req.user.id, req.body)
        return res.status(200).json({
            success: true,
            message: "Financial Profile updated successfully!",
            profile
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

const deleteFinancialProfileController = async (req, res) => {
    try {
        await deleteFinancialProfileService(req.user.id)
        return res.status(200).json({
            success: true,
            message: "Financial Profile deleted successfully!"
        })
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}
module.exports = {
    createFinancialProfileController,
    getFinancialProfileController,
    updateFinancialProfileController,
    deleteFinancialProfileController
}
const FinancialProfile = require('../models/FinancialProfile')

// create financial profile
const createFinancialProfileService = async (id, data) => {
    const existingProfile = await FinancialProfile.findOne({ userID: id })
    if (existingProfile) {
        throw new Error("Financial profile already exists!")
    }
    const profile = await FinancialProfile.create({
        userID: id,
        ...data,
        financialProfileCompleted: true
    })
    return profile
}

// get financial profile 
const getFinancialProfileService = async (id) => {
    const profile = await FinancialProfile.findOne({ userID: id })
    if (!profile) {
        throw new Error("Financial profile doesn't exist!")
    }
    return profile
}

// update financial profile
const updateFinancialProfileService = async (id, updatedData) => {
    let profile = await FinancialProfile.findOne({ userID: id })
    if (!profile) {
        throw new Error("Financial profile doesn't exist!")
    }
    for (const key in updatedData) {
        profile[key] = updatedData[key]
    }
    await profile.save()
    return profile
}

// delete financial profile
const deleteFinancialProfileService = async (id) => {
    const profile = await FinancialProfile.findOne({ userID: id })
    if (!profile) {
        throw new Error("Financial profile doesn't exist!")
    }
    await FinancialProfile.findByIdAndDelete(profile._id)
}

module.exports = {
    createFinancialProfileService,
    getFinancialProfileService,
    updateFinancialProfileService,
    deleteFinancialProfileService
}
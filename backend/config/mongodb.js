const mongoose = require('mongoose')

const database = process.env.MONGODB_URL

const connectDatabase = async () => {
    try {
        await mongoose.connect(database)
        console.log('Connection successful')
    }
    catch (err) {
        console.log('Connection unsuccessful')
    }
}

module.exports = connectDatabase
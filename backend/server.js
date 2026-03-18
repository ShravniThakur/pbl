const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const cors = require('cors')
const connectCloudinary = require('./config/cloudinary')
const connectDatabase = require('./config/mongodb')

const userRouter = require('./routes/user_routes')
const financialProfileRouter = require('./routes/financialProfile_routes')
const loanEligibilityRouter = require('./routes/loanEligibilityCheck_routes')

// app config 
const app = express()
const port = process.env.PORT
connectDatabase()
connectCloudinary()

// middlewares 
app.use(express.json())
app.use(cors())

// routes
app.use('/user',userRouter)
app.use('/financial-profile',financialProfileRouter)
app.use('/loan-eligibility', loanEligibilityRouter)

// run server
app.listen(port, ()=>{
    console.log('App running on port ' + port)
})
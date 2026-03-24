const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const cors = require('cors')
const connectCloudinary = require('./config/cloudinary')
const connectDatabase = require('./config/mongodb')

const userRouter = require('./routes/user_routes')
const financialProfileRouter = require('./routes/financialProfile_routes')
const loanEligibilityRouter = require('./routes/loanEligibilityCheck_routes')

const { verifyLoanOnChain } = require('./services/blockchainservice');
// app config 
const app = express()
const port = process.env.PORT
connectDatabase()
// connectCloudinary()

// middlewares 
app.use(express.json())
app.use(cors())

// routes
app.use('/user',userRouter)
app.use('/financial-profile',financialProfileRouter)
app.use('/loan-eligibility', loanEligibilityRouter)

app.get('/api/verify-loan/:id', async (req, res) => {
    try {
        const result = await verifyLoanOnChain(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// run server
app.listen(port, ()=>{
    console.log('App running on port ' + port)
})
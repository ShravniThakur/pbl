const jwt = require('jsonwebtoken')

const authentication = (req, res, next) => {
    try {
        const token = req.headers.authorization
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not Authorized!"
            })
        }
        const decode = jwt.verify(token, process.env.JWT_SECRET)
        
        // --- CHANGE THIS LINE ---
        // Change from req.user = { id: decode.id } to:
        req.userId = decode.id 
        
        next()
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token!"
        })
    }
}

module.exports = authentication
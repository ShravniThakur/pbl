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
        req.user = {
            id: decode.id
        }
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
/**
 * Admin authentication
 *
 * Credentials are NOT stored in MongoDB — they live in environment variables:
 *   ADMIN_EMAIL    e.g.  admin@loanapp.com
 *   ADMIN_PASSWORD e.g.  SuperSecret123
 *   ADMIN_JWT_SECRET  (separate secret from user JWT)
 *
 * This module exposes pure functions; no Mongoose model is needed.
 */

const jwt  = require('jsonwebtoken')
const bcrypt = require('bcrypt')

// Hash is generated once at startup from ADMIN_PASSWORD so comparison is
// constant-time even though the secret comes from an env variable.
let _passwordHash = null

const getPasswordHash = () => {
    if (!_passwordHash) {
        // bcrypt.hashSync is fine here — it runs once on cold start
        _passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'changeme', 10)
    }
    return _passwordHash
}

/**
 * Validate plain-text password against the env-variable credential.
 * Returns a signed JWT on success, throws on failure.
 */
const adminLogin = (email, password) => {
    const expectedEmail = process.env.ADMIN_EMAIL || 'admin@loanapp.com'

    if (email !== expectedEmail) {
        throw new Error('Invalid admin credentials.')
    }

    // Compare supplied password with the env-variable password directly
    // (constant-time via bcrypt)
    const valid = bcrypt.compareSync(password, getPasswordHash())
    if (!valid) {
        throw new Error('Invalid admin credentials.')
    }

    const token = jwt.sign(
        { role: 'admin', email },
        process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
        { expiresIn: '8h' }
    )
    return { token, email, role: 'admin' }
}

/**
 * Express middleware — protects admin-only routes.
 * Expects:  Authorization: Bearer <token>
 */
const requireAdmin = (req, res, next) => {
    try {
        const header = req.headers.authorization || ''
        const token  = header.startsWith('Bearer ') ? header.slice(7) : null
        if (!token) throw new Error('No token provided.')

        const payload = jwt.verify(
            token,
            process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
        )
        if (payload.role !== 'admin') throw new Error('Forbidden.')

        req.admin = payload
        next()
    } catch (err) {
        res.status(401).json({ success: false, message: err.message })
    }
}

module.exports = { adminLogin, requireAdmin }

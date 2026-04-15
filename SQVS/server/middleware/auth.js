const jwt = require('jsonwebtoken')
const pool = require('../config/db')
require('dotenv').config()

// Verify JWT token from cookie
const verifyToken = (req, res, next) => {
  const token = req.cookies.token
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

// Role guard — pass allowed roles as arguments
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
  }
}

const requireInstitutionApproved = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'staff' && req.user.Institution_ID) {
      const [rows] = await pool.query('SELECT Status FROM INSTITUTION WHERE Institution_ID = ?', [req.user.Institution_ID])
      if (rows.length === 0 || rows[0].Status !== 'Approved') {
        return res.status(403).json({ success: false, message: 'Access denied. Your institution registration is pending approval.' })
      }
    }
    next()
  } catch (error) {
    console.error('Approval check error:', error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

module.exports = { verifyToken, requireRole, requireInstitutionApproved }

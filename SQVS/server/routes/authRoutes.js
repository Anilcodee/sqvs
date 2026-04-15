const express = require('express')
const router = express.Router()
const { login, register, getMe, logout } = require('../controllers/authController')
const { verifyToken } = require('../middleware/auth')

router.post('/login', login)
router.post('/register', register)
router.get('/me', verifyToken, getMe)
router.post('/logout', logout)

module.exports = router

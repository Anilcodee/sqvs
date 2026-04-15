const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()

// Import DB (triggers connection test)
require('./config/db')

// Import routes
const authRoutes = require('./routes/authRoutes')
const studentRoutes = require('./routes/studentRoutes')
const staffRoutes = require('./routes/staffRoutes')
const verifierRoutes = require('./routes/verifierRoutes')
const adminRoutes = require('./routes/adminRoutes')
const publicRoutes = require('./routes/publicRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const transactionRoutes = require('./routes/transactionRoutes')

const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// Serve static uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/verifier', verifierRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/transactions', transactionRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SQVS API is running' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err)
  res.status(500).json({ success: false, message: 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`🚀 SQVS API server running on http://localhost:${PORT}`)
})

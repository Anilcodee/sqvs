const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// Helper: generate JWT and set cookie
const sendToken = (res, user, role) => {
  const token = jwt.sign(
    { id: user.id, email: user.email, role, name: user.name, Institution_ID: user.Institution_ID, Institution_Name: user.Institution_Name, staffRole: user.staffRole },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
  return token
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password and role are required' })
    }

    let query, user, userData
    switch (role) {
      case 'student':
        query = 'SELECT NED_ID AS id, Student_Name AS name, Email AS email, Phone AS phone, Password_Hash FROM STUDENT WHERE Email = ?'
        break
      case 'staff':
        query = 'SELECT s.Staff_ID AS id, s.Staff_Name AS name, s.Email AS email, s.Role AS staffRole, s.Institution_ID, i.Institution_Name, s.Password_Hash, i.Status AS institutionStatus, s.Status AS staffStatus FROM INSTITUTION_STAFF s JOIN INSTITUTION i ON s.Institution_ID = i.Institution_ID WHERE s.Email = ?'
        break
      case 'verifier':
        query = 'SELECT Verifier_ID AS id, Organization_Name AS orgName, Contact_Person AS name, Email AS email, Status, Password_Hash FROM EXTERNAL_VERIFIER WHERE Email = ?'
        break
      case 'admin':
        query = 'SELECT Official_ID AS id, Name AS name, Email AS email, Department AS department, Password_Hash FROM MINISTRY_OFFICIAL WHERE Email = ?'
        break
      default:
        return res.status(400).json({ success: false, message: 'Invalid role' })
    }

    const [rows] = await pool.query(query, [email])
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    user = rows[0]
    const isMatch = await bcrypt.compare(password, user.Password_Hash)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    // Role specific status checks
    if (role === 'staff') {
      if (user.institutionStatus === 'Pending') {
        return res.status(403).json({ success: false, message: 'Your institution registration is pending approval by the ministry.' })
      }
      if (user.institutionStatus === 'Rejected') {
        return res.status(403).json({ success: false, message: 'Your institution registration has been rejected. Please contact the ministry for details.' })
      }
      if (user.institutionStatus === 'Suspended') {
        return res.status(403).json({ success: false, message: 'Your institution access has been suspended.' })
      }
      if (user.staffStatus === 'Inactive') {
        return res.status(403).json({ success: false, message: 'Your staff account is currently inactive.' })
      }
    }

    if (role === 'verifier') {
      if (user.Status === 'Pending') {
        return res.status(403).json({ success: false, message: 'Your verifier registration is pending approval by the ministry.' })
      }
      if (user.Status === 'Rejected') {
        return res.status(403).json({ success: false, message: 'Your verifier registration has been rejected.' })
      }
      if (user.Status === 'Suspended') {
        return res.status(403).json({ success: false, message: 'Your organization access has been suspended.' })
      }
    }

    // Remove sensitive fields before sending
    delete user.Password_Hash
    delete user.institutionStatus
    delete user.staffStatus

    // Build userData based on role
    userData = { ...user, role }

    sendToken(res, userData, role)

    // Audit log
    await pool.query(
      'INSERT INTO AUDIT_LOG (User_Email, Action_Type, Table_Name, Record_ID, IP_Address) VALUES (?, ?, ?, ?, ?)',
      [email, 'LOGIN', role.toUpperCase(), String(user.id), req.ip]
    )

    res.json({ success: true, message: 'Login successful', user: userData })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { role } = req.body
    if (!role) return res.status(400).json({ success: false, message: 'Role is required' })

    const salt = await bcrypt.genSalt(10)

    if (role === 'student') {
      const { name, email, phone, aadhaar, dob, address, password } = req.body
      if (!name || !email || !phone || !aadhaar || !dob || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' })
      }
      const hash = await bcrypt.hash(password, salt)
      const nedId = 'NED' + Date.now().toString().slice(-7)
      await pool.query(
        'INSERT INTO STUDENT (NED_ID, Student_Name, Email, Phone, Aadhaar_Number, Date_of_Birth, Address, Password_Hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nedId, name, email, phone, aadhaar, dob, address || null, hash]
      )
      const userData = { id: nedId, name, email, role: 'student' }
      sendToken(res, userData, 'student')
      res.status(201).json({ success: true, message: 'Student registered', user: userData })
    } else if (role === 'verifier') {
      const { orgName, contactPerson, email, phone, country, verifierType, password } = req.body
      if (!orgName || !contactPerson || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' })
      }
      const hash = await bcrypt.hash(password, salt)
      const [result] = await pool.query(
        'INSERT INTO EXTERNAL_VERIFIER (Organization_Name, Verifier_Type, Country, Contact_Person, Email, Phone, Password_Hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orgName, verifierType || 'Other', country || 'India', contactPerson, email, phone || null, hash]
      )
      res.status(201).json({ success: true, message: 'Verifier registration submitted. Please wait for Ministry approval.' })
    } else if (role === 'institution') {
      const { instName, instType, license, location, contactEmail, contactPhone, adminName, adminEmail, adminPhone, adminPassword } = req.body
      
      if (!instName || !instType || !license || !contactEmail || !adminEmail || !adminPassword || !adminPhone) {
        return res.status(400).json({ success: false, message: 'All required fields must be filled (including admin phone)' })
      }

      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()

        // 1. Create Institution
        const [instResult] = await connection.query(
          'INSERT INTO INSTITUTION (License_Number, Institution_Name, Institution_Type, Location, Contact_Email, Contact_Phone, Status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [license, instName, instType, location || 'India', contactEmail, contactPhone || null, 'Pending']
        )
        const institutionId = instResult.insertId

        // 2. Create Admin Staff
        const adminHash = await bcrypt.hash(adminPassword, salt)
        const [staffResult] = await connection.query(
          'INSERT INTO INSTITUTION_STAFF (Institution_ID, Staff_Name, Email, Phone, Password_Hash, Role, Hired_Date, Status) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)',
          [institutionId, adminName, adminEmail, adminPhone, adminHash, 'Administrator', 'Inactive']
        )

        await connection.commit()
        
        res.status(201).json({ success: true, message: 'Institution registration submitted. Please wait for Ministry approval.' })
      } catch (err) {
        await connection.rollback()
        throw err
      } finally {
        connection.release()
      }
    } else {
      return res.status(400).json({ success: false, message: 'Only student, verifier and institution registration is allowed' })
    }
  } catch (error) {
    console.error('Register error:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email or phone already registered' })
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    res.json({ success: true, user: req.user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// POST /api/auth/logout
const logout = async (req, res) => {
  res.clearCookie('token')
  res.json({ success: true, message: 'Logged out' })
}

module.exports = { login, register, getMe, logout }

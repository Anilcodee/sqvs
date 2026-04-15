const pool = require('../config/db')
const bcrypt = require('bcryptjs')

// GET /api/staff/dashboard
const getDashboard = async (req, res) => {
  try {
    const instId = req.user.Institution_ID
    const [pending] = await pool.query('SELECT COUNT(*) as count FROM QUALIFICATION WHERE Institution_ID = ? AND Status = "Pending"', [instId])
    const [verified] = await pool.query('SELECT COUNT(*) as count FROM QUALIFICATION WHERE Institution_ID = ? AND Status = "Verified" AND DATE(Verification_Date) = CURDATE()', [instId])
    const [total] = await pool.query('SELECT COUNT(*) as count FROM QUALIFICATION WHERE Institution_ID = ?', [instId])

    const [staff] = await pool.query('SELECT Status FROM INSTITUTION_STAFF WHERE Staff_ID = ?', [req.user.id])
    const [institution] = await pool.query('SELECT Status FROM INSTITUTION WHERE Institution_ID = ?', [instId])
    
    // Account is inactive if staff member is INACTIVE OR institution is NOT APPROVED
    const staffStatus = staff.length > 0 ? staff[0].Status : 'Active'
    const instStatus = institution.length > 0 ? institution[0].Status : 'Pending'
    const finalStatus = (staffStatus === 'Inactive' || instStatus !== 'Approved') ? 'Inactive' : 'Active'

    res.json({
      success: true,
      stats: { 
        pending: pending[0].count, 
        verifiedToday: verified[0].count, 
        total: total[0].count, 
        status: finalStatus,
        instStatus 
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/staff/queue
const getQueue = async (req, res) => {
  try {
    const instId = req.user.Institution_ID
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const search = req.query.search || ''
    const sortBy = req.query.sortBy || 'Created_At'
    const sortDir = req.query.sortDir === 'ASC' ? 'ASC' : 'DESC'
    const showAll = req.query.all === 'true'

    const allowedColumns = {
      'Certificate_Number': 'q.Certificate_Number',
      'Student_Name': 's.Student_Name',
      'Degree_Name': 'q.Degree_Name',
      'Grade': 'q.Grade',
      'Status': 'q.Status',
      'Created_At': 'q.Created_At'
    }

    let orderBy = allowedColumns[sortBy] ? `${allowedColumns[sortBy]} ${sortDir}` : `q.Created_At DESC`
    
    // Always prioritize Pending status unless sorting explicitly by status
    if (sortBy !== 'Status') {
      orderBy = `FIELD(q.Status, 'Pending', 'Verified', 'Rejected'), ${orderBy}`
    }

    const searchPattern = `%${search}%`
    
    // Get total count for pagination
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM QUALIFICATION q 
       JOIN STUDENT s ON q.NED_ID = s.NED_ID 
       WHERE q.Institution_ID = ? AND (s.Student_Name LIKE ? OR s.NED_ID LIKE ?)`,
      [instId, searchPattern, searchPattern]
    )

    let query = `SELECT q.Qualification_ID, q.Certificate_Number, q.Degree_Name, q.Qualification_Level, q.Status,
              q.Percentage, q.Grade, q.Created_At,
              s.NED_ID, s.Student_Name, s.Email as Student_Email
       FROM QUALIFICATION q
       JOIN STUDENT s ON q.NED_ID = s.NED_ID
       WHERE q.Institution_ID = ? AND (s.Student_Name LIKE ? OR s.NED_ID LIKE ?)
       ORDER BY ${orderBy}`
    
    let queryParams = [instId, searchPattern, searchPattern]

    if (!showAll) {
      query += ` LIMIT ? OFFSET ?`
      queryParams.push(limit, offset)
    }

    const [rows] = await pool.query(query, queryParams)
    
    res.json({ 
      success: true, 
      queue: rows,
      pagination: {
        total: countRows[0].total,
        page: showAll ? 1 : page,
        limit: showAll ? countRows[0].total : limit,
        hasMore: showAll ? false : offset + rows.length < countRows[0].total
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// POST /api/staff/qualifications
const addQualification = async (req, res) => {
  try {
    const { nedId, level, degreeName, fieldOfStudy, enrollmentDate, completionDate, totalMarks, marksObtained, percentage, grade } = req.body
    const [staff] = await pool.query('SELECT Status, Role FROM INSTITUTION_STAFF WHERE Staff_ID = ?', [req.user.id])
    if (staff.length > 0 && staff[0].Status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact your institution administrator.' })
    }

    const staffRole = req.user.staffRole || (staff.length > 0 ? staff[0].Role : null)
    if (staffRole !== 'Data_Entry_Operator' && staffRole !== 'Support') {
      return res.status(403).json({ success: false, message: 'Access denied. Only Data Entry Operators and Support staff can add qualifications.' })
    }

    if (!nedId || !level || !degreeName || !fieldOfStudy || !enrollmentDate || !completionDate) {
      return res.status(400).json({ success: false, message: 'Required fields missing' })
    }

    // Check student exists
    const [student] = await pool.query('SELECT NED_ID FROM STUDENT WHERE NED_ID = ?', [nedId])
    if (student.length === 0) return res.status(404).json({ success: false, message: 'Student not found' })

    const certNum = `${req.user.Institution_Name?.substring(0, 4).toUpperCase() || 'INST'}-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`

    const [result] = await pool.query(
      `INSERT INTO QUALIFICATION (Certificate_Number, NED_ID, Institution_ID, Qualification_Level, Degree_Name, Field_of_Study, Enrollment_Date, Completion_Date, Total_Marks, Marks_Obtained, Percentage, Grade, Entered_By)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [certNum, nedId, req.user.Institution_ID, level, degreeName, fieldOfStudy, enrollmentDate, completionDate, totalMarks || null, marksObtained || null, percentage || null, grade || null, req.user.id]
    )

    // Insert supporting documents if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.query(
          'INSERT INTO SUPPORTING_DOCUMENT (Qualification_ID, Document_Type, Document_Path, Uploaded_By) VALUES (?, ?, ?, ?)',
          [result.insertId, 'Other', file.filename, req.user.id]
        )
      }
    }

    // Audit log
    await pool.query(
      'INSERT INTO AUDIT_LOG (User_Email, Action_Type, Table_Name, Record_ID, New_Value, IP_Address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.email, 'CREATE', 'QUALIFICATION', String(result.insertId), `Created qualification for ${nedId}`, req.ip]
    )

    res.status(201).json({ success: true, message: 'Qualification added', qualificationId: result.insertId, certificateNumber: certNum })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// PUT /api/staff/qualifications/:id/verify
const verifyQualification = async (req, res) => {
  try {
    // Check staff status
    const [staffCheck] = await pool.query('SELECT Status, Role FROM INSTITUTION_STAFF WHERE Staff_ID = ?', [req.user.id])
    if (staffCheck.length > 0 && staffCheck[0].Status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact your institution administrator.' })
    }

    const staffRole = req.user.staffRole || (staffCheck.length > 0 ? staffCheck[0].Role : null)
    if (staffRole !== 'Verifier' && staffRole !== 'Support') {
      return res.status(403).json({ success: false, message: 'Access denied. Only Verifiers and Support staff can verify qualifications.' })
    }

    const { status } = req.body // 'Verified' or 'Rejected'
    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Verified or Rejected' })
    }

    const [qual] = await pool.query('SELECT * FROM QUALIFICATION WHERE Qualification_ID = ? AND Institution_ID = ?', [req.params.id, req.user.Institution_ID])
    if (qual.length === 0) return res.status(404).json({ success: false, message: 'Qualification not found in your institution' })

    // Support staff restriction: cannot verify own entry
    if (staffRole === 'Support' && qual[0].Entered_By === req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. Support staff cannot verify records they entered themselves.' })
    }

    await pool.query(
      'UPDATE QUALIFICATION SET Status = ?, Verified_By = ?, Verification_Date = CURDATE() WHERE Qualification_ID = ?',
      [status, req.user.id, req.params.id]
    )

    // Notify student
    const [student] = await pool.query('SELECT Email FROM STUDENT WHERE NED_ID = ?', [qual[0].NED_ID])
    if (student.length > 0) {
      await pool.query(
        'INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message) VALUES (?, ?, ?)',
        [student[0].Email, 'Status_Update', `Your qualification "${qual[0].Degree_Name}" has been ${status.toLowerCase()} by ${req.user.Institution_Name}.`]
      )
    }

    res.json({ success: true, message: `Qualification ${status.toLowerCase()}` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/staff/students/:nedId
const searchStudent = async (req, res) => {
  try {
    const [students] = await pool.query(
      'SELECT NED_ID, Student_Name, Date_of_Birth FROM STUDENT WHERE NED_ID = ?',
      [req.params.nedId]
    )
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' })
    }

    const [quals] = await pool.query(
      'SELECT COUNT(*) as count FROM QUALIFICATION WHERE NED_ID = ?',
      [req.params.nedId]
    )

    res.json({
      success: true,
      student: { ...students[0], existingQualifications: quals[0].count }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// POST /api/staff/notifications
const sendStaffNotification = async (req, res) => {
  try {
    const { role: senderRole } = req.user
    const staffRole = req.user.staffRole
    if (staffRole !== 'Administrator') {
      return res.status(403).json({ success: false, message: 'Only Administrators can send staff notifications.' })
    }

    const { targetEmails, message } = req.body
    if (!targetEmails || !targetEmails.length || !message) {
      return res.status(400).json({ success: false, message: 'Recipient emails and message are required' })
    }

    const invalidEmails = []
    for (const email of targetEmails) {
      const [recipient] = await pool.query('SELECT Staff_ID FROM INSTITUTION_STAFF WHERE Email = ? AND Institution_ID = ?', [email, req.user.Institution_ID])
      if (recipient.length === 0) {
        invalidEmails.push(email)
      }
    }

    if (invalidEmails.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `One or more emails do not belong to your institution: ${invalidEmails.join(', ')}` 
      })
    }

    for (const email of targetEmails) {
      await pool.query(
        'INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message) VALUES (?, ?, ?)',
        [email, 'Other', `Staff Notice: ${message}`]
      )
    }

    res.json({ success: true, message: 'Notification(s) sent successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
// GET /api/staff/members (Administrator only)
const getStaffMembers = async (req, res) => {
  try {
    if (req.user.staffRole !== 'Administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Only Administrators can manage staff.' })
    }
    const [rows] = await pool.query(
      'SELECT Staff_ID, Staff_Name AS Name, Email, Role, Status, Created_At FROM INSTITUTION_STAFF WHERE Institution_ID = ? ORDER BY Created_At DESC',
      [req.user.Institution_ID]
    )
    res.json({ success: true, staff: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// POST /api/staff/members (Administrator only)
const addStaffMember = async (req, res) => {
  try {
    if (req.user.staffRole !== 'Administrator') {
      return res.status(403).json({ success: false, message: 'Access denied. Only Administrators can manage staff.' })
    }
    const { name, email, role, password, phone } = req.body
    if (!name || !email || !role || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT Staff_ID FROM INSTITUTION_STAFF WHERE Email = ?', [email])
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Staff member with this email already exists' })

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    await pool.query(
      'INSERT INTO INSTITUTION_STAFF (Institution_ID, Staff_Name, Email, Phone, Password_Hash, Role, Hired_Date) VALUES (?, ?, ?, ?, ?, ?, CURDATE())',
      [req.user.Institution_ID, name, email, phone, hashedPassword, role]
    )

    res.status(201).json({ success: true, message: 'Staff member added successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

module.exports = { 
  getDashboard, 
  getQueue, 
  addQualification, 
  verifyQualification, 
  searchStudent, 
  sendStaffNotification,
  getStaffMembers,
  addStaffMember
}

const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const { generateCertificatePDF } = require('../utils/pdfGenerator')
const { issueCertificate } = require('../utils/certificateHelper')
const ExcelJS = require('exceljs')

// GET /api/admin/institutions
const getInstitutions = async (req, res) => {
  try {
    const { status, sortBy, sortDir } = req.query
    const dir = sortDir === 'ASC' ? 'ASC' : 'DESC'
    
    const allowedColumns = {
      'Institution_Name': 'Institution_Name',
      'Institution_Type': 'Institution_Type',
      'Location': 'Location',
      'Status': 'Status',
      'Created_At': 'Created_At'
    }

    const orderBy = allowedColumns[sortBy] ? `${allowedColumns[sortBy]} ${dir}` : 'Created_At DESC'

    let query = 'SELECT * FROM INSTITUTION'
    const params = []

    if (status) {
      query += ' WHERE Status = ?'
      params.push(status)
    }

    query += ` ORDER BY ${orderBy}`
    const [rows] = await pool.query(query, params)
    res.json({ success: true, institutions: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [institutions] = await pool.query('SELECT COUNT(*) as active FROM INSTITUTION WHERE Status = "Approved"')
    const [pending] = await pool.query('SELECT COUNT(*) as count FROM INSTITUTION WHERE Status = "Pending"')
    const [pendingVer] = await pool.query('SELECT COUNT(*) as count FROM EXTERNAL_VERIFIER WHERE Status = "Pending"')
    const [totalVer] = await pool.query('SELECT COUNT(*) as count FROM VERIFICATION_REQUEST')
    const [completedVer] = await pool.query('SELECT COUNT(*) as count FROM VERIFICATION_REQUEST WHERE Status = "Completed"')

    // Weekly chart data
    const [weeklyData] = await pool.query(
      `SELECT DAYNAME(Request_Date) as name, COUNT(*) as reqs
       FROM VERIFICATION_REQUEST
       WHERE Request_Date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DAYNAME(Request_Date), DAYOFWEEK(Request_Date)
       ORDER BY DAYOFWEEK(Request_Date)`
    )

    // Recent alerts (last audit log entries flagged)
    const [alerts] = await pool.query(
      `SELECT Log_ID, User_Email, Action_Type, Table_Name, New_Value, Timestamp
       FROM AUDIT_LOG ORDER BY Timestamp DESC LIMIT 5`
    )

    // Top institutions
    const [topInst] = await pool.query(
      `SELECT i.Institution_Name, i.Location,
              COUNT(q.Qualification_ID) as verifications,
              ROUND(AVG(DATEDIFF(q.Verification_Date, q.Created_At)), 1) as avgDays
       FROM INSTITUTION i
       LEFT JOIN QUALIFICATION q ON i.Institution_ID = q.Institution_ID AND q.Status = 'Verified'
       WHERE i.Status = 'Approved'
       GROUP BY i.Institution_ID, i.Institution_Name, i.Location
       ORDER BY verifications DESC LIMIT 5`
    )

    res.json({
      success: true,
      stats: { 
        activeInstitutions: institutions[0].active, 
        pendingApprovals: pending[0].count, 
        pendingVerifiers: pendingVer[0].count,
        totalVerifications: totalVer[0].count, 
        completed: completedVer[0].count 
      },
      weeklyData,
      alerts,
      topInstitutions: topInst
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/admin/institutions/pending
const getPendingInstitutions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT Institution_ID, License_Number, Institution_Name, Institution_Type, Location, Contact_Email, Contact_Phone, Created_At
       FROM INSTITUTION WHERE Status = 'Pending' ORDER BY Created_At DESC`
    )
    res.json({ success: true, institutions: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// PUT /api/admin/institutions/:id/approve
const approveInstitution = async (req, res) => {
  try {
    const { status } = req.body // 'Approved', 'Rejected', 'Suspended'
    if (!['Approved', 'Rejected', 'Suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved, Rejected, or Suspended' })
    }

    const approvalDate = status === 'Approved' ? new Date().toISOString().split('T')[0] : null

    await pool.query(
      'UPDATE INSTITUTION SET Status = ?, Approved_By = ?, Approval_Date = ? WHERE Institution_ID = ?',
      [status, req.user.id, approvalDate, req.params.id]
    )

    // Sync Staff Status: If approved, set all staff to Active. If rejected/suspended, set to Inactive.
    const staffStatus = status === 'Approved' ? 'Active' : 'Inactive'
    await pool.query(
      'UPDATE INSTITUTION_STAFF SET Status = ? WHERE Institution_ID = ?',
      [staffStatus, req.params.id]
    )

    // Notify institution contact
    const [inst] = await pool.query('SELECT Contact_Email, Institution_Name FROM INSTITUTION WHERE Institution_ID = ?', [req.params.id])
    if (inst.length > 0) {
      await pool.query(
        'INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message) VALUES (?, ?, ?)',
        [inst[0].Contact_Email, 'Status_Update', `Your institution "${inst[0].Institution_Name}" has been ${status.toLowerCase()} by the Ministry.`]
      )
    }

    res.json({ success: true, message: `Institution ${status.toLowerCase()}` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    // Monthly trends
    const [trends] = await pool.query(
      `SELECT DATE_FORMAT(Request_Date, '%b') as month,
              SUM(CASE WHEN Purpose LIKE '%Employment%' THEN 1 ELSE 0 END) as emp,
              SUM(CASE WHEN Purpose LIKE '%Admission%' OR Purpose LIKE '%Education%' THEN 1 ELSE 0 END) as edu,
              SUM(CASE WHEN Purpose LIKE '%Immigration%' OR Purpose LIKE '%Visa%' THEN 1 ELSE 0 END) as visa
       FROM VERIFICATION_REQUEST
       GROUP BY YEAR(Request_Date), MONTH(Request_Date), DATE_FORMAT(Request_Date, '%b')
       ORDER BY YEAR(Request_Date), MONTH(Request_Date)`
    )

    // Purpose distribution
    const [purposeDist] = await pool.query(
      `SELECT 
        CASE
          WHEN Purpose LIKE '%Employment%' THEN 'Employment'
          WHEN Purpose LIKE '%Admission%' OR Purpose LIKE '%Education%' THEN 'Higher Education'
          WHEN Purpose LIKE '%Immigration%' OR Purpose LIKE '%Visa%' THEN 'Immigration'
          ELSE 'Other'
        END as name,
        COUNT(*) as value
       FROM VERIFICATION_REQUEST GROUP BY name`
    )

    // Revenue
    const [revenue] = await pool.query(
      'SELECT SUM(CASE WHEN Payment_Status = "Completed" THEN Amount ELSE 0 END) as totalRevenue, COUNT(*) as totalTxns FROM PAYMENT_TRANSACTION'
    )

    res.json({ success: true, trends, purposeDistribution: purposeDist, revenue: revenue[0] })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const search = req.query.search || ''

    let query = 'SELECT * FROM AUDIT_LOG'
    let countQuery = 'SELECT COUNT(*) as total FROM AUDIT_LOG'
    const params = []

    if (search) {
      const whereClause = ' WHERE User_Email LIKE ? OR Action_Type LIKE ? OR Table_Name LIKE ?'
      query += whereClause
      countQuery += whereClause
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const sortBy = req.query.sortBy || 'Timestamp'
    const sortDir = req.query.sortDir === 'ASC' ? 'ASC' : 'DESC'

    const allowedColumns = {
      'User_Email': 'User_Email',
      'Action_Type': 'Action_Type',
      'Table_Name': 'Table_Name',
      'Timestamp': 'Timestamp'
    }

    const orderBy = allowedColumns[sortBy] ? `${allowedColumns[sortBy]} ${sortDir}` : 'Timestamp DESC'

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [rows] = await pool.query(query, params)
    const [total] = await pool.query(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [])

    res.json({ success: true, logs: rows, total: total[0].total, page, limit })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// POST /api/admin/certificates/generate/:requestId
const generateCertificate = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { requestId } = req.params;

    // Check request exists and is Completed or In_Progress
    const [request] = await connection.query(
      `SELECT vr.Request_ID, vr.Status, vr.Fee_ID, s.Student_Name, s.NED_ID 
       FROM VERIFICATION_REQUEST vr 
       JOIN STUDENT s ON vr.NED_ID = s.NED_ID 
       WHERE vr.Request_ID = ?`, [requestId]
    );

    if (request.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Check if certificate already exists
    const [existing] = await connection.query('SELECT Certificate_Number FROM VERIFICATION_CERTIFICATE WHERE Request_ID = ?', [requestId]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Certificate already generated', certificateNumber: existing[0].Certificate_Number });
    }

    // Call the helper to issue the certificate
    const certNumber = await issueCertificate(connection, requestId);

    await connection.commit();
    res.json({ success: true, message: 'Certificate generated successfully', certificateNumber: certNumber });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    connection.release();
  }
}

// GET /api/admin/certificates/:certNumber/download
const downloadCertificate = async (req, res) => {
  try {
    const { certNumber } = req.params;

    const [rows] = await pool.query(
      `SELECT vc.Certificate_Number, vc.Issue_Date, vc.Valid_Until,
              s.Student_Name,
              q.Degree_Name,
              i.Institution_Name
       FROM VERIFICATION_CERTIFICATE vc
       JOIN VERIFICATION_REQUEST vr ON vc.Request_ID = vr.Request_ID
       JOIN STUDENT s ON vr.NED_ID = s.NED_ID
       JOIN REQUESTED_QUALIFICATION rq ON vr.Request_ID = rq.Request_ID
       JOIN QUALIFICATION q ON rq.Qualification_ID = q.Qualification_ID
       JOIN INSTITUTION i ON q.Institution_ID = i.Institution_ID
       WHERE vc.Certificate_Number = ? LIMIT 1`, [certNumber]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Certificate not found' });

    const certData = {
      certificateNumber: rows[0].Certificate_Number,
      studentName: rows[0].Student_Name,
      degreeName: rows[0].Degree_Name,
      institutionName: rows[0].Institution_Name,
      issueDate: new Date(rows[0].Issue_Date).toLocaleDateString(),
      validUntil: new Date(rows[0].Valid_Until).toLocaleDateString()
    };

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${certNumber}`;
    const pdfBuffer = await generateCertificatePDF(certData, verificationUrl);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SQVS-Certificate-${certNumber}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

// GET /api/admin/analytics/export
const exportAnalytics = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SQVS Admin'
    workbook.created = new Date()

    // Sheet 1: Verifications Overview
    const verSheet = workbook.addWorksheet('Verifications')
    verSheet.columns = [
      { header: 'Request ID', key: 'id', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Student Name', key: 'student', width: 25 },
      { header: 'NED ID', key: 'nedId', width: 15 },
      { header: 'Verifier Org', key: 'org', width: 30 },
      { header: 'Purpose', key: 'purpose', width: 30 }
    ]

    const [verData] = await pool.query(
      `SELECT vr.Request_ID, vr.Request_Date, vr.Status, vr.Purpose, 
              s.Student_Name, s.NED_ID, 
              ev.Organization_Name 
       FROM VERIFICATION_REQUEST vr 
       JOIN STUDENT s ON vr.NED_ID = s.NED_ID 
       JOIN EXTERNAL_VERIFIER ev ON vr.Verifier_ID = ev.Verifier_ID
       ORDER BY vr.Request_Date DESC`
    )

    verData.forEach(row => {
      verSheet.addRow({
        id: `REQ-${row.Request_ID}`,
        date: new Date(row.Request_Date).toLocaleDateString(),
        status: row.Status,
        student: row.Student_Name,
        nedId: row.NED_ID,
        org: row.Organization_Name,
        purpose: row.Purpose
      })
    })

    // Sheet 2: Institutions
    const instSheet = workbook.addWorksheet('Institutions')
    instSheet.columns = [
      { header: 'Institution Name', key: 'name', width: 40 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Contact Email', key: 'email', width: 30 }
    ]

    const [instData] = await pool.query('SELECT Institution_Name, Institution_Type, Location, Status, Contact_Email FROM INSTITUTION ORDER BY Institution_Name')
    
    instData.forEach(row => {
      instSheet.addRow({
        name: row.Institution_Name,
        type: row.Institution_Type,
        location: row.Location,
        status: row.Status,
        email: row.Contact_Email
      })
    })

    // Sheet 3: Revenue
    const revSheet = workbook.addWorksheet('Revenue')
    revSheet.columns = [
      { header: 'Transaction ID', key: 'txn', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Request ID', key: 'reqId', width: 15 },
      { header: 'Amount (Rs)', key: 'amount', width: 15 },
      { header: 'Method', key: 'method', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ]

    const [revData] = await pool.query('SELECT Transaction_ID, Transaction_Date, Request_ID, Amount, Payment_Method, Payment_Status FROM PAYMENT_TRANSACTION ORDER BY Transaction_Date DESC')
    
    revData.forEach(row => {
      revSheet.addRow({
        txn: row.Transaction_ID,
        date: new Date(row.Transaction_Date).toLocaleDateString(),
        reqId: `REQ-${row.Request_ID}`,
        amount: row.Amount,
        method: row.Payment_Method || 'UPI',
        status: row.Payment_Status
      })
    })

    // Style headers
    workbook.eachSheet((sheet) => {
      sheet.getRow(1).font = { bold: true }
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
    })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="SQVS-Analytics-Report.xlsx"')
    
    await workbook.xlsx.write(res)
    res.end()

  } catch (error) {
    console.error(error)
  }
}

// GET /api/admin/officials (HIDDEN FEATURE)
const getOfficials = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Official_ID, Name, Email, Department, Phone, Status, Created_At FROM MINISTRY_OFFICIAL ORDER BY Created_At DESC')
    res.json({ success: true, officials: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// POST /api/admin/officials (HIDDEN FEATURE)
const addOfficial = async (req, res) => {
  try {
    const { name, email, department, phone, password } = req.body
    if (!name || !email || !department || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    await pool.query(
      'INSERT INTO MINISTRY_OFFICIAL (Name, Email, Password_Hash, Department, Phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, department, phone || null]
    )

    res.status(201).json({ success: true, message: 'Ministry official added successfully' })
  } catch (error) {
    console.error(error)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Official with this email already exists' })
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/admin/verifiers
const getVerifiers = async (req, res) => {
  try {
    const { status, search } = req.query
    let query = 'SELECT Verifier_ID, Organization_Name, Verifier_Type, Country, Contact_Person, Email, Phone, Status, Created_At FROM EXTERNAL_VERIFIER'
    const params = []

    const conditions = []
    if (status) {
      conditions.push('Status = ?')
      params.push(status)
    }
    if (search) {
      conditions.push('(Organization_Name LIKE ? OR Contact_Person LIKE ? OR Email LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY Created_At DESC'
    const [rows] = await pool.query(query, params)
    res.json({ success: true, verifiers: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// PUT /api/admin/verifiers/:id/approve
const approveVerifier = async (req, res) => {
  try {
    const { status } = req.body // 'Approved', 'Rejected', 'Suspended'
    if (!['Approved', 'Rejected', 'Suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved, Rejected, or Suspended' })
    }

    const approvalDate = status === 'Approved' ? new Date().toISOString().split('T')[0] : null

    await pool.query(
      'UPDATE EXTERNAL_VERIFIER SET Status = ?, Approved_By = ?, Approval_Date = ? WHERE Verifier_ID = ?',
      [status, req.user.id, approvalDate, req.params.id]
    )

    // Notify verifier
    const [v] = await pool.query('SELECT Email, Organization_Name FROM EXTERNAL_VERIFIER WHERE Verifier_ID = ?', [req.params.id])
    if (v.length > 0) {
      await pool.query(
        'INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message) VALUES (?, ?, ?)',
        [v[0].Email, 'Status_Update', `Your verifier registration for "${v[0].Organization_Name}" has been ${status.toLowerCase()} by the Ministry.`]
      )
    }

    res.json({ success: true, message: `Verifier ${status.toLowerCase()}` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

module.exports = { getDashboard, getInstitutions, getPendingInstitutions, approveInstitution, getAnalytics, getAuditLogs, generateCertificate, downloadCertificate, exportAnalytics, getOfficials, addOfficial, getVerifiers, approveVerifier }

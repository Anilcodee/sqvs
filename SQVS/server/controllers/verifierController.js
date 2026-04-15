const pool = require('../config/db')
const { generateReceiptPDF } = require('../utils/pdfGenerator')
const { issueCertificate } = require('../utils/certificateHelper')

// GET /api/verifier/dashboard
const getDashboard = async (req, res) => {
  try {
    const vId = req.user.id
    const [stats] = await pool.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) as completed,
              SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as pending,
              SUM(CASE WHEN Status = 'In_Progress' THEN 1 ELSE 0 END) as inProgress
       FROM VERIFICATION_REQUEST WHERE Verifier_ID = ?`, [vId]
    )
    res.json({ success: true, stats: stats[0] })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/verifier/requests
const getRequests = async (req, res) => {
  try {
    const search = req.query.search || ''
    const searchPattern = `%${search}%`
    const sortBy = req.query.sortBy || 'Request_Date'
    const sortDir = req.query.sortDir === 'ASC' ? 'ASC' : 'DESC'

    const allowedColumns = {
      'Request_ID': 'vr.Request_ID',
      'Student_Name': 's.Student_Name',
      'Purpose': 'vr.Purpose',
      'Request_Date': 'vr.Request_Date',
      'Expiry_Date': 'vr.Expiry_Date',
      'Status': 'vr.Status',
      'Certificate_Number': 'vc.Certificate_Number',
      'Amount': 'pt.Amount'
    }

    let orderBy = allowedColumns[sortBy] ? `${allowedColumns[sortBy]} ${sortDir}` : `vr.Request_Date DESC`
    
    const [rows] = await pool.query(
      `SELECT vr.Request_ID, vr.NED_ID, vr.Purpose, vr.Request_Date, vr.Expiry_Date, vr.Status,
              s.Student_Name,
              pt.Amount, pt.Payment_Status,
              vf.Purpose as Fee_Purpose,
              vc.Certificate_Number
       FROM VERIFICATION_REQUEST vr
       JOIN STUDENT s ON vr.NED_ID = s.NED_ID
       LEFT JOIN PAYMENT_TRANSACTION pt ON vr.Request_ID = pt.Request_ID
       JOIN VERIFICATION_FEE vf ON vr.Fee_ID = vf.Fee_ID
       LEFT JOIN VERIFICATION_CERTIFICATE vc ON vr.Request_ID = vc.Request_ID
       WHERE vr.Verifier_ID = ? AND (s.Student_Name LIKE ? OR vc.Certificate_Number LIKE ?)
       ORDER BY ${orderBy}`, [req.user.id, searchPattern, searchPattern]
    )

    for (let row of rows) {
      const [rqs] = await pool.query(
        `SELECT rq.Consent_Status, q.Degree_Name FROM REQUESTED_QUALIFICATION rq JOIN QUALIFICATION q ON rq.Qualification_ID = q.Qualification_ID WHERE rq.Request_ID = ?`, [row.Request_ID]
      )
      row.qualifications = rqs
    }

    res.json({ success: true, requests: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/verifier/requests/:requestId
const getRequestDetail = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // First, check if it exists at all (for easier debugging)
    const [existsCheck] = await pool.query('SELECT Verifier_ID FROM VERIFICATION_REQUEST WHERE Request_ID = ?', [requestId]);
    
    if (existsCheck.length === 0) {
        return res.status(404).json({ success: false, message: 'Request ID does not exist' });
    }
    
    if (existsCheck[0].Verifier_ID != req.user.id) {
        console.warn(`Unauthorized access attempt: Verifier ${req.user.id} tried to access request ${requestId} owned by Verifier ${existsCheck[0].Verifier_ID}`);
        return res.status(403).json({ success: false, message: 'Access denied: You do not own this request' });
    }

    // Check ownership
    const [request] = await pool.query(
      `SELECT vr.*, s.Student_Name, s.Email as Student_Email,
              pt.Amount, pt.Payment_Status, pt.Payment_Method, pt.Transaction_Date as Payment_Date,
              vf.Purpose as Fee_Purpose, vc.Certificate_Number
       FROM VERIFICATION_REQUEST vr
       JOIN STUDENT s ON vr.NED_ID = s.NED_ID
       LEFT JOIN PAYMENT_TRANSACTION pt ON vr.Request_ID = pt.Request_ID
       JOIN VERIFICATION_FEE vf ON vr.Fee_ID = vf.Fee_ID
       LEFT JOIN VERIFICATION_CERTIFICATE vc ON vr.Request_ID = vc.Request_ID
       WHERE vr.Request_ID = ? AND vr.Verifier_ID = ?`,
      [requestId, req.user.id]
    );


    if (!request || request.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found or access denied' });
    }

    // Get requested qualifications and documents
    const [rqs] = await pool.query(
      `SELECT rq.Consent_Status, rq.Consent_Date, 
              q.Qualification_ID, q.Certificate_Number, q.Degree_Name, q.Qualification_Level, 
              q.Field_of_Study, q.Enrollment_Date, q.Completion_Date, q.Grade, q.Percentage,
              i.Institution_Name
       FROM REQUESTED_QUALIFICATION rq
       JOIN QUALIFICATION q ON rq.Qualification_ID = q.Qualification_ID
       JOIN INSTITUTION i ON q.Institution_ID = i.Institution_ID
       WHERE rq.Request_ID = ?`,
      [requestId]
    );

    for (let qual of rqs) {
      const [docs] = await pool.query(
        'SELECT Document_ID, Document_Type, Document_Type as Document_Name, Document_Path as File_Path FROM SUPPORTING_DOCUMENT WHERE Qualification_ID = ?', 
        [qual.Qualification_ID]
      );
      qual.documents = docs;
    }


    res.json({ success: true, request: request[0], qualifications: rqs });
  } catch (error) {
    console.error('Error fetching request detail:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

// GET /api/verifier/search-student/:nedId
const searchStudent = async (req, res) => {
  try {
    const [students] = await pool.query('SELECT NED_ID, Student_Name, Date_of_Birth FROM STUDENT WHERE NED_ID = ? AND Status = "Active"', [req.params.nedId])
    if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found' })

    const [quals] = await pool.query(
      `SELECT q.Qualification_ID, q.Degree_Name, q.Qualification_Level, q.Completion_Date, q.Status, i.Institution_Name
       FROM QUALIFICATION q JOIN INSTITUTION i ON q.Institution_ID = i.Institution_ID
       WHERE q.NED_ID = ? AND q.Status = 'Verified'`, [req.params.nedId]
    )
    res.json({ success: true, student: students[0], qualifications: quals })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// POST /api/verifier/requests
const createRequest = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { nedId, qualificationIds, purpose, feeId } = req.body
    if (!nedId || !qualificationIds || !qualificationIds.length || !purpose || !feeId) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'All fields required' })
    }

    // Get student info for notification
    const [studentRows] = await connection.query('SELECT Email, Student_Name FROM STUDENT WHERE NED_ID = ?', [nedId]);
    if (studentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const student = studentRows[0];

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    const [result] = await connection.query(
      'INSERT INTO VERIFICATION_REQUEST (NED_ID, Verifier_ID, Fee_ID, Purpose, Expiry_Date) VALUES (?, ?, ?, ?, ?)',
      [nedId, req.user.id, feeId, purpose, expiryDate.toISOString().split('T')[0]]
    )

    const requestId = result.insertId

    // Insert requested qualifications
    for (const qualId of qualificationIds) {
      await connection.query('INSERT INTO REQUESTED_QUALIFICATION (Request_ID, Qualification_ID) VALUES (?, ?)', [requestId, qualId])
    }

    // Get fee amount and create payment
    const [fee] = await connection.query('SELECT Base_Fee FROM VERIFICATION_FEE WHERE Fee_ID = ?', [feeId])
    const amount = fee[0].Base_Fee * qualificationIds.length

    await connection.query(
      'INSERT INTO PAYMENT_TRANSACTION (Request_ID, Amount, Payment_Method, Payment_Status) VALUES (?, ?, ?, ?)',
      [requestId, amount, 'UPI', 'Pending']
    )

    // Notification to student
    await connection.query(
      'INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message) VALUES (?, ?, ?)',
      [student.Email, 'Verification_Request', `${req.user.name || 'An organization'} has requested to verify your qualifications.`]
    )

    // Audit log
    await connection.query(
      'INSERT INTO AUDIT_LOG (User_Email, Action_Type, Table_Name, Record_ID, New_Value, IP_Address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.email, 'CREATE', 'VERIFICATION_REQUEST', String(requestId), `Created request for ${nedId}`, req.ip]
    )

    await connection.commit();
    res.status(201).json({ success: true, message: 'Request created', requestId, amount })
  } catch (error) {
    await connection.rollback();
    console.error('Error in createRequest:', error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  } finally {
    connection.release();
  }
}


// PUT /api/verifier/payment/:requestId
const processPayment = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const { requestId } = req.params
    const { paymentMethod } = req.body

    // Check the request belongs to this verifier
    const [check] = await connection.query(
      'SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = ? AND Verifier_ID = ?',
      [requestId, req.user.id]
    )
    if (check.length === 0) {
      await connection.rollback()
      return res.status(404).json({ success: false, message: 'Request not found' })
    }

    // Ensure some qualifications are associated with the request
    const [quals] = await connection.query('SELECT Consent_Status FROM REQUESTED_QUALIFICATION WHERE Request_ID = ?', [requestId])
    if (quals.length === 0) {
      await connection.rollback()
      return res.status(400).json({ success: false, message: 'No qualifications found for this request.' })
    }

    // Update payment status
    const [payment] = await connection.query(
      'SELECT Transaction_ID, Amount FROM PAYMENT_TRANSACTION WHERE Request_ID = ?',
      [requestId]
    )
    if (payment.length === 0) {
      await connection.rollback()
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    const txnId = 'TXN' + Date.now().toString(36).toUpperCase()
    await connection.query(
      'UPDATE PAYMENT_TRANSACTION SET Payment_Status = ?, Payment_Method = ?, Transaction_Date = NOW() WHERE Request_ID = ?',
      ['Completed', paymentMethod || 'UPI', requestId]
    )

    // Find an active ministry official to process the request
    const [officials] = await connection.query("SELECT Official_ID, Email FROM MINISTRY_OFFICIAL WHERE Status = 'Active' LIMIT 1")
    const processedBy = officials.length > 0 ? officials[0].Official_ID : null
    const officialEmail = officials.length > 0 ? officials[0].Email : null

    // Re-fetch qualification status just before deciding on request status
    const [finalQuals] = await connection.query('SELECT Consent_Status FROM REQUESTED_QUALIFICATION WHERE Request_ID = ?', [requestId])
    const allGranted = finalQuals.length > 0 && finalQuals.every(q => q.Consent_Status === 'Granted')

    // Always assign the official when payment is completed
    await connection.query(
      'UPDATE VERIFICATION_REQUEST SET Processed_By = ? WHERE Request_ID = ?',
      [processedBy, requestId]
    )
    
    if (allGranted) {
      await issueCertificate(connection, requestId)
    } else {
      await connection.query(
        'UPDATE VERIFICATION_REQUEST SET Status = "In_Progress" WHERE Request_ID = ?',
        [requestId]
      )

      // Notify the assigned Ministry Official
      if (officialEmail) {
        await connection.query(
          'INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message) VALUES (?, ?, ?)',
          [officialEmail, 'Status_Update', `A new verification request #${requestId} has been assigned to you and is currently In Progress (awaiting student consent).`]
        )
      }

      // Notify the student that payment is completed and consent is pending
      const [student] = await connection.query(
        'SELECT s.Email FROM STUDENT s JOIN VERIFICATION_REQUEST vr ON s.NED_ID = vr.NED_ID WHERE vr.Request_ID = ?',
        [requestId]
      )
      if (student.length > 0) {
        await connection.query(
          'INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message) VALUES (?, ?, ?)',
          [student[0].Email, 'Status_Update', `Payment for verification request #${requestId} has been completed. Please grant consent for the requested qualifications to finalize the process.`]
        )
      }
    }

    // Audit log
    await connection.query(
      'INSERT INTO AUDIT_LOG (User_Email, Action_Type, Table_Name, Record_ID, New_Value, IP_Address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.email, 'UPDATE', 'PAYMENT_TRANSACTION', String(payment[0].Transaction_ID), `Payment completed: ₹${payment[0].Amount}`, req.ip]
    )

    await connection.commit()
    res.json({ 
      success: true, 
      message: 'Payment processed successfully', 
      transactionId: txnId,
      amount: payment[0].Amount
    })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  } finally {
    connection.release()
  }
}

// GET /api/verifier/payments/:requestId/receipt
const downloadReceipt = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Verify ownership and get payment info
    const [request] = await pool.query(
      `SELECT vr.*, ev.Organization_Name, pt.Transaction_ID, pt.Amount, pt.Transaction_Date as Payment_Date, pt.Payment_Method, vf.Purpose
       FROM VERIFICATION_REQUEST vr
       JOIN EXTERNAL_VERIFIER ev ON vr.Verifier_ID = ev.Verifier_ID
       JOIN PAYMENT_TRANSACTION pt ON vr.Request_ID = pt.Request_ID
       JOIN VERIFICATION_FEE vf ON vr.Fee_ID = vf.Fee_ID
       WHERE vr.Request_ID = ? AND vr.Verifier_ID = ? AND pt.Payment_Status = 'Completed'`,
      [requestId, req.user.id]
    );

    if (request.length === 0) {
      return res.status(404).json({ success: false, message: 'Completed payment not found for this request' });
    }

    const receiptData = {
      transactionId: request[0].Transaction_ID,
      amount: request[0].Amount,
      paymentDate: new Date(request[0].Payment_Date).toLocaleDateString('en-IN'),
      paymentMethod: request[0].Payment_Method || 'UPI/Card',
      payerName: request[0].Organization_Name || 'Authorized Verifier',
      purpose: request[0].Purpose || 'Verification Fee'
    };

    const pdfBuffer = await generateReceiptPDF(receiptData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-${receiptData.transactionId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

module.exports = { getDashboard, getRequests, getRequestDetail, searchStudent, createRequest, processPayment, downloadReceipt }

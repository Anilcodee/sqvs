const pool = require('../config/db')
const { generateReceiptPDF } = require('../utils/pdfGenerator')
const { issueCertificate } = require('../utils/certificateHelper')
const path = require('path')
const fs = require('fs')

// GET /api/student/dashboard
const getDashboard = async (req, res) => {
  try {
    const nedId = req.user.id
    const [quals] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN Status = "Verified" THEN 1 ELSE 0 END) as verified, SUM(CASE WHEN Status = "Pending" THEN 1 ELSE 0 END) as pending FROM QUALIFICATION WHERE NED_ID = ?', [nedId])
    const [consents] = await pool.query('SELECT COUNT(*) as pending FROM REQUESTED_QUALIFICATION rq JOIN VERIFICATION_REQUEST vr ON rq.Request_ID = vr.Request_ID WHERE vr.NED_ID = ? AND rq.Consent_Status = "Pending"', [nedId])
    const [activity] = await pool.query('SELECT al.Action_Type, al.Table_Name, al.New_Value, al.Timestamp FROM AUDIT_LOG al WHERE al.User_Email = ? ORDER BY al.Timestamp DESC LIMIT 5', [req.user.email])

    res.json({
      success: true,
      stats: { total: quals[0].total, verified: quals[0].verified, pending: quals[0].pending, pendingConsents: consents[0].pending },
      activity
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/student/qualifications
const getQualifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT q.Qualification_ID, q.Certificate_Number, q.Qualification_Level, q.Degree_Name, q.Field_of_Study,
              q.Enrollment_Date, q.Completion_Date, q.Percentage, q.Grade, q.Status,
              i.Institution_Name
       FROM QUALIFICATION q
       JOIN INSTITUTION i ON q.Institution_ID = i.Institution_ID
       WHERE q.NED_ID = ?
       ORDER BY q.Completion_Date DESC`, [req.user.id]
    )
    res.json({ success: true, qualifications: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/student/qualifications/:id
const getQualificationDetail = async (req, res) => {
  try {
    const [quals] = await pool.query(
      `SELECT q.*, i.Institution_Name, s1.Staff_Name as EnteredByName, s2.Staff_Name as VerifiedByName
       FROM QUALIFICATION q
       JOIN INSTITUTION i ON q.Institution_ID = i.Institution_ID
       JOIN INSTITUTION_STAFF s1 ON q.Entered_By = s1.Staff_ID
       LEFT JOIN INSTITUTION_STAFF s2 ON q.Verified_By = s2.Staff_ID
       WHERE q.Qualification_ID = ? AND q.NED_ID = ?`, [req.params.id, req.user.id]
    )
    if (quals.length === 0) return res.status(404).json({ success: false, message: 'Qualification not found' })

    const [docs] = await pool.query('SELECT * FROM SUPPORTING_DOCUMENT WHERE Qualification_ID = ?', [req.params.id])

    res.json({ success: true, qualification: quals[0], documents: docs })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// GET /api/student/verifications
const getVerifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT vr.Request_ID, vr.Purpose, vr.Request_Date, vr.Expiry_Date, vr.Status,
              ev.Organization_Name, ev.Verifier_Type,
              pt.Amount, pt.Payment_Status,
              vc.Certificate_Number
       FROM VERIFICATION_REQUEST vr
       JOIN EXTERNAL_VERIFIER ev ON vr.Verifier_ID = ev.Verifier_ID
       LEFT JOIN PAYMENT_TRANSACTION pt ON vr.Request_ID = pt.Request_ID
       LEFT JOIN VERIFICATION_CERTIFICATE vc ON vr.Request_ID = vc.Request_ID
       WHERE vr.NED_ID = ?
       ORDER BY vr.Request_Date DESC`, [req.user.id]
    )

    // Get requested qualifications for each request
    for (let row of rows) {
      const [rqs] = await pool.query(
        `SELECT rq.Consent_Status, rq.Consent_Date, q.Qualification_ID, q.Degree_Name, q.Completion_Date
         FROM REQUESTED_QUALIFICATION rq
         JOIN QUALIFICATION q ON rq.Qualification_ID = q.Qualification_ID
         WHERE rq.Request_ID = ?`, [row.Request_ID]
      )
      row.qualifications = rqs
    }

    res.json({ success: true, verifications: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// PUT /api/student/consent/:requestId/:qualId
const updateConsent = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const { requestId, qualId } = req.params
    const { consent } = req.body // 'Granted' or 'Denied'

    // Verify this request belongs to the student
    const [check] = await connection.query('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = ? AND NED_ID = ?', [requestId, req.user.id])
    if (check.length === 0) {
      await connection.rollback()
      return res.status(403).json({ success: false, message: 'Not your verification request' })
    }

    await connection.query(
      'UPDATE REQUESTED_QUALIFICATION SET Consent_Status = ?, Consent_Date = NOW() WHERE Request_ID = ? AND Qualification_ID = ?',
      [consent, requestId, qualId]
    )

    if (consent === 'Denied') {
      // If student denies consent, the entire request is rejected
      await connection.query(
        'UPDATE VERIFICATION_REQUEST SET Status = "Rejected" WHERE Request_ID = ?',
        [requestId]
      )

      // Fetch verifier email and payment status
      const [verifierData] = await connection.query(
        `SELECT ev.Email, ev.Organization_Name, pt.Payment_Status, pt.Amount
         FROM VERIFICATION_REQUEST vr
         JOIN EXTERNAL_VERIFIER ev ON vr.Verifier_ID = ev.Verifier_ID
         LEFT JOIN PAYMENT_TRANSACTION pt ON vr.Request_ID = pt.Request_ID
         WHERE vr.Request_ID = ?`,
        [requestId]
      )

      if (verifierData.length > 0) {
        let refundMsg = ''
        if (verifierData[0].Payment_Status === 'Completed') {
          // Mark as Refunded (simulation)
          await connection.query(
            'UPDATE PAYMENT_TRANSACTION SET Payment_Status = "Refunded", Refund_Date = CURDATE(), Refund_Reason = ? WHERE Request_ID = ?',
            ['Student denied consent for verification', requestId]
          )
          refundMsg = ' Your payment has been marked for refund.'
        }

        // Notify the verifier
        await connection.query(
          'INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message) VALUES (?, ?, ?)',
          [verifierData[0].Email, 'Status_Update', `Student ${req.user.name} has denied consent for verification request #${requestId} (${verifierData[0].Organization_Name}). The request has been rejected.${refundMsg}`]
        )
      }
    } else {
      // Re-fetch ALL qualifications to ensure we have the absolute latest state
      const [allQuals] = await connection.query('SELECT Consent_Status FROM REQUESTED_QUALIFICATION WHERE Request_ID = ?', [requestId])
      const allGranted = allQuals.every(q => q.Consent_Status === 'Granted')
      
      if (allGranted) {
        const [payment] = await connection.query('SELECT Payment_Status FROM PAYMENT_TRANSACTION WHERE Request_ID = ?', [requestId])
        if (payment.length > 0 && payment[0].Payment_Status === 'Completed') {
          // Trigger certificate issuance
          await issueCertificate(connection, requestId)
        }
      }
    }

    // Audit log
    await connection.query(
      'INSERT INTO AUDIT_LOG (User_Email, Action_Type, Table_Name, Record_ID, Old_Value, New_Value, IP_Address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.email, 'UPDATE', 'REQUESTED_QUALIFICATION', `${requestId}-${qualId}`, 'Consent_Status: Pending', `Consent_Status: ${consent}`, req.ip]
    )

    await connection.commit()
    res.json({ success: true, message: `Consent ${consent}` })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  } finally {
    connection.release()
  }
}

// GET /api/student/payments/:requestId/receipt
const downloadReceipt = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Verify ownership and get payment info
    const [request] = await pool.query(
      `SELECT vr.*, s.Student_Name, pt.Transaction_ID, pt.Amount, pt.Transaction_Date, pt.Payment_Method, vf.Purpose
       FROM VERIFICATION_REQUEST vr
       JOIN STUDENT s ON vr.NED_ID = s.NED_ID
       JOIN PAYMENT_TRANSACTION pt ON vr.Request_ID = pt.Request_ID
       JOIN VERIFICATION_FEE vf ON vr.Fee_ID = vf.Fee_ID
       WHERE vr.Request_ID = ? AND vr.NED_ID = ? AND pt.Payment_Status = 'Completed'`,
      [requestId, req.user.id]
    );

    if (request.length === 0) {
      return res.status(404).json({ success: false, message: 'Completed payment not found for this request' });
    }

    const receiptData = {
      transactionId: request[0].Transaction_ID,
      amount: request[0].Amount,
      paymentDate: new Date(request[0].Transaction_Date).toLocaleDateString('en-IN'),
      paymentMethod: request[0].Payment_Method || 'UPI/Card',
      payerName: request[0].Student_Name,
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

// GET /api/student/error-reports
const getErrorReports = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT er.*, q.Degree_Name 
       FROM ERROR_REPORT er
       JOIN QUALIFICATION q ON er.Qualification_ID = q.Qualification_ID
       WHERE er.Reported_By = ?
       ORDER BY er.Report_Date DESC`, [req.user.id]
    )
    res.json({ success: true, reports: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// POST /api/student/error-reports
const createErrorReport = async (req, res) => {
  try {
    const { qualificationId, description } = req.body
    if (!qualificationId || !description) {
      return res.status(400).json({ success: false, message: 'Qualification and description required' })
    }

    // Verify qualification belongs to student
    const [check] = await pool.query('SELECT * FROM QUALIFICATION WHERE Qualification_ID = ? AND NED_ID = ?', [qualificationId, req.user.id])
    if (check.length === 0) {
      return res.status(403).json({ success: false, message: 'Not your qualification' })
    }

    await pool.query(
      'INSERT INTO ERROR_REPORT (Qualification_ID, Reported_By, Issue_Description) VALUES (?, ?, ?)',
      [qualificationId, req.user.id, description]
    )

    // Audit log
    await pool.query(
      'INSERT INTO AUDIT_LOG (User_Email, Action_Type, Table_Name, Record_ID, New_Value, IP_Address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.email, 'CREATE', 'ERROR_REPORT', qualificationId, description, req.ip]
    )

    res.status(201).json({ success: true, message: 'Error report submitted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

module.exports = { getDashboard, getQualifications, getQualificationDetail, getVerifications, updateConsent, downloadReceipt, getErrorReports, createErrorReport }

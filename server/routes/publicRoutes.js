const express = require('express')
const router = express.Router()
const pool = require('../config/db')

// GET /api/public/verify/:certNumber
router.get('/verify/:certNumber', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT vc.Certificate_Number, vc.Issue_Date, vc.Valid_Until,
              s.Student_Name, s.NED_ID,
              q.Degree_Name, q.Qualification_Level, q.Percentage, q.Grade, q.Completion_Date,
              i.Institution_Name,
              vr.Purpose
       FROM VERIFICATION_CERTIFICATE vc
       JOIN VERIFICATION_REQUEST vr ON vc.Request_ID = vr.Request_ID
       JOIN STUDENT s ON vr.NED_ID = s.NED_ID
       JOIN REQUESTED_QUALIFICATION rq ON vr.Request_ID = rq.Request_ID
       JOIN QUALIFICATION q ON rq.Qualification_ID = q.Qualification_ID
       JOIN INSTITUTION i ON q.Institution_ID = i.Institution_ID
       WHERE vc.Certificate_Number = ?
       LIMIT 1`, [req.params.certNumber]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Certificate not found', valid: false })
    }

    res.json({ success: true, valid: true, certificate: rows[0] })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
)

// GET /api/public/fees
router.get('/fees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM VERIFICATION_FEE ORDER BY Base_Fee')
    res.json({ success: true, fees: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
})

const { downloadCertificate } = require('../controllers/adminController')

// GET /api/public/certificates/:certNumber/download
router.get('/certificates/:certNumber/download', downloadCertificate)

module.exports = router

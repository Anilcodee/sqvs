const express = require('express')
const router = express.Router()
const { verifyToken, requireRole } = require('../middleware/auth')
const { getDashboard, getQualifications, getQualificationDetail, getVerifications, updateConsent, downloadReceipt, getErrorReports, createErrorReport } = require('../controllers/studentController')

router.use(verifyToken, requireRole('student'))

router.get('/dashboard', getDashboard)
router.get('/qualifications', getQualifications)
router.get('/qualifications/:id', getQualificationDetail)
router.get('/verifications', getVerifications)
router.put('/consent/:requestId/:qualId', updateConsent)
router.get('/payments/:requestId/receipt', downloadReceipt)
router.get('/error-reports', getErrorReports)
router.post('/error-reports', createErrorReport)

// Document Download
const path = require('path');
const fs = require('fs');

router.get('/documents/:filename', (req, res) => {
  const filepath = path.join(__dirname, '../uploads', req.params.filename);
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).json({ success: false, message: 'Document not found' });
  }
});

module.exports = router

const express = require('express')
const router = express.Router()
const { verifyToken, requireRole } = require('../middleware/auth')
const { getDashboard, getRequests, getRequestDetail, searchStudent, createRequest, processPayment, downloadReceipt } = require('../controllers/verifierController')

router.use(verifyToken, requireRole('verifier'))

router.get('/dashboard', getDashboard)
router.get('/requests', getRequests)
router.get('/requests/:requestId', getRequestDetail)
router.get('/search-student/:nedId', searchStudent)
router.post('/requests', createRequest)
router.put('/payment/:requestId', processPayment)
router.get('/payments/:requestId/receipt', downloadReceipt)

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

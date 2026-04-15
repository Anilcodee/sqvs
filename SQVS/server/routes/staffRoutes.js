const express = require('express')
const router = express.Router()
const { verifyToken, requireRole, requireInstitutionApproved } = require('../middleware/auth')
const { getDashboard, getQueue, addQualification, verifyQualification, searchStudent, sendStaffNotification, getStaffMembers, addStaffMember } = require('../controllers/staffController')
const upload = require('../middleware/uploadMiddleware')

router.use(verifyToken, requireRole('staff'), requireInstitutionApproved)

router.get('/dashboard', getDashboard)
router.get('/queue', getQueue)
router.get('/students/:nedId', searchStudent)
router.post('/qualifications', upload.array('documents', 5), addQualification)
router.put('/qualifications/:id/verify', verifyQualification)
router.post('/notifications', sendStaffNotification)
router.get('/members', getStaffMembers)
router.post('/members', addStaffMember)

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

const express = require('express')
const router = express.Router()
const { verifyToken, requireRole } = require('../middleware/auth')
const { getDashboard, getInstitutions, getPendingInstitutions, approveInstitution, getAnalytics, getAuditLogs, generateCertificate, downloadCertificate, exportAnalytics, getOfficials, addOfficial, getVerifiers, approveVerifier } = require('../controllers/adminController')

router.use(verifyToken, requireRole('admin'))

router.get('/dashboard', getDashboard)
router.get('/institutions', getInstitutions)
router.get('/institutions/pending', getPendingInstitutions)
router.put('/institutions/:id/approve', approveInstitution)
router.get('/verifiers', getVerifiers)
router.put('/verifiers/:id/approve', approveVerifier)
router.get('/analytics', getAnalytics)
router.get('/analytics/export', exportAnalytics)
router.get('/audit-logs', getAuditLogs)
router.post('/certificates/generate/:requestId', generateCertificate)
router.get('/certificates/:certNumber/download', downloadCertificate)
router.get('/officials', getOfficials)
router.post('/officials', addOfficial)

module.exports = router

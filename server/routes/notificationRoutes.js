const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/auth')
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController')

router.use(verifyToken)

router.get('/', getNotifications)
router.put('/read-all', markAllAsRead)
router.put('/:id/read', markAsRead)
router.delete('/:id', deleteNotification)

module.exports = router

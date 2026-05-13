const pool = require('../config/db')

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const email = req.user.email
    const [rows] = await pool.query(
      'SELECT * FROM NOTIFICATION WHERE Recipient_Email = ? ORDER BY Sent_At DESC LIMIT 50',
      [email]
    )
    res.json({ success: true, notifications: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const email = req.user.email

    const [result] = await pool.query(
      'UPDATE NOTIFICATION SET Read_Status = TRUE WHERE Notification_ID = ? AND Recipient_Email = ?',
      [id, email]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }

    res.json({ success: true, message: 'Notification marked as read' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    const email = req.user.email
    await pool.query(
      'UPDATE NOTIFICATION SET Read_Status = TRUE WHERE Recipient_Email = ? AND Read_Status = FALSE',
      [email]
    )
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params
    const email = req.user.email

    const [result] = await pool.query(
      'DELETE FROM NOTIFICATION WHERE Notification_ID = ? AND Recipient_Email = ?',
      [id, email]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }

    res.json({ success: true, message: 'Notification deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification }

const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

  const [rows] = await pool.query(
    `SELECT id, type, message, related_id, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [req.user.id, limit]
  );

  const [[{ unread }]] = await pool.query(
    'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.user.id]
  );

  res.json({ notifications: rows, unread });
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (result.affectedRows === 0) throw new AppError(404, 'Notification not found');
  res.json({ message: 'Marked as read' });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [
    req.user.id,
  ]);
  res.json({ message: 'All notifications marked as read' });
});

module.exports = { listNotifications, markRead, markAllRead };

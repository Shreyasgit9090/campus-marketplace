const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/reports — report another user
const createReport = asyncHandler(async (req, res) => {
  const { reportedUserId, reason } = req.body;
  if (!reportedUserId) throw new AppError(400, 'reportedUserId is required');
  if (!reason?.trim()) throw new AppError(400, 'A reason is required');
  if (Number(reportedUserId) === req.user.id) throw new AppError(400, "You can't report yourself");

  const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [reportedUserId]);
  if (!users[0]) throw new AppError(404, 'User not found');

  // Single-row INSERT (not INSERT...SELECT) — trg_reports_after_insert updates the
  // `users` table, and MySQL forbids a trigger updating a table the invoking
  // statement itself reads from.
  const [result] = await pool.query(
    'INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)',
    [req.user.id, reportedUserId, reason.trim()]
  );

  res.status(201).json({ id: result.insertId, reportedUserId: Number(reportedUserId), reason: reason.trim() });
});

// GET /api/reports/mine — reports the current user has filed
const listMyReports = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.reason, r.status, r.created_at, u.name AS reported_name
     FROM reports r
     JOIN users u ON u.id = r.reported_id
     WHERE r.reporter_id = ?
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );
  res.json({ reports: rows });
});

module.exports = { createReport, listMyReports };

const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/reports?status=Pending
const listReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = status ? 'WHERE r.status = ?' : '';
  const params = status ? [status] : [];

  const [rows] = await pool.query(
    `SELECT r.id, r.reason, r.status, r.created_at, r.reviewed_at,
            reporter.id AS reporter_id, reporter.name AS reporter_name,
            reported.id AS reported_id, reported.name AS reported_name, reported.is_suspended
     FROM reports r
     JOIN users reporter ON reporter.id = r.reporter_id
     JOIN users reported ON reported.id = r.reported_id
     ${where}
     ORDER BY r.created_at DESC`,
    params
  );
  res.json({ reports: rows });
});

// PATCH /api/admin/reports/:id — review a report (Reviewed/Dismissed)
const reviewReport = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Reviewed', 'Dismissed'].includes(status)) {
    throw new AppError(400, 'status must be Reviewed or Dismissed');
  }

  const [result] = await pool.query(
    `UPDATE reports SET status = ?, reviewed_at = NOW(), reviewed_by = ?
     WHERE id = ? AND status = 'Pending'`,
    [status, req.user.id, req.params.id]
  );
  if (result.affectedRows === 0) throw new AppError(404, 'Pending report not found');

  res.json({ message: `Report marked ${status}` });
});

// PATCH /api/admin/users/:id/suspend
const suspendUser = asyncHandler(async (req, res) => {
  const [result] = await pool.query('UPDATE users SET is_suspended = 1 WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'User not found');
  res.json({ message: 'User suspended' });
});

// PATCH /api/admin/users/:id/unsuspend
const unsuspendUser = asyncHandler(async (req, res) => {
  const [result] = await pool.query('UPDATE users SET is_suspended = 0 WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'User not found');
  res.json({ message: 'User unsuspended' });
});

// GET /api/admin/users?suspended=1
const listUsers = asyncHandler(async (req, res) => {
  const { suspended } = req.query;
  const where = suspended !== undefined ? 'WHERE is_suspended = ?' : '';
  const params = suspended !== undefined ? [suspended === '1' ? 1 : 0] : [];

  const [rows] = await pool.query(
    `SELECT id, name, email, is_suspended, is_admin, avg_rating, rating_count, created_at
     FROM users ${where} ORDER BY created_at DESC`,
    params
  );
  res.json({ users: rows });
});

module.exports = { listReports, reviewReport, suspendUser, unsuspendUser, listUsers };

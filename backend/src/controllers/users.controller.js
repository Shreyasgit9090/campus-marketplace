const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users/me
const getMe = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, phone, avg_rating, rating_count, is_admin, created_at
     FROM users WHERE id = ?`,
    [req.user.id]
  );
  res.json(rows[0]);
});

// PATCH /api/users/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  await pool.query('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?', [
    name || null,
    phone || null,
    req.user.id,
  ]);
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, avg_rating, rating_count, is_admin FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json(rows[0]);
});

// GET /api/users/:id/public
const getPublicProfile = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, avg_rating, rating_count, created_at FROM users WHERE id = ?',
    [req.params.id]
  );
  if (!rows[0]) throw new AppError(404, 'User not found');
  res.json(rows[0]);
});

// GET /api/users/me/transactions
const getMyTransactions = asyncHandler(async (req, res) => {
  const [bought] = await pool.query(
    `SELECT o.id, o.item_id, o.item_price, o.status, o.reserved_at, o.completed_at,
            i.name AS item_name, u.name AS seller_name
     FROM orders o
     JOIN items i ON i.id = o.item_id
     JOIN users u ON u.id = o.seller_id
     WHERE o.buyer_id = ?
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );

  const [sold] = await pool.query(
    `SELECT o.id, o.item_id, o.item_price, o.status, o.reserved_at, o.completed_at,
            i.name AS item_name, u.name AS buyer_name
     FROM orders o
     JOIN items i ON i.id = o.item_id
     JOIN users u ON u.id = o.buyer_id
     WHERE o.seller_id = ?
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );

  res.json({ bought, sold });
});

module.exports = { getMe, updateMe, getPublicProfile, getMyTransactions };

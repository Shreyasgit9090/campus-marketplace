const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/ratings — rate the other party on a Completed order
const createRating = asyncHandler(async (req, res) => {
  const { orderId, stars, comment } = req.body;
  const starsNum = Number(stars);
  if (!orderId) throw new AppError(400, 'orderId is required');
  if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
    throw new AppError(400, 'stars must be an integer between 1 and 5');
  }

  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  const order = rows[0];
  if (!order) throw new AppError(404, 'Order not found');
  if (order.status !== 'Completed') throw new AppError(409, 'You can only rate completed orders');

  let rateeId;
  if (order.buyer_id === req.user.id) rateeId = order.seller_id;
  else if (order.seller_id === req.user.id) rateeId = order.buyer_id;
  else throw new AppError(403, 'Not your order');

  try {
    const [result] = await pool.query(
      'INSERT INTO ratings (order_id, rater_id, ratee_id, stars, comment) VALUES (?, ?, ?, ?, ?)',
      [orderId, req.user.id, rateeId, starsNum, comment || null]
    );
    res.status(201).json({ id: result.insertId, orderId, rateeId, stars: starsNum, comment: comment || null });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, "You've already rated this order");
    }
    throw err;
  }
});

// GET /api/ratings/user/:userId — ratings a user has received
const listRatingsForUser = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.stars, r.comment, r.created_at, u.name AS rater_name
     FROM ratings r
     JOIN users u ON u.id = r.rater_id
     WHERE r.ratee_id = ?
     ORDER BY r.created_at DESC`,
    [req.params.userId]
  );

  const [[summary]] = await pool.query(
    'SELECT avg_rating, rating_count FROM users WHERE id = ?',
    [req.params.userId]
  );
  if (!summary) throw new AppError(404, 'User not found');

  res.json({ ...summary, ratings: rows });
});

module.exports = { createRating, listRatingsForUser };

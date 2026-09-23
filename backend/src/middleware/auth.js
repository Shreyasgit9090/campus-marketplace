const { verifyToken } = require('../utils/jwt');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the JWT, then re-checks is_suspended against the DB so a
// suspension takes effect immediately rather than waiting for the token to
// expire.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'Not authenticated');

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, phone, is_verified, is_admin, is_suspended FROM users WHERE id = ?',
    [payload.id]
  );
  const user = rows[0];
  if (!user) throw new AppError(401, 'User no longer exists');
  if (user.is_suspended) throw new AppError(403, 'Account suspended');

  req.user = user;
  next();
});

const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin) throw new AppError(403, 'Admin access required');
  next();
};

module.exports = { authenticate, requireAdmin };

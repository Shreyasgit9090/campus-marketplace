const bcrypt = require('bcrypt');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createOtp, verifyOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');
const { signToken } = require('../utils/jwt');

const COLLEGE_DOMAIN = () => (process.env.COLLEGE_EMAIL_DOMAIN || 'msrit.edu').toLowerCase();

function assertCollegeEmail(email) {
  if (!email.toLowerCase().endsWith(`@${COLLEGE_DOMAIN()}`)) {
    throw new AppError(400, `Registration is only open to @${COLLEGE_DOMAIN()} email addresses`);
  }
}

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();
  assertCollegeEmail(normalizedEmail);

  const [existingRows] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [
    normalizedEmail,
  ]);
  const existing = existingRows[0];

  if (existing && existing.is_verified) {
    throw new AppError(409, 'An account with this email already exists. Try logging in.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    // Unverified account re-signing up — refresh their details instead of erroring.
    await pool.query('UPDATE users SET name = ?, password_hash = ?, phone = ? WHERE id = ?', [
      name,
      passwordHash,
      phone || null,
      existing.id,
    ]);
  } else {
    await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, is_verified) VALUES (?, ?, ?, ?, 0)',
      [name, normalizedEmail, passwordHash, phone || null]
    );
  }

  const code = await createOtp(normalizedEmail, 'signup');
  await sendOtpEmail(normalizedEmail, code, 'signup');

  res.status(201).json({ message: 'Account created. Check your email for a verification code.', email: normalizedEmail });
});

// POST /api/auth/resend-otp
const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();
  if (!['signup', 'password_reset'].includes(purpose)) {
    throw new AppError(400, 'Invalid purpose');
  }

  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (!rows[0]) {
    // Don't reveal whether the email exists.
    return res.json({ message: 'If that account exists, a new code has been sent.' });
  }

  const code = await createOtp(normalizedEmail, purpose);
  await sendOtpEmail(normalizedEmail, code, purpose);
  res.json({ message: 'If that account exists, a new code has been sent.' });
});

// POST /api/auth/verify-otp
const verifyOtpHandler = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const result = await verifyOtp(normalizedEmail, 'signup', code);
  if (!result.ok) {
    throw new AppError(400, otpFailureMessage(result.reason));
  }

  await pool.query('UPDATE users SET is_verified = 1 WHERE email = ?', [normalizedEmail]);

  const [rows] = await pool.query(
    'SELECT id, name, email, phone, is_admin FROM users WHERE email = ?',
    [normalizedEmail]
  );
  const user = rows[0];
  const token = signToken(user);

  res.json({ message: 'Account verified', token, user });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
  const user = rows[0];
  if (!user) throw new AppError(401, 'Invalid email or password');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new AppError(401, 'Invalid email or password');

  if (!user.is_verified) throw new AppError(403, 'Please verify your email before logging in');
  if (user.is_suspended) throw new AppError(403, 'This account has been suspended');

  const token = signToken(user);
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const [rows] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [
    normalizedEmail,
  ]);
  const user = rows[0];

  if (user && user.is_verified) {
    const code = await createOtp(normalizedEmail, 'password_reset');
    await sendOtpEmail(normalizedEmail, code, 'password_reset');
  }

  // Same response either way so the endpoint can't be used to enumerate emails.
  res.json({ message: 'If that account exists, a password reset code has been sent.' });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const result = await verifyOtp(normalizedEmail, 'password_reset', code);
  if (!result.ok) {
    throw new AppError(400, otpFailureMessage(result.reason));
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [
    passwordHash,
    normalizedEmail,
  ]);

  res.json({ message: 'Password reset successfully. You can now log in.' });
});

function otpFailureMessage(reason) {
  switch (reason) {
    case 'EXPIRED':
      return 'That code has expired. Request a new one.';
    case 'TOO_MANY_ATTEMPTS':
      return 'Too many incorrect attempts. Request a new code.';
    case 'NOT_FOUND':
      return 'No pending verification found for this email.';
    default:
      return 'Incorrect verification code.';
  }
}

module.exports = { signup, resendOtp, verifyOtp: verifyOtpHandler, login, forgotPassword, resetPassword };

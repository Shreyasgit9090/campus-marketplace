const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

function generateOtpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

async function createOtp(email, purpose) {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);

  // Invalidate any earlier unconsumed OTPs for this email+purpose so only
  // the newest one is valid.
  await pool.query(
    `UPDATE otp_codes SET consumed_at = NOW()
     WHERE email = ? AND purpose = ? AND consumed_at IS NULL`,
    [email, purpose]
  );

  await pool.query(
    `INSERT INTO otp_codes (email, purpose, code_hash, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [email, purpose, codeHash, expiryMinutes]
  );

  return code;
}

async function verifyOtp(email, purpose, code) {
  const [rows] = await pool.query(
    `SELECT * FROM otp_codes
     WHERE email = ? AND purpose = ? AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose]
  );

  const otp = rows[0];
  if (!otp) return { ok: false, reason: 'NOT_FOUND' };
  if (new Date(otp.expires_at) < new Date()) return { ok: false, reason: 'EXPIRED' };
  if (otp.attempts >= 5) return { ok: false, reason: 'TOO_MANY_ATTEMPTS' };

  const match = await bcrypt.compare(code, otp.code_hash);
  if (!match) {
    await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otp.id]);
    return { ok: false, reason: 'INVALID' };
  }

  await pool.query('UPDATE otp_codes SET consumed_at = NOW() WHERE id = ?', [otp.id]);
  return { ok: true };
}

module.exports = { createOtp, verifyOtp };

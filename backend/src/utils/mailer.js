const nodemailer = require('nodemailer');

let transporter = null;
let warnedNoSmtp = false;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  return transporter;
}

// Falls back to logging the email to the console when SMTP isn't configured,
// so OTP flows are testable locally without real mail credentials.
async function sendMail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    if (!warnedNoSmtp) {
      console.warn('[mailer] SMTP not configured — emails will be logged to the console instead of sent.');
      warnedNoSmtp = true;
    }
    console.log(`[mailer] To: ${to} | Subject: ${subject}\n${text}`);
    return;
  }

  await t.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}

async function sendOtpEmail(to, code, purpose) {
  const subject =
    purpose === 'signup' ? 'Verify your Campus Marketplace account' : 'Reset your Campus Marketplace password';
  const text = `Your one-time verification code is ${code}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you didn't request this, ignore this email.`;
  await sendMail({ to, subject, text });
}

module.exports = { sendMail, sendOtpEmail };

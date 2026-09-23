const nodemailer = require('nodemailer');

let transporter = null;
let warnedNoSmtp = false;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // port 587 uses STARTTLS, not implicit TLS (that's port 465/secure:true)
    requireTLS: true, // refuse to send over an unencrypted connection
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

  try {
    await t.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
  } catch (err) {
    if (err.code === 'EAUTH') {
      console.error(
        '[mailer] Gmail rejected the login. SMTP_PASSWORD must be a 16-character Gmail App Password ' +
          '(Google Account -> Security -> 2-Step Verification -> App passwords), not your regular password.'
      );
    }
    throw err;
  }
}

async function sendOtpEmail(to, code, purpose) {
  const subject =
    purpose === 'signup' ? 'Verify your Campus Marketplace account' : 'Reset your Campus Marketplace password';
  const text = `Your one-time verification code is ${code}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you didn't request this, ignore this email.`;

  if (!getTransporter()) {
    // No SMTP configured — this IS the delivery mechanism for local dev, so
    // make it impossible to scroll past in a terminal full of morgan logs.
    const line = '='.repeat(60);
    console.log(
      `\n${line}\n  OTP for ${to} (${purpose})\n  CODE: ${code}\n  Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes\n${line}\n`
    );
    return;
  }

  await sendMail({ to, subject, text });
}

module.exports = { sendMail, sendOtpEmail };

const nodemailer = require('nodemailer');

/**
 * Send an email using configured SMTP settings.
 * Relies on process.env.SMTP_USER and process.env.SMTP_PASS
 *
 * Gmail App Passwords are displayed with spaces in the Google UI,
 * but must be sent without spaces — we strip them automatically.
 *
 * Hard timeout of 15 s prevents this from hanging the entire request.
 */
const SEND_TIMEOUT_MS = 15000;

const sendEmail = async ({ to, subject, html }) => {
  try {
    // Strip spaces from app password (Google UI shows them with spaces)
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPass,
      },
      connectionTimeout: SEND_TIMEOUT_MS,
      greetingTimeout: SEND_TIMEOUT_MS,
      socketTimeout: SEND_TIMEOUT_MS,
    });

    const mailOptions = {
      from: `medSchedule <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    // Race against a hard timeout so we never block a request indefinitely
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email send timed out after 15s')), SEND_TIMEOUT_MS)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`Email sent to ${to} [MessageId: ${info.messageId}]`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message || error);
    return false;
  }
};

module.exports = sendEmail;

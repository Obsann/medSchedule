const nodemailer = require('nodemailer');

/**
 * Send an email using Nodemailer + Gmail SMTP.
 * Requires process.env.SMTP_USER and process.env.SMTP_PASS (Gmail App Password).
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `medSchedule <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to} [MessageId: ${info.messageId}]`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message || error);
    return false;
  }
};

module.exports = sendEmail;

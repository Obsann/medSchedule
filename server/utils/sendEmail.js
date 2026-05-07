const { Resend } = require('resend');

/**
 * Send an email using the Resend API (HTTP-based, not blocked by cloud hosts).
 * Requires process.env.RESEND_API_KEY
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Resend requires a verified domain to send FROM.
    // During testing, you can send emails TO your own email address 
    // using the default 'onboarding@resend.dev' sender.
    const sender = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const { data, error } = await resend.emails.send({
      from: `medSchedule <${sender}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return false;
    }

    console.log(`Email sent to ${to} [MessageId: ${data?.id}]`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message || error);
    return false;
  }
};

module.exports = sendEmail;

const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@straycare.org';

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log('✅ SMTP Email Transporter initialized successfully.');
} else {
  console.warn('⚠️ SMTP credentials missing in .env. Emails will be logged to the console instead.');
}

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 */
const sendEmail = async ({ to, subject, html }) => {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"StrayCare" <${FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
      console.log(`✉️ Email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Error sending email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  } else {
    // Fallback simulation logger
    console.log('\n=================== SIMULATED OUTBOUND EMAIL ===================');
    console.log(`FROM: "StrayCare" <${FROM_EMAIL}>`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('BODY:');
    console.log(html);
    console.log('================================================================\n');
    return { success: true, simulated: true };
  }
};

module.exports = {
  sendEmail,
};

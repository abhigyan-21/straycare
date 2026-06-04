const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
const SMTP_SECURE = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : (SMTP_PORT === 465);
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;

let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log(`⏳ SMTP Email Transporter initialized (${SMTP_HOST}:${SMTP_PORT}, secure=${SMTP_SECURE}). Verifying connection...`);
  
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Email Transporter verification failed on startup:');
      console.error(error);
    } else {
      console.log('✅ SMTP Email Transporter is ready to send emails.');
    }
  });
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
        from: `"Furzo" <${FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
      console.log(`✉️ Email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Error sending email to ${to}:`, error);
      return { success: false, error: error.message || error };
    }
  } else {
    // Fallback simulation logger
    console.log('\n=================== SIMULATED OUTBOUND EMAIL ===================');
    console.log(`FROM: "Furzo" <${FROM_EMAIL}>`);
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

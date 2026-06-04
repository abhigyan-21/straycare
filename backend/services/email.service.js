const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node's DNS resolution to prefer IPv4 first globally (safest production-grade fix for ENETUNREACH on IPv6)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_SECURE = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : false;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;

let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  // Proactively perform DNS lookup diagnostics for target host on startup
  dns.lookup(SMTP_HOST, { all: true }, (dnsErr, addresses) => {
    if (dnsErr) {
      console.error(`❌ [SMTP DNS Diagnostics] DNS Resolution failed for host "${SMTP_HOST}":`, dnsErr);
    } else {
      console.log(`🔍 [SMTP DNS Diagnostics] DNS Resolution for "${SMTP_HOST}":`);
      addresses.forEach((addr, idx) => {
        console.log(`   [${idx + 1}] Address: ${addr.address} | Family: IPv${addr.family}`);
      });
      const chosen = addresses[0];
      if (chosen) {
        console.log(`🎯 [SMTP DNS Diagnostics] Chosen IP Version: IPv${chosen.family} (IP: ${chosen.address})`);
      }
    }
  });

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    family: 4, // Explicitly force IPv4 socket connection in Nodemailer
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    // Production TLS parameters for reliability and security
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    }
  });

  console.log(`⏳ SMTP Email Transporter initialized (${SMTP_HOST}:${SMTP_PORT}, secure=${SMTP_SECURE}, forcedFamily=IPv4). Verifying SMTP handshake & credentials...`);
  
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Email Transporter verification failed on startup:');
      console.error(`   Error Code: ${error.code || 'N/A'}`);
      console.error(`   Syscall: ${error.syscall || 'N/A'}`);
      console.error(`   Command: ${error.command || 'N/A'}`);
      console.error(`   Message: ${error.message}`);
      console.error(`   SMTP Authentication Status: FAIL (Check host/port/credentials or Gmail App Password configuration)`);
    } else {
      console.log('✅ SMTP Email Transporter is ready to send emails.');
      console.log(`   SMTP Authentication Status: SUCCESS (Authenticated as ${SMTP_USER})`);
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
      console.log(`✉️ [SMTP Send Mail] Initiating email delivery:`);
      console.log(`   Recipient: ${to}`);
      console.log(`   SMTP Server: ${SMTP_HOST}:${SMTP_PORT}`);
      console.log(`   Forced IP Version: IPv4`);
      console.log(`   SMTP Auth User: ${SMTP_USER}`);
      
      const info = await transporter.sendMail({
        from: `"Furzo" <${FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
      
      console.log(`✅ [SMTP Send Mail] Delivery SUCCESS:`);
      console.log(`   Recipient: ${to}`);
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response}`);
      console.log(`   Accepted Recipients: ${JSON.stringify(info.accepted)}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ [SMTP Send Mail] Delivery FAIL:`);
      console.error(`   Recipient: ${to}`);
      console.error(`   Error Message: ${error.message}`);
      console.error(`   Error Code: ${error.code || 'N/A'}`);
      console.error(`   Syscall: ${error.syscall || 'N/A'}`);
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

require('dotenv').config();
const { sendEmail } = require('./services/email.service');

async function test() {
  console.log('Starting email service test...');
  try {
    const res = await sendEmail({
      to: 'lakshayN02@gmail.com',
      subject: 'Test Email from Brevo Migration',
      html: '<h1>Brevo Test</h1><p>This is a test to verify the migration from Resend to Brevo.</p>',
      text: 'This is a test to verify the migration from Resend to Brevo.'
    });
    console.log('Result:', res);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();

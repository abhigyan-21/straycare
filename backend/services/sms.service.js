// services/sms.service.js
const sendSMS = async (to, message) => {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
    } else {
        // Development Mock
        console.log('\n=================== SIMULATED OUTBOUND SMS ===================');
        console.log(`TO: ${to}`);
        console.log(`MESSAGE: ${message}`);
        console.log('==============================================================\n');
    }
};

module.exports = { sendSMS };
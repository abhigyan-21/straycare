/**
 * Send an SMS message
 * @param {string} to - Recipient phone number
 * @param {string} body - SMS message content
 */
const sendSMS = async (to, body) => {
  // Simulated console logging fallback
  console.log('\n=================== SIMULATED OUTBOUND SMS ===================');
  console.log(`TO: ${to}`);
  console.log(`MESSAGE: ${body}`);
  console.log('==============================================================\n');
  return { success: true, simulated: true };
};

module.exports = {
  sendSMS,
};

/**
 * Generate a 6-digit numeric OTP and its expiry date
 * @returns {Object} { otp: string, expiry: Date }
 */
const generateOTP = () => {
  // Generate a random 6-digit number as a string
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry time to 5 minutes from now
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  
  return { otp, expiry };
};

module.exports = {
  generateOTP,
};

const twilio = require('twilio');

let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Sends an OTP via SMS to the provided phone number.
 */
async function sendOTP(phone, otp) {
  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn(`⚠️  Twilio credentials not set. Mocking OTP send to ${phone}: ${otp}`);
    return;
  }

  try {
    await client.messages.create({
      body: `Your NestMate login code is: ${otp}. It will expire in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    console.log(`✅ OTP sent to ${phone}`);
  } catch (error) {
    console.error('❌ Error sending OTP via Twilio:', error);
    throw error;
  }
}

module.exports = {
  sendOTP
};

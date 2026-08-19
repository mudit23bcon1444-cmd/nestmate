/**
 * utils/sms.js — OTP delivery via Fast2SMS (free for Indian numbers)
 *
 * To enable real SMS:
 *   1. Sign up at https://fast2sms.com
 *   2. Copy your API key from Dashboard → Dev API
 *   3. Add  FAST2SMS_API_KEY=your_key  to .env
 *   4. Restart the server
 */

/**
 * Sends an OTP via Fast2SMS to the given phone number.
 * @param {string} phone  - E.164 format e.g. "+918905771631"
 * @param {string} otp    - 6-digit OTP string
 */
async function sendOTP(phone, otp) {
  // ── DEV FALLBACK: no API key configured ───────────────────────────────────
  if (!process.env.FAST2SMS_API_KEY) {
    console.log('\n' + '═'.repeat(52));
    console.log(`  📱 OTP for ${phone}`);
    console.log(`  ✉️  CODE: ${otp}`);
    console.log(`  ⏰  Expires in 5 minutes`);
    console.log('  ⚠️  Set FAST2SMS_API_KEY in .env to send real SMS');
    console.log('═'.repeat(52) + '\n');
    return;
  }

  // Strip +91 prefix — Fast2SMS expects 10-digit Indian numbers
  const number = phone.replace(/^\+91/, '').replace(/\D/g, '');

  console.log(`📤 Sending OTP via Fast2SMS to ${number}...`);

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'q',
        message: `Your NestMate login code is: ${otp}. It will expire in 5 minutes.`,
        numbers: number
      })
    });

    const result = await response.json();

    if (!result.return) {
      // Full response logged for debugging
      console.error('❌ Fast2SMS error response:', JSON.stringify(result, null, 2));
      throw new Error(result.message || 'Fast2SMS returned return=false');
    }

    console.log(`✅ OTP sent via Fast2SMS to ${number}:`, JSON.stringify(result));
  } catch (err) {
    console.error('❌ Fast2SMS sendOTP failed:', err.message);
    throw err; // propagate so /send-otp returns 500
  }
}

module.exports = { sendOTP };

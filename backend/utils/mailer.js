// utils/mailer.js — Resend SDK email transport & HTML-safe template builder
const { Resend } = require('resend');

// Startup validation: in production without a key, throw at startup
if (process.env.NODE_ENV === 'production' && !process.env.RESEND_API_KEY) {
  throw new Error('FATAL: RESEND_API_KEY must be configured in production environments.');
}

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Safely HTML-escapes any user-supplied string to prevent template injection / XSS.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Links MUST be built strictly from APP_URL, NEVER from req.headers.host.
 */
function getAppUrl() {
  const url = process.env.APP_URL || 'http://localhost:5173';
  return url.replace(/\/+$/, '');
}

/**
 * Core sendMail interface.
 * In development without a key, logs links and message details to console.
 */
async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || 'NestMate <onboarding@resend.dev>';

  if (resendClient) {
    try {
      const data = await resendClient.emails.send({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      });
      return data;
    } catch (err) {
      console.error('[mailer] Failed to send email via Resend:', err.message);
      throw err;
    }
  }

  // Development / Test mode without Resend API Key:
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 [DEV MAILER OUTPUT]');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);

  // Extract and print any action links clearly
  const urlMatches = html ? html.match(/https?:\/\/[^\s"'<>]+/g) : [];
  if (urlMatches && urlMatches.length > 0) {
    console.log('🔗 Action Links:');
    urlMatches.forEach(link => console.log(`   👉 ${link}`));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return { id: 'dev-mock-id', mock: true };
}

/**
 * Send email verification link
 */
async function sendVerificationEmail(user, rawToken) {
  const verifyLink = `${getAppUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const safeName = escapeHtml(user.name || 'Student');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1bfb5; border-radius: 12px; background-color: #fff8f6;">
      <h2 style="color: #ab3500; margin-bottom: 16px;">Verify your NestMate email address</h2>
      <p style="color: #261814; font-size: 15px; line-height: 1.5;">Hi ${safeName},</p>
      <p style="color: #594139; font-size: 14px; line-height: 1.6;">
        Welcome to NestMate! Please confirm your email address by clicking the button below. This link is valid for <strong>24 hours</strong> and can only be used once.
      </p>
      <div style="margin: 28px 0;">
        <a href="${verifyLink}" style="background-color: #ff6b35; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #8d7168; font-size: 12px;">Or copy and paste this link into your browser:</p>
      <p style="color: #ab3500; font-size: 12px; word-break: break-all;">${verifyLink}</p>
      <p style="color: #8d7168; font-size: 12px; margin-top: 24px;">If you did not create a NestMate account, you can safely ignore this email.</p>
    </div>
  `;

  const text = `Hi ${user.name || 'Student'},\n\nPlease verify your email by opening this link: ${verifyLink}\n\nThis link is valid for 24 hours.`;

  return sendMail({
    to: user.email,
    subject: 'Verify your NestMate account',
    html,
    text
  });
}

/**
 * Send password reset link
 */
async function sendPasswordResetEmail(user, rawToken) {
  const resetLink = `${getAppUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const safeName = escapeHtml(user.name || 'Member');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1bfb5; border-radius: 12px; background-color: #fff8f6;">
      <h2 style="color: #ab3500; margin-bottom: 16px;">Reset your NestMate password</h2>
      <p style="color: #261814; font-size: 15px; line-height: 1.5;">Hi ${safeName},</p>
      <p style="color: #594139; font-size: 14px; line-height: 1.6;">
        We received a request to reset your NestMate password. Click the button below to choose a new password. This link is valid for <strong>30 minutes</strong> and can only be used once.
      </p>
      <div style="margin: 28px 0;">
        <a href="${resetLink}" style="background-color: #ab3500; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #8d7168; font-size: 12px;">Or copy and paste this link into your browser:</p>
      <p style="color: #ab3500; font-size: 12px; word-break: break-all;">${resetLink}</p>
      <p style="color: #8d7168; font-size: 12px; margin-top: 24px;">If you did not request a password reset, no action is needed. Your current password remains secure.</p>
    </div>
  `;

  const text = `Hi ${user.name || 'Member'},\n\nReset your password here: ${resetLink}\n\nThis link is valid for 30 minutes. If you did not request this, ignore this email.`;

  return sendMail({
    to: user.email,
    subject: 'Reset your NestMate password',
    html,
    text
  });
}

/**
 * Send password changed security notice
 */
async function sendPasswordChangedEmail(user) {
  const safeName = escapeHtml(user.name || 'Member');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1bfb5; border-radius: 12px; background-color: #fff8f6;">
      <h2 style="color: #ab3500; margin-bottom: 16px;">Your password has been changed</h2>
      <p style="color: #261814; font-size: 15px; line-height: 1.5;">Hi ${safeName},</p>
      <p style="color: #594139; font-size: 14px; line-height: 1.6;">
        The password for your NestMate account was recently changed. All active sessions have been signed out for your security.
      </p>
      <p style="color: #ba1a1a; font-size: 13px; font-weight: bold; margin-top: 20px;">
        If you did not make this change, please reset your password immediately or contact NestMate support.
      </p>
    </div>
  `;

  const text = `Hi ${user.name || 'Member'},\n\nThe password for your NestMate account was changed. If you did not do this, please reset your password immediately.`;

  return sendMail({
    to: user.email,
    subject: 'Security Alert: Your NestMate password was changed',
    html,
    text
  });
}

/**
 * Send new sign-in security alert
 */
async function sendNewSignInEmail(user, { ip, user_agent }) {
  const safeName = escapeHtml(user.name || 'Member');
  const safeIp = escapeHtml(ip || 'Unknown');
  const safeAgent = escapeHtml(user_agent || 'Unknown browser/device');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1bfb5; border-radius: 12px; background-color: #fff8f6;">
      <h2 style="color: #ab3500; margin-bottom: 16px;">New Sign-In to your NestMate account</h2>
      <p style="color: #261814; font-size: 15px; line-height: 1.5;">Hi ${safeName},</p>
      <p style="color: #594139; font-size: 14px; line-height: 1.6;">
        We noticed a sign-in to your NestMate account from a new location or device:
      </p>
      <ul style="color: #261814; font-size: 13px; line-height: 1.8;">
        <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
        <li><strong>IP Address:</strong> ${safeIp}</li>
        <li><strong>Device / Browser:</strong> ${safeAgent}</li>
      </ul>
      <p style="color: #594139; font-size: 13px; margin-top: 20px;">
        If this was you, you can disregard this email. If you do not recognize this activity, change your password immediately in your account security settings.
      </p>
    </div>
  `;

  const text = `Hi ${user.name || 'Member'},\n\nNew sign-in detected from IP ${ip} using ${user_agent} at ${new Date().toUTCString()}.\n\nIf this was not you, change your password immediately.`;

  return sendMail({
    to: user.email,
    subject: 'Security Alert: New sign-in to your NestMate account',
    html,
    text
  });
}

module.exports = {
  sendMail,
  escapeHtml,
  getAppUrl,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendNewSignInEmail
};

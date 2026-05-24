const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/**
 * Sends a notification email to the property owner about a new enquiry.
 */
async function sendEnquiryEmail(ownerEmail, ownerName, propertyTitle, studentName, studentPhone, message) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('⚠️  MAIL_USER or MAIL_PASS not set. Skipping email send.');
    return;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">NestMate</h1>
        <p style="color: #e0e7ff; margin: 5px 0 0 0; font-size: 14px;">New Property Enquiry</p>
      </div>
      <div style="padding: 20px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #374151;">Hello ${ownerName || 'Owner'},</p>
        <p style="font-size: 16px; color: #374151;">You have received a new enquiry for your property: <strong>${propertyTitle}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #111827;">Student Details</h3>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Name:</strong> ${studentName}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Phone:</strong> ${studentPhone}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Message:</strong> ${message || 'No additional message provided.'}</p>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Please contact the student directly using the phone number provided above.
        </p>
      </div>
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} NestMate. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: \`"NestMate" <\${process.env.MAIL_USER}>\`,
      to: ownerEmail,
      subject: \`New Enquiry for \${propertyTitle}\`,
      html: htmlContent,
    });
    console.log(\`✅ Enquiry email sent to \${ownerEmail}\`);
  } catch (error) {
    console.error('❌ Error sending enquiry email:', error);
  }
}

module.exports = {
  sendEnquiryEmail
};

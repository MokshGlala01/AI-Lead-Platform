import nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  text,
  html
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('SMTP credentials missing (SMTP_USER/SMTP_PASS). Skipping email sending.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    });

    const info = await transporter.sendMail({
      from: `"EFOS Admissions" <${user}>`,
      to,
      subject,
      text,
      html
    });

    console.log('Email sent successfully via SMTP:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('SMTP Email sending failed:', error.message || error);
    return false;
  }
}

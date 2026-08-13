const nodemailer = require("nodemailer");

async function sendEmail(to, subject, html) {
  const configured =
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    !process.env.EMAIL_USER.includes("your-email");

  if (!configured) {
    // Dev fallback: no real email service configured — log the link instead
    console.log("\n📧 [DEV MODE] Email not configured. Would have sent:");
    console.log(`To: ${to}\nSubject: ${subject}\n${html}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: `ReliefSphere AI <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;

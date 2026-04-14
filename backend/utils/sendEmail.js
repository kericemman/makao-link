const resend = require("../config/resend");

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing. Email skipped.");
    return;
  }

  await resend.emails.send({
    from: `RendaHomes <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html
  });
};

module.exports = sendEmail;
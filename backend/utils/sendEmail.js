const getResend = require("../config/resend");

const htmlToText = (html = "") =>
  String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing. Email skipped.");
    return;
  }

  const resend = getResend();
  const configuredFrom = String(process.env.EMAIL_FROM || "hello@rendahomes.com").trim();
  const from = configuredFrom.includes("<")
    ? configuredFrom.replace(/^RendaHomes\s*</, "Renda Homes <")
    : `Renda Homes <${configuredFrom}>`;
  return resend.emails.send({
    from,
    to,
    subject,
    html,
    text: htmlToText(html)
  });
};

module.exports = sendEmail;

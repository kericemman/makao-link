const { Resend } = require("resend");

let resend;

const getResend = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
};

module.exports = getResend;

const test = require("node:test");
const assert = require("node:assert/strict");

test("email sender loads and skips sending when Resend is not configured", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const sendEmailPath = require.resolve("../../utils/sendEmail");
  const resendPath = require.resolve("../../config/resend");
  const originalWarn = console.warn;
  const warnings = [];

  delete process.env.RESEND_API_KEY;
  delete require.cache[sendEmailPath];
  delete require.cache[resendPath];
  console.warn = (...args) => warnings.push(args.join(" "));

  try {
    const sendEmail = require("../../utils/sendEmail");
    await assert.doesNotReject(sendEmail({ to: "test@example.com", subject: "Test", html: "<p>Test</p>" }));
    assert.deepEqual(warnings, ["RESEND_API_KEY missing. Email skipped."]);
  } finally {
    console.warn = originalWarn;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    delete require.cache[sendEmailPath];
    delete require.cache[resendPath];
  }
});

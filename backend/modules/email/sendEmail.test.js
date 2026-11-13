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

test("email sender uses the Renda Homes display name", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.EMAIL_FROM;
  const sendEmailPath = require.resolve("../../utils/sendEmail");
  const resendPath = require.resolve("../../config/resend");
  const previousSendEmailModule = require.cache[sendEmailPath];
  const previousResendModule = require.cache[resendPath];
  let sentPayload;

  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "hello@rendahomes.com";
  require.cache[resendPath] = {
    id: resendPath,
    filename: resendPath,
    loaded: true,
    exports: () => ({ emails: { send: async (payload) => { sentPayload = payload; return { data: { id: "test" } }; } } })
  };
  delete require.cache[sendEmailPath];

  try {
    const sendEmail = require("../../utils/sendEmail");
    await sendEmail({ to: "test@example.com", subject: "Test", html: "<p>Test</p>" });
    assert.equal(sentPayload.from, "Renda Homes <hello@rendahomes.com>");
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = previousFrom;
    if (previousSendEmailModule) require.cache[sendEmailPath] = previousSendEmailModule;
    else delete require.cache[sendEmailPath];
    if (previousResendModule) require.cache[resendPath] = previousResendModule;
    else delete require.cache[resendPath];
  }
});

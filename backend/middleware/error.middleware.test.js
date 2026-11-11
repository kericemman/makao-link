const test = require("node:test");
const assert = require("node:assert/strict");
const { errorHandler } = require("./error.middleware");

const invokeErrorHandler = (error, path = "/api/listings") => {
  let status;
  let body;
  const response = {
    status(value) { status = value; return this; },
    json(value) { body = value; return this; }
  };
  errorHandler(error, { path }, response, () => {});
  return { status, body };
};

test("upload errors return actionable messages without losing status or code", () => {
  const { status, body } = invokeErrorHandler(Object.assign(new Error("Multer limit"), {
    name: "MulterError",
    code: "LIMIT_FILE_SIZE"
  }));

  assert.equal(status, 413);
  assert.equal(body.code, "LIMIT_FILE_SIZE");
  assert.match(body.message, /10 MB/);
  assert.match(body.message, /smaller image/);
});

test("aggregate upload limit explains the user action to take", () => {
  const { status, body } = invokeErrorHandler(Object.assign(new Error("Internal detail"), {
    statusCode: 413,
    code: "LISTING_UPLOAD_TOO_LARGE"
  }));

  assert.equal(status, 413);
  assert.match(body.message, /38 MB/);
  assert.match(body.message, /Remove some images/);
  assert.doesNotMatch(body.message, /Internal detail/);
});

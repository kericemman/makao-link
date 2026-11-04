const crypto = require("node:crypto");

const hashIdempotencyKey = (key) => crypto.createHash("sha256").update(key).digest("hex");
const hashRequestPayload = (payload) => crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

module.exports = { hashIdempotencyKey, hashRequestPayload };

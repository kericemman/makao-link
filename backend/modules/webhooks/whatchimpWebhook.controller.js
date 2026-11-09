const webhookService = require("./whatchimpWebhook.service");
const DiagnosticEvent = require("./whatchimpDiagnosticEvent.model");

const secureTokenEquals = (provided, configured) => {
  if (typeof provided !== "string" || typeof configured !== "string") return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(configured);
  return left.length === right.length && left.length >= 32 && require("crypto").timingSafeEqual(left, right);
};

const createWebhookController = ({
  enabled = () => process.env.WHATCHIMP_WEBHOOK_ENABLED === "true",
  diagnosticEnabled = () => process.env.WHATCHIMP_WEBHOOK_DIAGNOSTIC_ENABLED === "true",
  expectedToken = () => process.env.WHATCHIMP_WEBHOOK_TOKEN || "",
  diagnosticEventModel = DiagnosticEvent,
  parsePayload,
  EventModel
} = {}) => async (req, res) => {
  if (!enabled()) return res.status(503).json({ success: false, code: "WHATCHIMP_WEBHOOK_DISABLED" });
  if (!secureTokenEquals(req.params?.token, expectedToken())) {
    return res.status(401).json({ success: false, code: "WHATCHIMP_WEBHOOK_UNAUTHORIZED" });
  }
  if (diagnosticEnabled()) {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    let summary;
    try {
      summary = webhookService.summarizeDiagnosticPayload(rawBody);
    } catch {
      return res.status(400).json({ success: false, code: "WHATCHIMP_WEBHOOK_INVALID_DIAGNOSTIC" });
    }
    try {
      const result = await webhookService.persistDiagnostic({ rawBody, summary, token: expectedToken(), EventModel: diagnosticEventModel });
      return res.status(202).json({ success: true, diagnostic: true, duplicate: result.duplicate });
    } catch {
      return res.status(503).json({ success: false, code: "WHATCHIMP_WEBHOOK_STORAGE_UNAVAILABLE" });
    }
  }
  if (typeof parsePayload !== "function") {
    return res.status(503).json({ success: false, code: "WHATCHIMP_WEBHOOK_MAPPING_PENDING" });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  let event;
  try {
    event = webhookService.normalizeInternalEvent(await parsePayload(rawBody));
  } catch {
    return res.status(400).json({ success: false, code: "WHATCHIMP_WEBHOOK_INVALID_EVENT" });
  }

  try {
    const result = await webhookService.persistEvent({ event, EventModel });
    return res.status(200).json({ success: true, duplicate: result.duplicate });
  } catch {
    return res.status(503).json({ success: false, code: "WHATCHIMP_WEBHOOK_STORAGE_UNAVAILABLE" });
  }
};

module.exports = { createWebhookController, secureTokenEquals };

const MAX_ID_LENGTH = 200;
const MAX_TEXT_LENGTH = 4000;

const boundedString = (value, name, max = MAX_ID_LENGTH) => {
  if (typeof value !== "string") throw new TypeError(`${name} must be a string`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new TypeError(`Invalid ${name}`);
  return normalized;
};

const normalizeInboundEvent = (event) => {
  if (!event || typeof event !== "object" || Array.isArray(event)) throw new TypeError("Invalid inbound event");
  if (event.direction !== "inbound" || event.contentType !== "text") throw new TypeError("Only inbound text events are supported");
  const occurredAt = new Date(event.occurredAt);
  if (!Number.isFinite(occurredAt.getTime())) throw new TypeError("Invalid event timestamp");
  return Object.freeze({
    eventId: boundedString(event.eventId, "event ID"),
    messageId: boundedString(event.messageId, "message ID"),
    contactId: boundedString(event.contactId, "contact ID", 160),
    direction: "inbound",
    contentType: "text",
    text: boundedString(event.text, "message text", MAX_TEXT_LENGTH),
    occurredAt
  });
};

const normalizeOutboundText = (message) => {
  if (!message || typeof message !== "object" || Array.isArray(message)) throw new TypeError("Invalid outbound message");
  return Object.freeze({
    contactId: boundedString(message.contactId, "contact ID", 160),
    text: boundedString(message.text, "message text", MAX_TEXT_LENGTH),
    idempotencyKey: boundedString(message.idempotencyKey, "idempotency key")
  });
};

module.exports = { normalizeInboundEvent, normalizeOutboundText };

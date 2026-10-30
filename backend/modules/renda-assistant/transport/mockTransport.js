const { normalizeInboundEvent, normalizeOutboundText } = require("./transport.contract");

class MockTransport {
  constructor({ inboundEvents = [], sendOutcomes = [] } = {}) {
    this.inboundEvents = inboundEvents.map(normalizeInboundEvent);
    this.sendOutcomes = [...sendOutcomes];
    this.sentMessages = [];
  }

  async receiveNext() {
    return this.inboundEvents.shift() || null;
  }

  async sendText(message) {
    const normalized = normalizeOutboundText(message);
    const existing = this.sentMessages.find((item) => item.idempotencyKey === normalized.idempotencyKey);
    if (existing) return { ...existing, duplicate: true };

    const outcome = this.sendOutcomes.shift() || { status: "sent", providerMessageId: `mock-${this.sentMessages.length + 1}` };
    if (outcome.error) throw outcome.error;
    if (!['sent', 'failed'].includes(outcome.status)) throw new TypeError("Invalid mock send outcome");

    const result = {
      status: outcome.status,
      providerMessageId: outcome.providerMessageId || null,
      failureCode: outcome.status === "failed" ? String(outcome.failureCode || "mock_delivery_failed").slice(0, 80) : ""
    };
    this.sentMessages.push({ ...normalized, ...result });
    return { ...result, duplicate: false };
  }
}

module.exports = MockTransport;

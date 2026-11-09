const axios = require("axios");

const API_URL = "https://app.whatchimp.com/api/v1/whatsapp/send";
const MAX_TEXT_LENGTH = 4000;
const REQUEST_TIMEOUT_MS = 10000;

class WhatsAppTransportDisabledError extends Error {
  constructor() {
    super("WhatChimp transport is disabled");
    this.name = "WhatsAppTransportDisabledError";
    this.statusCode = 503;
  }
}

class WhatsAppDeliveryUnknownError extends Error {
  constructor() {
    super("WhatChimp delivery result is unknown; automatic retry was not attempted");
    this.name = "WhatsAppDeliveryUnknownError";
    this.retryable = false;
  }
}

const getConfig = (env = process.env) => {
  if (env.WHATCHIMP_ENABLED !== "true") throw new WhatsAppTransportDisabledError();
  const apiToken = String(env.WHATCHIMP_API_KEY || "").trim();
  const phoneNumberId = String(env.WHATCHIMP_PHONE_NUMBER_ID || "").trim();
  if (!apiToken || !phoneNumberId) {
    const error = new Error("WhatChimp API configuration is incomplete");
    error.statusCode = 503;
    throw error;
  }
  return { apiToken, phoneNumberId };
};

const normalizeRecipient = (value) => {
  const phoneNumber = String(value || "").replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(phoneNumber)) throw new TypeError("A valid WhatsApp recipient number is required");
  return phoneNumber;
};

const sendText = async ({ phoneNumber, text, httpClient = axios, env = process.env } = {}) => {
  const { apiToken, phoneNumberId } = getConfig(env);
  const recipient = normalizeRecipient(phoneNumber);
  const message = String(text || "").trim();
  if (!message || message.length > MAX_TEXT_LENGTH) throw new TypeError("WhatsApp text must contain 1 to 4,000 characters");

  const body = new URLSearchParams({
    apiToken,
    phone_number_id: phoneNumberId,
    phone_number: recipient,
    message
  });

  let response;
  try {
    response = await httpClient.post(API_URL, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: 0
    });
  } catch {
    throw new WhatsAppDeliveryUnknownError();
  }

  if (response?.data?.status !== "1") {
    const error = new Error("WhatChimp rejected the message");
    error.retryable = false;
    error.code = "WHATCHIMP_SEND_REJECTED";
    throw error;
  }

  return {
    status: "sent",
    providerMessageId: String(response.data.wa_message_id || "").slice(0, 200) || null
  };
};

module.exports = {
  API_URL,
  WhatsAppDeliveryUnknownError,
  WhatsAppTransportDisabledError,
  getConfig,
  normalizeRecipient,
  sendText
};

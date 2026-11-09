# RendaHomes WhatChimp Integration Audit

**Reviewed:** 2026-11-09
**Scope:** Existing backend, Renda Assistant, local environment variable presence (values not printed), and current public WhatChimp documentation. No production systems were contacted or changed.

## Readiness

| Component | Status | Evidence / next action |
|---|---|---|
| Express API and MongoDB | READY | Existing Express app and Mongoose models are used. The audit does not independently verify production database health. |
| WhatChimp inbound endpoint | FOUNDATION IMPLEMENTED / DISABLED | `POST /api/webhooks/whatchimp/:token` is registered, rate-limited, body-limited, token-authenticated in constant time, and persists normalized events before acknowledgment. It remains disabled and returns a mapping-pending response until real provider fields are verified. |
| WhatChimp outbound text adapter | PARTIAL | `modules/renda-assistant/transport/whatChimpTransport.js` uses the documented form fields and is disabled unless `WHATCHIMP_ENABLED=true`. It is not wired to a webhook conversation loop or notification worker. |
| Outbound approved templates | MISSING | The provider supports approved templates, but template parameter schemas and RendaHomes template IDs have not been configured or verified. |
| Conversation storage | READY | `conversation.model.js` and `message.model.js` store channel-scoped conversations, consent, workflow, message sequencing, provider IDs, delivery state, and TTL expiry. |
| Conversation engine | PARTIAL | `orchestration/orchestrator.service.js` reuses validated tools and OpenAI structured output for web/mobile. There is no WhatsApp controller/turn dispatcher invoking it. |
| Public listing search | READY | `publicListingTools.js` uses `parsePublicListingQuery`; filters enforce approved, active, available, non-deleted listings server-side. No AI-generated Mongo query is accepted. |
| Landlord onboarding and KYC | READY for portal handoff | Assistant tools provide plan/portal information and listing drafts require verified linked identity, permissions, and plan access. WhatsApp does not upload KYC or publish listings. |
| Inquiry management | READY as existing channels | Website/app inquiry routes exist. Assistant inquiry service writes AppAlert only after consent, account linking, and listing validation. WhatsApp webhook delivery is not connected. |
| Consent and STOP | PARTIAL | `welcome.service.js` records separate service/update consent and STOP opt-out. No WhatsApp inbound route currently invokes it. |
| Account linking | PARTIAL | One-time challenge primitives exist in `accountLink.service.js`; no complete authenticated HTTP redemption route is registered. Do not rely on phone possession as account authentication. |
| Human handoff | PARTIAL | Handoff state/model and automation pause exist. There is no operational staff queue/API/UI notification path. |
| Status notifications | PARTIAL | `notifications.service.js` queues consent-filtered records as `awaiting_provider`. No sender/worker dispatches them. |
| Logging / rate limiting | PARTIAL | Webhook has a route-specific in-memory IP limiter, 64 KiB raw-body limit, and Morgan URL-token redaction. Reverse-proxy/access-log redaction must also be configured before using a URL token. |
| Environment validation | MISSING | No central startup schema validates the WhatsApp configuration. `.env.example` now documents the disabled flag and API variables. |
| Background queue | FOUNDATION IMPLEMENTED / NOT RUNNING | MongoDB inbox records are durable and uniquely indexed by hashed provider message ID; a lease/retry worker primitive recovers queued or stale-processing events. No production worker is started until a verified processor exists. |

## Existing Assistant Security Boundaries

- `RENDA_ASSISTANT_ENABLED` gates current assistant APIs and storage.
- `readConversationContext` requires service consent and pauses when handoff is pending/claimed.
- Search tools use an allowlisted schema and public listing parser; property details are loaded only under the public visibility filter.
- Messages are redacted before persistence and OpenAI context use.
- Listing drafts require verified account linking and existing landlord workspace permissions; KYC remains in the authenticated portal.
- `RENDA_ASSISTANT_LIVE_TRANSPORT_ENABLED` exists in `.env.example` but is not referenced by application code yet.
- Local `.env` has assistant flags set to true, but `WHATCHIMP_ENABLED` is unset. These local settings do not establish production status. The new sender remains fail-closed unless the new flag is explicitly true.

## WhatChimp Contract Verified

Current public WhatChimp documentation describes:

- Developer API base `https://app.whatchimp.com/api/v1/` and `apiToken` authentication.
- `POST /api/v1/whatsapp/send` with form fields `apiToken`, `phone_number_id`, `phone_number`, and `message` for text messages.
- Provider response fields including string `status` and `wa_message_id`.
- Dashboard webhooks can POST message content, subscriber ID, timestamp, and message type for incoming and outgoing messages.
- Text messages are limited to the customer-service window; business-initiated messages require approved templates.

WhatChimp support has stated that inbound delivery is HTTP POST; events include message data, subscriber ID, timestamps, type and a stable message identifier; HMAC signatures and custom authorization headers are unsupported; IP allowlisting or a secret URL token is recommended; retries use exponential backoff with undocumented intervals/attempt limit; and the message identifier remains stable across retries. These are support statements, not yet verified against actual webhook events. Complete JSON field paths/types remain unknown, so no provider parser is enabled.

## Environment and Host Findings

- Local `backend/.env` contains non-empty `WHATCHIMP_API_KEY` and `WHATCHIMP_PHONE_NUMBER_ID` entries; values were not displayed or tested.
- The production host named in the supplied brief (`api.rendahomes.com`) conflicts with the repository's current deployment configuration: `deploy/hostinger-nginx.conf` proxies `updates.rendahomes.com` to the backend, and frontend API defaults use `https://updates.rendahomes.com/api`.
- Confirm which hostname will be canonical before configuring a WhatChimp callback. Do not configure the proposed `api.rendahomes.com` endpoint until DNS, TLS, Nginx routing, and API availability are verified.
- No production secrets, database records, DNS, Nginx, PM2 process, or provider settings were changed.

## Safe Outbound Adapter

`modules/renda-assistant/transport/whatChimpTransport.js` implements the documented text API as a reusable adapter. It:

- Requires `WHATCHIMP_ENABLED=true` and the existing API key/phone-number ID variables.
- Posts credentials in form body, not query string; uses a fixed HTTPS provider URL, timeout, and disables redirects.
- Returns only send status and provider message ID.
- Redacts provider/network detail from thrown errors.
- Does not retry network timeouts because the provider may have accepted the send even if the response was lost, and no API idempotency contract was verified.

This adapter is not yet wired into an inbound processor, outbox worker, or approved-template sender. Do not set the flag to true in production yet.

The inbound foundation is in `modules/webhooks/`:

- `whatchimpWebhook.routes.js` uses a route-specific IP limiter and reads bounded raw request bytes before JSON parsing.
- `whatchimpWebhook.controller.js` checks a high-entropy path token using constant-time byte comparison and returns 200 only after durable queue persistence; it rejects all traffic while disabled and fails closed while provider mapping is absent.
- `whatchimpWebhook.service.js` validates an internal canonical message shape and uses a SHA-256 hash of the stable message ID as the unique idempotency key.
- `whatchimpEvent.model.js` stores normalized queue data (message text/contact are excluded from ordinary selection), attempt/state metadata, and a TTL; it does not store the original raw provider body.
- `whatchimpWebhook.worker.js` provides lease-based claiming, stale-lease recovery, and bounded exponential retry. It is not started because no verified event processor is configured.
- Morgan redacts the secret path segment. Host-level proxy/access logs must also redact it; URL credentials are bearer secrets and are not proof of provider identity.
- `.env.example` documents `WHATCHIMP_WEBHOOK_ENABLED=false` and an empty `WHATCHIMP_WEBHOOK_TOKEN`; the actual local environment remains disabled/unconfigured.

No provider payload mapping has been guessed. The route will continue returning a mapping-pending response until the actual JSON contract is captured and mapped. The application-level token check is not cryptographic sender proof; use verified provider IP ranges if WhatChimp supplies them, plus the secret token. Do not enable in production before host routing, proxy log redaction, mapping, worker/assistant dispatch, and staged tests are complete.

## Required WhatChimp Confirmation

Before implementing/enabling inbound handling, obtain from WhatChimp support or the account's webhook configuration:

1. A sanitized raw sample for incoming text, media, outgoing echoes and STOP events, with exact keys/types.
2. Confirm how subscriber ID maps to a WhatsApp number usable by the send API, and whether the stable ID identifies a message or a delivery event.
3. Official source IP ranges (if available), callback URL encoding/length constraints, and expected response/status behavior.
4. Retry intervals/max attempts if support can provide them; internal retry policy must remain independent.
5. Approved template names, locales, categories and exact parameter shape for messages outside the customer-service window.
6. Confirmation on outgoing echo behavior, media payloads/retrieval, and STOP/opt-out event representation.

Do not include API tokens, phone numbers, or customer PII in the sample; redact those values while preserving the JSON structure.

## Activation Checklist

1. The user has confirmed `https://api.rendahomes.com`; verify its DNS, TLS, and live routing because repository deployment defaults still use `updates.rendahomes.com`. No Nginx change was made.
2. Capture a provider event; implement and test a provider-only mapping with strict mandatory fields.
3. Configure the secret URL token, redact it in reverse-proxy logs, and add verified IP allowlisting if available.
4. Build the processor to apply consent/STOP, existing assistant search/orchestration, inquiry validation and handoff; keep approval, payment, KYC, and publication rules in RendaHomes.
5. Add idempotent outbound outbox/delivery reconciliation and an operational human handoff path before enabling replies.
6. Test using a controlled WhatChimp/Meta test number and internal recipients only.
7. Enable in production gradually only after privacy, rate-limit, webhook-authentication, monitoring, and rollback checks pass.

## Verification Performed

- WhatChimp adapter + webhook/queue focused tests: **16 passed**.
- Full backend suite: **154 passed, 9 integration tests failed before connecting** because DNS resolution for the MongoDB hostname configured in local `.env` was refused. The tests are named staging tests, but the target database was not independently verified as staging; no MongoDB connection or write succeeded. Do not rerun those integration tests until a dedicated staging URI is confirmed.
- No live WhatChimp send, webhook, Meta call, or production deployment was performed.

## Verdict

**NO-GO for real WhatsApp customers.** The existing assistant/search foundation is reusable and the documented outbound text adapter is safely scaffolded, but no authenticated inbound webhook or live conversation dispatch exists. The provider webhook security/payload contract and canonical production API hostname must be resolved first.

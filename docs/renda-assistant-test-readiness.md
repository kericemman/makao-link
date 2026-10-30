# Renda Assistant Test Readiness

This runbook describes the current local implementation. It is not a production activation guide. The mobile assistant HTTP API is implemented locally, but the mobile client is not connected. No WhatsApp provider adapter, inbound webhook, or staff handoff screen is currently connected.

## Local Verification

From the repository root:

```sh
cd backend
npm test
```

The suite uses Node's built-in test runner and mocked models/transports. It must not require MongoDB, OpenAI, WhatChimp, Paystack, Cloudinary, or Resend credentials. For the landlord portal build:

```sh
cd frontend-landlord
npm run build
```

## Current HTTP Surface

Mounted under `/api/renda-assistant`:

- `GET /listing-drafts/:draftId` - authenticated landlord workspace; returns only the current landlord's unexpired collecting draft.
- `PATCH /listing-drafts/:draftId/submitted` - authenticated landlord workspace; records completion only after the canonical listing exists in `pending` status for the same landlord and actor.
- `GET /mobile/consent` - returns the current mobile consent copy, privacy URL, policy version, and retention period when the assistant feature flag is enabled.
- `POST /mobile/conversations` - accepts only `{ "consentAccepted": true }`; creates a guest mobile-search conversation and returns a one-time session token. The raw token is never stored.
- `POST /mobile/conversations/messages` - accepts `{ "message": "..." }` and requires `x-renda-assistant-session`; returns a concise reply, verified public listing cards, and backend search criteria/match metadata.
- `DELETE /mobile/conversations` - requires `x-renda-assistant-session` and immediately deletes that mobile conversation and its messages.

Mobile session tokens are opaque 256-bit random values. Store them in the app's secure storage, send them only in `x-renda-assistant-session`, and never put them in URLs or logs. Guest sessions expire after `RENDA_ASSISTANT_MOBILE_SESSION_DAYS` (default 30, accepted range 1-90). Consent is explicit and separate from optional update consent. The mobile orchestration mode allows only public listing search, public listing details, live listing metadata, and minimal conversation context; it does not expose landlord onboarding, listing drafts, inquiries, payments, KYC, or WhatsApp operations.

The mobile endpoints use in-process IP rate limits (10 session creations/hour and 30 message requests/15 minutes) in addition to the existing global API limiter. These limits are per backend process; before running multiple API instances, move assistant rate limits to a shared store such as Redis. The new unique mobile-session-token index must be present in MongoDB before enabling this API in production.

Existing plan catalog:

- `GET /api/payments/plans` - public plan metadata derived from the backend plan configuration; does not expose Paystack plan codes.

The following services exist in code but are not exposed as HTTP endpoints: WhatsApp welcome/consent parsing, account-link challenge creation/confirmation, assistant inquiry creation, and status-notification queueing. The mobile API does not make a working WhatsApp bot; no WhatChimp transport is connected.

## Assistant Model and Data Boundaries

- `RendaAssistantConversation`: normalized provider contact ID, consent state, account-link state, workflow, revision, and handoff state.
- `RendaAssistantMessage`: redacted text-only history and provider delivery identifiers/status.
- `RendaAssistantListingDraft`: private owner-scoped draft with bounded listing fields; expires with assistant retention.
- `RendaAssistantStatusNotification`: fixed-template status outbox; rows are `awaiting_provider`, not delivered.
- `RendaAssistantHandoff`: minimal pending/claimed/resolved support handoff record; it contains no copied message transcript or contact details.
- Mobile conversations additionally store a hash of the guest session token and a separate session expiry. The token hash field is excluded from default query projections.

Assistant records use the configured 7-365 day TTL retention (`RENDA_ASSISTANT_RETENTION_DAYS`, default 90). Unique indexes protect provider event/message IDs, message order, one collecting draft per conversation, one pending handoff per conversation, and notification deduplication per conversation/event. Production rollout must verify these indexes exist before relying on them; MongoDB index creation was not run as part of local tests.

Public listing tools preserve approved/active/available/not-deleted filters and select public fields only. Listing photos and KYC files are not accepted by WhatsApp or the model; photos continue through the authenticated landlord upload form and existing compression/Cloudinary flow.

## Environment and Gates

Defined in `backend/.env.example`:

- `RENDA_ASSISTANT_ENABLED=false` - assistant persistence/orchestration services fail closed unless explicitly enabled.
- `RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED=false` - when enabled, qualifying persisted events may create outbox rows; it does not send WhatsApp messages.
- `RENDA_ASSISTANT_LIVE_TRANSPORT_ENABLED=false` - reserved configuration only; there is no live adapter that reads this flag yet.
- `RENDA_ASSISTANT_RETENTION_DAYS=90` - assistant TTL target, accepted range 7-365.
- `RENDA_ASSISTANT_CONSENT_POLICY_VERSION` - version stamped on recorded consent.
- `OPENAI_API_KEY`, `RENDA_ASSISTANT_MODEL`, `RENDA_ASSISTANT_TIMEOUT_MS` - server-side orchestration settings. Tests inject a mock client; they do not make OpenAI calls.

No WhatChimp API secret or webhook-signature configuration is implemented because the account's authentication, payload, retry, media, template, and delivery contracts remain unverified. Do not set the assistant or notification flags to true in production until routes, provider adapter, privacy/legal review, staff handoff, and operational monitoring are ready.

## Notification and Handoff Behavior

Listing review, KYC review, subscription activation, and short-stay request/status transitions are the authoritative event sources. Notifications use fixed text, a per-conversation/event key, and require unexpired conversations with both service consent and updates consent. Support/claimed handoffs suppress automated notices. Existing Resend email behavior is unchanged.

There is no sender/worker, WhatChimp template/window handling, callback processing, or staff queue UI/API. Outbox records stay `awaiting_provider`; they are evidence of a queued event, not a delivered notice. A handoff pauses assistant automation and stores a minimal queue record, but no staff member is assigned or alerted yet.

## Controlled Test Boundaries

Verified locally with mocks:

- auth token verification and explicit legal acceptance;
- public listing filter security and search normalization;
- payment webhook idempotency;
- assistant consent, account-link challenge rules, text redaction, bounded tools, and fabricated-result rejection;
- inquiry authorization and idempotency against the app-specific alert boundary;
- landlord plan catalog and Basic=7 invariant;
- private listing drafts, resume ownership, submission verification, and pending moderation;
- opted-in notification queueing, opt-out/handoff suppression, deduplication, and Kenyan phone normalization;
- support handoff persistence and assistant pause behavior.

Not verified end-to-end:

- HTTP controller behavior and mobile session lifecycle against a real MongoDB instance; WhatsApp conversation and account-link HTTP routes remain unmounted;
- Live mobile API requests against MongoDB/OpenAI, Expo UI integration, and iOS/Android end-to-end behavior;
- MongoDB integration, production index rollout, transaction/outbox recovery, and TTL deletion timing;
- real provider payload/signature/retry behavior, approved WhatsApp templates, service windows, or delivery callbacks;
- real OpenAI retention/account settings or cost limits;
- Cloudinary account-level KYC access policy and actual upload behavior;
- live Paystack/Resend outcomes or any production notification;
- staff pickup/resolution of assistant handoffs.

## Disable and Rollback

For the current code, leave both `RENDA_ASSISTANT_ENABLED` and `RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED` false to keep assistant behavior inactive. If status queueing was enabled, first disable the notification flag; existing `awaiting_provider` rows will remain stored until their TTL and are not sent. To roll back the mobile API independently, remove its `/mobile` routes from `rendaAssistant.routes.js`; this leaves the authenticated, owner-scoped landlord draft routes and existing listings, subscriptions, and inquiries unchanged. Do not delete assistant collections as a rollback step; preserve records for the configured retention period unless a separately approved data-retention action says otherwise.

No deployment, secrets change, provider call, or database migration/index build was performed for this readiness pass.

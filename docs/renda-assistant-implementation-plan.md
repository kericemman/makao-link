# Renda Assistant Implementation Plan

**Status:** Parts 0–13 are checkpointed locally. Mobile UI integration, WhatsApp transport, live service validation, and deployment remain incomplete.

## Progress Checkpoints

- **Part 0 — Baseline:** Complete. Read-only inspection confirmed `main`, preserved pre-existing payment/dashboard edits, identified active Basic=7 configuration, and found stale plan references. No tests or production connections were made.
- **Part 1 — Public listing security:** Implemented and reviewed locally. Public filters now preserve publication constraints, validate supported inputs, and cap pagination/recent lookups. Eight focused tests passed.
- **Part 2 — Authentication and sensitive files:** Implemented locally; awaiting user review before Part 3. Google is the only enabled social provider; the user portal sends Google ID tokens to the backend for signature/audience/issuer/email verification and continues through email OTP. Landlord social onboarding is intentionally not enabled because landlord registration must select a subscription plan. New KYC uploads use authenticated Cloudinary delivery; landlord responses omit sensitive document URLs and ID numbers; admin responses use expiring download links for new files. Legacy KYC assets are unchanged and may remain publicly accessible until migrated in Cloudinary.
- **Provider configuration:** Google client IDs are not configured in the local backend or user-frontend environment at the latest boolean-only check. Google sign-in therefore remains hidden/disabled until `GOOGLE_OAUTH_CLIENT_IDS` and `VITE_GOOGLE_CLIENT_ID` are set. Cloudinary variables were present locally, but no asset/account access settings were inspected or changed.
- **Verification at Part 2:** 17 focused tests passed across Parts 1 and 2; changed JavaScript files passed syntax checks; frontend-app production build succeeded with the existing large-chunk warning; `git diff --check` passed.
- **Part 3 — Paystack webhook idempotency:** Implemented locally; awaiting user review before Part 4. Paystack webhooks now claim durable event keys, acknowledge already processed events, return a retryable response while the same event is being processed, and release failures for provider retry. The ledger stores event identity/status only, not the payment payload. Subscription and add-on failure handling avoids repeating grace-period notifications/state changes. Focused tests cover duplicate, concurrent, and failed/retried events.
- **Verification at Part 3:** 19 focused tests passed across Parts 1–3; changed backend JavaScript files pass syntax checks; `git diff --check` passes. No Paystack calls or database writes were made. Deployment must allow the unique `eventKey` index for the new webhook event collection to be created before accepting traffic.
- **Part 4 — Assistant data and module foundation:** Implemented locally; reviewed as the prerequisite for Part 5. Added isolated conversation/message models and a service boundary, but no routes are mounted and no provider integration is present. Storage is fail-closed behind `RENDA_ASSISTANT_ENABLED=false`; consent defaults to unknown; workflow state uses a narrow schema; message ordering is allocated atomically and workflow updates use revision checks. Provider event/message IDs are unique, delivery transitions are tracked, and MongoDB TTL indexes apply configurable 90-day-by-default retention (allowed range 7–365 days). Text persistence is redacted for common password/OTP, ID/passport, and payment-card patterns; no media or arbitrary KYC document field is supported.
- **Verification at Part 4:** 25 focused tests passed across Parts 1–4, including default-off behavior, consent defaults, indexes, redaction, duplicate provider events, concurrent message sequencing, and stale workflow revisions. Changed assistant JavaScript files pass syntax checks; `git diff --check` passes. No database, WhatChimp, OpenAI, or other external service was contacted.
- **Part 5 — Provider-neutral transport boundary:** Implemented locally; awaiting user review before Part 6. Added a strict normalized text-event contract, deterministic mock transport, sanitized normalized fixture, idempotent mock outbound sends, and bounded exponential retry helper. No provider-shaped webhook payload, public endpoint, WhatChimp adapter, or external request was added. `RENDA_ASSISTANT_LIVE_TRANSPORT_ENABLED=false` is documented in the example environment.
- **WhatChimp contract verification at Part 5:** Official WhatChimp docs describe a REST API base URL and outbound text send fields/response, conversation-history fields, delivery-status lookup, and an incoming-message webhook feature. The publicly available pages reviewed do not establish a complete direct-webhook authentication/signature contract or stable incoming payload schema. Actual account plan, API token, WhatsApp number/phone-number ID, webhook configuration, retry behavior, media contract, template configuration, and delivery callback behavior remain unverified. Do not connect live traffic until the account owner verifies these details.
- **Verification at Part 5:** Focused tests cover normalized text ingress, rejection of non-text content, idempotent mock sends, transient retry/backoff, permanent-failure handling, and attempt bounds. No WhatChimp/OpenAI/API calls, database writes, webhook routes, or real messages were made.
- **Part 6 — OpenAI orchestration and read-only tools:** Implemented locally; awaiting user review before Part 7. Added the official OpenAI Node SDK, a versioned assistant instruction set, bounded Responses API orchestration, strict tool schemas, safe output validation, and read-only public listing search/detail/live inventory metadata/conversation context tools. Listing queries preserve the public publication constraints and select only public fields; landlord/customer contacts are excluded. Email, Kenyan phone, credential, identity-number, and card-like patterns are redacted from text; explicit service consent is required before text is sent to OpenAI. Each request sets `store:false`, uses a configured timeout and bounded SDK retries, and performs at most one batch of three read-only tool calls. No route is mounted and the assistant remains disabled by default. No API request was made.
- **Verification at Part 6:** 41 focused tests passed across Parts 1–6, including mocked orchestration, consent gating, tool-call caps, strict schemas, fabricated listing ID rejection, public listing guards, and disabled-by-default behavior. Changed JavaScript passes syntax checks and `git diff --check` passes. An `npm install` audit reported 15 dependency vulnerabilities in the overall backend tree; inspect/fix that separately before production rather than applying broad automatic upgrades during this scoped part.
- **Part 7 — Welcome, consent, and verified account linking:** Implemented locally and used as the prerequisite for Part 8. Added deterministic welcome/intent selection with resume, correction, and restart responses; exact opt-in phrases for assistant service and optional updates; atomic STOP opt-out; and optional name/email persistence only after service consent with validation. Account linking uses a random 256-bit, ten-minute, one-use challenge; only its SHA-256 hash is stored on the conversation, and redemption requires an authenticated user ID plus explicit confirmation. Link challenges are cleared on conversation expiry. No WhatChimp route, outbound link, website confirmation page, or account-link HTTP endpoint is mounted because the provider webhook contract remains unverified. When adding the link UX, keep the raw token out of server/access logs and referrer headers; redeem it via authenticated POST after login and explicit confirmation.
- **Consent copy review:** The current draft explicitly names OpenAI and warns against sending passwords, payment data, or identity documents. Product/legal should approve this exact wording and the referenced privacy-policy details before enabling the flow. Consent capture is deterministic and does not call OpenAI.
- **Verification at Part 7:** 49 focused tests passed across Parts 1–7. Tests cover consent granularity and STOP, workflow resume/restart, profile-field validation, challenge hashing/expiry/single-use semantics, and authenticated confirmation. No external calls or database writes were made.
- **Part 8 — Property search and inquiry:** Implemented locally; awaiting review before Part 9. Safe searches reuse the public listing parser, return verified result cards and purpose-based price periods, and label bounded town/budget alternatives. The new inquiry service writes only to AppAlert, requires consent plus verified account linking, derives ownership from the listing, and deduplicates through a hashed source key. No inquiry action is exposed to the model until an explicit listing-specific confirmation state is persisted. The website Inquiry flow, WhatChimp transport, short-stay confirmation, and deployment are unchanged.
- **Verification at Part 8:** 34 Renda Assistant tests passed, including search filters, alternative labeling, public-data projections, inquiry authorization/idempotency, and prior consent/account-linking coverage. Changed JavaScript passes syntax checks and `git diff --check`. No database writes or external calls were made.
- **Part 9 — Landlord onboarding and subscription:** Implemented locally; awaiting review before Part 10. Added a public `/api/payments/plans` catalog generated from `plan.config` (without Paystack plan IDs), with a fail-closed Basic=7 invariant. The assistant can return only plan keys verified by that tool, with backend-built registration and actual public Terms/Privacy links. Landlord registration, password creation, and KYC remain in the landlord portal; paid plans continue through the existing hosted Paystack initialization and verification flow. The landlord signup page now reads prices/limits from the catalog, and its legal links now target existing public pages. Server-side signup requires explicit acceptance and records server-built policy URLs plus acceptance time. No WhatsApp account creation, password/KYC collection, payment claim, or Paystack call was added.
- **Verification at Part 9:** 39 focused assistant/legal-acceptance tests passed; backend syntax checks passed; landlord frontend production build succeeded with the existing large-chunk warning; `git diff --check` passed. No database writes or external calls were made.
- **Landlord auth note:** Current landlord registration creates the account and emails its existing welcome message; this flow does not include the email OTP used by tenant signup. Part 9 preserves that existing behavior and does not claim landlord email verification.
- **Part 10 — Listing drafts, media, and moderation:** Implemented locally. A consented, verified account link can save an owner-scoped private draft only when existing landlord listing eligibility passes; active company staff must have listing permission. Draft fields are allowlisted, bounded, normalized against the current listing enums and county/town map, and advanced building inventory fields require Premium/Pro. Drafts resume only through an authenticated landlord portal URL; secure photo selection/upload remains in the existing form (up to 10 images with existing client compression and Cloudinary handling). The user sees the complete form review and must explicitly confirm submission. The canonical listing API remains responsible for ownership, plan limits, and creating a pending listing; the assistant never approves or publishes it. Draft completion is recorded only after verifying a matching pending listing. Re-linked conversations cannot read or overwrite another landlord's draft.
- **Verification at Part 10:** 46 focused Renda Assistant tests passed; changed backend JavaScript syntax checks and landlord frontend production build passed; `git diff --check` passed. The build retains the large JavaScript chunk warning. No database writes, provider calls, live uploads, or deployment were performed. Existing website inquiry and listing flows were left in place.
- **Part 11 — Notifications and human handoff:** Implemented locally with external delivery gated. Added a separate status-notification outbox with fixed message templates, per-conversation/event idempotency, expiry, and an off-by-default `RENDA_ASSISTANT_STATUS_NOTIFICATIONS_ENABLED` flag. Persisted listing approval/rejection, KYC review, subscription activation, and short-stay request/status transitions now enqueue notices only for active WhatsApp conversations with both service consent and explicit updates consent; support-handoff conversations are suppressed. Existing Resend email paths remain unchanged, so WhatsApp notices do not duplicate those emails. A minimal handoff record and conversation state are created for support selection or assistant escalation; further automated turns stop while that handoff is pending/claimed.
- **Part 11 limitations:** No WhatChimp send worker, webhook/template-window integration, or delivery callback is enabled; outbox rows remain `awaiting_provider`. Provider/account requirements must be verified before any live delivery. A staff-facing handoff queue/API/UI is not yet connected, so the persisted handoff pauses automation but does not itself alert or assign a staff member. Existing support-page fallback remains the user-facing route until that staff workflow is built.
- **Verification at Part 11:** 75 backend module tests passed; touched backend files passed syntax checks and `git diff --check` passed. Tests use mocks and assert that notifications are disabled by default; no external provider calls, database writes, or deployment occurred. New unique and TTL indexes must be created by MongoDB before a future consumer depends on deduplication/expiry.
- **Part 12 — End-to-end QA and controlled test readiness:** Local test command runs through `cd backend && npm test`; it passed 75 tests before mobile API work. Added `docs/renda-assistant-test-readiness.md` with routes, model/index list, feature flags, test commands, limitations, and rollback notes. No live services or database were used.
- **Part 13 — Mobile Ask Renda API:** Implemented locally after user approval. Added guest mobile sessions using random 256-bit tokens stored only as hashes, explicit mobile consent and privacy metadata, message/reset endpoints, IP rate limits, mobile-only public search orchestration, verified listing IDs, and backend-returned criteria/exact-or-alternative metadata. Existing landlord draft routes remain protected; app search/save/inquiry UI is not in this checkout and was not changed. No OpenAI calls or database writes were made.
- **Verification at Part 13:** `cd backend && npm test` passes 83 tests. `git diff --check` passes. No mobile bundle, MongoDB index build, live AI request, deployment, or external integration test was performed.
- **Readiness outcome:** The standard website and landlord flows remain unchanged. The mobile API is locally implemented but requires the Expo app to wire it, MongoDB to create/verify the mobile session token index, shared rate limiting before multi-instance scaling, and an approved privacy/consent review. Renda Assistant is not ready for live WhatsApp use: no WhatChimp adapter, inbound webhook, or sender exists; outbox entries are not delivered; and there is no staff handoff inbox/API/UI. Recheck the previously reported backend dependency vulnerabilities before production. Keep `RENDA_ASSISTANT_ENABLED=false` until required reviews and deployment checks are complete.
- **Review gate:** Review Part 13 API behavior and consent copy before wiring the Expo UI. Provider sandbox tests require verified contracts and explicit approval; production deployment requires separate explicit approval.

## Purpose

Implement Renda Assistant inside the existing RendaHomes Express/MongoDB backend. The assistant will use WhatChimp for WhatsApp transport and OpenAI for natural-language understanding, while RendaHomes remains authoritative for identity, authorization, listings, moderation, subscriptions, payments, KYC, inquiries, and stay requests.

Do not create a second backend or frontend. Reuse existing services and models where they are appropriate. Do not deploy, modify production infrastructure or credentials, perform production database writes, or send real WhatsApp messages or payments during development/testing.

## Decisions and constraints to retain

- Basic plan limit is **up to 7 listings**. The active backend plan config already enforces 7; stale references must be identified and reconciled without changing valid subscription behavior.
- Preserve pre-existing changes in `backend/modules/payments/payment.controller.js` and `frontend-landlord/src/pages/landlord/Dashboard.jsx`. Inspect Git status before every implementation session; never reset, stash, discard, or overwrite user changes.
- No WhatChimp endpoint, payload, authentication scheme, webhook signature, or delivery semantics may be guessed. Verify provider documentation/account configuration first. If unavailable, build a mockable adapter and keep live integration disabled.
- Do not claim provider end-to-end functionality without a verified test.
- OpenAI may request operations through strict, validated tools; it is never authorization to execute them. The backend enforces identity, ownership, permissions, confirmation, and business rules.
- Never collect passwords, payment credentials, or sensitive KYC documents in ordinary chat. Use secure authenticated flows/links for sensitive steps.
- Require consent for communications, provide opt-out, avoid duplicate operations/notifications, and preserve admin moderation.
- No edits until the user explicitly approves implementation. At each checkpoint, report changes and test results, then pause for user review before starting the next checkpoint.

## Working Agreement

Each part follows this loop:

1. Confirm the current repository state and relevant existing implementation.
2. Make only the scoped changes for that part.
3. Add or update focused tests.
4. Run relevant local tests and report exact results.
5. Summarize files, risks, and any external dependency that remains unverified.
6. Stop and wait for the user's review/approval before moving to the next part.

If an external dependency blocks one part, complete only safe independent work within the approved part, document the blocker, and do not enable live integration.

## Part 0 — Baseline and Change Protection

**Goal:** Establish a trustworthy starting point without changing files.

- Inspect Git status, branch, existing local changes, project scripts, test setup, backend route/module conventions, and relevant audit findings.
- Confirm the active Basic limit and inventory stale plan references.
- Identify existing APIs/models for listings, inquiries, auth, KYC, Paystack, short stays, notifications, and admin moderation.
- Record provider-dependent unknowns: WhatChimp contract/configuration and OpenAI configuration.

**Review gate:** Present baseline findings and intended file scope. No implementation until the user approves Part 1.

## Part 1 — Public Listing Security and Input Boundaries

**Goal:** Ensure public listing search can never expose non-public records.

- Enforce approved, active, visible, available, non-deleted constraints server-side for public list/detail/search paths.
- Prevent public query values from overriding publication constraints; keep admin/landlord queries separate and authorized.
- Add allowlisted filter validation and sensible page/limit caps.
- Test pending, inactive, unavailable, deleted, malformed, and over-limit queries.

**Review gate:** Show the filter behavior, tests, and any compatibility impact; wait for approval.

## Part 2 — Authentication and Sensitive-File Review

**Goal:** Close identity and KYC exposure gaps without breaking valid sign-in flows.

- Trace social login and verify provider identity tokens server-side if currently absent.
- Preserve legitimate existing login behavior and test invalid, expired, mismatched, and valid identities.
- Trace KYC upload, storage, retrieval, and authorization paths.
- Apply application-level access controls where feasible; document Cloudinary account settings that cannot be verified in code.

**Review gate:** Report auth-flow changes, KYC access guarantees, tests, and external verification needs; wait for approval.

## Part 3 — Payment Webhook Idempotency

**Goal:** Make payment event processing replay-safe while retaining current Paystack behavior.

- Inspect current webhook validation and subscription/payment transitions.
- Add durable event deduplication or an equivalent idempotency mechanism where needed.
- Validate allowed state transitions and repeated/out-of-order events.
- Use mocks/fixtures only; do not make live payments or change plan credentials/codes.

**Review gate:** Demonstrate duplicate/replay tests and confirm existing payment paths remain intact; wait for approval.

## Part 4 — Assistant Data and Module Foundation

**Goal:** Add isolated, feature-flagged persistence and service boundaries.

- Add a dedicated `backend/modules/renda-assistant/` module following existing conventions.
- Design conversation/message persistence, unique provider-event identifiers, consent, workflow state, delivery tracking, and retention controls.
- Prevent concurrent messages from corrupting one conversation.
- Keep secrets, passwords, card data, and raw KYC documents out of assistant records.
- Default external/live integration to disabled.

**Review gate:** Review schema/indexes, retention and privacy choices, module boundaries, and tests before provider wiring.

## Part 5 — Provider-Neutral Transport and Webhook

**Goal:** Support testable WhatsApp ingress/egress without inventing WhatChimp behavior.

- Define a normalized text transport contract and mock adapter with fixtures. (Implemented.)
- Verify WhatChimp's actual webhook authentication, payload, retry, media, outbound, and delivery-status contracts from authoritative documentation/configuration.
- Only implement the real adapter for verified contract details.
- Deduplicate inbound events, persist message IDs, process safely, and acknowledge according to the verified contract. (Persistence-layer dedupe exists from Part 4; provider ingress/acknowledgement deferred until contract verification.)
- Track outbound delivery accurately; add timeouts and bounded retries. (Bounded retry helper exists; live delivery tracking/timeouts deferred.)
- Keep production webhook disabled until its authentication and configuration are verified. (No route is mounted; live transport flag is false.)

**Review gate:** User verifies provider/account details and reviews the adapter contract; then approve real provider wiring separately.

## Part 6 — OpenAI Orchestration and Read-Only Tools

**Goal:** Add constrained assistant responses and property discovery first.

- Use the official server-side SDK and environment-based credentials; never expose keys in frontend, messages, or logs. (Implemented; key presence was checked without reading or printing its value.)
- Add versioned instructions and configurable model selection.
- Implement strict JSON schemas, tool allowlists, timeouts, token/tool limits, safe logging, and graceful fallback. (Implemented locally; response storage is disabled with `store: false`, but this alone is not a claim of zero provider-side operational retention.)
- Start with public listing search, listing details, live search metadata, and conversation context/preferences. (Read-only tools implemented.) Human support request is a write operation and is deferred until a separate explicit confirmation flow is designed.
- Return only necessary backend-verified fields to the model; treat listing/user content as untrusted.
- Test fabricated-result prevention and prompt-injection resistance. (Tool outputs are treated as untrusted; listing IDs must be returned by the database-backed tools.)

**Review gate:** Inspect prompts, schemas, data minimization, and mock-based tests before enabling any write tools.

## Part 7 — Welcome, Consent, and Verified Account Linking

**Goal:** Safely recognize new and returning WhatsApp users.

- Add concise welcome and intent selection for property search vs. listing a property. (Implemented as deterministic text; no provider send.)
- Persist optional name/email only after explicit service consent and validate provided values; persist intent in workflow state. (Implemented.)
- Support resume, correction, and restart. (Implemented.) Human handoff remains for Part 11 because no support/handoff transport is configured.
- Link WhatsApp to a RendaHomes account only after a backend-verified challenge; phone possession alone is not account authorization. (Challenge service implemented; authenticated route and website confirmation UI remain unmounted.)
- Record communication consent and opt-out state. (Separate assistant/updates consent; STOP withdraws both atomically.)

**Review gate:** Review privacy/consent wording and account-linking workflow before enabling account-specific actions.

## Part 8 — Property Search and Inquiry

**Goal:** Search real approved listings and create inquiry records safely.

- Implemented locally: the assistant maps Kenyan listing vocabulary to bounded public search arguments; case-insensitive location filters and validated budget/bedroom/guest limits reuse the public listings parser.
- Implemented locally: responses include only tool-verified listing cards, public site links, and purpose-based price labels (monthly rent, nightly short stay, sale total). No landlord contact fields are selected.
- Implemented locally: when exact search returns none, one bounded alternative query may remove the town filter and widen supplied budget bounds by 15%; the response labels those changes rather than calling them exact matches.
- Implemented locally: a WhatsApp inquiry service writes only to `AppAlert`, derives the landlord from an approved active listing, requires explicit assistant consent and a verified linked account, and uses a hashed idempotency key. The website `Inquiry` model/controller are unchanged.
- Not activated: there is no AI-callable inquiry action or inbound WhatsApp workflow for submitting the final inquiry. The selected listing, inquiry message, and explicit user confirmation need a persisted confirmation step before that action can be safely exposed. No short-stay booking request is created here; requests remain pending through the existing stay flow only.
- No provider send, booking confirmation, or contact-detail disclosure was added.

**Review gate:** Review alternative-search behavior and AppAlert attribution. Before activation, implement a persisted listing-specific confirmation step and wire it to the canonical inquiry service; keep short-stay requests pending until the existing landlord confirmation workflow succeeds.

## Part 9 — Landlord Onboarding and Subscription

**Goal:** Guide landlords through secure registration and accurate plan selection.

- Reuse current registration, verification, and account-recovery services.
- Require explicit acceptance of actual Privacy Policy/Terms links; never request passwords in chat.
- Prevent duplicate accounts and preserve email verification/KYC behavior.
- Read package names/prices/limits from the active backend source of truth; Basic is 7.
- For paid plans, initialize existing Paystack hosted checkout and report only backend-verified status.

**Review gate:** Review account linking, consent recording, plan rendering, and mocked payment outcomes before listing drafts.

## Part 10 — Listing Drafts, Media, and Moderation

**Goal:** Create resumable property drafts and submit them only after confirmation.

- Derive required fields from the current listing schema and plan/KYC rules.
- Persist draft progress, support corrections/resume, validate and upload photos through Cloudinary safely.
- Show a complete summary and require explicit submit confirmation.
- Submit through existing ownership/subscription/moderation services.
- Preserve pending review; AI must never approve or publish listings.
- Offer the actual landlord dashboard link after verifying its route.

**Review gate:** Review draft schema, upload rules, and submission tests before notifications.

## Part 11 — Notifications and Human Handoff

**Goal:** Send accurate, consent-aware updates tied to persisted backend events.

- Identify actual status-change events for verification, payment, listing review, KYC, and short stays.
- Send messages only when the backend confirms the event; deduplicate notifications and honor opt-outs/templates/windows.
- Reuse existing Resend notifications without accidental duplication.
- Stop automated actions during human handoff and provide support context safely.

**Review gate:** Review event mappings, templates, consent, and mocked delivery/retry behavior before end-to-end testing.

## Part 12 — End-to-End QA and Controlled Test Readiness

**Goal:** Prove local/sandbox behavior without touching production.

- Run backend unit/integration tests with mocked OpenAI, WhatChimp, Paystack, Cloudinary, and Resend.
- Cover security, idempotency, conversations, search, account linking, payment outcomes, draft resume, image validation, moderation, and handoff.
- Test provider sandbox only after user approval and verified test credentials; never send unsolicited production messages.
- Document setup, API routes/tools, model/indexes, provider configuration, retention, limitations, and rollback/disable switches.
- Report implemented/tested, awaiting provider configuration, partial, and not implemented separately.

**Review gate:** Present final test evidence and remaining production checklist. No deployment without separate explicit approval.

## External facts to verify before live provider work

- WhatChimp product/plan, official API docs, webhook authentication/signature, payload schemas, message/media APIs, retries, delivery callbacks, and WhatsApp number setup.
- Meta policy/template requirements, customer-service window, consent and opt-out practices, and current message pricing.
- OpenAI account/model availability, server-side key location, cost limits, and data-retention requirements.
- Production Cloudinary KYC access policy and Paystack dashboard webhook/plan configuration.

Repository documentation alone cannot prove these account-level settings.

## Current starting-state note

At the time this plan was created, the working tree already had local modifications in:

- `backend/modules/payments/payment.controller.js`
- `frontend-landlord/src/pages/landlord/Dashboard.jsx`

These are pre-existing user changes and must be preserved. Re-check `git status` before each part because the working tree can change after this note is written.

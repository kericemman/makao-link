# RendaHomes WhatsApp Integration

**Status:** Product and architecture proposal; not implemented.

## Product direction

Use WhatsApp as a primary entry point for landlord onboarding and as a communication channel between RendaHomes, landlords, and prospective tenants. Keep the website and mobile app as the places where people discover and view published properties. RendaHomes' shared backend remains the source of truth for accounts, listings, inquiries, and viewing bookings.

The intended journey is:

1. A landlord responds to an advert or opens a RendaHomes WhatsApp conversation.
2. A guided conversation collects their contact details and property information, including photos and location.
3. The backend creates or matches the landlord account and saves a listing as a draft or pending review. The landlord should receive a clear confirmation and a way to continue or correct the submission.
4. An administrator reviews and approves the listing before it appears on the website and app.
5. RendaHomes sends the landlord the published listing link and can send opted-in status updates.
6. A client discovers a property on the website or app, then starts an inquiry or requests a viewing. The backend records the inquiry or booking and WhatsApp can notify the relevant parties and continue the conversation.

## Responsibilities

- **Website and app:** Public property discovery, listing details, search, and account experiences.
- **Shared backend:** Identity, authorization, listing workflow, moderation, inquiry and booking records, notification preferences, and audit history.
- **WhatsApp / WhatChimp:** Conversation entry point, guided data collection, message delivery, and links into RendaHomes flows.
- **Admin platform:** Review and approve WhatsApp-submitted listings, manage reports, and inspect message or delivery status where available.

WhatsApp should not be treated as the permanent database or as proof that a person owns a property. Verify the phone number and associate the WhatsApp identity with a RendaHomes account. Keep KYC documents, sensitive information, and payment steps in authenticated web or app flows; send secure links through WhatsApp instead of collecting sensitive material in chat.

## Proposed first release

1. **Landlord intake:** A guided WhatsApp flow collects name, phone, email where available, county/town/area, property type, rent or sale price, bedrooms/bathrooms, description, and listing photos. It creates a draft or pending-review listing through the existing backend.
2. **Admin review:** Admins can inspect the full submission, request corrections, reject it with a reason, or approve it for publication.
3. **Listing updates:** Send the landlord a confirmation and meaningful status messages, including approval and the public listing link.
4. **Client inquiry and viewing:** From a website/app listing, the client starts an inquiry or requests a viewing. Save it in RendaHomes first, then notify the landlord and client through their chosen channels. Continue the conversation on WhatsApp when both parties have consented and the contact details are available.
5. **Delivery and consent records:** Store opt-in state, message purpose/template, provider message ID, delivery result, and timestamps so notification behavior can be audited and retried safely.

## Later opportunities

- Listing edits, availability changes, and listing performance summaries through WhatsApp.
- Reminders and follow-ups for unanswered inquiries or upcoming viewings.
- Saved-search or new-listing alerts, only for users who explicitly opt in.
- Agent-assisted landlord onboarding and attribution.
- Human handoff for incomplete submissions, disputes, or support questions.

## WhatsApp and provider constraints to confirm

- Confirm the exact WhatChimp product/API plan supports inbound webhooks, outbound messages, interactive flows, media retrieval, delivery callbacks, and the required production number setup. Do not assume a bot-builder feature is equivalent to a stable backend API contract.
- Follow Meta's WhatsApp Business rules for user consent, message templates, categories, and the customer-service messaging window. Business-initiated follow-ups may require approved templates and incur charges; verify current rules and pricing before launch.
- Provide a clear opt-out path and honor it across notifications. Do not send marketing or listing alerts without the appropriate opt-in.
- Design for duplicate webhook delivery, retries, out-of-order events, provider downtime, and users who change phone numbers.
- Ask for only the information needed at each stage. Require explicit confirmation before submitting a listing, booking a viewing, or sharing a client's contact details with a landlord.

## Backend design direction

Integrate with the existing backend; do not create a second backend. Reuse existing users, listings, inquiries, support, and authentication models where suitable. Add only the records needed for WhatsApp identity linking, onboarding progress, viewing bookings if none already exist, notification consent, and provider delivery tracking.

Possible endpoint responsibilities (names are illustrative and must be aligned with existing routes):

- `POST /api/whatsapp/webhook`: receive and validate provider events; process idempotently.
- Internal service for inbound messages: advance or resume the landlord intake session and validate collected fields.
- Internal notification service: send approved templates or session messages and persist provider results.
- Existing listing and inquiry APIs: persist the actual business records, with authorization and ownership checks.
- Viewing booking API: create and manage viewing requests if the current platform does not already support them.

Do not expose an unrestricted public send-message endpoint. Verify webhook authenticity, validate provider signatures/tokens, rate-limit public entry points, and keep WhatChimp credentials in server-side environment variables.

## Decisions before implementation

- Confirm the exact WhatChimp account/product, API documentation, webhook capabilities, pricing, and production WhatsApp number.
- Decide whether landlord onboarding requires email in addition to a verified WhatsApp phone number, and how account recovery works.
- Define required listing fields, photo limits, draft expiry, duplicate-account handling, and admin review states.
- Decide the exact client journey: direct WhatsApp chat, an inquiry form followed by WhatsApp, or both. Avoid exposing personal phone numbers before the client chooses to contact the landlord.
- Define consent wording, notification categories, opt-out behavior, template ownership, and message costs.
- Confirm how viewing availability, confirmation, cancellation, and rescheduling are represented in the current backend.

## Reference links

- [WhatChimp: connect and integrate a WhatsApp Business account](https://whatchimp.com/docs/how-to-connect-and-integrate-your-whatsapp-business-account-with-whatchimp/)
- [WhatChimp: connect a bot](https://app.whatchimp.com/docs/whatsapp/connect-bot)
- [WhatChimp API: conversation history](https://help.whatchimp.com/docs/whatchimp-apis/get-conversation-history-via-whatchimp-api)
- [WhatsApp Business policy](https://whatsappbusiness.com/policy/)
- [WhatsApp Business Platform features](https://whatsappbusiness.com/products/business-platform-features/)

Provider documentation and Meta policy can change. Re-check them against the selected WhatChimp plan before implementation.

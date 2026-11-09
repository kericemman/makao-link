# WhatChimp Diagnostic Collection

The receive-only diagnostic path uses the existing Mongoose `MONGO_URI` connection and stores only sanitized structure metadata in `whatchimp_diagnostic_events`. It does not write to marketplace collections or invoke assistant/business services.

## Security and data

- Both `WHATCHIMP_WEBHOOK_ENABLED` and `WHATCHIMP_WEBHOOK_DIAGNOSTIC_ENABLED` default to `false`; `WHATCHIMP_ENABLED` remains `false`.
- Requests require the high-entropy URL token and are bounded to 64 KiB. The diagnostic parser rejects malformed JSON and stores only field paths/types, byte size, a keyed payload digest, timestamps and expiry.
- No raw JSON, message contents, phone numbers, user IDs, listings, inquiries, payments or subscription records are stored by this diagnostic flow.
- Records expire after 48 hours. Indexes are collection-scoped: unique `diagnosticHash` for duplicate suppression and TTL on `expiresAt`.
- The database connection is the existing app connection. If Mongo is unavailable, the webhook returns a generic retryable error; no alternate connection or business collection is attempted.

## Production database risk

This does write metadata into the production MongoDB database when explicitly enabled. Risks include resource/index-build overhead, diagnostic records consuming storage for up to 48 hours, and a unique-index build failing if unexpected duplicate hashes already exist. Before enabling, review collection size/index state and schedule the first index creation during a low-traffic period. The indexes are created only on `whatchimp_diagnostic_events`; no database-wide migration is performed. The application does not save raw payloads or customer message/phone values.

## Nginx

`deploy/whatchimp-api-location.conf` is intended for inclusion inside the existing TLS `server {}` for `api.rendahomes.com`. `deploy/whatchimp-api-rate-limit.conf` belongs once inside Nginx's `http {}` context. The route suppresses access/error logging for the token-bearing path, sets a 64 KiB request limit, and applies source-IP limiting at `10r/s` with a burst of `50`; the application also caps requests at 600 per 15 minutes per process/IP. These are starting limits, not provider-verified delivery guarantees; monitor legitimate retry patterns before changing them. Preserve the existing SSL certificates, server block and proxy behavior. The checked-in generic vhost references `updates.rendahomes.com`; the live API vhost must be identified on the VPS before applying the snippet. Nginx syntax was not validated here.

If a trusted CDN/proxy sits in front, configure real-IP handling only from its verified proxy CIDRs. Do not trust arbitrary `X-Forwarded-For` values. Morgan redacts the token path in the application log. Check any CDN/WAF logs separately because they are outside this repository.

## Controlled test and rollback

1. Keep all three flags false while releasing code and reviewing the two Nginx snippets.
2. Verify normal API connection and Mongo health. Do not run diagnostic tests against production Mongo.
3. Back up the current release/environment and active API-vhost config. Review `sudo nginx -T` locally on the VPS to identify the correct TLS server, add the two includes, and run `sudo nginx -t`. Do not reload without explicit authorization.
4. For an approved short capture window, set `WHATCHIMP_WEBHOOK_ENABLED=true` and `WHATCHIMP_WEBHOOK_DIAGNOSTIC_ENABLED=true`; keep `WHATCHIMP_ENABLED=false`. Use a controlled test message. Other inbound messages might arrive during this window, but no business action or automated reply occurs.
5. Inspect only stored field/type summaries and compare with WhatChimp's restricted Webhook Log. Disable both webhook flags immediately after capture, remove the callback, and rotate the token.

Rollback is to disable both webhook flags and remove the provider callback. No collection drop is required. Existing diagnostic rows expire automatically; retain the unique and TTL indexes. If the index build causes operational impact, disable the flags first and have the DBA review the diagnostic collection/index only. Do not drop any marketplace collections or alter business indexes.

No deployment, PM2 restart, Nginx reload, production database connection, or live WhatsApp send was performed for this change.

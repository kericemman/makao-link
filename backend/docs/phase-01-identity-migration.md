# Phase 01 Identity Migration

The migration is additive and idempotent for sequential runs. It backfills `User.roles` with the existing primary role, creates an organization only for landlords with existing legacy team accounts, creates owner/team memberships without changing the legacy fields, and associates those landlords' currently unassociated listings with that operational workspace. It does not change user IDs, listing IDs, `Listing.landlord`, subscriptions, KYC, or legal-ownership fields.

This architecture continues to use the existing MongoDB deployment, existing application database, and existing `User` and `Listing` records. It does not introduce a second production database or duplicate identity store. The distinct staging database below is only a rehearsal target; it may live in the same MongoDB project/cluster if it has a separate database name and a staging-only database user. The production rollout should eventually apply these additive changes to the existing application database after the rehearsal, backup, and an explicitly approved production migration window.

## Staging rehearsal

Use a dedicated, disposable staging database, not the production database. It can be in the existing MongoDB Atlas project/cluster; it does not need a separate production deployment. Create a database user whose role is limited to `readWrite` on only the disposable staging database. Restrict Atlas Network Access to the developer's current public IP (or the approved staging runner's fixed egress IP); do not allow `0.0.0.0/0`.

Set these variables in the private local `backend/.env` only:

- `MONGO_URI_STAGING`: URI for the disposable database, with a database name containing `staging`, `stage`, `test`, `dev`, or `local`.
- `RENDA_IDENTITY_MIGRATION_TARGET=staging`.
- `MONGO_STAGING_ALLOWED_HOSTS`: exact comma-separated MongoDB hostnames from the staging URI. Do not include production hosts.
- `MONGO_STAGING_DB_USER`: exact staging-only username embedded in the URI; use a dedicated username containing `staging`, `stage`, or `test`.

The script checks all four values before connecting: explicit staging URI, non-production runtime, marked database name, exact host allowlist match, and exact staging-only user match. Never use `MONGO_URI` as a fallback. These checks cannot independently prove Atlas user's database role or network rules; verify those in Atlas before running anything.

From `backend/`, first run the fail-closed preflight and dry run:

```sh
npm run migrate:identity:dry-run
```

Review the per-landlord user ID, organization existence, team count, listing association count, and role backfill count. Then back up the disposable dataset and run:

```sh
npm run migrate:identity:apply
```

Repeat dry-run and apply to verify idempotency. Do not run these commands against production. The script refuses to connect unless the dedicated staging variable, staging marker, and non-production database-name check all pass.

## Recovery

The migration intentionally has no destructive rollback. For rehearsal, restore the pre-run snapshot or discard the disposable database. For reconciliation, compare organizations and memberships against the unchanged `User.role`, `landlordOwner`, `teamRole`, `teamPermissions`, and `teamStatus` fields; correct additive records forward and retain all existing listing ownership references. Migration audit records use a stable dedupe key so sequential retries do not duplicate them.

Run one migration process at a time. Concurrent runs are not supported. Inspect a failed run's staging records and rerun after correcting the cause; the user-role updates, organization/membership upserts, listing association predicate, indexes, and deduplicated migration audit records are designed to tolerate sequential retries. No broad database cleanup command is part of the rehearsal; discard only the disposable database or restore its snapshot.

## Route and database integration tests

The staging-backed Mongoose/Express integration harness is `modules/authorization/identity.mongo.integration.test.js`. Run it with `npm run test:identity:integration` after configuring staging-only variables. It verifies a validated staging database name, allowed host, staging-only database username, target marker, and a URI distinct from the application `MONGO_URI` before connecting. The test seeds synthetic users, organizations, memberships, listings, mandates, and subscription records; cleanup deletes only the exact fixture IDs created by that run. It exercises tenant/landlord isolation, multi-role identity, valid/expired/revoked mandates, branch scope and immediate membership revocation, and role-escalation denial through Express middleware. Without staging configuration, the test is explicitly skipped; that skip is not integration coverage and remains a release blocker. Never substitute the application `MONGO_URI`.

## Rehearsal Record

On 2026-11-02, the staging guard validated `rendahomes_staging`; the initial dry-run found no existing role backfills or legacy team organizations. The migration was applied to staging and a second dry-run remained unchanged. The integration harness then created a synthetic legacy landlord, team agent and listing, verified dry-run/apply/re-apply behavior, and confirmed one organization, two memberships, one deduplicated audit record, preserved listing owner, and no unassociated fixture listings. All five integration scenarios passed. A follow-up read-only check found zero synthetic integration users remaining. The normal backend suite passed 114 tests; the staging integration test is skipped when that suite is deliberately run without staging configuration. Production `MONGO_URI` was not used, and no production migration was run.

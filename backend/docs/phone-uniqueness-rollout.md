# Phone uniqueness rollout

New account phone numbers must be Kenyan mobile numbers in `+254` format. The API strips display separators, stores the canonical number, and enforces uniqueness through `User.phoneCanonical` and a sparse unique MongoDB index. Empty phone values are reserved for provider-created accounts that have not supplied a phone number.

Before production rollout, deploy the API and frontend code, then run a production dry run and inspect only the aggregate counts:

```sh
cd backend
NODE_ENV=production node scripts/migrateCanonicalPhones.js --target=production --confirm-production-phone-backfill
```

The command is dry-run by default. If it reports duplicate canonical numbers or invalid legacy values, stop and resolve those accounts manually before applying. Do not remove or merge accounts automatically.

After the report is clean, apply the backfill:

```sh
NODE_ENV=production node scripts/migrateCanonicalPhones.js --target=production --confirm-production-phone-backfill --apply
```

The migration is idempotent and only changes valid Kenyan numbers into canonical `+254` form while populating `phoneCanonical`. It refuses to apply if it finds duplicates or invalid non-empty phone values. It does not change account IDs or remove records. The normal application registration check also checks legacy phone spellings, while the unique index closes concurrent registration races for canonicalized values.

Staging is selected using the existing explicit migration target and allowlist:

```sh
cd backend
node scripts/migrateCanonicalPhones.js
node scripts/migrateCanonicalPhones.js --apply
```

Never run an apply command without reviewing its dry-run result first.

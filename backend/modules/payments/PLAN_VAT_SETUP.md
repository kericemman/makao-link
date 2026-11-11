# Landlord Plan VAT Setup

Landlord plan catalog prices are pre-tax monthly amounts. Checkout adds 16% VAT:

| Plan | Base/month | VAT | Paystack monthly amount |
| --- | ---: | ---: | ---: |
| Basic | KES 500 | KES 80 | KES 580 |
| Premium | KES 1,500 | KES 240 | KES 1,740 |
| Pro | KES 2,500 | KES 400 | KES 2,900 |

The backend verifies that each configured Paystack plan code has the matching
VAT-inclusive amount, KES currency and monthly interval before checkout. Update
the Paystack plan configuration first, then point `PAYSTACK_BASIC_PLAN`,
`PAYSTACK_PREMIUM_PLAN` and `PAYSTACK_PRO_PLAN` at those VAT-inclusive plans.
If Paystack requires new plan codes, existing subscriptions attached to prior
plan codes need a deliberate migration/renewal plan; do not silently replace
their subscription codes.

No production environment variables or Paystack dashboard settings are changed
by this implementation.

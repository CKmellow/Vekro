# S15 Start selling: design brief

Code-ready brief. Route `/buyer/start-selling`. A member without a store. Focused wizard (no nav), mobile first, 560px column on desktop. `Stepper` with 3 steps.

1. **Your store**: store name (`Field`, 2–60), area (optional, the S3 area list), seller terms `Choice` "I accept the Vekro seller terms" with a link to the terms on X3 Help. Button "Open my store" → `POST /account/store {shop_name, shop_area, terms_version}`. 409 "already open" → go to `/seller`.
2. **Where we pay you**: M-Pesa payout number, SMS-verified: the existing S3 payout step, but always with the code (`/me/mpesa-number/request-code` then `PUT /me/mpesa-number` with `code`). Copy: "We send your money here when a buyer accepts. We text a code to prove it's your number."
3. **Your first listing**: hand over to S7 (`/seller/listings/new?first=1`), whose step 3 sets the dispute policy.

After step 1 the store exists, so leaving and coming back resumes at step 2 (seller dashboard shows the Finish setup banner). The mode switches to Selling (`vekro.mode=selling`).

## Finish setup banner (seller area)

While `store.payout_ready` is false: saffron `Banner` on every seller page "Finish setup: add your payout number (SMS-verified). Buyers can't pay until you do." with "Add payout number" → step 2. Listings stay visible to buyers but the Trust Link says "This store isn't ready yet."

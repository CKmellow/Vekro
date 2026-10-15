# Frontend contract decisions

Authoritative. Where `docs/PAGES.md` conflicts, this wins. Gap index: [BACKEND_GAPS.md](BACKEND_GAPS.md).

## Principles

1. Design to the product intent in PAGES.md. Implement against the real contract in `api/openapi.json`. Never bend the UI to fit a backend accident, and never fake a capability silently.
2. Generate a typed client from `api/openapi.json` (openapi-typescript). Everything that touches a gap goes through `src/models/api/adapters/*`, the only layer allowed to know about gaps (kept under `models/` so the MVC import rules still hold).
3. For each missing endpoint, ship an MSW mock plus a typed interface, switchable with a per-gap env flag `VITE_MOCK_<GAP>`. Tag every mock `// backend-gap #<n>`. When the backend ships, the fix is deleting a mock, not editing screens.
4. Keep `docs/BACKEND_GAPS.md` as the index (gap, issue, status, mock file). The PR template has a "Gaps touched" line. PAGES.md gets a short "Deviations from original spec" section instead of being rewritten.

## Decisions

### A. Buyer entry and identity

- Target (per PAGES.md): the buyer opens the seller's link, sees the order, pays. No visible signup.
- Do NOT use order ID + phone as a credential. The seller knows both, so the seller could act as the buyer.
- Entry link: `/pay/:listingId`, backed by the public `GET /listings/{listing_id}`. Show item, price and the seller's dispute policy before any auth.
- Interim auth (the backend requires buyer accounts today): one compact step on the payment page, "Save your details to track this order" (phone + password via `/auth/register`, or `/auth/login` if the phone exists). No marketing-style signup page.
- Auth sits behind an `AuthStrategy` interface. Today: `PasswordAccount`. Target: `PhoneVerifiedGuest` (SMS code, then the backend find-or-creates a buyer by phone). Swapping it must not touch the screens.
- "Find my order" (order ID + phone) is built to spec, hidden behind its flag until the lookup gap ships. It never shows order details before phone verification.

### B. Payment screen

- Normalize the create/initiate response into `PaymentInstruction = { kind: 'STK_PROMPT' | 'REDIRECT', redirectUrl? }`. A redirect URL means `REDIRECT`, otherwise `STK_PROMPT`. Replace the heuristic with the explicit field when the gap ships.
- Heading is always "Complete payment". Never name LOOP, Pesapal or Daraja to buyers.
- STK_PROMPT copy: "Check your phone and enter your M-Pesa PIN", with waiting, resend and timeout states.
- REDIRECT copy: "Continue to secure checkout". Return page `/pay/return` reads `OrderTrackingId`, shows "Confirming your payment…" and polls. The redirect itself confirms nothing.
- Success is shown only when the transaction status is `locked`, learned by polling, never from a redirect or callback query param.
- Polling needs a single-order read (gap P0-1); use a mock until it ships.
- The client always sends `listing.price` as the amount; never a user-editable amount (gap P0-4).

### C. B4: arrival, inspection, accept or reject

- Flow: "Your item has arrived" notice, then an inspection checklist, then a decision. No "reveal your code" screen.
- Contract check (done): `/arrival` returns `TransactionResponse` (no code); `otp-give` requires `otp_code`. So the buyer receives the code by SMS or in-app notification and types it in. The code is never displayed on the screen that submits it. Delivery of the code to the buyer only is gap P1-4.
- Accept copy states consequences by item type. Non-serialized: "Accepting is final and releases payment to the seller." Serialized: "Payment is held for 24 hours; you can report a functional issue in that window."
- Reject calls `otp-withhold` and routes to the return/refund state screen.
- A visible countdown runs from arrival. About 1 hour of no action triggers the withheld-code path automatically.
- Serialized accepted items get a "24h window" screen with the report-an-issue action, a countdown, and the category list from the seller's declared policy.

### D. Seller screens

- Create-listing and the actions (dispatch, arrival, resolution buttons) are buildable now.
- Orders dashboard and listings list need list endpoints; build against mocks (P0-2).
- Returns inbox and analytics are mocked until the list endpoints and filters exist.

### E. Admin screens

- Escalation queue, case timeline and force-resolve are buildable now.
- The SPLIT option handles a backend capability error gracefully.

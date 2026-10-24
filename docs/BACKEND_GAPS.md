# Backend gaps

Each gap has a `backend-gap` issue, an MSW mock tagged `// backend-gap #<n>`, and a `VITE_MOCK_<GAP>` flag. When the backend ships, delete the mock and flag.

Reconciled against `api/openapi.json` on 2026-10-24 (resynced from CKmellow/Vekro-backend `main`).

## Open

| Gap | Issue | Needed by (milestone) | Status | Flag | Mock file |
| --- | --- | --- | --- | --- | --- |
| P1-1 Public order summary | #10 | M6 | Open | `VITE_MOCK_PUBLIC_ORDER` | not yet |
| P1-2 Phone-verified guest session | #11 | M15 | Open | `VITE_MOCK_PHONE_AUTH` | not yet |
| P1-3 Buyer order history | #12 | M15 | Open | `VITE_MOCK_BUYER_ORDERS` | not yet |
| P1-7 Seller profile and payout settings update | #144 | M4 | Open (mocked) | `VITE_MOCK_SELLER_PROFILE` | `src/mocks/gaps/sellerProfile.ts` |
| P1-9 Seller disagree-and-escalate | #146 | M12 | Open | `VITE_MOCK_ESCALATE` | not yet |
| P1-10 Admin transaction search | #147 | M14 | Open | `VITE_MOCK_ADMIN_SEARCH` | not yet |
| P2-1 Courier/seller code verify | #14 | M16 | Open (only if needed) | none | n/a |
| P2-3 Seller analytics aggregates | #148 | M15 | Open | `VITE_MOCK_ANALYTICS` | not yet |
| P2-4 Password change and reset, sessions and devices | #149 | M15 | Open | `VITE_MOCK_ACCOUNT_SECURITY` | not yet |
| P2-5 Notification preferences | #150 | M15 | Open | `VITE_MOCK_NOTIFICATION_PREFS` | not yet |

## Closed

| Gap | Issue | Closed | Evidence |
| --- | --- | --- | --- |
| P0-4 Server-derived transaction amount | #9 | 2026-10-15 | Backend PR CKmellow/Vekro-backend#140 (issue #139). `CreateTransactionRequest.amount` is optional; the server uses the listing price and rejects a different amount with 422. The client omits `amount`. |
| P1-4 Delivery code to buyer only | #13 | 2026-10-15 | Backend PR #140. The code is sent in the buyer's notification (and by SMS), never the seller's; covered by `test_service_arrival_sends_delivery_code_to_buyer_only`. |
| P2-2 Non-sequential order reference | #15 | 2026-10-15 | Backend PR #140. `TransactionResponse.reference` is a random human reference such as `VK-7K3P9Q`. Show it instead of the UUID. |
| P0-5 Listing content and public seller profile | #139 | 2026-10-20 | Backend PR CKmellow/Vekro-backend#168 (issue #167). `ListingResponse` has `description`, `category`, `buyer_name`, `status` (`active`, `awaiting_payment`, `sold`), ordered `photos` and a `seller` summary (`name`, `member_since`, `completed_sales`); photos upload to `POST /listings/{id}/photos`. Sold listings refuse new transactions. No seller area, verified badge or view counts (not stored). The `VITE_MOCK_LISTING_CONTENT` mock is deleted. |
| P0-1 Single-transaction read | #6 | 2026-10-20 | Backend PR CKmellow/Vekro-backend#163 (issue #161). `GET /transactions/{id}` for the buyer, the seller and admins (404 for anyone else): state, listing summary, masked parties, `viewer_role`, `server_time`. Used by `src/models/api/transactions.ts`. |
| P0-7 State deadlines | #141 | 2026-10-20 | Same PR as P0-1. `deadlines` (`dispatch_by`, `inspect_by`, `hold_until`, `return_send_by`, `return_confirm_by`) come from the same windows as the backend timeout jobs; `server_time` gives the clock offset. |
| P0-3 Payment instruction | #8 | 2026-10-20 | Backend PR CKmellow/Vekro-backend#166 (issue #165). `POST /transactions` returns `payment` with an explicit `kind` (`STK_PROMPT` or `REDIRECT`); a 202 has `failed_to_initiate`. |
| P1-6 Payment failure reason and resend | #143 | 2026-10-20 | Same PR as P0-3. `payment.failure_reason` (`cancelled`, `wrong_pin`, `insufficient_funds`, `timeout`, `provider_error`), `expired` after 90s, and `POST /transactions/{id}/payment/resend` with a 30s cooldown (429 + Retry-After). |
| P1-5 Order timeline for buyer and seller | #142 | 2026-10-20 | Backend PR CKmellow/Vekro-backend#172 (issue #171). `GET /transactions/{id}/timeline` returns `{ kind, at, title, description }` oldest first, in words for the caller's role; notification messages and payloads (which hold the delivery code) are never returned. Used by B3 and B7. |
| P0-2 Seller order and listing lists | #7 | 2026-10-24 | Backend PR CKmellow/Vekro-backend#176 (issue #175). `GET /transactions` lists the caller's orders (bought or sold) with `segment`, repeatable `status`, `q`, `sort`, page numbers, per-segment and per-status counts and `server_time`. `GET /listings` lists the seller's listings with status counts. Used by S5 (`listOrders`) and S8 (`listListings`); the `VITE_MOCK_SELLER_LISTS` mock is deleted. Page numbers instead of the cursor first requested. |
| P0-6 Listing update, archive and duplicate | #140 | 2026-10-24 | Backend PR CKmellow/Vekro-backend#180 (issue #179). `PATCH /listings/{id}` (409 once paid or while archived), `POST /listings/{id}/archive` and `/restore`, status `archived`; archived listings refuse new transactions. Duplicate stays client-side. The `VITE_MOCK_LISTING_UPDATE` mock and `src/mocks/gaps/listings.ts` are deleted. |
| P1-8 Notifications mark as read | #145 | 2026-10-24 | Backend PR CKmellow/Vekro-backend#178 (issue #177). `POST /notifications/{id}/read` (idempotent), `POST /notifications/read-all`, `GET /notifications/unread-count` (in-app), and `unread`/`channel` filters on the list. Used by S14 and the seller bell; the `VITE_MOCK_NOTIFICATION_READ` flag is removed. |

# Backend gaps

Each gap has a `backend-gap` issue, an MSW mock tagged `// backend-gap #<n>`, and a `VITE_MOCK_<GAP>` flag. When the backend ships, delete the mock and flag.

Reconciled against `api/openapi.json` on 2026-10-15 (resynced from CKmellow/Vekro-backend at `6ff02d4`).

## Open

| Gap | Issue | Needed by (milestone) | Status | Flag | Mock file |
| --- | --- | --- | --- | --- | --- |
| P0-1 Single-transaction read | #6 | M6 | Open | `VITE_MOCK_TRANSACTION_READ` | not yet |
| P0-2 Seller order and listing lists | #7 | M4 | Open (listings mocked; orders in M9) | `VITE_MOCK_SELLER_LISTS` | `src/mocks/gaps/listings.ts` |
| P0-3 Payment instruction in initiate response | #8 | M6 | Open | `VITE_MOCK_PAYMENT_INSTRUCTION` | not yet |
| P0-5 Listing content fields and public seller profile | #139 | M4 | Open (mocked) | `VITE_MOCK_LISTING_CONTENT` | `src/mocks/gaps/listings.ts` |
| P0-6 Listing update, archive and duplicate | #140 | M4 | Open (mocked) | `VITE_MOCK_LISTING_UPDATE` | `src/mocks/gaps/listings.ts` |
| P0-7 State deadlines on transactions | #141 | M7 | Open | `VITE_MOCK_DEADLINES` | not yet |
| P1-1 Public order summary | #10 | M6 | Open | `VITE_MOCK_PUBLIC_ORDER` | not yet |
| P1-2 Phone-verified guest session | #11 | M15 | Open | `VITE_MOCK_PHONE_AUTH` | not yet |
| P1-3 Buyer order history | #12 | M15 | Open | `VITE_MOCK_BUYER_ORDERS` | not yet |
| P1-5 Order timeline for buyer and seller | #142 | M7 | Open | `VITE_MOCK_TIMELINE` | not yet |
| P1-6 Payment failure reason and STK resend | #143 | M6 | Open | `VITE_MOCK_PAYMENT_STATUS` | not yet |
| P1-7 Seller profile and payout settings update | #144 | M4 | Open (mocked) | `VITE_MOCK_SELLER_PROFILE` | `src/mocks/gaps/sellerProfile.ts` |
| P1-8 Notifications mark as read | #145 | M9 | Open | `VITE_MOCK_NOTIFICATION_READ` | not yet |
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

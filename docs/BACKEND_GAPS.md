# Backend gaps

Each gap has a `backend-gap` issue, an MSW mock tagged `// backend-gap #<n>`, and a `VITE_MOCK_<GAP>` flag. When the backend ships, delete the mock and flag.

| Gap | Issue | Needed by (milestone) | Status | Flag | Mock file |
| --- | --- | --- | --- | --- | --- |
| P0-1 Single-transaction read | #6 | M6 | Open | `VITE_MOCK_TRANSACTION_READ` | not yet |
| P0-2 Seller order and listing lists | #7 | M4 | Open | `VITE_MOCK_SELLER_LISTS` | not yet |
| P0-3 Payment instruction in initiate response | #8 | M6 | Open | `VITE_MOCK_PAYMENT_INSTRUCTION` | not yet |
| P0-4 Server-derived transaction amount | #9 | M6 | Open | none (client sends listing price) | n/a |
| P1-1 Public order summary | #10 | M6 | Open | `VITE_MOCK_PUBLIC_ORDER` | not yet |
| P1-2 Phone-verified guest session | #11 | M15 | Open | `VITE_MOCK_PHONE_AUTH` | not yet |
| P1-3 Buyer order history | #12 | M15 | Open | `VITE_MOCK_BUYER_ORDERS` | not yet |
| P1-4 Delivery code to buyer only | #13 | M7 | Open | `VITE_MOCK_DELIVERY_CODE` | not yet |
| P2-1 Courier/seller code verify | #14 | M16 | Open (only if needed) | none | n/a |
| P2-2 Non-sequential order reference | #15 | M16 | Open | none | n/a |

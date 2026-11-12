# S16 Close store (in S13 Settings) and Trust Link store states: design brief

Code-ready brief.

## Close store (S13 Settings, new "Your store" section, danger zone)

- "Close store" (secondary, coral text) opens a `ConfirmDialog` that first calls `GET /account/store/close-check`.
- **Blocked** (`can_close` false): the dialog lists what must finish first, each a link: "Open orders: VK-…" → S6, "KES 2,400 still held for your orders", "Payouts not yet settled: VK-…", "Open returns or disputes: VK-…". Only "OK".
- **Allowed**: copy "Closing your store hides your listings and stops new orders. Your past orders and payouts stay on record, because buyers and Vekro's public audit rely on them. You can reopen any time." Buttons "Keep my store open" / "Close store" → `POST /account/store/close` (a 409 re-shows the blockers).
- **Closed**: the section shows "Your store is closed (since 11 Nov)" with primary "Reopen store" → `POST /account/store/reopen`, and "Listings stay archived; restore the ones you want from Listings."
- Why no delete: one line under the section, "Stores and orders are never deleted: they are part of a tamper-evident record."

## Trust Link (B1) store states

| `GET /listings/{id}` | B1 shows |
| --- | --- |
| `store_status` `closed` | item card dimmed, sand `Banner` "This store is closed", no pay buttons |
| `store_ready` false | `Banner` "This store isn't ready yet. Ask the seller to finish setting up." no pay buttons |
| `is_own_listing` true | `Banner` "This is your own listing. You can't buy from your own store." with "Open in your store" |

The same 422 messages from `POST /transactions` show in a toast if the state changed while the page was open.

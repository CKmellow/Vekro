# S6 Seller order detail: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` S6 and its Deviations, `docs/FRONTEND_CONTRACT.md` F, `docs/COPILOT_PROMPT.md` 4.3 and open question 1, `.stitch/DESIGN.md`.

Route `/seller/orders/:id` (`:id` is the transaction UUID; the screen shows the reference). Seller. Devices: desktop 1440px (8 / 4 columns) and mobile 390px (single column, action dock).

Goal: know exactly where this order and its money stand, and do the one thing it needs. Feeling: in control of the hand-off.

## Layout, top to bottom

1. **Header**: back link "Orders", `type-headline` reference "VK-7K3P9Q" in mono with a copy button (`aria-label="Copy order reference"`), `StatusPill` (seller label), and an `ActionsMenu` ("Copy order link", "Get help").
2. **Left column (8)**:
   1. **Vault card** (`VaultCard`): amount label from the state ("Held in escrow", "Paid out to you", "Refunded to the buyer"), `KES 52,000`, lock ring in the state's ring. Under it a `MoneyPath`: "Buyer" (Brian Otieno), "Vekro vault", "You".
   2. **Action panel** (the most important element, below the vault): tone, icon, headline, one sentence, optional `CountdownRing`, and at most one primary button. Table below.
   3. **Item card**: 56px photo, "iPhone 13, 128GB, Midnight", "Serialized · IMEI on file" or "Standard item", price, link "View listing" (S9).
   4. **Buyer card**: "Brian Otieno", "+254 712 *** 678" (masked). Call and WhatsApp are hidden until the backend gives sellers a contact route (see notes).
   5. **Tabs**: "Overview" (items 1 to 4) and "Timeline" (`Timeline`, the order's history from the timeline endpoint).
3. **Right column (4)**, sticky from 1024px: **Payout card** (white, 20px radius):
   - Rows: "Order amount" `KES 52,000`; "Network fee (estimated)" `−KES 130`; "Platform fee" `KES 0`; divider; bold "You receive" `KES 51,870` (Bricolage).
   - Payout status line with icon: "Held until the buyer accepts" (lock, emerald) / "Paid out to M-Pesa" with the M-Pesa reference in mono and EAT date (check, emerald) / "Payout in progress" (loader, lake) / "Refunded to the buyer" (coin, sand) / "Payout delayed. We're retrying." (alert, coral).
   - Lock explainer, text-muted: "Vekro holds the money in escrow for this one order. It moves to your M-Pesa only after the buyer accepts the item, or when a timer runs out in your favour."
4. **Mobile**: one column in the order vault, action panel, payout card, item, buyer, tabs; the action's primary button sits in the frosted `ActionDock`.

## Action panel by state

| Backend status | Tone | Headline / sentence | Countdown | Primary |
| --- | --- | --- | --- | --- |
| `initiated`, `awaiting_payment` | sand | "Waiting for the buyer to pay" / "The order locks when the M-Pesa payment comes in. Don't send anything yet." | none | none |
| `locked` | emerald | "Ready to dispatch" / "Pack the item and hand it to your courier." Warning line (saffron-700 text): "If you don't dispatch in time, the buyer is refunded automatically." | time left to dispatch (48h) | "Mark as dispatched" (confirm dialog) |
| `out_for_delivery`, `dispatched` | lake | "On the way to the buyer" / "When the courier reaches the buyer, mark the item as arrived so they can inspect it." | none | "Mark item arrived" (confirm dialog); none for legacy `dispatched` |
| `at_door_pending_inspection` | saffron | "The buyer is inspecting" / "They have about 1 hour to accept with their code or reject. If they do nothing, the item comes back to you." | time left to inspect | none |
| `hold_24h` | saffron | "Funds release in 21h 04m" / "Unless the buyer reports a problem, you're paid when the timer ends." | time to release | none |
| `disputed_functional`, `return_in_transit`, `return_received`, `awaiting_buyer_reconfirmation` | coral | "The buyer reported a problem" / the buyer's category, for example "Screen or touch problem" | per state (return windows) | "Open return case" (to S11) |
| `escalated_admin_review` | plum | "With Vekro support" / "Support is reviewing this case. The money stays in escrow until they decide." | none | none (secondary "Open return case") |
| `released`, `resolved_release` | emerald | "You've been paid" / "The buyer accepted. KES 51,870 went to your M-Pesa." | none | none |
| `refunded_buyer`, `resolved_refund`, `returned_to_seller` | sand | "Order closed" / "The buyer was refunded" plus the door-rejection reason when there is one ("Buyer's reason: Not as described. "Screen has a crack."") | none | none |
| `resolved_split` | plum | "Settled by Vekro support" / "Support divided the payment. Check your notifications for the split." | none | none |

## Dialogs

- **Dispatch confirm** (`ConfirmDialog`): title "Mark VK-7K3P9Q as dispatched?" body "Only confirm once the courier has the item. The buyer is told it's on the way." confirm "Yes, it's dispatched", cancel "Not yet".
- **Arrival confirm**: title "Is the courier at the buyer's door?" body "The buyer gets a text to inspect the item and about 1 hour to decide." confirm "Yes, mark arrived", cancel "Not yet".

## Controls

| Control | Label | Style | Enabled when | Result |
| --- | --- | --- | --- | --- |
| Back | "Orders" | link | always | `/seller/orders` |
| Copy reference | copy icon | icon button | always | copies, toast "Reference copied" |
| Mark as dispatched | "Mark as dispatched" | primary | `locked` and online | dispatch confirm, then `POST /dispatch`; toast "Marked as dispatched" |
| Mark item arrived | "Mark item arrived" | primary | `out_for_delivery` and online | arrival confirm, then `POST /arrival`; toast "The buyer has been asked to inspect" |
| Open return case | "Open return case" | primary (secondary when escalated) | dispute states | S11 |
| View listing | "View listing" | link | always | S9 |
| Tabs | "Overview" / "Timeline" | `Tabs` | always | switch panels |

## States

| State | Design |
| --- | --- |
| Loading | vault skeleton (emerald-900 block), action panel, payout card skeletons |
| Not yours (403/404) | friendly page: `EmptyState` (shield) "This order isn't in your shop" / "It may belong to another seller account." action "Back to orders" |
| Error | coral `Banner` "We couldn't load this order." with "Try again" |
| Offline | sand `Banner` with the last update time; primary buttons disabled with the reason "You're offline" |
| Conflict (409) | the order refetches and toast "This order changed. Here's the latest." |

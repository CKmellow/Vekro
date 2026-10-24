# S10 Returns inbox: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` S10, `docs/COPILOT_PROMPT.md` 4.3, `.stitch/DESIGN.md`.

Route `/seller/returns`. Seller. Devices: desktop 1440px and mobile 390px.

Goal: see every return and which ones are waiting on you. Feeling: problems are contained and have a clear path.

## Layout, top to bottom

1. **Header**: `type-display-lg` "Returns". Under it, text-muted: "When a buyer reports a problem with a serialized item, the money stays in escrow until the case is settled."
2. **Tabs** (`Tabs`) with counts:
   - "Awaiting return" (`disputed_functional`, `return_in_transit`)
   - "Action needed" (`return_received`): the label in PAGES.md is "Received: action needed"; the tab reads "Action needed" with a saffron count badge
   - "Awaiting buyer" (`awaiting_buyer_reconfirmation`, `escalated_admin_review`)
   - "Closed" (`refunded_buyer`, `resolved_refund`, `resolved_release`, `resolved_split`, `returned_to_seller` when it came from a dispute)
3. **Case cards** (one column on mobile, two on desktop): white, 20px radius, `shadow-1`:
   - Top: 48px item photo, title, mono reference, amount.
   - Category chip (coral-50 / coral-700): the buyer's problem, for example "Not working".
   - `StatusPill` (seller label) and, when a timer runs, a 44px `CountdownRing` with a line: "Confirm receipt within 2d 5h, or it goes to Vekro support" (`return_in_transit`); "The buyer has 2d 5h to send it back" (`disputed_functional`).
   - Escalated cards carry a plum "With Vekro support" pill and no countdown.
   - Button "Open case" (secondary; primary-styled on "Action needed" cards since they wait on the seller).

## Controls

| Control | Label | Style | Result |
| --- | --- | --- | --- |
| Tab | name and count | `Tabs` | filters the cards |
| Open case | "Open case" | secondary (primary on Action needed) | S11 `/seller/returns/:transactionId` |
| Card | whole card | link (same target as the button; the button is the visible affordance) | S11 |

## States

| State | Design |
| --- | --- |
| Loading | tabs without counts, 4 card skeletons |
| Empty: Awaiting return | "No items on their way back." / "If a buyer reports a problem, you'll see the return here." |
| Empty: Action needed | "Nothing waiting on you." / "When a returned item reaches you, confirm it here and choose a fix." |
| Empty: Awaiting buyer | "No one to wait for." / "After you repair or replace an item, the buyer confirms here." |
| Empty: Closed | "No closed returns yet." |
| No returns at all | `EmptyState` (shield) "No returns. Good sign." / "Returns only happen when a buyer reports a fault during the 24-hour hold on serialized items." |
| Error | coral `Banner` "We couldn't load your returns." with "Try again" |
| Offline | sand `Banner` with the last update time; cards dimmed |

## Sample data

HP Pavilion 15 laptop KES 68,500, VK-9F2K4D, "Not working", "Waiting for item to arrive", confirm within 2d 5h. iPhone 13 KES 52,000, VK-2H7N5R, "Damaged on arrival", "Item received". Samsung Galaxy A54 KES 41,000, VK-6T3W8B, "Missing parts", "Waiting for buyer to confirm".

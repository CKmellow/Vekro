# S4 Seller dashboard: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision of 2026-10-17). Sources: `docs/PAGES.md` S4 and its Deviations, `docs/FRONTEND_CONTRACT.md`, `docs/COPILOT_PROMPT.md` 4.3 (state mapping), `.stitch/DESIGN.md`.

Route `/seller`. Seller. Devices: desktop 1440px (sidebar layout) and mobile 390px (bottom navigation).

Goal: answer "what do I need to do right now, and how is business?" in one glance. Feeling: on top of things, never anxious.

## Foundation

- Shell: `SellerLayout` (emerald-950 sidebar from 1024px, bottom navigation on phones). "Dashboard" is active. The Orders badge shows the "Needs action" count and Returns the open-returns count, both from the order list counts.
- Labels and pill colours come from `STATE_META` seller labels. Never show raw state names. References are `VK-7K3P9Q` style, never UUIDs.
- Money as `KES 143,500` (`MoneyText`, Bricolage for big numbers, `tabular-nums`).
- Time in EAT. Countdowns use server deadlines with the server clock offset, never the device clock.

## Layout (desktop), top to bottom

1. **Greeting row**: `type-display-lg` "Good morning, Amina" (morning / afternoon / evening from EAT), under it `type-body-md` text-muted "Friday, 24 October". Right: primary "New listing" (plus icon), the page's only primary button.
2. **KPI row**: four white tiles on sand, 20px radius, `shadow-1`, 4 columns:
   - "In escrow": `KES 143,500` with a thin `MoneyPath` dot at the vault and the caption "Held for 5 orders".
   - "Awaiting dispatch": `3`, caption "Dispatch within 48 hours of payment".
   - "Released this month": `KES 428,000`, delta chip "+12%" (emerald-50 / emerald-700, arrow-up) against last month; no chip when last month was 0.
   - "Open issues": `1`, coral dot when above 0, caption "Returns waiting on you".
   Each tile is a link that opens Orders on the matching segment (In escrow: In transit; Awaiting dispatch: Needs action; Released: Completed; Open issues: Issues). Numbers count up once on first load.
3. **Needs your action** (the hero): section title `type-headline` "Needs your action" with a count chip. A horizontal row of up to three action cards (desktop), each: 48px item thumbnail (or parcel placeholder), item title, mono reference, one instruction line, a 56px `CountdownRing` on the right, and one secondary button:
   - locked: "Dispatch VK-7K3P9Q within 41h 12m", button "Mark as dispatched" (opens the S6 dispatch confirm).
   - out_for_delivery: "Tell the buyer VK-3M8D2L has arrived", button "Mark as arrived".
   - return_in_transit: "Confirm you received VK-9F2K4D", button "Confirm received" (opens S11).
   - return_received: "Choose resolution for VK-2H7N5R", button "Open case" (opens S11).
   Rings are saffron and turn coral under 10% of the window. More than three: a "See all 5" link to Orders > Needs action.
4. **Two columns** (8 / 4):
   - Left: **Recent orders** card: `DataTable` of the 5 newest orders (Item with thumb, Reference mono, Amount, Status pill, Placed relative time). Row click opens S6. Footer link "View all orders".
   - Right rail: **Payouts** card: "Paid out this month" `KES 428,000`, "Next payout" (the order with the soonest release, for example "VK-4299, after the buyer accepts"), and the lock explainer line "Money moves to your M-Pesa only after the buyer accepts the item." Under it a **Tip** card (sand-100, lightbulb icon): "Add a second photo to sell 2x faster" shown only while the seller has fewer than 3 listings.

## Layout (mobile)

Greeting in the top bar ("Habari, Amina"); KPI tiles as a horizontal snap carousel (two visible); action cards stacked full width; recent orders as stacked cards; payouts card last. "New listing" is the raised centre button of the bottom navigation, so there is no in-page primary.

## Variants

| Variant | Design |
| --- | --- |
| Default | as above, with the sample data |
| New seller | the KPI row and actions are replaced by an onboarding checklist card (emerald-50): "Get ready to sell" with three steps, each with a check circle: "Add your M-Pesa payout number" (done when the payout number is set; link to `/onboarding`), "Create your first listing" (link to `/seller/listings/new`), "Share your Trust Link" (done once any listing has an order). A progress bar "1 of 3 done" |
| All caught up | the actions section shows `EmptyState` (vault illustration) "You're all caught up" / "New orders that need you will show here." with no button |

## Controls

| Control | Label | Style | Result |
| --- | --- | --- | --- |
| New listing | "New listing" | primary | `/seller/listings/new` |
| KPI tile | tile title | whole tile is a link with a visible focus ring | Orders on the matching segment |
| Action button | "Mark as dispatched" / "Mark as arrived" / "Confirm received" / "Open case" | secondary | S6 confirm dialog / arrival confirm / S11 |
| See all | "See all 5" | link | Orders, Needs action |
| Recent order row | whole row | row link | S6 |
| View all orders | "View all orders" | link | `/seller/orders` |

## States

| State | Design |
| --- | --- |
| Loading | skeleton tiles (4), three action-card skeletons, five table rows |
| Error | coral `Banner` "We couldn't load your dashboard." with "Try again"; the greeting stays |
| Offline | sand `Banner` "You're offline. Showing the last update at 14:36."; data dimmed to 70% |

## Sample data (PAGES.md 0.1)

Amina Gadgets; iPhone 13, 128GB, Midnight KES 52,000 (VK-7K3P9Q, paid, dispatch within 41h 12m); Nike Air Force 1 size 42 KES 6,500 (VK-3M8D2L, on the way); HP Pavilion 15 KES 68,500 (VK-9F2K4D, return on its way back); Kitenge wrap dress KES 3,200 (completed); 3-seater sofa KES 38,000 (held 24 hours).

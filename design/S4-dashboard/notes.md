# S4 Seller dashboard: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M8). Built in M9 (#103). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Shell | `SellerLayout` with badge counts |
| KPI tiles | new `KpiTile` view (title, value, caption, optional delta chip, link) |
| Action cards | new `ActionCard` view (thumb, title, reference, instruction, `CountdownRing`, one `Button`) |
| Recent orders | `DataTable` + `StatusPill` + `MoneyText` |
| Payouts and tip | `Card` |
| States | `SkeletonGroup`, `EmptyState` (vault), `Banner` |
| New seller | checklist card built from `Card` and the check circle used by `Stepper` |

Controller `useSellerDashboard()` reads the dashboard summary and the order list (needs-action segment and the five newest), maps each needing-action order to an instruction from `getAvailableActions('seller', order)`, and builds deadlines with the deadlines module. Dispatch and arrival reuse the S6 mutations.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Every PAGES.md S4 element in order: greeting and "New listing", four KPIs, Needs your action, recent orders, payout summary, tip
- [x] Variants: default, new seller checklist, all caught up
- [x] Loading, error, offline; no-permission is handled by the seller route guard

Design system
- [x] Emerald for the one primary, saffron only for running deadlines, coral only under 10% left and for issues
- [x] Lucide icons: plus, lock, truck, rotate-ccw, circle-alert, arrow-up, lightbulb, package

Content
- [x] Seller labels from `STATE_META`; references `VK-7K3P9Q`; money `KES 143,500`
- [x] Payout copy always says "after the buyer accepts the item"; no payout-speed or regulator claims

Usability and accessibility
- [x] One primary per screen (none on mobile: the raised nav button is the create action)
- [x] KPI tiles are links with readable names ("In escrow, KES 143,500, open orders in transit")
- [x] Countdown rings announce at 10 minutes and 1 minute only

Life and motion
- [x] Motion below with reduced-motion fallbacks

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| KPI numbers | count up once on first load (600ms) | final numbers |
| Action cards | stagger in (40ms apart, 220ms fade and 8px rise) | appear at once |
| Rings | drain with the deadline; colour shifts to coral under 10% | numbers update, no sweep |
| Card leaves after an action | collapses (220ms) and the next card slides over | removed at once |

## Backend dependencies (build in `../backend`, no frontend mocks)

- The seller's order list with segment counts: gap #7 (`GET /transactions`).
- KPI totals (in escrow, released this month and last month, open issues): new seller summary endpoint, filed with #103.
- Item thumbnails: listing photos (shipped in #139).
- The new-seller checklist reads the payout number from the session user and the listing count from the seller listing list (#7).

## Deviations from PAGES.md

1. "Mark item arrived" appears as an action card for `out_for_delivery`, because arrival is seller-only (open question 1, default a).
2. The tip card shows only while the seller has fewer than 3 listings, so experienced sellers don't see filler.
3. The KPI sparklines are dropped: the summary endpoint returns totals, not series. Sparklines can come with S12 analytics (#148).

## Audit (web-design-guidelines, applied to the brief)

- Tiles and rows are real links (middle-click and keyboard work); no `div` click handlers.
- Numbers use `tabular-nums`; the count-up only changes the visible text, and screen readers get the final value.
- The carousel on mobile uses native scroll snapping with visible overflow, not a JS slider.

## Open questions

- None new. Seller contact for buyers (B3) and buyer contact for sellers (S6) stay hidden until the backend exposes a contact route.

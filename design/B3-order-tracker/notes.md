# B3 Order tracker: notes

Status: Specced (2026-10-17). No Stitch render (Cyprian's M5 decision). Built in M7 (#90 to #93, #97). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Hero | `VaultCard` + `MoneyPath` |
| Next step | new `NextStepCard` view (tone, icon, headline, sentence, optional `CountdownRing`) |
| Progress | `Stepper` |
| Tabs and timeline | `Tabs`, `Timeline` |
| Menu | `ActionsMenu` |
| States | `SkeletonGroup`, `EmptyState`, `Banner`, `Sheet` + `PhoneField` |
| Dock | shared frosted action dock |

Controller `useOrderTracker(orderId)` reads the transaction, polls every 15s while the order is active and on window focus, keeps the last good data for offline, and gets dock actions from `getAvailableActions` (#90) and deadlines from the deadlines module.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Every PAGES.md B3 element in order
- [x] Panels: awaiting payment, locked, out for delivery, at the door, held 24h, a dispute state, escalated, released, refunded
- [x] Out for delivery shows "Waiting for the courier"; the seller marks arrival (open question 1, default a)
- [x] Phone gate specced and flagged off; not found, error, offline ("Showing the last update at 14:36"), loading; Overview and Timeline tabs

Design system
- [x] Next-step tones follow DESIGN.md meaning: saffron only when time runs, coral for problems, plum for support, lake for in motion
- [x] Lucide icons: lock, truck, eye, hourglass, alert-circle, shield, check, coins, clock, phone, message-circle, copy

Content
- [x] Reference `VK-7K3P9Q`; human labels from `STATE_META`; phones masked
- [x] Every panel says where the money is and what happens next

Usability and accessibility
- [x] At most one primary; "Report a problem" is a danger outline, never filled
- [x] 48px icon buttons with labels
- [x] State changes announced politely once (not on every poll)

Life and motion
- [x] Motion below with reduced-motion fallbacks

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| State change | money-path dot glides (600ms); next-step card cross-fades (220ms); ring changes state | instant swap |
| Locked vault | breathing glow, 3s | still |
| At the door | amber ring pulse, 2s | still |
| Hold 24h | ring drains with the deadline | numbers only |
| Stepper | current node pulses | still |
| Dock | slides in when an action appears, out when it goes | appears and disappears |

## Backend dependencies (build in `../backend`, no frontend mocks)

- Single-transaction read for the buyer: gap #6.
- Deadlines (dispatch 48h, door 1h, hold 24h): gap #141.
- Timeline tab: gap #142.
- Item photo and seller name on the mini-card: gap #139.
- Seller contact for the buyer (Call, WhatsApp): not in the contract yet; see open questions.

## Deviations from PAGES.md

1. `out_for_delivery` has no buyer "Courier is here" action; the seller marks arrival (arrival is seller-only in the contract). The card says "Waiting for the courier".
2. "Download receipt" on released and refunded orders is deferred: there is no receipt endpoint. Specced later with B9 (M10).
3. The phone gate is built to spec but flagged off until #10 and #11 ship (contract A).

## Audit (web-design-guidelines, applied to the brief)

- Polling refreshes don't move focus or re-announce unchanged states.
- The offline timestamp uses EAT and `tabular-nums`.
- `wa.me` and `tel:` links have descriptive labels; no number is printed on screen.

## Open questions

1. **Seller contact.** Call and WhatsApp need the seller's number, which the buyer contract doesn't expose, and the UI masks phones outside the admin console. Proposal: the buttons dial without printing the number, and the backend adds the seller's contact to the buyer's order read (with #6). Until then the buttons are hidden.
2. **Buyer "Courier is here".** Kept as default (a): the seller marks arrival. A backend gap for buyer-confirmed arrival can be filed if you want option (b).

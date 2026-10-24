# S6 Seller order detail: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M8). Built in M9 (#101, #102). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Hero | `VaultCard` + `MoneyPath` |
| Action panel | the B3 `NextStepCard` pattern, extracted to a shared domain view `NextStepPanel` with an optional action slot |
| Payout card | `Card` + `MoneyText`; fee from `lib/fees` (estimated) until the backend reports the real fee |
| Item, buyer | `Card` |
| Tabs and timeline | `Tabs`, the B7 `TimelinePanel` |
| Dialogs | `ConfirmDialog` |
| Mobile dock | `ActionDock` |

Controller `useSellerOrder(id)` reads `GET /transactions/{id}`, polls every 15s while active, gets the action from `getAvailableActions('seller', order)` and the countdown from the deadlines module, and runs dispatch and arrival with 409 handling.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Header, vault with money path, action panel, item, buyer, timeline tab, payout card (gross, network fee, platform fee, you receive, payout status, lock explainer)
- [x] Action panel for every backend status, dispatch confirm, "Mark item arrived" (open question 1, default a), not yours, loading, error, offline, conflict

Design system
- [x] Tones follow meaning: saffron for running timers, coral for problems, plum for support, lake for in motion
- [x] Lucide: lock, truck, eye, hourglass, circle-alert, shield-check, check, coins, loader, copy

Content
- [x] Reference `VK-7K3P9Q`; buyer masked; seller labels; network fee labelled "estimated"
- [x] Payout copy: money moves only after the buyer accepts or a timer runs out in the seller's favour

Usability and accessibility
- [x] At most one primary; dispatch and arrival are confirmed first
- [x] Disabled buttons say why (offline)
- [x] State changes after polling are announced once, politely

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| After dispatch | ring travels (lock ring "locked" with the travelling dot); pill morphs; action panel cross-fades (220ms) | instant swap |
| Payout paid | ring turns to a green check (600ms) and the payout line ticks in | instant |
| Countdown | drains with the server deadline; coral under 10% | numbers only |

## Backend dependencies

- `GET /transactions/{id}` for the seller (shipped, #6), dispatch and arrival (shipped).
- Payout status and M-Pesa reference: new `payout` block on the seller's order read, filed with #101.
- Dispute category for the dispute-state panel: dispute summary on the order read (M11 backend work; until then the panel shows "The buyer reported a problem" without the category).
- Buyer contact (Call, WhatsApp): not in the contract. Hidden for now (same rule as B3 seller contact).

## Deviations from PAGES.md

1. "Mark item arrived" is a seller action here (arrival is seller-only).
2. "Download receipt" on released orders is deferred: there is no receipt endpoint.
3. "Prints a packing slip (later)" is not specced.
4. Network fee shows as "estimated" until the payout provider's fee is stored.

## Audit (web-design-guidelines, applied to the brief)

- The copy button and the menu have labels; the reference is real text (selectable).
- The sticky payout card doesn't trap scroll on short laptop screens (`max-height` with overflow).
- Dialog focus goes to "Not yet" (the safe choice), never the confirm.

## Open questions

1. **Buyer contact for sellers.** Sellers need to call the buyer about delivery. Proposal: a backend contact route that returns a `tel:` and `wa.me` target for the other party only while the order is active, so the number is dialled but never printed. Until then the buttons stay hidden.

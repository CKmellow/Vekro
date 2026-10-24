# B6 Return flow: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M10). Built in M11 (#108, #109). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Vault, stepper | `VaultCard`, `Stepper` |
| State panel | the S6 action-panel pattern (tone, icon, headline, ring) |
| Summary, policy | `Card`, quote block |
| Chips | small pills with check or clock icons |
| Dialogs | `ConfirmDialog` (destructive style for the support escalation) |
| Dock | `ActionDock` |

Controller `useReturnFlow(orderId)` reads the order with its dispute summary, polls every 15s while open, offers actions from `getAvailableActions('buyer', order)` plus the closure confirmation on resolved states, and runs buyer-sent-back, buyer-reconfirmation and confirm-resolved-buyer with 409 handling.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Every PAGES.md B6 state panel, "Is it fixed?" with the second-"No" warning, refund issued, mark as resolved with both chips, escalated (plum, read only), deadline passed

Design system
- [x] Tones follow DESIGN.md meaning; "No, still a problem" is a danger outline, never filled

Content
- [x] Repair and replacement shown as the seller's chosen action, not as states
- [x] Every panel says where the money is

Usability and accessibility
- [x] One primary per state; dialogs start focus on the safe choice
- [x] State changes announced once (polite) after polling

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Step change | stepper dot travels (600ms); panel cross-fades (220ms) | instant |
| Chips | flip to confirmed (220ms) | instant |
| Refund issued | money path dot glides back to "You" (600ms) | instant |

## Backend dependencies

- buyer-sent-back, buyer-reconfirmation, confirm-resolved-buyer (shipped).
- Dispute summary on the order read: category, description, reported time, seller's chosen action and note, reconfirmation rejections so far, and both closure confirmations. Not in the contract yet: M11 backend work (#106).

## Deviations from PAGES.md

1. **Return instructions.** There's no return address or drop-off note in the contract, so the card gives generic guidance. "Contact seller" is hidden (no seller contact route, same as B3).
2. **"Mark as resolved" only on resolved cases**, matching the backend (it closes the case record after the money moved). Same rule as S11.
3. **"Download receipt"** is deferred: there's no receipt endpoint.

## Audit (web-design-guidelines, applied to the brief)

- The quote blocks are `<blockquote>` with the buyer's or seller's words; no HTML from the server is rendered.

## Open questions

- Return address: a seller "return address" field on the listing or profile would make the card concrete. Proposed for later.

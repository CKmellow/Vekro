# S11 Return case: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M8). Built in M12 (#112, #113, #114). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Summary, policy | `Card`, category chip, quote block |
| Timeline | `Timeline` via the B7 `TimelinePanel` |
| Action panel | `NextStepPanel` (from S6) plus `Choice` radio cards and `Field` textarea |
| Dialogs and sheet | `ConfirmDialog` (destructive for refund), `Sheet` |
| Mobile | `ActionDock` |

Controller `useReturnCase(id)` reads the order with its dispute summary, offers only the actions `getAvailableActions('seller', order)` allows and the listing policy declares, and runs seller-received, seller-resolution-action, escalate and confirm-resolved-seller with 409 handling.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Case summary (category, quoted description, dates), timeline, the no-photos note, sticky action panel, confirmation chips
- [x] Every state: waiting to be sent, in transit, received (radio cards), awaiting buyer, escalated, refund issued, resolved release, resolved split
- [x] Refund confirm (coral), disagree sheet, escalated, refund issued

Design system
- [x] Coral only for the refund warning and the problem chip; plum for support; one primary per panel

Content
- [x] Repair and replacement shown as the chosen action, not as states (operating prompt 4.3)
- [x] The refund warning names the amount and says it can't be undone
- [x] No photo evidence (removed from the product)

Usability and accessibility
- [x] Radio cards are a real radio group with a legend "How will you resolve this?"
- [x] The refund dialog's initial focus is "Go back"
- [x] The disagree reason has a visible counter and a clear error under 20 characters

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Pick a radio card | border and tint animate (120ms); the note field expands (220ms) | instant |
| After an action | panel cross-fades to the next state (220ms); pill morphs | instant |
| Escalation | panel turns plum with a single soft pulse | instant |

## Backend dependencies

- Dispute summary (category, description, dates, chosen action, notes, closure confirmations) on the order read: M11 backend work.
- Seller disagree-and-escalate: gap #146.
- seller-received, seller-resolution-action and confirm-resolved-seller (shipped).

## Deviations from PAGES.md

1. **"Mark as resolved" only on resolved cases.** PAGES.md shows it on any open case, but the backend accepts mutual confirmation only once the case is `resolved_refund`, `resolved_release` or `resolved_split` (it closes the case record; the money has already moved). The chips appear there.
2. **Refund ends as "Refunded to buyer".** The seller's refund action moves the order to `refunded_buyer`; the panel shows the "Refund issued" summary for it.
3. A "Your policy" card is added so the seller sees why only some options are offered.
4. The "tracking note" from PAGES.md is folded into the one optional note field.

## Audit (web-design-guidelines, applied to the brief)

- The sticky panel stays inside the viewport with its own scroll on short screens.
- Disabled "Confirm action" explains "Pick an option first" via `aria-describedby`.

## Open questions

- None.

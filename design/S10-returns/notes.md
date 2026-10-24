# S10 Returns inbox: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M8). Built in M12 (#111). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Tabs | `Tabs` with counts |
| Case card | new `ReturnCaseCard` view (photo, title, reference, amount, category chip, `StatusPill`, `CountdownRing`, button) |
| States | `SkeletonGroup`, `EmptyState`, `Banner` |

Controller `useReturnsInbox()` reads the seller's order list filtered by dispute statuses (gap #7 `GET /transactions?status=…`), with the dispute summary (category) from the M11 backend work, and deadlines from the deadlines module.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Header, four tabs with counts, case cards with thumb, reference, category chip, status pill, countdown and "Open case"
- [x] Each tab, empty per tab, no returns at all, loading, error, offline

Design system
- [x] Coral only for the problem chip; saffron for running timers; plum for escalated

Content
- [x] Categories in buyer words from the backend's list (not working, damaged on arrival, missing parts, not as described, other)
- [x] No photo evidence anywhere (removed from the product)

Usability and accessibility
- [x] One link target per card; the button isn't nested inside another link
- [x] Countdown lines are text, not only rings

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Tab change | cards cross-fade (120ms) | instant |
| Rings | drain with the deadline | numbers only |

## Backend dependencies

- Seller order list with a status filter: gap #7.
- Category on each case: dispute summary on the order read and list (M11 backend work).
- Deadlines `return_send_by` and `return_confirm_by` (shipped, #141).

## Deviations from PAGES.md

1. The "Received: action needed" tab is labelled "Action needed" to fit four tabs on a phone.
2. Escalated cases sit under "Awaiting buyer" with a plum "With Vekro support" pill: in both, the seller is waiting on someone else.
3. Category chips use the backend's five categories, not the PAGES.md phone categories (see B5 in M10).

## Audit (web-design-guidelines, applied to the brief)

- Tab counts are part of the tab's accessible name ("Action needed, 1").

## Open questions

- None.

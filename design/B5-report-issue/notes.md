# B5 Report an issue: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M10). Built in M11 (#107). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Countdown chip | `MiniCountdown` (from S5) in a saffron chip |
| Problem cards | `Choice` radio cards |
| Description | `Field` textarea with counter |
| What happens next | `Timeline` with upcoming entries |
| Confirm | native checkbox (`Choice` checkbox) |
| Dock | `ActionDock` |
| Success | `VaultCard` (coral ring) |

Controller `useReportIssue(orderId)` reads the order, checks eligibility (`getAvailableActions('buyer', order)` includes `report_problem`), validates with Zod (category required, 20 to 500 characters, checkbox unless `other`), submits, and refetches the order.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Countdown chip, headline, item card, problem cards, description with counter, what happens next, checkbox, dock
- [x] Success "We've told the seller" (and the support variant), window closed, not eligible, already reported, submit error, offline

Design system
- [x] Coral only as an accent (the success ring), plum only for the support tag; one primary

Content
- [x] No photos asked for (removed from the product); amount and serial as in sample data
- [x] Next steps follow the seller's declared resolution

Usability and accessibility
- [x] Radio cards are a radio group with a legend; counter is announced politely at the limits only
- [x] Submit stays enabled-looking only when valid; errors are listed under fields on submit

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Pick a card | lifts (translateY -2px, shadow-2, 120ms) with an emerald check | border change only |
| Counter | colour transition at the limits | instant |
| Submit | form fades, vault card slides in and its ring turns coral (600ms) | instant swap |

## Backend dependencies

- `POST /transactions/{id}/report-functional-issue` (shipped). It accepts five categories: `not_working`, `damaged_on_arrival`, `missing_parts`, `not_as_described`, `other`. `other` goes straight to Vekro support.
- Dispute summary on the order read (category, description) for B6 and S11: M11 backend work.

## Deviations from PAGES.md

1. **Categories.** PAGES.md lists phone-specific problems from the seller's policy. The backend accepts five fixed categories, so the cards use them in buyer words, and the seller's declared problems show as context ("Amina Gadgets covers: …"). The buyer's own words go in the description.
2. **No coral primary.** "coral-accented Submit report" becomes the standard primary; coral is reserved for problems and destructive confirmations (DESIGN.md).
3. "Something else" skips the return checkbox and shows the support path, matching the backend's routing.

## Audit (web-design-guidelines, applied to the brief)

- The textarea keeps its value offline and on errors; `maxLength` is not set (so paste isn't silently cut), the counter warns instead.

## Open questions

- Should the backend accept the seller's declared problems as categories (so S10/S11 show "Screen or touch problem")? Proposed for later; the description carries it today.

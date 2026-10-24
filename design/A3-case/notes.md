# A3 Case detail and decision: notes

Status: Specced (2026-10-24). No Stitch render. Built in M14 (#118 read only, #119 decision).

## Build map

| Part | Component |
| --- | --- |
| Header, cards | `Card` (dark variant), copy buttons |
| Accounts | quote blocks on `dark-surface-raised` |
| Timeline | `Timeline` with a dark style and full timestamps |
| Decision | radio cards, two `PriceField`s locked to the total, a split bar, `TextArea` |
| Confirm | `ConfirmDialog` with a typed-confirmation input (new `confirmText` prop) |
| Money path on success | `MoneyPath` moving to the chosen side |

Controllers: `useAdminCase(id)` (read) and `useAdminDecision(id)` (validation, typed confirmation, execute, retry, capability error).

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

- [x] Undecided, split selected, confirm dialog, executing, failed, decided (read only), split unsupported
- [x] Full phones only here (admins); payloads never rendered
- [x] The dialog restates amounts and names; typed confirmation; focus starts on "Cancel"
- [x] Plum for the binding action, coral only for failures

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Decision cards | the selected card expands (220ms) | instant |
| Split bar | width animates as amounts change (220ms) | instant |
| Success | money path dot moves to the chosen side (600ms) | instant |

## Backend dependencies (build in `../backend` in M14)

1. The case read returns ids only for parties and the listing: A3 needs the order reference, amount, item title and serial, the declared policy, party names, full phones, order counts, dispute rate, the seller's action and note, and the escalation trigger and reason.
2. **Split amounts**: `force-resolve` takes `decision` and `reason` only, and a split is always 50/50 (`split_ratio = 0.5`). A3 needs a `split_ratio` (or buyer amount) in the request.
3. The decided state needs the deciding admin and time on the read.
4. Timeline events include notification payloads; the build never renders them, and the backend should drop them from this response too.

## Deviations from PAGES.md

1. Split amounts add up to the amount held. Network fees are taken at payout and aren't known here, so the "minus fees" rule becomes a note: "Network fees are deducted when each payout is sent."

## Open questions

- None.

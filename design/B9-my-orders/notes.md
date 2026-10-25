# B9 My orders: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M10). Built in M15 (#122).

## Build map

| Part | Component |
| --- | --- |
| Search, filter | search field from S5, `SegmentedControl` |
| Cards | new `BuyerOrderCard` view (photo, title, seller, amount, `StatusPill`, dots, `MiniCountdown`) |
| Track sheet | `Sheet`, `Field` |
| States | `SkeletonGroup`, `EmptyState`, `Banner` |

Controller `useMyOrders()` reads `GET /transactions` as the buyer (the server scopes it to the orders they bought), keeps filters in the URL, and maps statuses with buyer labels.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] List with segment counts, search, empty, no results, "Track an order" sheet, error, offline, signed out

Content
- [x] Buyer labels from `STATE_META`; references, never UUIDs; seller name only (no phone)

Usability and accessibility
- [x] Cards are links; the floating button has a text label (not icon only) and doesn't cover the last card (bottom padding)

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Filter change | cards cross-fade (120ms) | instant |
| Sheet | slides up (360ms) | instant |

## Backend dependencies

- `GET /transactions` for buyers shipped with backend #176 (gap #12's list is covered; close #12 when B9 ships).
- The page needs a buyer session: today phone and password; gap #11 for the passwordless one (B8).

## Deviations from PAGES.md

1. "Track by order ID" becomes "Track an order" with a link or reference that only opens the buyer's own orders: an order ID is never a credential (FRONTEND_CONTRACT A).

## Open questions

- None.

## Build notes (M15 #122)

1. "Sign out" sits beside the headline instead of in an avatar menu, so the buyer header stays the same on every buyer page.
2. Signed-in sellers and admins are sent to their own areas.

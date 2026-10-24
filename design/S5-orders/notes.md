# S5 Orders list: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M8). Built in M9 (#100). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Filters | `SegmentedControl`, search field from S8 |
| Table and cards | `DataTable` (cards below 768px), `StatusPill`, `MoneyText`, `CountdownRing` (small) |
| Pagination | `Pagination` |
| Row actions | `Button` + `ConfirmDialog` (shared with S6) |
| States | `SkeletonGroup`, `EmptyState`, `Banner` |

Controller `useOrdersPage()` keeps segment, search, sort and page in the URL, reads `GET /transactions` (gap #7) with them, and exposes the dispatch and arrival mutations used by S6.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Header, segments with counts, search, table columns from PAGES.md, row quick action, pagination, mobile cards
- [x] Empty state for each segment, no results, no orders at all, loading, error, offline

Design system
- [x] Pills from `STATE_META` tones; saffron rings only where a deadline runs

Content
- [x] References in mono; buyers masked; money `KES 52,000`

Usability and accessibility
- [x] Rows are links; the quick action is a separate button (not nested in the link) with a label naming the order ("Dispatch VK-7K3P9Q")
- [x] Hover-only actions are also visible on focus and always visible on touch
- [x] The search announces the result count politely

Life and motion
- [x] Motion below

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Segment change | rows cross-fade (120ms) | instant |
| Row after dispatch | pill morphs to "On the way" and the row leaves Needs action with a 220ms collapse | instant |

## Backend dependencies

- `GET /transactions` with `segment`, `q`, `sort`, `page`, `page_size` and segment counts: gap #7.

## Deviations from PAGES.md

1. The date range picker is dropped for now: search and segments cover the demo, and the stack has no date picker component. Can be added with a backend `placed_from`/`placed_to` filter later.
2. "Export CSV" is marked "later" in PAGES.md and is not specced.
3. "Mark arrived" joins "Dispatch" as a quick action because arrival is seller-only (open question 1, default a).

## Audit (web-design-guidelines, applied to the brief)

- URL holds the filter state (deep links and back button work).
- Sortable headers expose `aria-sort`.
- Deadline cells read "41 hours 12 minutes left to dispatch" to screen readers.

## Open questions

- None.

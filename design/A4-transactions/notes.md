# A4 Transactions explorer: notes

Status: Specced (2026-10-24). No Stitch render. Built in M14 (#120), after backend gap #147.

## Build map

| Part | Component |
| --- | --- |
| Search and filters | `TextField`, chips, a small date-range pair of native date inputs, `PriceField` pair |
| Table | `DataTable` (dark variant), `StatusPill`, `Pagination` |
| Slide-over | Radix dialog as a right sheet (dark), `VaultCard` compact, `Timeline` |

Controller `useTransactionsExplorer()` keeps search and filters in the URL and reads the admin search endpoint; the slide-over reads `GET /transactions/{id}` (admins can) and its timeline.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

- [x] No query yet (recent activity), results with slide-over, no results, loading, error
- [x] Read only: no action buttons except "Open case"
- [x] Full phones (admin only); EAT times; references, never UUIDs

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Slide-over | slides in from the right (360ms spring) | instant |

## Backend dependencies

- Gap #147: `GET /admin/transactions` with search (reference, phone in any format, seller name, serial), status, date and amount ranges, item type, paging, and "recent" ordering without a query. M14.

## Deviations from PAGES.md

- None.

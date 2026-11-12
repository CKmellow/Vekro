# B11 Returns & disputes: notes

Status: Specced (2026-11-11). Build #316.

- Controller `useBuyerCases(segment)`: `GET /transactions?as=buying&filter=disputed|cases`.
- Reuses `BuyerOrderCard` with a category line; no new endpoint (backend #336 added `filter=cases`: any order with a dispute or return row, open or past).

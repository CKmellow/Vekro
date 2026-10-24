# A2 Escalation queue: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` A2, `.stitch/DESIGN.md` (dark console), `api/openapi.json` (`GET /admin/disputes/escalation-queue`).

Route `/admin` (filters in the query). Admin. Device: desktop 1440px (min 1280).

Goal: see what's waiting, oldest first, and open the right case. Feeling: under control, never frantic.

## Layout

1. **Shell**: `AdminLayout`: 240px `dark-surface` sidebar ("Queue" active with a plum indicator, "Transactions", "Sign out"), top bar with global search ("Order reference, phone or serial") and a queue pill "7 open".
2. **Header**: `type-display-lg` "Escalation queue".
3. **Counters** (4 tiles, `dark-surface-raised`): "Open cases" 7, "Older than 24h" 2 (coral number when above 0), "Decided today" 3, "Average time to decide" "5h 20m".
4. **Filters**: chips "Open" (default), "Decided", "All"; a trigger multi-select "Trigger" with "Seller didn't confirm receipt", "Buyer said not fixed twice", "Parties disagree", "Something else category".
5. **Table** (sticky header, 48px rows, zebra `dark-surface`/`dark-background`): "Case" (mono, short dispute id), "Order" (mono reference), "Item", "Amount" (right), "Trigger" (plum-tinted tag), "Age" (badge: sand under 12h, saffron 12 to 24h, coral over 24h, since escalation), "Buyer", "Seller", chevron. Oldest first. The row is a link to A3; the focused row has a plum left rule.
6. **Pagination** under the table (25 per page).

## Controls

| Control | Label | Result |
| --- | --- | --- |
| Status chips | "Open" / "Decided" / "All" | filters |
| Trigger | "Trigger" | multi-select filter |
| Sort | "Age", "Amount" | sortable headers |
| Row | whole row | A3 `/admin/cases/:id` |
| Keyboard | J / K move focus, Enter opens | shown in a hint "J K to move · Enter to open" |
| Search | top bar | A4 with the query |

## States

| State | Design |
| --- | --- |
| Loading | counter and 8 row skeletons on dark |
| Empty | `EmptyState` on dark: "Nothing waiting. Nice." / "Escalated cases show here, oldest first." |
| Error | coral banner "We couldn't load the queue." with "Try again" |
| Offline | banner with the last update time |

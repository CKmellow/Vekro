# A4 Transactions explorer: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` A4, `.stitch/DESIGN.md` (dark console), backend gap #147 (admin transaction search).

Route `/admin/transactions?q=…` (the console top bar search lands here). Admin, read only. Device: desktop 1440px.

Goal: find any order fast and read its whole story without changing anything. Feeling: a clear, quiet ledger.

## Layout

1. **Header**: `type-display-lg` "Transactions".
2. **Search**: wide field (56px) "Order reference, phone, seller or serial number", with a search icon and "Search" button; Enter submits.
3. **Filters** (chips and menus): "Status" multi-select (human labels from `STATE_META`, grouped like the seller segments), "Placed" date range (from, to; EAT), "Amount" range (min, max KES), "Item type" ("Standard", "Serial-numbered").
4. **Results table** (dense, 48px rows): "Order" (mono reference), "Parties" (buyer name and full phone, then seller shop), "Amount" (right), "Status" (pill, seller wording), "Created" (EAT date and time), "Last event" (relative, with the event title). Row click opens the slide-over.
5. **Slide-over** (right, 480px, `dark-surface`, focus trapped, Escape closes): vault summary (amount, state, ring), parties with full phones, item and policy, deadlines, the read-only timeline, and a link "Open case" when the order has an escalated dispute (to A3).
6. **Pagination** (25 per page) with "Showing 1 to 25 of 312".

## States

| State | Design |
| --- | --- |
| No query yet | "Recent activity": the 25 most recent orders across the platform |
| Results | as above |
| No results | "No orders match "0712 345"" with "Clear search and filters" |
| Loading | 8 skeleton rows |
| Error | coral banner with "Try again" |

## Controls

| Control | Label | Result |
| --- | --- | --- |
| Search | as above | filters by reference, buyer or seller phone (any format), seller name or serial |
| Filters | "Status", "Placed", "Amount", "Item type" | narrows results; in the URL |
| Row | whole row | opens the slide-over |
| Open case | "Open case" | A3 |
| Close | "Close" (X), Escape | closes the slide-over |

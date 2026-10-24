# S12 Analytics: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` S12, `.stitch/DESIGN.md`, the `dataviz` guidance for chart form and colour.

Route `/seller/analytics`. Seller. Devices: desktop 1440px and mobile 390px.

Goal: see how the shop is doing and where trust breaks down. Feeling: a clear, honest scoreboard.

## Layout, top to bottom

1. **Header**: `type-display-lg` "Analytics"; right: `SegmentedControl` "7 days" / "30 days" / "90 days" (default 30).
2. **KPI row** (6 tiles; 3 x 2 on desktop, horizontal snap carousel on mobile), each with the value and a delta against the previous period of the same length:
   - "Sales volume" `KES 428,000` (+12%)
   - "Orders" `46` (+5)
   - "Average order value" `KES 9,300`
   - "Completion rate" `94%`: released orders out of closed orders
   - "Dispute rate" `2%`: orders with a reported issue (lower is better; a rise shows coral, a fall emerald)
   - "Average time to dispatch" `6h 40m`: payment to dispatch
3. **Sales over time**: area-and-line chart (Recharts), emerald-600 line on an emerald-50 to transparent area, daily points (weekly at 90 days); x axis in EAT dates, y axis in short KES ("KES 40k"); no vertical gridlines, faint horizontal ones; tooltip "Tue 21 Oct · KES 28,400 · 4 orders".
4. **Two columns** (6 / 6):
   - **Orders by outcome**: stacked bar per week: "Released" emerald-600, "Refunded" sand-400, "Disputed" coral-500, with direct labels on the last bar and a legend whose items toggle series.
   - **Dispute categories**: horizontal bars ("Not working" 3, "Damaged on arrival" 1, "Missing parts" 1), coral-400 bars, values at the bar ends.
5. **Top listings** table (`DataTable`): Listing (thumb + title), Orders, Sales (KES), Completion rate. Sortable by Orders and Sales.
6. **Insights** card (plum-50 tint, sparkle-free, lightbulb icon): "Smart insights are coming" / "We'll flag unusual order patterns here." No button.

## Controls

| Control | Label | Style | Result |
| --- | --- | --- | --- |
| Range | "7 days" / "30 days" / "90 days" | `SegmentedControl` | refetches every block |
| Chart tooltip | n/a | hover and focus on points | shows the values |
| Legend item | "Released" / "Refunded" / "Disputed" | toggle button with `aria-pressed` | hides or shows the series |
| Table sort | "Orders", "Sales" | sortable header | sorts |

## States

| State | Design |
| --- | --- |
| Not enough data | fewer than 5 completed sales: `EmptyState` (chart icon) "Make 5 sales to unlock analytics" / "You've made 2. Your numbers show here once there's enough to be useful." action "Share a listing" (to S8) |
| Loading | tile skeletons and chart-shaped skeletons |
| Error | coral `Banner` "We couldn't load your analytics." with "Try again" |
| Offline | sand `Banner` with the last update time; charts dimmed |

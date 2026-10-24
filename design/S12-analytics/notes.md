# S12 Analytics: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M8). Built in M15 (#125). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Range | `SegmentedControl` |
| KPIs | `KpiTile` (from S4) with delta chips |
| Charts | Recharts `AreaChart`, `BarChart` (stacked), `BarChart` (horizontal), themed with tokens |
| Top listings | `DataTable` |
| Insights | `Card` with the plum tint |
| States | `EmptyState`, `SkeletonGroup`, `Banner` |

Controller `useAnalytics(range)` reads the analytics aggregates (gap #148) and maps them to tiles, series and rows. Charts are lazy-loaded so Recharts never reaches the buyer bundle.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Range, six KPIs, sales over time, orders by outcome, dispute categories, top listings, Insights card
- [x] Populated and not enough data; loading, error, offline

Design system
- [x] Chart colours from tokens: emerald for money and success, coral only for disputes, sand for neutral outcomes; plum only on the reserved Insights card
- [x] Direct labels, no gridline clutter, no 3D or gradients beyond the area fade

Content
- [x] KES with short axis labels; EAT dates
- [x] Insights card makes no promises beyond "coming"; no AI wording (removed from the product)

Usability and accessibility
- [x] Each chart has a text summary for screen readers ("Sales rose 12% to KES 428,000 over 30 days") and a "View as table" toggle
- [x] Legend toggles are buttons with `aria-pressed`
- [x] Colour is never the only signal: outcome bars carry labels

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Range change | charts morph to the new data (400ms) | instant |
| First load | KPI count-up (600ms), area draws left to right (700ms) | final state |

## Backend dependencies

- Analytics aggregates for a range (KPIs with previous-period deltas, daily series, outcomes by week, dispute categories, top listings): gap #148.

## Deviations from PAGES.md

1. The Insights card is copy-only and says nothing about AI (AI is on the removed list).
2. A "View as table" toggle is added under each chart for accessibility.

## Audit (web-design-guidelines, applied to the brief)

- Tooltips also open on keyboard focus of a point; charts don't trap focus.
- `tabular-nums` on all values; deltas include a sign and an arrow icon, not colour alone.

## Open questions

- None.

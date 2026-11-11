# B11 Returns & disputes: design brief

Code-ready brief. Route `/buyer/cases`. Any signed-in member. X4 shell.

Goal: one place for every return or dispute, open or past. Feeling: in control.

## Layout

1. Headline "Returns & disputes".
2. `SegmentedControl` "Open" (`filter=disputed`) | "All cases" (`filter=cases`), with counts from `filter_counts`.
3. Case cards: item photo, title, seller name, reference (mono), `StatusPill` (buyer label from `STATE_META`), the dispute category (`dispute_category`, human label), and the running deadline (`deadlines.return_send_by`) as a `MiniCountdown`. Card → B3 `/order/:id` (which shows the case and its actions).

## States

| State | Design |
| --- | --- |
| Loading | 3 skeleton cards |
| None open | `EmptyState` "No open returns or disputes" / "If something is wrong with an order, report it from the order page." |
| None ever | same, with "All cases" selected: "No returns or disputes yet" |
| Error / offline | `Banner` as on B9 |

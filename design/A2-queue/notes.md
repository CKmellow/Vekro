# A2 Escalation queue: notes

Status: Specced (2026-10-24). No Stitch render. Built in M14 (#117).

## Build map

| Part | Component |
| --- | --- |
| Shell | `AdminLayout` (dark) with `queueCount` |
| Counters | `KpiTile`-style tiles on dark tokens |
| Table | `DataTable` with a dark variant (header `dark-surface-raised`, rows `dark-border`) |
| Age badge | small pill with tone by hours since `escalated_at` |
| Keyboard | a `useRovingRows` controller hook (J/K, Enter), ignoring keys while typing in inputs |

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

- [x] Populated and empty; loading, error, offline
- [x] Dark roles, plum for escalation accents, coral only for overdue
- [x] References and amounts in human form; phones shown in full only in A3 (admins may see them)
- [x] Rows are links; J/K never fire inside inputs; sort headers expose `aria-sort`

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Row focus | plum left rule slides in (120ms) | instant |
| Counters | count up once | final values |

## Backend dependencies (build in `../backend` in M14)

The queue endpoint returns ids, category, description and timestamps only. A2 needs, per case: order reference, amount, item title, buyer and seller names, the escalation trigger (receipt timeout, second "not fixed", party escalation with who, "other" category), and status filters with decided cases. Plus counters (open, older than 24h, decided today, average time to decide). One backend issue in M14, before #117.

## Deviations from PAGES.md

1. The "In review" chip is dropped: the backend has no in-review state between escalated and decided.
2. The Age badge counts from escalation, not from the order.

## Open questions

- None.

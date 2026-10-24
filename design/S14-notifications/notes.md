# S14 Notifications: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M8). Built in M9 (#104). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Filter | `SegmentedControl` |
| Rows | new `NotificationRow` view (icon tint by kind, title, detail, time, unread dot) |
| States | `SkeletonGroup`, `EmptyState`, `Banner` |

Controller `useNotificationsPage()` reads `GET /notifications`, groups by EAT day, maps `event_type` to an icon kind, and marks read through the new read endpoints (gap #145). The shell's bell dot reads the same query (unread count above 0).

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Header with "Mark all as read", All / Unread, day groups, rows with kind icon, title, detail, relative time, unread dot, chevron
- [x] Grouped list with unread, empty (both filters), loading, error, offline

Design system
- [x] Icon tints follow meaning (emerald money, lake movement, coral problems, plum support, saffron time)

Content
- [x] References `VK-7K3P9Q`; no phone numbers; the notification payload is never shown (it can hold the buyer's delivery code on buyer notifications)

Usability and accessibility
- [x] Rows are links; unread state is in the accessible name ("Unread: Payment received for VK-7K3P9Q, 12 minutes ago")
- [x] "Mark all as read" announces "All caught up" politely

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Mark all as read | dots fade (220ms), titles drop to regular weight | instant |
| New notification on refetch | slides in at the top of "Today" (220ms) | appears |

## Backend dependencies

- `GET /notifications` (shipped). Mark one and mark all as read: gap #145.
- Opening the right page needs the transaction id (in the response) and, for returns, the case route (`/seller/returns/:transactionId`).

## Deviations from PAGES.md

1. Only in-app notifications are listed; SMS copies of the same event are hidden so events aren't doubled.
2. A sixth icon kind (saffron clock) covers reminders and timeouts, which PAGES.md doesn't list.

## Audit (web-design-guidelines, applied to the brief)

- Relative times have the absolute EAT time in `title` and in a `<time dateTime>` element.
- Day headings are real headings (`h2`) for screen-reader navigation.

## Open questions

- None.

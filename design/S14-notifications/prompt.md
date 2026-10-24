# S14 Notifications: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` S14, `.stitch/DESIGN.md`, `api/openapi.json` (`GET /notifications`, `NotificationResponse`).

Route `/seller/notifications`. Seller. Devices: desktop 1440px (content max 720px, centred in the main column) and mobile 390px.

Goal: catch up on what happened and jump straight to the order that needs you. Feeling: a calm, tidy inbox.

## Layout, top to bottom

1. **Header**: `type-display-lg` "Notifications"; right: ghost button "Mark all as read" (check-check icon), disabled when nothing is unread.
2. **Filter**: `SegmentedControl` "All" / "Unread (3)".
3. **List** grouped by EAT day with small caps group headings: "Today", "Yesterday", "Earlier". Each row (min 64px, full-width link):
   - 40px circular icon on a tint by kind: coin on emerald-50 (payment: `transaction_locked`, `payout_*`), truck on lake-50 (dispatch and delivery: `transaction_dispatched`, `delivery_arrived`), alert on coral-50 (disputes and returns), shield on plum-50 (support decisions and escalations), clock on saffron-50 (reminders and timeouts), bell on sand-100 (anything else).
   - Title, bold when unread: the notification `title` with the order reference, for example "Payment received for VK-7K3P9Q".
   - One-line detail (truncate, text-muted): the notification `message`.
   - Right: relative time ("12 min ago", mono, `title` with the EAT date and time), an 8px emerald unread dot, and a chevron.
4. Only in-app notifications are listed (SMS copies of the same event are not repeated).

## Controls

| Control | Label | Style | Result |
| --- | --- | --- | --- |
| Mark all as read | "Mark all as read" | ghost | marks every unread one read; toast "All caught up"; dots fade out |
| Filter | "All" / "Unread (3)" | `SegmentedControl` | filters the list |
| Row | whole row | link | marks that notification read and opens the related order (S6) or, for return and dispute events, the return case (S11) |

## States

| State | Design |
| --- | --- |
| Loading | 6 skeleton rows with circles |
| Empty (All) | `EmptyState` (bell) "You're all caught up" / "Payments, dispatch reminders and return updates show here." |
| Empty (Unread) | "No unread notifications." with a link "Show all" |
| Error | coral `Banner` "We couldn't load your notifications." with "Try again" |
| Offline | sand `Banner` with the last update time; "Mark all as read" disabled |

## Sample data

Today: "Payment received for VK-7K3P9Q" (iPhone 13, KES 52,000 is held in escrow. Dispatch within 48 hours.), "Dispatch VK-3M8D2L within 6 hours" (reminder). Yesterday: "Return started for VK-9F2K4D" (HP Pavilion 15: the buyer reported "Not working"), "Payout sent for VK-8C1Q7T" (KES 3,170 to your M-Pesa). Earlier: "Vekro support decided VK-2H7N5R".

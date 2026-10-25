# X2 Not found and offline: notes

Status: Specced (2026-10-24), reconciling the M4 build (`NotFoundPage`, `StatusPage` in `views/pages/shared/system.tsx`). No Stitch render. Built in M14 (#69).

## Build map

| Part | Component |
| --- | --- |
| Both screens | `StatusPage` |
| Offline | new `OfflinePage`; vite-plugin-pwa `navigateFallback` serves the app shell, which shows `OfflinePage` when `navigator.onLine` is false and the route's data can't load |

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

- [x] 404 and offline; one primary each; no blame in the copy
- [x] The 404 keeps the current copy (M4) and gains the illustration; "Track an order" becomes "Get help" (an order ID is never a credential)

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Illustration | gentle 3s float | static |

## Backend dependencies

- None.

## Deviations from PAGES.md

1. "Track an order" becomes "Get help" (FRONTEND_CONTRACT A).
2. "Shows cached orders if available" is out of scope: the PWA caches the app shell, not API data (no data in browser storage by design).

## Build notes (M14 #69)

1. The offline page shows when the session check is paused or fails with no connection (`RequireRole`), or when a page's code can't load offline (`RouteError`). The query client starts from `navigator.onLine`, so a page opened offline shows it at once.
2. "Try again" retries (the session check, or a reload) and the page retries by itself when the browser comes back online.

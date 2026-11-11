# B10 Buyer Home: notes

Status: Specced (2026-11-11). Build #316.

## Build map

| Part | Component |
| --- | --- |
| Need cards | new `NeedCard` view (title, line, `MiniCountdown`, `Button`) |
| Recent | `BuyerOrderCard` (B9) |
| States | `SkeletonGroup`, `EmptyState`, `Banner` |

Controller `useBuyerHome()` (query `GET /buyer/home`, 15s refetch while a deadline runs). Kinds map to copy in `models/domain/buyerHome.ts`.

## Backend dependencies

- `GET /buyer/home` (backend #336). No mocks.

## Self-review

- [x] Every `kind` has a title, line and action; deadlines from the server clock
- [x] Store owners see their purchases only (never their sales)

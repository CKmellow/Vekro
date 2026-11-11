# X4 Account shell: notes

Status: Specced (2026-11-11). No Stitch render. Milestone 21 (#314); build #315/#316.

## Build map

| Part | Component |
| --- | --- |
| Buyer shell | new `BuyerAppLayout` (copies `SellerLayout`'s structure: `NavLink` items, `Sheet` "More", `ThemeSwitch`) |
| Mode switch | `SegmentedControl` in both shells; `useMode()` controller (`lib/mode.ts`, key `vekro.mode`, try/catch around storage) |
| Routing | `destinationFor(account, returnTo, lastMode)` in `models/domain/roleHome.ts`; `RequireStore` guard (store `active` or `closed`) replaces `RequireRole allow="seller"`; `RequireMember` for `/buyer/*` |

## Backend dependencies (all merged, backend M28)

- `/auth/me`: `account_type`, `store {status, name, payout_ready, opened_at, closed_at}`, `sms_login_enabled`; `role` kept (derived) during the switch.
- `GET /buyer/home`, `GET /transactions?as=buying&filter=…`, `GET /notifications?audience=…`.

## Self-review

- [x] Same anatomy as the seller shell; mobile bottom nav ≤ 5 items
- [x] Switch only for accounts with a store; never for admins
- [x] Dark mode through existing roles; focus rings on nav items; the switch is a labelled radio group

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Mode switch | thumb slides 160ms, page cross-fades 120ms | instant |

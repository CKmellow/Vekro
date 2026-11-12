# X4 Account shell and mode switch: design brief

Code-ready brief (no Stitch render, Cyprian's M5 decision). Sources: backend `docs/accounts-and-modes.md` (one account buys and sells; admin separate), the seller shell (`SellerLayout`), `.stitch/DESIGN.md`. Full dark mode through the existing roles (`src/styles/dark.css`); no new tokens.

Every signed-in member has a **buyer area**. An account with a store also has the **seller area**, and a switch between them. Admins keep the console only.

## Buyer shell (new `BuyerAppLayout`)

Same anatomy as the seller shell, so a person who sells already knows it:

- **Desktop (≥1024px)**: 264px emerald sidebar, 72px top bar with the page title and the theme switch.
- **Mobile**: 56px frosted header (VekroMark, page title) and a bottom navigation with 4 items plus "More" (sheet).

| Item | Route | Icon | Badge |
| --- | --- | --- | --- |
| Home | `/buyer` | House | count of `needs_you` |
| Orders | `/buyer/orders` | ShoppingBag | none |
| Returns & disputes | `/buyer/cases` | RotateCcw | open cases (`filter_counts.disputed`) |
| Notifications | `/buyer/notifications` | Bell | dot when unread (`audience=buying`) |
| Profile & security | `/buyer/profile` | UserRound | none |
| Help | `/help` | LifeBuoy | none |
| Start selling / Switch to selling | `/buyer/start-selling` or `/seller` | Store | none |

Bottom nav on mobile: Home, Orders, Returns, Notifications, More (Profile & security, Help, the selling item, theme, Sign out).

The order pages (`/order/:id/...`) keep their focused single-column `BuyerLayout` (they are reached from SMS links by people who may not be signed in); a signed-in member gets a "Back to my orders" link in its header.

## Mode switch

- Shown only when `store.status` is `active` or `closed`.
- Desktop: a two-option `SegmentedControl` "Buying | Selling" at the top of the sidebar, under the mark. Mobile: the first row of the "More" sheet, same control.
- Switching writes `vekro.mode` (`buying` or `selling`, localStorage, a UI preference only: the server never reads it) and navigates to `/buyer` or `/seller`.
- Seller shell gets the same control ("Switch to buying" on mobile in More). The seller's own purchases live under Buying → Orders.

## After log in (`destinationFor`)

| Account | No `returnTo` |
| --- | --- |
| Admin | `/admin` |
| Member with a store (active or closed) | last mode from `vekro.mode`; none saved: Selling (`/seller`) |
| Member without a store | `/buyer` |

`returnTo` wins when the account may use that area (`/seller/*` needs a store; `/buyer/*`, `/order/*`, `/pay/*` any member; `/admin/*` admins).

## States

| State | Design |
| --- | --- |
| Loading session | existing `LoadingPage` |
| Admin opens `/buyer` | `NoPermissionPage` ("The admin console has no buyer area.") |
| Store closed | Selling still opens, read-only history; a sand `Banner` "Your store is closed. Reopen it in Settings." on every seller page |

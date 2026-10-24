# B9 My orders: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` B9, `docs/FRONTEND_CONTRACT.md` A (order ID plus phone is never a credential), `api/openapi.json` (`GET /transactions` for buyers), `.stitch/DESIGN.md`.

Route `/buyer/orders`. Buyer, signed in. Device: mobile 390px.

Goal: find any order fast. Feeling: organised.

## Layout, top to bottom

1. **Header**: buyer header with an avatar menu ("Sign out").
2. **Headline** `type-headline` "My orders".
3. **Search**: field "Search by order ID or item" (search icon, 300ms debounce).
4. **Filter**: `SegmentedControl` "All", "Active", "Completed", "Issues" with counts.
5. **Order cards** (stacked, 20px radius, `shadow-1`): 64px photo, title, seller name, `KES 52,000`, `StatusPill` (buyer label), placed date ("21 Oct"), small progress dots (the B3 steps), and a 28px saffron `MiniCountdown` when a deadline runs (dispatch, inspect, hold, return). The card is a link to B3.
6. **Floating button** "Track an order" (emerald pill, bottom right above the safe area): opens a `Sheet` "Track an order" with a field "Order link or reference" and primary "Open". A reference only opens an order the signed-in buyer owns.

## Segments (buyer view, from the server's segments)

| Segment | Server segments |
| --- | --- |
| All | none |
| Active | `needs_action`, `in_transit`, `held` |
| Completed | `completed` |
| Issues | `issues` |

## Controls

| Control | Label | Result |
| --- | --- | --- |
| Search | "Search by order ID or item" | filters (reference or title) |
| Segment | name and count | filters |
| Card | whole card | B3 `/order/:id` |
| Track an order | "Track an order" | sheet; "Open" goes to the order if it's yours, else "We can't find that order in your account." |
| Sign out | "Sign out" in the avatar menu | ends the session, to `/` |

## States

| State | Design |
| --- | --- |
| Loading | three skeleton cards |
| Empty | `EmptyState` (parcel) "No orders yet" / "When you buy with a Vekro link, it shows up here." action "Track an order" |
| No results | "No orders match "VK-1234"" with "Clear search" |
| Error | coral `Banner` "We couldn't load your orders." with "Try again" |
| Offline | sand `Banner` with the last update time; cards dimmed |
| Signed out | redirect to B8 with `returnTo=/buyer/orders` |

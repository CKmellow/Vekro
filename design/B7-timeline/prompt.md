# B7 Transaction timeline: design brief

Code-ready brief, reconciling the screen built in M7 (#97) from PAGES.md B7. No Stitch render (Cyprian's M5 decision). Sources: `docs/PAGES.md` B7, `api/openapi.json` (`GET /transactions/{id}/timeline`), `.stitch/DESIGN.md`.

Route `/order/:orderId/timeline` (also the Timeline tab of B3, and of S6 for sellers). Buyer. Device: mobile 390px.

Goal: a complete, trustworthy record. Feeling: "nothing is hidden".

## Layout, top to bottom

1. **Header**: back arrow (`aria-label="Back to your order"`), `type-headline` "Order timeline".
2. **Summary row**: reference (mono), amount, state pill (buyer label).
3. **Timeline card** (`Timeline`): newest first. Each event: a typed node and chip by actor ("You" emerald, "Seller" lake, "Vekro" sand, "Vekro support" plum; on the seller's side, "Buyer" saffron and "You" for the seller), a mono EAT time ("Today 14:36"), a bold line (the server's title, worded for the viewer), an optional muted detail.
4. **Upcoming steps** at the top, dashed and greyed, with their deadline when one runs ("By Today 15:36"): for example "Decide: give your code to release payment, or reject. If you do neither, the item goes back".
5. **Footer**: "Copy link" and "Get help".

## Controls

| Control | Label | Result |
| --- | --- | --- |
| Back | arrow | B3 |
| Copy link | "Copy link" | copies the page URL, toast "Link copied" |
| Get help | "Get help" | X3 |

## States

| State | Design |
| --- | --- |
| Populated | typed nodes, newest pulses once |
| Upcoming | dashed nodes with deadlines from the server |
| Empty | `EmptyState` "Nothing has happened yet" |
| Loading | skeleton rail (three rows) |
| Not found | "We can't find this order" |
| Error | coral `Banner` with "Try again" |

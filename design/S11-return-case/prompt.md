# S11 Return case: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` S11 and its Deviations, `docs/COPILOT_PROMPT.md` 4.3 (REPAIR_SHIPPED and REPLACEMENT_SHIPPED are actions, not states), `.stitch/DESIGN.md`, the backend dispute rules in `api/openapi.json`.

Route `/seller/returns/:id` (`:id` is the transaction UUID). Seller. Devices: desktop 1440px (7 / 5 columns, sticky action panel) and mobile 390px (single column, action in the dock).

Goal: resolve fairly and quickly, following the policy you promised. Feeling: fair process, no drama.

## Layout, top to bottom

1. **Header**: back link "Returns", `type-headline` "Return for VK-2H7N5R" (mono reference), `StatusPill` (seller label).
2. **Left (7)**:
   1. **Case summary** card: item photo and title, amount; "Buyer's problem" with the category chip ("Damaged on arrival"); the buyer's description as a quote block (sand-100, 4px coral-200 left rule, italic DM Sans): "The screen flickers and goes black after a few minutes."; dates row: "Reported 21 Oct, 14:02", "Sent back 22 Oct, 09:15", "Received 23 Oct, 16:40" (EAT, mono times).
   2. **Your policy** card: the seller's declared actions from the listing, as small chips ("Refund", "Repair then release", "Replacement"), with the line "You promised these options when you listed the item."
   3. **Timeline** card (`Timeline`): the order's history from the timeline endpoint.
   4. A one-line note, text-muted with a shield icon: "Vekro cases never need photos. Describe what you see in words."
3. **Right (5)**, sticky: **Action panel** by state (table below).
4. **Mobile**: summary, action panel, policy, timeline; the panel's primary button sits in the `ActionDock`.

## Action panel by state

| Backend status | Panel | Controls |
| --- | --- | --- |
| `disputed_functional` | lake: "Waiting for the buyer to send it back" / "They have about 3 days to send it. After that, the case moves on as if it was sent, and your receipt timer starts." with a ring on `return_send_by` | none |
| `return_in_transit` | lake: "Waiting for the item to arrive" / "Check the item when it reaches you, then confirm here. If you don't confirm within about 3 days, the case goes to Vekro support." ring on `return_confirm_by` | primary "I received the item" (confirm dialog) |
| `return_received` | "Choose your resolution": radio cards limited to the declared policy: **Refund buyer** (coin icon; coral note "Sends KES 52,000 back to the buyer now. This can't be undone."), **Repair and send back** (wrench; "Fix it and return it. The buyer confirms it works before you're paid."), **Send a replacement** (package; "Send a working unit. The buyer confirms before you're paid."). Repair and replacement reveal an optional "Note for the buyer" textarea (500 characters, placeholder "Courier, tracking number or what you fixed") | primary "Confirm action" (disabled until a card is picked); refund opens the coral refund confirm |
| `awaiting_buyer_reconfirmation` | saffron: "Waiting for the buyer to confirm it's fixed" / shows the chosen action ("You sent a repair") and the note | none |
| `escalated_admin_review` | plum `Banner`: "Vekro support is reviewing this case" / "They'll decide using what you and the buyer told us. The money stays in escrow until then." Read-only | none |
| `refunded_buyer`, `resolved_refund` | closed summary: "Refund issued" / "KES 52,000 went back to the buyer." | closure chips (below) |
| `resolved_release` | closed summary: "Settled: you were paid" | closure chips |
| `resolved_split` | plum closed summary: "Settled by Vekro support" | closure chips |

**Disagree** (any open case, that is `disputed_functional`, `return_in_transit`, `return_received` or `awaiting_buyer_reconfirmation`): outline button under the panel "I disagree with this account" opens a `Sheet`: title "Tell Vekro support what happened", required textarea "What's wrong with the buyer's account?" (20 to 1,000 characters), helper "Support reads both sides. The money stays in escrow until they decide.", primary "Send to Vekro support", ghost "Cancel". On success the case moves to `escalated_admin_review` and the panel turns plum.

**Closure chips** (resolved cases only, where the backend accepts mutual confirmation): two chips "You: confirmed" / "You: not yet" and "Buyer: confirmed" / "Buyer: waiting" (check-circle emerald or clock sand), with secondary "Mark as resolved" while "You" is not yet confirmed. When both confirm: "Case closed" with a check.

## Dialogs

- **Received confirm**: "Did the item arrive?" / "Only confirm once you have it. You'll then choose how to resolve the case." confirm "Yes, I have it", cancel "Not yet".
- **Refund confirm** (coral, `ConfirmDialog destructive`): "Refund KES 52,000 to the buyer?" / "The money leaves escrow and goes back to the buyer's M-Pesa. You can't undo this." confirm "Refund buyer", cancel "Go back".

## Controls

| Control | Label | Style | Enabled when | Result |
| --- | --- | --- | --- | --- |
| I received the item | "I received the item" | primary | `return_in_transit`, online | confirm, `POST /seller-received` |
| Resolution card | "Refund buyer" / "Repair and send back" / "Send a replacement" | radio cards (`Choice`) | `return_received`, action in policy | selects |
| Note for the buyer | "Note for the buyer (optional)" | textarea | repair or replacement picked | sent as `notes` |
| Confirm action | "Confirm action" | primary | a card picked | refund: coral confirm; others: `POST /seller-resolution-action` |
| I disagree | "I disagree with this account" | outline | open case | sheet, then the escalate endpoint |
| Mark as resolved | "Mark as resolved" | secondary | resolved case, seller not yet confirmed | `POST /confirm-resolved-seller` |

## States

| State | Design |
| --- | --- |
| Loading | summary and panel skeletons |
| Not a case | the order has no dispute: redirect to S6 for that order |
| Not yours | the S6 "This order isn't in your shop" page |
| Error | coral `Banner` "We couldn't load this case." with "Try again" |
| Offline | sand `Banner`; all action buttons disabled with "You're offline" |
| Conflict (409) | refetch and toast "This case changed. Here's the latest." |

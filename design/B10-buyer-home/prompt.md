# B10 Buyer Home: design brief

Code-ready brief. Route `/buyer`. Any signed-in member. Mobile first, desktop in the X4 shell (two columns from 1024px: "Needs you" left, "Recent orders" right).

Goal: show what needs the buyer now. Feeling: calm, nothing missed.

## Layout

1. **Greeting** `type-headline` "Hi, {first name}".
2. **Needs you** (from `GET /buyer/home` `needs_you`, soonest deadline first). One card per item, 20px radius, saffron left rule when it has a deadline:

| `kind` | Title | Line | Action |
| --- | --- | --- | --- |
| `pay` | "Finish paying" | item, KES amount | "Pay now" → `/order/:id/payment` |
| `at_door` | "Your item is at the door" | `MiniCountdown` to `due_at` ("Inspect within") | "Inspect" → `/order/:id/inspect` |
| `hold_check` | "24-hour check" | `MiniCountdown` ("Report a problem before") | "Open" → `/order/:id` |
| `send_return` | "Send the item back" | `MiniCountdown` | "Return steps" → `/order/:id/return` |
| `confirm_return` | "Confirm the return" | item | "Answer" → `/order/:id` |

3. **Recent orders**: the 5 newest as `BuyerOrderCard`s (from B9), and "See all orders" → `/buyer/orders`.
4. **Start selling** card (only without a store): "Sell on Vekro too" / "Open a store on this same account." → `/buyer/start-selling`.

Countdowns use `server_time` from the response, never the device clock. Poll every 15s while any item has a deadline.

## States

| State | Design |
| --- | --- |
| Loading | 2 skeleton need cards, 3 skeleton order cards |
| Nothing needs you | emerald check `EmptyState` "You're all caught up" / "We'll tell you here and by SMS when an order needs you." |
| No orders at all | `EmptyState` (parcel) "No orders yet" / "When you buy with a Vekro link, it shows up here." |
| Error | coral `Banner` "We couldn't load your home." with "Try again" |
| Offline | sand `Banner` with the last update time |

# B3 Order tracker: design brief

Code-ready brief (no Stitch render, Cyprian 2026-10-17). Sources: `docs/PAGES.md` B3 and its Deviations, `docs/FRONTEND_CONTRACT.md` A and F, `docs/COPILOT_PROMPT.md` 4.3 (state mapping, open question 1), `.stitch/DESIGN.md`.

Route `/order/:orderId`. Buyer. Device: mobile 390px.

Goal: one place that answers "where is my order, where is my money, and what do I do now?". Feeling: "I'm in control".

## Foundation

- Shell: `BuyerLayout`; the header gains an overflow menu (`ActionsMenu`): "Timeline", "Get help", "Copy link".
- Labels, pill colour, icon and lock-ring state come from `STATE_META` (backend `TransactionStatus` is the authority). Never show raw state names. `dispatched` is legacy: show it as "On the way" with no actions.
- The reference is `TransactionResponse.reference` (`VK-7K3P9Q`), never the UUID (contract F).

## Layout, top to bottom

1. **Vault card** (hero, `VaultCard`): amount label "Your money", "KES 52,000", reference "VK-7K3P9Q" with copy, state pill, lock ring in the matching state. Inside the card, under the amount: a thin `MoneyPath` (Buyer "You", Vault "Vekro vault", Seller "Amina Gadgets") with the dot on the current node.
2. **Next-step card** (the most important element): emerald-50 for normal steps, saffron-50 when a deadline is running, coral-50 for problems, plum-50 for support. Icon, one `type-title` headline, one sentence, and a `CountdownRing` on the right when a deadline exists (deadline from server timestamps).
3. **Item mini-card**: 56px thumbnail, "iPhone 13, 128GB, Midnight", "KES 52,000", "Amina Gadgets"; two 48px round icon buttons on the right, "Call seller" (phone) and "WhatsApp seller" (message-circle).
4. **Stepper** (`Stepper`): "Paid", "On the way", "At your door", "Inspected", "Complete"; serialized items insert "Held 24h" before "Complete". The current node pulses.
5. **Tabs** (`Tabs`): "Overview" (default, items 1 to 4) and "Timeline" (B7 content inline, `Timeline` component).
6. **Footer links** (ghost, centred): "Get help" · "How Vekro works".
7. **Action dock**: the single state-driven action (table below). Hidden when there is none.

## State panels

| Backend status | Pill (buyer label) | Next-step card | Countdown | Dock |
| --- | --- | --- | --- | --- |
| `initiated`, `awaiting_payment` | "Waiting for payment" (saffron, clock) | "Finish paying to lock your order" / "Your order is saved. Pay to put the money in the vault." | none | primary "Pay now" (to B2) |
| `locked` | "Paid, funds held safely" (emerald, lock) | "Waiting for the seller to dispatch" / "If it isn't sent within 48 hours, you get an automatic refund." | time left to dispatch (48h) | none; ghost "Contact seller" |
| `out_for_delivery` | "On the way" (lake, truck) | "Waiting for the courier" / "When the courier reaches you, the seller marks the item as arrived and you'll get a text to inspect it." | none | ghost "Contact seller" |
| `at_door_pending_inspection` | "At your door, inspect now" (saffron, eye) | "Your item has arrived" / "You have about 1 hour to check it before you decide." | time left to inspect (1h) | primary "Inspect and confirm" (to B4) |
| `hold_24h` | "Held 24 hours for checks" (saffron, hourglass) | "Funds held for 24 hours" / "Test your item. Report a problem before the timer ends, or the seller is paid." | time left to report (24h) | danger outline "Report a problem" (to B5) |
| `disputed_functional` (dispute example) | "Issue reported" (coral, alert) | "The seller is reviewing your report" / "They'll choose refund, repair or replacement, as their policy says." | seller response window when known | primary "Continue" (to B6) |
| `escalated_admin_review` | "With Vekro support" (plum, shield) | plum `Banner` "Vekro support is reviewing this" / "We'll message you by SMS. Your money stays in the vault until it's decided." | none | none |
| `released`, `resolved_release` | "Complete, seller paid" (emerald, check) | "All done" / "You accepted the item and the seller has been paid." | none | none |
| `refunded_buyer`, `resolved_refund` | "Refunded" / "Refund issued" (emerald, coin) | "Your refund is on its way" / "KES 52,000 is going back to +254 712 *** 678 by M-Pesa." | none | none |

The other dispute and return statuses follow the same pattern with their `STATE_META` labels and send the buyer to B6 with "Continue".

## Controls

| Control | Label | Style | Enabled when | Result |
| --- | --- | --- | --- | --- |
| Copy reference | copy icon, `aria-label="Copy order reference"` | icon button | always | Copies "VK-7K3P9Q", toast "Reference copied" |
| Call seller | phone icon, `aria-label="Call Amina Gadgets"` | 48px round icon button | seller contact known | `tel:` link |
| WhatsApp seller | message icon, `aria-label="WhatsApp Amina Gadgets"` | 48px round icon button | seller contact known | `https://wa.me/…` with a prefilled "About order VK-7K3P9Q" |
| Tabs | "Overview" / "Timeline" | `Tabs` | always | Switches panel; keeps scroll |
| Overflow | "Timeline", "Get help", "Copy link" | `ActionsMenu` | always | Timeline tab / X3 / copies the tracker URL |
| Dock action | per state table | primary, or danger outline for "Report a problem" | per state | per state |
| Contact seller | "Contact seller" | ghost in the dock | `locked`, `out_for_delivery` | Opens a small sheet with Call and WhatsApp |

## States

| State | Design |
| --- | --- |
| Loading | skeleton of the vault card (emerald-900 block with sand shimmer lines), next-step card, item card |
| Not found / not yours | `EmptyState` "We can't find this order" / "Check the link in your SMS, or log in with the phone you paid with." action "Log in" |
| Error | coral `Banner` "We couldn't load your order." with "Try again" |
| Offline | last known state dimmed to 70%, sand `Banner` "You're offline. Showing the last update at 14:36." (EAT, mono time) |
| Phone gate (flagged off until #10 and #11) | `Sheet` over blurred content: "Confirm it's you" / "Enter the phone number you paid with." `PhoneField`, primary "Show my order". Never shows order details before verification |

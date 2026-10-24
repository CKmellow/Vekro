# B6 Return flow: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` B6, `docs/COPILOT_PROMPT.md` 4.3 (repair and replacement are actions, not states), `api/openapi.json` (buyer-sent-back, buyer-reconfirmation, confirm-resolved-buyer), `.stitch/DESIGN.md`.

Route `/order/:orderId/return`. Buyer. Device: mobile 390px.

Goal: one screen that adapts to the dispute step, always showing the single next action and who we're waiting on. Feeling: "I can see exactly where this stands".

## Layout, top to bottom

1. **Header**: back arrow, title "Your return".
2. **Vault card** (`VaultCard`): "Held in the vault" `KES 52,000`, pill from `STATE_META` (buyer label), ring in the state colour (coral, lake, saffron, plum).
3. **Stepper** (`Stepper`): "Reported", "Sent back", "Seller has it", "Resolved"; current node pulses.
4. **State panel** (the most important element): tone, icon, headline, one sentence, optional `CountdownRing`. Table below.
5. **Case summary** card: category chip ("Doesn't work properly"), the buyer's description as a quote block (sand-100, coral-200 rule), "Reported 21 Oct, 14:02" (EAT).
6. **Seller's policy** card: "Amina Gadgets will: Repair then release" (declared resolution), line "They must follow this policy."
7. **Returning the item** card (in `disputed_functional` only): "Send it back the way it came, or arrange a drop-off with the seller. Keep your courier receipt." (no address in the contract yet).
8. **Closure chips** (resolved states only): "You: confirmed" / "You: not yet" and "Seller: confirmed" / "Seller: waiting".
9. **Action dock** per state.

## State panels

| Backend status | Panel | Countdown | Primary | Secondary |
| --- | --- | --- | --- | --- |
| `disputed_functional` | coral: "Send the item back" / "You have about 3 days. Tap the button once it's on its way." | `return_send_by` | "I've sent it back" (confirm dialog) | none |
| `return_in_transit` | lake: "On its way back" / "Waiting for the seller to confirm they got it. If they don't within about 3 days, Vekro support steps in." | `return_confirm_by` | none | none |
| `return_received` | lake: "The seller has your item" / "They'll refund, repair or replace it, as their policy says." | none | none | none |
| `awaiting_buyer_reconfirmation` | saffron: "Is it fixed?" / the seller's chosen action ("The seller sent a repair") and their note in a quote block | none | "Yes, it's fixed" | "No, still a problem" (danger outline); on the second "No" (one earlier rejection) the dialog warns "This will go to Vekro support." |
| `refunded_buyer`, `resolved_refund` | emerald success vault "Refund issued: KES 52,000" / "It's going back to +254 712 *** 678 by M-Pesa." | none | none | "Mark as resolved" (chips) |
| `resolved_release` | emerald: "Sorted" / "You confirmed it works and the seller has been paid." | none | none | "Mark as resolved" |
| `resolved_split` | plum: "Settled by Vekro support" / "Check your SMS for how the payment was divided." | none | none | "Mark as resolved" |
| `escalated_admin_review` | plum `Banner` "Vekro support is reviewing this" / "We'll message you by SMS. Your money stays in the vault until it's decided." Read-only | none | none | ghost "Get help" |

## Dialogs

- **Sent back**: "Have you sent the item back?" / "The seller is told it's on the way and has about 3 days to confirm they got it." confirm "Yes, it's on its way", cancel "Not yet".
- **Not fixed** (first time): "Still not working?" / "The seller gets one more chance to sort it out." confirm "Send it back to the seller". **Second time**: title "This will go to Vekro support" / "The seller has already tried once. Support will look at the case and decide." confirm "Send to Vekro support".
- **Fixed**: "Confirm it's fixed?" / "The seller is paid KES 52,000 and the case closes." confirm "Yes, it works".

## States

| State | Design |
| --- | --- |
| Loading | vault and panel skeletons |
| Not a return | the order isn't in a dispute state: redirect to B3 |
| Deadline passed | the panel explains what happened next (the server moved the case on) after the next poll |
| Error | coral `Banner` with "Try again" |
| Offline | sand `Banner`; actions disabled |
| Conflict (409) | refetch and toast "This case changed. Here's the latest." |

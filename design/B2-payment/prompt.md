# B2 Payment in progress: design brief

Code-ready brief (no Stitch render, Cyprian 2026-10-17). Sources: `docs/PAGES.md` B2 and its Deviations, `docs/FRONTEND_CONTRACT.md` B, `.stitch/DESIGN.md`.

Routes `/order/:orderId/payment` (STK and redirect variants) and `/pay/return` (redirect return). Buyer. Device: mobile 390px.

Goal: calm the buyer while the M-Pesa prompt is on their phone, then give a satisfying, trust-building success. Feeling: "it's working, I know what to do".

## Foundation

- Shell: `BuyerLayout` with a simplified header: Vekro mark left, a 48px close (X) icon button right labelled "Leave payment". No escrow pill, no help item.
- The vault card is the focal point. Everything else is calm sand. Same tokens and type roles as B1.
- Heading on every variant: "Complete payment" (`type-display-lg`, visually above the vault card). Never name LOOP, Pesapal or Daraja.

## Layout, top to bottom (STK_PROMPT, waiting)

1. Heading "Complete payment".
2. **Vault card** (`VaultCard`): amount label "You're paying", amount "KES 52,000", reference "VK-7K3P9Q" (mono, copy button), status pill "Waiting for payment" (saffron, clock), lock ring `open` (dashed, slowly turning). Hint line inside the card: "Your money goes into the Vekro vault, not to the seller."
3. **Instruction block**: `type-headline` "Check your phone and enter your M-Pesa PIN"; body "We sent a payment request for KES 52,000 to +254 712 *** 678."
4. **Phone illustration** (inline SVG, emerald and sand, geometric): a phone showing a prompt card with "KES 52,000" and a PIN row of four dots; floats gently.
5. **Countdown** (`CountdownRing`, saffron, 56px) beside the text "left to approve", e.g. "01:12". Deadline from the server (transaction `created_at` + the 90s polling window), never the device clock.
6. **Help card** (`Card`, collapsed by default): "Didn't get the prompt?" expands to three tips:
   - "Your phone is on and has network."
   - "You have at least KES 52,000 in M-Pesa."
   - "If you use the SIM toolkit, open M-Pesa and check for a pending request."
7. **Action dock**: secondary "Resend prompt (0:18)", disabled with a live countdown until 30s have passed; under it ghost "Change phone number".

## Variants

| Variant | Content |
| --- | --- |
| STK waiting | as above |
| STK resend ready | "Resend prompt" enabled; the ring resets when pressed |
| STK timed out | vault ring stops; saffron `Banner` "The M-Pesa request expired." / "Nothing was charged. Send a new request to try again."; dock primary "Send a new request", ghost "Change phone number" |
| REDIRECT | vault card as waiting; instruction "Continue to secure checkout" / "You'll pay KES 52,000 on a secure page, then come back here automatically."; dock primary "Continue to secure checkout" (external-link icon); no countdown, no phone illustration (card illustration instead) |
| `/pay/return` confirming | heading "Complete payment"; vault card ring turning; centred text "Confirming your payment…" with a polite live region; after 90s without `locked`: "This is taking longer than usual. We'll text you as soon as it's confirmed." with "Track my order" (secondary). The redirect itself never shows success |
| Success | only when the polled status is `locked`. Lock ring closes with the click and one glow pulse; pill "Paid, funds held safely" (emerald, lock); heading stays; `type-headline` "Payment received"; body "KES 52,000 is held safely until you confirm delivery."; `MoneyPath` with the dot on "Vekro vault" (Buyer "You", Vault "Held safely", Seller "Amina Gadgets"); note "We sent your order link by SMS."; dock primary "Track my order" |
| Failure: cancelled | coral `Banner` "You cancelled the M-Pesa request." / "Nothing was charged." |
| Failure: wrong PIN | "The PIN was incorrect." / "Nothing was charged. Try again and enter your M-Pesa PIN." |
| Failure: insufficient funds | "There wasn't enough in M-Pesa." / "Top up M-Pesa and try again." |
| Failure: provider error | "M-Pesa didn't go through." / "This is on M-Pesa's side. Try again in a minute." |
| All failures | ring returns to `open`, pill "Payment didn't go through" (coral, alert), dock primary "Try again", ghost "Change phone number" |
| Leave confirm | `ConfirmDialog` "Leave payment?" / "You can come back with your link. If you already entered your PIN, the payment still goes through." confirm "Leave", cancel "Stay" (focus starts on "Stay") |
| Offline | network banner "You're offline. We'll check your payment when you're back."; polling pauses and resumes |

## Controls

| Control | Label | Style | Enabled when | Result |
| --- | --- | --- | --- | --- |
| Resend | "Resend prompt (0:18)" then "Resend prompt" | secondary | 30s after the last request | New STK request; countdown resets |
| Send a new request | "Send a new request" | primary | timed out | New STK request |
| Try again | "Try again" | primary | a failure | New payment attempt |
| Change number | "Change phone number" | ghost | STK variants | Back to B1 with the phone field focused |
| Continue | "Continue to secure checkout" | primary, external-link icon | REDIRECT | Opens the provider's page in the same tab |
| Close | X, `aria-label="Leave payment"` | icon button, 48px | always | Leave confirm |
| Copy reference | copy icon, `aria-label="Copy order reference"` | icon button | always | Copies "VK-7K3P9Q", toast "Reference copied" |
| Track my order | "Track my order" | primary | `locked` | Navigates to B3 |

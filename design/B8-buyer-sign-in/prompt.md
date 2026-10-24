# B8 Buyer sign-in: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` B8, `docs/FRONTEND_CONTRACT.md` A (phone-verified guest session behind `AuthStrategy`; never order ID plus phone as a credential), `.stitch/DESIGN.md`.

Route `/buyer/sign-in` (with `?returnTo=`). Buyer. Device: mobile 390px. Built behind the `PhoneVerifiedGuest` strategy once gap #11 ships; until then the route shows the existing phone-and-password step.

Goal: a quick, passwordless way for a returning buyer to see all their orders. Feeling: quick and painless.

## Layout, top to bottom

1. **Header**: buyer header (Vekro mark, "Protected by Vekro Escrow" pill).
2. **Illustration**: geometric phone with a message bubble (emerald-50 tile, `EmptyState` style).
3. **Headline** `type-headline` "See all your orders"; body "No password. We'll text you a code."
4. **Step 1, phone**: `PhoneField` label "Phone number" (+254 chip), primary "Send code" (full width).
5. **Step 2, code** (replaces step 1, 220ms slide): line "Enter the 6-digit code we sent to +254 712 *** 678", six `CodeCells` (auto-advance, paste, numeric keypad), verify runs on the sixth digit; "Resend in 0:28" (mono) turning into a link "Resend code"; ghost "Use a different number".
6. **Footer**: link "Continue without an account" (to `/`), privacy line text-muted "We only use your number to find your orders."

## Controls

| Control | Label | Style | Enabled when | Result |
| --- | --- | --- | --- | --- |
| Phone | "Phone number" | `PhoneField` | always | validates Kenyan mobile numbers |
| Send code | "Send code" | primary | phone valid, online | requests the SMS code, step 2 |
| Code cells | "Digit 1 of 6"... | `CodeCells` | step 2 | verifies on the sixth digit |
| Resend code | "Resend code" | link | 30s after the last send | new code, timer restarts |
| Use a different number | "Use a different number" | ghost | step 2 | back to step 1, phone kept |
| Continue without an account | as labelled | link | always | `/` |

## States

| State | Design |
| --- | --- |
| Sending / verifying | button spinner; cells read-only while verifying |
| Wrong code | cells shake (reduced motion: no shake) and clear; coral line "That code doesn't match. Check the SMS and try again." |
| Expired code | coral line "That code has expired." with "Send a new code" |
| Too many attempts | saffron `Banner` "Too many tries. Try again in 4:59." (countdown from the server's Retry-After), cells disabled |
| Network error | sand `Banner` "You're offline. Connect and try again." |
| Success | redirect to `returnTo` or B9 |

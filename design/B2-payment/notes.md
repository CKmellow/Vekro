# B2 Payment in progress: notes

Status: Specced (2026-10-17). No Stitch render (Cyprian's M5 decision). Built in M6 (#85, #86, #87). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Money | `VaultCard` (ring `open` → `locked`), `MoneyPath` (success) |
| Timer | `CountdownRing` with `announceAt={[60, 10]}` |
| Status | `StatusPill` from `STATE_META` (never raw status names) |
| Failures and notices | `Banner` |
| Leave | `ConfirmDialog` |
| Phone illustration | new inline SVG view, tokens only |
| Dock | shared frosted action dock |

Controller `usePayment(orderId)` polls the transaction every 3s for up to 90s (pauses offline and in background tabs), maps the instruction to `PaymentInstruction` (`STK_PROMPT` / `REDIRECT`) and owns resend and retry. `/pay/return` uses the same controller with the `OrderTrackingId` query parameter.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Heading always "Complete payment"; STK waiting, resend, timed out; REDIRECT; `/pay/return` confirming; success; four failures; leave confirm; offline
- [x] Every PAGES.md control, with the contract's variants added
- [x] Success only from the polled `locked` status (contract B)

Design system
- [x] Vault surface is the focal point; saffron only for the timer and waiting pill; coral only for failures
- [x] Lucide icons: clock, lock, alert-circle, external-link, copy, x, smartphone

Content
- [x] Reference `VK-7K3P9Q`; phone masked `+254 712 *** 678`; `KES 52,000`
- [x] Failure copy says what happened, that nothing was charged, and what to do
- [x] No provider names; nothing from the removed list

Usability and accessibility
- [x] One primary per variant (Resend is secondary while waiting)
- [x] 48px targets, including the close icon
- [x] Status changes announced politely; the countdown announces only at 60s and 10s
- [x] Leave confirm starts focus on "Stay"

Life and motion
- [x] Motion below with reduced-motion fallbacks

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Lock ring, waiting | dashed ring turns once per 8s | still |
| Phone illustration | floats 4px up and down, 4s | still |
| Countdown | drains every second | numbers update, no sweep |
| Success | ring closes with a spring and one glow pulse (600ms); money-path dot glides from Buyer to Vault (600ms); success text cross-fades | final state at once |
| Failure | banner slides down 220ms | appears |
| Dock | slides up when its action changes | swaps |

## Backend dependencies (build in `../backend`, no frontend mocks)

- Single-transaction read for polling: gap #6.
- Payment instruction kind in the initiate response: gap #8 (until then: a redirect URL means `REDIRECT`).
- Failure reasons and an STK resend endpoint: gap #143. Until they ship, all failures use the provider-error copy and "Try again" starts a new payment; the resend button stays hidden rather than faked.

## Deviations from PAGES.md

1. Heading is always "Complete payment"; STK and REDIRECT variants; new `/pay/return` page (contract B).
2. Route is `/order/:orderId/payment`, keyed by the transaction created on B1.
3. The "try *334#" tip is replaced by a generic SIM-toolkit tip (no unverified USSD codes).

## Audit (web-design-guidelines, applied to the brief)

- Icon buttons have `aria-label`s; the external redirect is a real link-styled button with an external-link icon.
- Polling never steals focus; the success heading receives focus once so screen readers land on it.
- Timers use `tabular-nums` so digits don't jitter.

## Open questions

- None.

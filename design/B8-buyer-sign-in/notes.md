# B8 Buyer sign-in: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M10). Built in M15 (#121), once gap #11 (phone-verified guest session) ships in the backend.

## Build map

| Part | Component |
| --- | --- |
| Phone step | `PhoneField`, `Button` |
| Code step | `CodeCells` (from B4), resend timer from `useNow` with the server's cooldown |
| States | `Banner`, inline errors |
| Strategy | `AuthStrategy` implementation `PhoneVerifiedGuest` beside `PasswordAccount` (`models/api/auth.ts`) |

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Phone step, code step with resend timer, wrong code, expired code, locked out, network error

Design system
- [x] One primary per step; coral only for errors

Content
- [x] Phone masked on the code step; no claims about speed or security beyond what happens

Usability and accessibility
- [x] Cells: `inputmode="numeric"`, `autocomplete="one-time-code"`, paste fills all six
- [x] Errors announced (`role="alert"`); focus returns to the first cell after a wrong code

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Step change | slide (220ms) | instant |
| Wrong code | cells shake (300ms) | no shake, message only |

## Backend dependencies

- Gap #11: request an SMS code for a phone, verify it and open a buyer session (rate limited, Retry-After). Not in the contract; M15.

## Deviations from PAGES.md

1. Until #11 ships, `/buyer/sign-in` uses the existing phone-and-password step (`PasswordAccount`, as in B1), per FRONTEND_CONTRACT A.

## Open questions

- None.

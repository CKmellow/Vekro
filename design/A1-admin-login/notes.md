# A1 Admin log in: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M13). Built in M14 (#116).

## Build map

| Part | Component |
| --- | --- |
| Card and fields | `PhoneField`, `PasswordField`, `Button` (a plum variant via className on the console only) |
| Background | `dark-*` tokens with two radial gradients in CSS |
| Logic | reuse `useLogIn` (S2) with an admin role check and an admin `returnTo` guard |

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

- [x] Default, wrong credentials, non-admin, session expired, locked out, loading
- [x] Dark roles only; plum as the console accent; one primary
- [x] Generic credential errors; "All actions are logged." footer
- [x] Labels above fields; autocomplete `username` and `current-password`; errors announced

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Card | fades up 8px on load (220ms) | static |
| Error | the line slides in (120ms) | instant |

## Backend dependencies

- `POST /auth/login` and `GET /auth/me` (shipped). There is no admin bootstrap or seed command yet (see the execution plan); M17 #136 seeds an admin for demos.

## Deviations from PAGES.md

1. "Identifier" is the phone number, because the backend logs everyone in by phone.
2. A non-admin who logs in here is signed out again, so a seller session never lingers in the console.

## Open questions

- None.

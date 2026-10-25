# S2 Log in: notes

Status: Approved by Cyprian (2026-10-15). Route `/login`. Devices: desktop 1440px, mobile 390px.

## Stitch screens

Project `4950346905124660155` ("Vekro"), design system `assets/3f76e23767ff46c69a4931548f3cd1b2`.

| Export | Variant | Stitch screen ID | Edit passes |
| --- | --- | --- | --- |
| `desktop.png`, `desktop.html` | Form with the saffron "Your session expired. Log in again." banner | `ddfe1052595a470088d338581b17bf67` | 1 (copy and brand fixes) |
| `mobile.png`, `mobile.html` | Form with the plum "This area is for sellers" banner | `23e6bdc17f814e378ccd12885fc24f54` | 0 (regenerated after two edit passes on `0658b0fa…` kept re-adding a "Forgot?" link and a footer) |
| `states.png`, `states.html` | Wrong details; too many attempts with a countdown | `ac53f146b7fc458a90f1d58d18ef91a5` | 1 (copy and brand fixes) |

History: `c4e5d57c…` (desktop), `0658b0fa…`, `53fc0cda…`, `d2297ed7…` (mobile attempts), `41319da3…` (states).

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Same split as S1 with a shorter form: Phone (+254), Password with show/hide, "Log in", "New here? Create an account"
- [x] "Forgot password?" omitted (backend-gap #149, P2-4)
- [x] Banners: "Your session expired. Log in again." (saffron); "This area is for sellers. Log in with a seller account." (plum)
- [x] States: wrong credentials (generic "Phone or password doesn't match. Check them and try again."); locked after repeated attempts with a countdown ring; loading is the M2 Button state; success returns to the original URL (no screen)
- [x] Devices: 1440px and 390px

Design system
- [x] DESIGN.md colours by role, the three fonts, radius scale, one outline icon set

Content
- [x] Sample data: +254 722 118 904, VK-7K3P9Q, KES 52,000, "Paid, ready to dispatch"
- [x] The wrong-details message is generic and never says which field is wrong
- [x] Invented regulator, encryption and "dual-key release" claims (multi-sig is on the removed list) were removed in pass 1

Usability and accessibility
- [x] One primary per screen ("Log in"); disabled while locked
- [x] Errors and the lockout use icon, text and a countdown, not colour alone
- [x] Contrast: saffron text uses saffron-700 on saffron-50 (5.45:1); plum-700 on plum-50 (7.22:1)

## Motion notes (build phase)

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Banners | slide down 8px and fade in (220ms) | appear at once |
| Wrong details | password field shakes once (coral), then the banner appears | no shake; banner only |
| Lockout | countdown ring drains each second from the server's `Retry-After`; fields unlock at zero | ring updates without animation |
| Form fields | stagger in, 60ms apart | appear at once |

## Audit (web-design-guidelines, exported HTML)

- `desktop.html`, `mobile.html`, `states.html`: inputs without a label association, `outline: none` without focus-visible, `transition: all`. Design-level checks pass. Build rules covered by the M2 components; the lockout countdown uses `CountdownRing` with the M4 `ApiError.retryAfterSeconds` (#71).

## Deviations

1. **No "Forgot password?"** until backend-gap #149 ships.
2. **Lockout length** comes from the backend's `Retry-After` header (429), not a fixed five minutes; the design shows 04:59 as an example.

## Open questions

- None.

## Build notes (M15, #149)

1. "Forgot password?" sits under the password field and opens `/forgot-password` (same split layout): phone, then the SMS code with a new password. The confirmation never says whether the number has an account. After the reset every device is signed out and S2 shows "Password updated. Log in with your new password."

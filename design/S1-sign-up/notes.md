# S1 Sign up: notes

Status: In review. Route `/register`. Devices: desktop 1440px, mobile 390px.

## Stitch screens

Project `4950346905124660155` ("Vekro"), design system `assets/3f76e23767ff46c69a4931548f3cd1b2`.

| Export | Variant | Stitch screen ID | Edit passes |
| --- | --- | --- | --- |
| `desktop.png`, `desktop.html` | Form with strength meter (Strong) | `2830a77a40bb4ac1a749061ce27879f1` | 2 (copy and brand fixes; stray dot by the phone field) |
| `mobile.png`, `mobile.html` | Form with strength meter (Fair) | `80b6474e08e74e349515054e95e3c19c` | 1 (copy and brand fixes) |
| `states.png`, `states.html` | Phone already registered, weak password, mismatch, server error | `3a116cfb6af1492fa56615a3150a5104` | 1 (copy and brand fixes) |

Earlier generations stay in the project as history: `238ddb7d…` (desktop), `baaa82c6…` (mobile), `4768394a…` (desktop after pass 1), `57e55185…` (states).

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Layout order from PAGES.md: emerald panel (logo, headline, three benefit rows, mini vault card), sand form panel; mobile header strip with the form card overlapping it
- [x] Controls with exact labels: Full name, Phone (+254), Shop name (optional), Password with eye toggle, strength meter and rules checklist, Confirm password, terms checkbox, "Create account", "Already selling with Vekro? Log in"
- [x] States: strength meter (Strong desktop, Fair mobile); phone already registered with "Log in instead"; weak password; mismatch; server error banner with "Try again". Submitting is the M2 Button loading state; success navigates to S3 (no screen)
- [x] Contract: nothing buyer-facing; no deviation applies
- [x] Devices: 1440px and 390px

Design system
- [x] DESIGN.md colours by role; no cold greys, pure black or purple gradients
- [x] Bricolage Grotesque, DM Sans, JetBrains Mono (phone digits, reference)
- [x] Radius 14/20/28 and the vault shadow as specified
- [x] One outline icon set (Material Symbols Outlined in the export; the build uses lucide-react equivalents)

Content
- [x] Sample data: Amina Wanjiru, Amina Gadgets, +254 722 118 904, VK-7K3P9Q, KES 52,000
- [x] Human state label on the vault card ("Paid, funds held safely")
- [x] Nothing from the removed list; Stitch's invented regulator claims ("CBK regulated", "Regulated P2P Escrow Services") were removed in pass 1
- [x] No payout amounts on this screen, so gross/fee/net does not apply

Usability and accessibility
- [x] One primary button ("Create account"); disabled while invalid (states export)
- [x] Errors use a coral icon plus text, never colour alone
- [x] Contrast from the D0 audit token pairs (white on emerald-700 6.27:1, coral-600 on white 5.25:1)
- [x] Next action obvious: the form is the only thing to do

Life and motion: see below. Audit: see below.

## Motion notes (build phase)

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Form fields | stagger in, 60ms apart, 220ms fade and 8px rise | appear at once |
| Strength meter | segments fill left to right over 220ms as the password changes; colour moves coral, saffron, emerald | colour changes without the fill |
| Mini vault card (desktop) | cycles Locked and Released every 4s: the lock ring closes and opens, the label and pill swap with a 220ms cross-fade | static Locked card |
| Create account | M2 Button: press scale 0.98, spinner while submitting | no scale; spinner stays |

## Audit (web-design-guidelines, exported HTML)

Automated checks against `.agents/skills/web-design-guidelines/guidelines.md`:
- `desktop.html`: 6 inputs without a label association, `outline: none` without a focus-visible replacement, `transition: all`, animation without reduced motion.
- `mobile.html`: the same label, focus and transition findings.
- `states.html`: label and focus findings; 2 icon-only buttons (eye toggles) without `aria-label`.
- Design-level checks (contrast, hierarchy, touch targets) pass. The findings are in Stitch's static HTML and are build rules already covered by the M2 components: `TextField` and `PhoneField` wire `<label for>` and `aria-describedby`, focus uses `:focus-visible`, transitions list their properties, the global reduced-motion rule applies, and the password eye toggle gets `aria-label="Show password"` / `"Hide password"`.

## Deviations

1. **Shop name.** `RegisterUserRequest` has no shop name field. The field stays in the design (PAGES.md); the build keeps it for the profile once backend-gap #144 (P1-7) ships, and until then sends only name, phone, password and role.
2. **Labels above fields**, as in the approved D0 sheet (DESIGN.md mentions floating labels).
3. **Stitch copy discipline.** Every Stitch generation added regulator or security badges that Vekro cannot claim; the M3 prompts now forbid them, and the edit passes removed them here.

## Open questions

- None.

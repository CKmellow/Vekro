# S13 Settings: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M8). Built in M15 (#123, #124). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Tabs | `Tabs` (vertical variant from 1024px), `SegmentedControl` on phones |
| Profile | `Field`, `ImageUploader` |
| Payout | `PhoneField`, `CodeCells`, the S3 payout card |
| Notifications | a table of switches (new `Switch` view on a native checkbox with `role="switch"`) |
| Security | `PasswordField` with the S1 strength meter; device list rows |
| Save bar and guard | `ActionDock`-style frosted bar, `ConfirmDialog`, React Router `useBlocker` |

Controllers: `useSettingsProfile`, `useSettingsPayout`, `useSettingsNotifications`, `useSettingsSecurity` (one per tab, React Hook Form with Zod).

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Profile, Payout, Notifications and Security tabs with every PAGES.md control
- [x] Unsaved-changes bar and guard; loading, saving, success, error, offline

Design system
- [x] One primary per view (the save bar's "Save changes", or the step's primary in Payout); coral only for "Log out"

Content
- [x] Phone always masked outside the admin console, including the current payout number
- [x] Payout warning explains already-paid orders keep their number

Usability and accessibility
- [x] The toggle matrix is a table with row and column headers; each switch's name combines both
- [x] Tabs follow the WAI-ARIA tabs pattern (arrow keys)
- [x] Password fields have show/hide and autocomplete hints (`current-password`, `new-password`)

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Save bar | slides up (spring) when dirty, down when saved | appears and disappears |
| Switch | thumb slides (120ms) | instant |
| Payout change | card cross-fades to the form (220ms) | instant |

## Backend dependencies

- Profile and payout update with SMS confirmation: gap #144.
- Password change, session list, sign out one or other devices: gap #149.
- Notification preferences: gap #150.
- Log out (shipped).

## Deviations from PAGES.md

1. Payout change confirms by SMS code, which PAGES.md marks "if supported"; gap #144 covers it.
2. "Support messages" in-app is always on, so sellers can't miss a support decision about their money.
3. The save bar covers Profile and Notifications only; Payout and Security have their own confirm steps.

## Audit (web-design-guidelines, applied to the brief)

- `beforeunload` warning only while dirty.
- Field errors linked with `aria-describedby`; focus moves to the first error on submit.

## Open questions

- None.

## Build notes (M15 #123)

1. Payout copy changed to what the backend does: "Payouts that haven't been sent yet will go to the new number. Vekro texts your old number when it changes." (payouts read the current number when they're sent).
2. Before the first order a new payout number saves without a code ("Save number"), since no money can move yet; afterwards it needs the code texted to the new number.
3. Tabs: Profile and Payout ship in #123; Notifications and Security join in #124.

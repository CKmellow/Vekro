# Accessibility audit (M16 #127)

## Automated

`e2e/a11y.spec.ts` runs axe-core (WCAG 2.x A and AA rules, including colour contrast against the real CSS) on every page: public pages, buyer and seller pages with a real paid order, and the support console at desktop width. It runs in CI against the real backend and fails on any violation.

Found and fixed:

| Finding | Where | Fix |
| --- | --- | --- |
| Text in ink-400 at 3.0:1 | Stepper upcoming steps (B3, S3, S7), timeline upcoming entries (B7) | ink-500 (5.4:1) |
| Content outside landmarks | S1, S2 and reset (the brand panel) | labelled `section` ("About Vekro") |
| Duplicate landmarks | seller sidebar vs dashboard aside; console header search vs A4 search | unique labels |
| Console text over a light background on narrow screens | A2, A4 (wide tables overflowing the dark root) | the dark background spans the overflow |

## Keyboard (checked in the component and e2e tests)

- Every action is a native button or link with a visible label; icon-only buttons have `sr-only` names.
- Tabs and segmented controls use arrow keys (Radix and native radios); dialogs and sheets trap focus and return it (Radix).
- Code cells move focus as digits are typed, step back on Backspace, and focus returns to the first cell after a wrong code.
- The console queue supports J and K, and never steals keys from fields.
- Charts have text summaries, a table view (sales), legend toggles with `aria-pressed` and direct value labels.

## Screen reader

Labels, live regions (`role="status"` for progress, `role="alert"` for errors) and accessible names are asserted by role-based queries throughout the component tests. A manual pass with TalkBack on Android and VoiceOver on iOS is still to be recorded before the defense.

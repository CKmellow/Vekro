# B1 Order summary and pay: notes

Status: Specced (2026-10-17). No Stitch render: Cyprian chose code-ready specs for M5, built to this bar in M6 (#83, #84, #88). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Shell | `BuyerLayout` |
| Product card, promise strip, pay card | `Card` |
| Price, receipt amounts | `MoneyText` (`countUp` on the hero price only) |
| Phone, name, password | `PhoneField`, `TextField`, `PasswordField` |
| Terms | `Checkbox`, `Sheet` |
| Steps | vertical variant of the "how it works" list (new, small, view-only) |
| Banners, empty, loading | `Banner`, `EmptyState`, `SkeletonGroup` |
| Dock | `Button` (primary, `loading`) in a frosted sticky dock (shared with B2 to B4; extract once) |
| Photo viewer | new view component; zoom with pinch, `Escape` closes, focus returns to the photo |

Controller `usePayPage` owns the listing query, the session, the save-details mutation (`AuthStrategy`, today `PasswordAccount`) and the create-transaction mutation. The view gets props only.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Every PAGES.md B1 element in order, with the contract changes: no order ID field, compact "Save your details" step, code-entry wording in step 4
- [x] Every control in the table with its exact label
- [x] Every issue state: serialized and standard, register and log in, not found, already paid, withdrawn, phone invalid, provider slow, offline, loading, terms sheet
- [x] Device: 390px; 480px centred column from 600px

Design system
- [x] Token colours by role only; Bricolage, DM Sans, JetBrains Mono; 14/20/28px radii; `shadow-1` cards, frosted dock
- [x] Lucide icons only: shield-check, lock, smartphone, eye, key, scan-barcode, badge-check, chevron-down

Content
- [x] PAGES.md 0.1 sample data (Amina Gadgets, iPhone 13 KES 52,000, Nike Air Force 1 KES 6,500, +254 712 *** 678)
- [x] Money as `KES 52,000`; no fee charged to the buyer, said plainly
- [x] Never names LOOP, Pesapal or Daraja; no regulator claims; nothing from the removed list

Usability and accessibility
- [x] One primary ("Pay KES 52,000 with M-Pesa"); 52px buttons, 56px inputs, 48px+ targets
- [x] Visible labels; errors pair icon and words and are announced with `aria-live="polite"`; Pay has `aria-busy` while submitting
- [x] Photo alt text from the title; carousel dots are buttons labelled "Photo 2 of 3"
- [x] Contrast: muted text is ink-500 on sand-50 and white (4.5:1 or better)

Life and motion
- [x] Motion below, each with a reduced-motion fallback

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Price | counts up once, 700ms | final value |
| Description, steps | height expands with the spring (300/28) | instant |
| Pay button | lock icon pulses once when the button becomes enabled | no pulse |
| Pay pressed | label becomes a spinner; the lock icon closes (220ms) | spinner only |
| Sheet | slides up 360ms over the scrim | appears |
| Cards | fade and rise 8px, 60ms stagger on first load | appear |

## Backend dependencies (build in `../backend`, no frontend mocks)

- Photos, description, category, listing status and public seller profile (name, area, verified, sales count): gap #139. Until it ships, omit what is missing rather than inventing it (no "412 sales" without data).
- "Already paid" and "withdrawn" need the listing status from #139.
- Payment instruction kind (STK or redirect): gap #8, used by B2.

## Deviations from PAGES.md

1. Route is `/pay/:listingId`; the order ID field is gone (contract A).
2. Phone and name live in the "Save your details" step, which also creates the buyer account (phone + password). Name is required by `RegisterUserRequest`.
3. Step 4 reads "Enter your code to release payment" (contract C).
4. Link-not-found has no "Enter an order ID" button: order lookup is flagged off until #10 and #11.

## Audit (web-design-guidelines, applied to the brief)

- Every input has a `<label>`; `autocomplete="tel-national"`, `name`, `current-password` / `new-password`.
- Focus is visible on all controls (3px emerald-400 ring); no `transition: all`.
- The dock never covers focused inputs (`scroll-margin-bottom` on fields).
- The Pay button keeps its label while loading for screen readers (`aria-busy`, visually a spinner).

## Open questions

- None.

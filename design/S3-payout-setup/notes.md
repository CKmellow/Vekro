# S3 Payout setup: notes

Status: In review. Route `/onboarding`. Devices: desktop 1440px, mobile 390px.

## Stitch screens

Project `4950346905124660155` ("Vekro"), design system `assets/3f76e23767ff46c69a4931548f3cd1b2`.

| Export | Variant | Stitch screen ID | Edit passes |
| --- | --- | --- | --- |
| `step1-desktop.png`, `.html` | Step 1 "Your shop" with the live "How buyers see you" preview | `a985f4065fb743b69e4a2d840e7ba2c5` | 0 |
| `step2-desktop.png`, `.html` | Step 2 "Get paid" with the fee explainer slider and stacked bar | `944e795cc1c24048be2ae95eea19e6a4` | 2 (removed an invented footer and claims; name helper copy) |
| `step2-mobile.png`, `.html` | Step 2, mismatched number | `a4aeabc2845347a98a148537841ee647` | 1 (payout timing copy, removed a "Verified" badge) |
| `saved-mobile.png`, `.html` | Saved celebration, "You're ready to sell" | `10d927147a9241688ee0aae99b6598d8` | 1 (payout timing copy) |

History: `b93735fc…` (step 2 desktop), `56532ca2…` (step 2 mobile), `156b9301…` (saved).

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Two-step progress ("Your shop", "Get paid"); step 1 shop display name, city or area select, short description with counter, optional circular logo upload; step 2 M-Pesa number twice, fee explainer card with slider and stacked bar, trust note
- [x] Controls: Next, Back, Save and finish, number confirmation, logo upload, fee slider
- [x] States: step 1; step 2 with the slider; mismatched number (coral field message, Save and finish disabled); saved celebration with "Create your first listing". Saving is the M2 Button loading state
- [x] Devices: 1440px and 390px (step 1 mobile follows step 2 mobile's layout; deferred, see Deviations)

Design system
- [x] DESIGN.md colours by role; three fonts; radius scale; one outline icon set

Content
- [x] Sample data: Amina Gadgets, Kilimani, Nairobi, +254 722 118 904 (masked +254 722 *** 904 on the success screen)
- [x] Gross, network fee and net shown wherever payout appears: KES 52,000, KES 130, KES 51,870
- [x] Payout timing is always "after the buyer accepts the item" (pass 1 fixed Stitch's "upon package delivery" and "funds clear instantly")
- [x] Nothing from the removed list

Usability and accessibility
- [x] One primary per screen (Next / Save and finish / Create your first listing)
- [x] Mismatch shown with icon and text; the disabled primary explains why through the field message
- [x] Contrast from the D0 audit token pairs

## Motion notes (build phase)

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Step change | content slides 24px and fades (220ms); the progress segment grows | instant swap |
| Fee slider | the stacked bar segments and amounts update live; amounts count to the new value over 220ms | values update without counting |
| Saved celebration | vault card lock ring opens (600ms), the check badge draws in; no confetti | open ring shown at once |
| Logo upload | circular crop preview fades in | appears at once |

## Audit (web-design-guidelines, exported HTML)

- All four exports: `transition: all`; step 2 desktop also removes outlines without a focus-visible replacement; step 2 desktop and saved have animations without reduced motion.
- No missing labels on the inputs that Stitch wired; design-level checks (contrast, hierarchy, targets) pass. Build rules covered by the M2 components (`PhoneField`, `TextField`, `TextArea` counter, global reduced-motion rule).

## Deviations

1. **Payout settings cannot be saved yet.** `mpesa_phone` and `mpesa_account_name` can only be set at registration; updating them is backend-gap #144 (P1-7). The build saves through the gap adapter (mocked behind `VITE_MOCK_SELLER_PROFILE`) and, without the mock, sends the payout number at registration.
2. **Shop display name, area, description and logo** are seller-profile fields from backend-gap #139/#144; same handling.
3. **Network fee.** KES 130 on KES 52,000 is the PAGES.md sample; the real fee comes from the payment provider. The build labels it "Estimated network fee" until the backend exposes it.
4. **Step 1 on mobile** is not rendered separately: it is the step 2 mobile layout (progress, single column, sticky dock) with the step 1 fields from the desktop render.

## Open questions

- None. (The first brief said "We check this matches before the first payout" under the M-Pesa name; the backend makes no such check, so pass 2 changed it to "As it appears on your M-Pesa account.")

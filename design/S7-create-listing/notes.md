# S7 Create listing: notes

Status: Approved by Cyprian (2026-10-15). Routes `/seller/listings/new` and `/seller/listings/:id/edit`. Devices: desktop 1440px, mobile 390px. Covers #31 (steps 1 and 2) and #32 (steps 3 and 4).

## Stitch screens

Project `4950346905124660155` ("Vekro"), design system `assets/3f76e23767ff46c69a4931548f3cd1b2`.

| Export | Variant | Stitch screen ID | Edit passes |
| --- | --- | --- | --- |
| `step1-desktop.png`, `.html` | Step 1 Item: uploader (cover, uploading, failed with retry, add tile, size chip), fields, live buyer preview | `00fdf9653f224ae9926b39aa9aa2c753` | 1 (sidebar items, copy) |
| `step1-mobile.png`, `.html` | Step 1 on mobile with Preview and Next in the dock | `282be5b74f1e4cb48a1f758825ad47ca` | 1 (stepper labels, copy) |
| `preview-sheet-mobile.png`, `.html` | Preview bottom sheet over step 1 | `0870ffc05eb648e98e6f91d795ee6dec` | 1 (background, badges, policy copy) |
| `step2-desktop.png`, `.html` | Step 2 Item type: standard and serial-numbered cards, unique ID field | `e0beedd14e3a4194b594dd2871dc60f9` | 1 (removed invented badges) |
| `step3-standard-desktop.png`, `.html` | Step 3 standard policy | `617842feae7a4a72aee67b09efc61bc9` | 2 (copy; payout timing line) |
| `step3-serialized-desktop.png`, `.html` | Step 3 serial-numbered: problem chips and resolution radio cards | `aec9f2af2386476ebcd383f337c1a646` | 1 (removed invented labels) |
| `step3-warning-mobile.png`, `.html` | Missing-policy warning, Next disabled | `1eab9d05e00a4de7adbc012b9f2b9a4d` | 1 (copy) |
| `step4-desktop.png`, `.html` | Step 4 Review: summary cards with Edit, fee breakdown, buyer preview, link preview | `803954128de2430bb6f4d26e774c47f2` | 2 (claims and fee percentages; nav label) |

History in the project: the first generation of each, plus `95d195a8…` (step 1 mobile before the edit).

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Desktop: wizard on the left, sticky live buyer preview (phone frame) on the right; mobile: full-width wizard with a "Preview" bottom sheet
- [x] Step 1: uploader (up to 4, cover, reorder, size chip "182 KB"), title, category, description with counter, price in mono KES, optional buyer name
- [x] Step 2: Standard and Serial-numbered cards with the PAGES.md copy; Unique ID (IMEI or serial, mono, scan icon) with "Buyers will check the last 4 characters at the door"
- [x] Step 3: standard explainer and door-reject checkboxes; serial-numbered problem chips (phone presets plus "Add") and Refund / Repair then release / Replacement radio cards; warning "Serial-numbered listings need a policy before you can publish."
- [x] Step 4: summary per step with Edit links, fee breakdown (price, estimated network fee, net payout), buyer preview, link preview
- [x] Controls: Next, Back, Save draft (ghost), Publish and get link (primary, last step), photo upload/remove/reorder, toggles and radio cards, Edit links
- [x] States: per-step validation (warning variant), upload failure with retry, uploading, live preview; draft restored toast, publish success (S9) and "editing a paid listing is blocked" are covered by the shared Toast, S9 and Banner and are not rendered here

Design system
- [x] DESIGN.md colours by role (serial-numbered uses the lake accent, as PAGES.md asks), three fonts, radius scale, one outline icon set
- [x] Product photos only, no people

Content
- [x] Sample data: iPhone 13, 128GB, Midnight, KES 52,000, IMEI ends 1234, Amina Gadgets, Kilimani, Nairobi, Brian Otieno
- [x] Payout timing always "after the buyer accepts the item"; gross, fee and net in step 4
- [x] Stitch's invented claims (M-Pesa B2C instant settlement, 0.25% fee, "SN Verified", "Highest buyer trust rate") removed

Usability and accessibility
- [x] One primary per step (Next, or Publish and get link)
- [x] Selected radio cards and type cards show border, check and lift, not colour alone

## Motion notes (build phase)

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Step change | content slides 24px in the direction of travel (220ms) | instant swap |
| Live preview | the changed field gets a soft emerald highlight (600ms fade) | no highlight |
| Item type card | the selected card morphs (border and lift, 220ms); the Unique ID field slides open | instant |
| Photo tiles | reorder with a spring; failed tile shakes once | no spring or shake |
| Preview sheet | M2 Sheet spring slide-up | appears without slide |

## Audit (web-design-guidelines, exported HTML)

- Inputs without label association, `outline: none` without focus-visible, `transition: all`, animations without reduced motion, and icon-only buttons (photo remove, reorder, scan) without `aria-label`. Build rules: the M2 `ImageUploader` labels every photo button ("Remove front.jpg", "Move … earlier"), the scan button gets "Scan IMEI or serial", and fields use the M2 Field components.

## Deviations

1. **Content fields** (photos, description, category, buyer name) need backend-gap #139; the build saves them through the #184 adapter when mocked and tells the seller when they could not be saved.
2. **Network fee** is the PAGES.md sample (KES 130); the build labels it "Estimated network fee".
3. **Link preview** shows `vekro.co.ke/pay/VK-4299` (PAGES.md sample); the real link is `/pay/:listingId`.
4. **Editing** an existing listing (`/edit`) needs backend-gap #140 (mocked).

## Open questions

- None.

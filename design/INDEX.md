# Design index

Every Stitch screen for Vekro, its exports and its review status.

- Stitch project: **Vekro**, ID `4950346905124660155` (https://stitch.withgoogle.com/projects/4950346905124660155)
- Design system: "Vekro" (asset `assets/3f76e23767ff46c69a4931548f3cd1b2`), created from `.stitch/DESIGN.md` on 2026-10-15. Theme read back: light mode, primary `#0a6e4c` (emerald-700), secondary override `#f2a516` (saffron-500), headlines Bricolage Grotesque, body and labels DM Sans, mono JetBrains Mono, 80 named colours, the full type scale and spacing.
- Known deviation: Stitch set roundness to `ROUND_EIGHT`; DESIGN.md asks for 14px controls, 20px cards and 28px vault cards. `update_design_system` rejects every payload through the MCP, so prompts restate the radius scale explicitly. To fix by hand: Stitch > Vekro > Design system > Roundness > 12.
- Uploaded DESIGN.md source screen: `17679250463712788980`.
- Status values: Not started, Draft, In review, Approved. Only Cyprian sets Approved.
- **Specced** (from M5, Cyprian 2026-10-17): no Stitch render. The folder holds a code-ready brief (`prompt.md`) and notes (`notes.md`: checklist, build map, motion, backend dependencies, deviations); the built page, with its PR screenshots, is the visual reference.
- Exports live in `design/<ID>-<slug>/`: `mobile.png` and/or `desktop.png`, variant PNGs, the matching `.html`, `prompt.md` and `notes.md`.
- Review checklist: [`docs/DESIGN_REVIEW_CHECKLIST.md`](../docs/DESIGN_REVIEW_CHECKLIST.md)

| ID | Name | Folder | Device | Milestone | Stitch screens | Status |
| --- | --- | --- | --- | --- | --- | --- |
| D0 | Design System Sheet | `D0-design-system-sheet/` | desktop | M0 | Foundations [`f11db728…`](https://stitch.withgoogle.com/projects/4950346905124660155), Components [`e711257c…`](https://stitch.withgoogle.com/projects/4950346905124660155) | Approved (2026-10-15) |
| B1 | Order summary and pay | `B1-order-summary/` | mobile | M5 | none (code-ready spec) | Specced (2026-10-17) |
| B2 | Payment in progress | `B2-payment/` | mobile | M5 | none (code-ready spec) | Specced (2026-10-17) |
| B3 | Order tracker | `B3-order-tracker/` | mobile | M5 | none (code-ready spec) | Specced (2026-10-17) |
| B4 | Arrival, inspection and decision | `B4-inspection/` | mobile | M5 | none (code-ready spec) | Specced (2026-10-17) |
| B5 | Report an issue | `B5-report-issue/` | mobile | M10 | | Not started |
| B6 | Return flow | `B6-return-flow/` | mobile | M10 | | Not started |
| B7 | Transaction timeline | `B7-timeline/` | mobile | M10 | | Not started |
| B8 | Buyer sign-in | `B8-buyer-sign-in/` | mobile | M10 | | Not started |
| B9 | My orders | `B9-my-orders/` | mobile | M10 | | Not started |
| S1 | Sign up | `S1-sign-up/` | mobile, desktop | M3 | Desktop [`2830a77a…`](https://stitch.withgoogle.com/projects/4950346905124660155), mobile [`80b6474e…`](https://stitch.withgoogle.com/projects/4950346905124660155), states [`3a116cfb…`](https://stitch.withgoogle.com/projects/4950346905124660155) | Approved (2026-10-15) |
| S2 | Log in | `S2-log-in/` | mobile, desktop | M3 | Desktop [`ddfe1052…`](https://stitch.withgoogle.com/projects/4950346905124660155), mobile [`23e6bdc1…`](https://stitch.withgoogle.com/projects/4950346905124660155), states [`ac53f146…`](https://stitch.withgoogle.com/projects/4950346905124660155) | Approved (2026-10-15) |
| S3 | Payout setup | `S3-payout-setup/` | mobile, desktop | M3 | Step 1 [`a985f406…`](https://stitch.withgoogle.com/projects/4950346905124660155), step 2 [`944e795c…`](https://stitch.withgoogle.com/projects/4950346905124660155), step 2 mobile [`a4aeabc2…`](https://stitch.withgoogle.com/projects/4950346905124660155), saved [`10d92714…`](https://stitch.withgoogle.com/projects/4950346905124660155) | Approved (2026-10-15) |
| S7 | Create listing | `S7-create-listing/` | mobile, desktop | M3 | Step 1 [`00fdf965…`](https://stitch.withgoogle.com/projects/4950346905124660155), step 1 mobile [`282be5b7…`](https://stitch.withgoogle.com/projects/4950346905124660155), preview [`0870ffc0…`](https://stitch.withgoogle.com/projects/4950346905124660155), step 2 [`e0beedd1…`](https://stitch.withgoogle.com/projects/4950346905124660155), step 3 standard [`617842fe…`](https://stitch.withgoogle.com/projects/4950346905124660155), step 3 serial [`aec9f2af…`](https://stitch.withgoogle.com/projects/4950346905124660155), warning [`1eab9d05…`](https://stitch.withgoogle.com/projects/4950346905124660155), step 4 [`80395412…`](https://stitch.withgoogle.com/projects/4950346905124660155) | Approved (2026-10-15) |
| S8 | Listings | `S8-listings/` | mobile, desktop | M3 | Grid [`3c740dda…`](https://stitch.withgoogle.com/projects/4950346905124660155), list mobile [`5bf4234c…`](https://stitch.withgoogle.com/projects/4950346905124660155), states [`8c66dd07…`](https://stitch.withgoogle.com/projects/4950346905124660155) | Approved (2026-10-15) |
| S9 | Listing detail and share | `S9-listing-detail/` | mobile, desktop | M3 | Published [`dc69bb47…`](https://stitch.withgoogle.com/projects/4950346905124660155), published mobile [`01532281…`](https://stitch.withgoogle.com/projects/4950346905124660155), paid [`eaab8d88…`](https://stitch.withgoogle.com/projects/4950346905124660155), archived [`e52fd4e2…`](https://stitch.withgoogle.com/projects/4950346905124660155) | Approved (2026-10-15) |
| S4 | Dashboard | `S4-dashboard/` | mobile, desktop | M8 | none (code-ready spec) | Specced (2026-10-24) |
| S5 | Orders list | `S5-orders/` | mobile, desktop | M8 | none (code-ready spec) | Specced (2026-10-24) |
| S6 | Order detail | `S6-order-detail/` | mobile, desktop | M8 | none (code-ready spec) | Specced (2026-10-24) |
| S14 | Notifications | `S14-notifications/` | mobile, desktop | M8 | none (code-ready spec) | Specced (2026-10-24) |
| S10 | Returns inbox | `S10-returns/` | mobile, desktop | M8 | none (code-ready spec) | Specced (2026-10-24) |
| S11 | Return case | `S11-return-case/` | mobile, desktop | M8 | none (code-ready spec) | Specced (2026-10-24) |
| S12 | Analytics | `S12-analytics/` | mobile, desktop | M8 | none (code-ready spec) | Specced (2026-10-24) |
| S13 | Settings | `S13-settings/` | mobile, desktop | M8 | none (code-ready spec) | Specced (2026-10-24) |
| A1 | Admin log in | `A1-admin-login/` | desktop | M13 | | Not started |
| A2 | Escalation queue | `A2-queue/` | desktop | M13 | | Not started |
| A3 | Case detail and decision | `A3-case/` | desktop | M13 | | Not started |
| A4 | Transactions explorer | `A4-transactions/` | desktop | M13 | | Not started |
| X1 | Landing | `X1-landing/` | mobile, desktop | M13 | | Not started |
| X2 | Not found and offline | `X2-not-found/` | mobile, desktop | M13 | | Not started |
| X3 | Help and support | `X3-help/` | mobile | M10 | | Not started |

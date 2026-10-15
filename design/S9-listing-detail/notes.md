# S9 Listing detail and share: notes

Status: Approved by Cyprian (2026-10-15). Route `/seller/listings/:id`. Devices: desktop 1440px, mobile 390px.

## Stitch screens

Project `4950346905124660155` ("Vekro"), design system `assets/3f76e23767ff46c69a4931548f3cd1b2`.

| Export | Variant | Stitch screen ID | Edit passes |
| --- | --- | --- | --- |
| `published-desktop.png`, `.html` | Just published: success banner, share hero, item and activity | `dc69bb47ba2448f182bb88f27244662b` | 1 (removed invented claims, including "M-Pesa Auto-Release") |
| `published-mobile.png`, `.html` | Just published, mobile | `01532281cb584b4e999a10cf983b9956` | 1 (fee rows and payout timing) |
| `paid-desktop.png`, `.html` | Paid with the linked order panel; Edit and Archive disabled | `eaab8d8843f34601819809025d704137` | 1 (removed invented labels and metrics) |
| `archived-mobile.png`, `.html` | Archived, link closed | `e52fd4e247294d0f9cd841f177ec3982` | 1 (photo and labels) |

History: `05c0d219…`, `67b0ec27…`, `22098810…`, `f74f63e2…`.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Header with back and status pill; share hero card (emerald vault): "Your Trust Link is ready", link in mono with Copy, QR, WhatsApp (white, primary in the card), Facebook, Telegram, Copy message, suggested caption with copy, Download QR card
- [x] Item summary card (photos, details, type, policy); linked order panel once paid (buyer masked, status pill, "Open order"); views and clicks mini chart
- [x] Controls: Copy link, Share on WhatsApp, Copy message, Download QR card, Edit and Archive (disabled once paid), Duplicate, Open order
- [x] States: just published, paid, archived. Loading and error use the shared Skeleton and Banner (not rendered separately)

Design system
- [x] DESIGN.md colours by role, three fonts, radius scale, one outline icon set; WhatsApp uses a chat icon, not the brand logo

Content
- [x] Sample data: vekro.co.ke/pay/VK-4299, iPhone 13 KES 52,000, network fee KES 130, you receive KES 51,870, order VK-7K3P9Q, Brian Otieno +254 712 *** 678
- [x] Payout always "after the buyer accepts the item"; gross, fee and net shown
- [x] Nothing from the removed list

Usability and accessibility
- [x] One emerald primary per screen ("Share on WhatsApp" in the hero, "Open order" when paid, "Duplicate as new listing" when archived)
- [x] Disabled actions explain why (tooltip "This listing has a paid order, so it can't be changed.")

## Motion notes (build phase)

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Just published | success banner slides in; the hero's lock ring opens once (600ms); no confetti | banner and open ring shown at once |
| Copy buttons | label morphs to a check for 1.5s and the "Link copied" toast | check shown, no morph |
| Activity chart | bars grow once on mount (700ms) | final bars |
| Linked order countdown | `CountdownRing` from the server dispatch deadline | updates without animation |

## Audit (web-design-guidelines, exported HTML)

- Inputs without a label association, `outline: none` without focus-visible, `transition: all`, animation without reduced motion; icon-only copy buttons without `aria-label`. Build rules: copy buttons are labelled ("Copy link", "Copy message"), the QR uses the M2 `QrCode` with a label.

## Deviations

1. **Link format.** The design shows `vekro.co.ke/pay/VK-4299` (PAGES.md sample). The real Trust Link is `/pay/:listingId` (FRONTEND_CONTRACT A); the build shows the listing's link as the backend gives it.
2. **Views, clicks, photos and archive** depend on backend-gaps #139 and #140 (mocked, #184). "Restore listing" on the archived state is part of #140's update.
3. **Download QR card** is generated client-side from the M2 `QrCode`.

## Open questions

- None.

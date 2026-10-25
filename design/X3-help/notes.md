# X3 Help and support: notes

Status: Specced (2026-10-24). No Stitch render (Cyprian's M5 decision, applied to M10). Built in M14 (#69).

## Build map

| Part | Component |
| --- | --- |
| Accordions | Radix accordion restyled to tokens (shadcn), or native `<details>` |
| Search | field from S8 |
| Contact | `Button` links |
| Content | `lib/copy` help entries (static, versioned with the app) |
| Configuration | `VITE_SUPPORT_PHONE`, `VITE_SUPPORT_WHATSAPP`, `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_HOURS` |

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Search, grouped accordions, contact card, track-order shortcut, report-a-page link

Content
- [x] Answers match the product: no wallets, no courier tracking, no photo evidence, payout after the buyer accepts, no regulator or speed claims
- [x] No invented contact numbers: contact buttons come from configuration and hide when unset

Usability and accessibility
- [x] Disclosures are buttons with `aria-expanded`; search results announced politely

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Accordion | height and chevron rotate (220ms) | instant |

## Backend dependencies

- None (static content and configuration).

## Deviations from PAGES.md

1. Contact details are configuration, not hard-coded, because the support numbers aren't decided.
2. "Track your order" points to the order link and B9 instead of an order-ID field (an order ID is never a credential).

## Open questions

1. Support phone, WhatsApp number, email and hours: please provide them for the deployment environment (M17 #135).

## Build notes (M14 #69)

1. `/help` uses the public layout for everyone, signed-in sellers included, so the page stays a single static route that works offline; the seller nav links to it.
2. While searching, every matching answer shows open (no disclosures to tap); clearing the search restores the accordions.

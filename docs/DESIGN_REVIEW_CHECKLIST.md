# Design review checklist

Run this on every screen before it goes to review. Record the result, item by item, in `design/<ID>-<slug>/notes.md`. A screen with an unchecked item is not ready, unless the notes explain why it is deferred.

## Completeness

- [ ] Every component in the page's PAGES.md layout is present, in the documented order.
- [ ] Every control in the page's control table is present, with its exact label.
- [ ] Every state and variant listed in the issue is rendered, or explicitly deferred in notes.md.
- [ ] Contract deviations applied (`docs/FRONTEND_CONTRACT.md` and the PAGES.md "Deviations" section). For example, B4 asks the buyer to enter the code; it never displays it.
- [ ] Required devices rendered: buyer 390px; seller 390px and 1440px; admin 1440px.

## Design system

- [ ] Only DESIGN.md colours, by role. No cold greys, no pure black, no purple gradients.
- [ ] Only the three fonts: Bricolage Grotesque (display and headlines), DM Sans (body), JetBrains Mono (IDs, amounts in tables, codes, timers).
- [ ] Only the DESIGN.md radius scale and shadows.
- [ ] One consistent stroke icon set. No emoji icons, no stock photos of people, no crypto imagery.

## Content

- [ ] Sample data from PAGES.md 0.1 (Amina Gadgets, Brian Otieno, iPhone 13 at KES 52,000, and so on).
- [ ] Human state labels only (PAGES.md 0.2 and the state mapping); never raw state names.
- [ ] Money written as `KES 52,000`; payouts shown as gross, network fee and net wherever payout appears.
- [ ] Order references in the `VK-7K3P9Q` style; phones masked (`+254 712 *** 678`) everywhere except the admin console.
- [ ] Buyer-facing copy never names LOOP, Pesapal or Daraja.
- [ ] Nothing from the removed list: AI or photo comparison, geofencing, multi-sig, blockchain, crypto, wallets, courier tracking, photo evidence.

## Usability and accessibility

- [ ] One primary button per screen.
- [ ] Touch targets at least 48px on buyer screens.
- [ ] Text contrast at least 4.5:1 (3:1 for large text and UI glyphs).
- [ ] Destructive actions are never the default and are visually distinct (coral outline or coral fill with confirmation).
- [ ] Clear hierarchy: the next action is obvious within five seconds.

## Life and motion

- [ ] The screen feels alive: depth, the vault card or lock ring where relevant, the money path where relevant.
- [ ] Every motion described in the page is written into notes.md for the build phase (Stitch designs are static).
- [ ] A reduced-motion alternative is noted for each animation.

## Audit and export

- [ ] web-design-guidelines run on the exported HTML; design-level findings fixed (contrast, hierarchy, targets) and the rest noted.
- [ ] At most two edit passes; anything still short of the bar is called out in the PR.
- [ ] Exports committed: PNG per device and variant, HTML, `prompt.md`, `notes.md` (Stitch screen IDs, deviations, motion notes, open questions).
- [ ] Row updated in `design/INDEX.md` (Stitch screen IDs, status In review).

Quality bar: a demanding product designer would say "this looks like a real, premium fintech app".

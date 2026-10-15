# S8 Listings: notes

Status: Approved by Cyprian (2026-10-15). Route `/seller/listings`. Devices: desktop 1440px, mobile 390px.

## Stitch screens

Project `4950346905124660155` ("Vekro"), design system `assets/3f76e23767ff46c69a4931548f3cd1b2`.

| Export | Variant | Stitch screen ID | Edit passes |
| --- | --- | --- | --- |
| `grid-desktop.png`, `.html` | Grid view, filters, three-dot menu open, "Link copied" toast | `3c740dda638d409fabdff1113d3d3c4c` | 1 (replaced a product photo with a person in it and one showing an app screenshot) |
| `list-mobile.png`, `.html` | List view with filter pills | `5bf4234c28694345bf6f3b03a6864176` | 1 (shop name, removed an invented banner, bottom nav) |
| `states-desktop.png`, `.html` | Empty, no results, loading | `8c66dd07083547ae939c33de48c8c261` | 1 (removed invented meta labels and footer) |

History: `6a4c8471…` (grid), `986b7dee…` (list), `59d57c71…` (states).

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Header "Listings" with count and the single primary "New listing"; SegmentedControl (Active, Awaiting payment, Sold, Draft, Archived) with counts; search; grid/list toggle
- [x] Listing cards: photo, title, price, type tag (Standard or Serial-numbered), status pill, views, "Copy link", three-dot menu (Share, Edit, Duplicate, Archive in coral)
- [x] Desktop 4-column grid, mobile single column
- [x] States: grid and list views, filters, empty ("Create your first listing"), no results ("Clear search and filters"), loading skeleton cards. Error is the shared M2 Banner (not rendered separately)
- [x] Paid card shows the saffron "Awaiting dispatch" pill

Design system
- [x] DESIGN.md colours by role, three fonts, radius scale, one outline icon set
- [x] Product photos only; no people, no screenshots (fixed in pass 1)

Content
- [x] Sample data: iPhone 13 KES 52,000 (serial-numbered, awaiting dispatch), Nike Air Force 1 KES 6,500, Kitenge wrap dress KES 3,200, HP Pavilion 15 KES 68,500, 3-seater sofa KES 38,000
- [x] Human status labels only

Usability and accessibility
- [x] One primary ("New listing"); destructive "Archive" is coral and last in the menu
- [x] Mobile bottom navigation per PAGES.md 0.5 (Listings lives under More)

## Motion notes (build phase)

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Cards | press scale 0.98; hover lifts shadow 1 to 2 | border change only |
| Copy link | toast slides down "Link copied", 4s | appears in place |
| Filter change | grid cross-fades (220ms) | instant |
| Loading | skeleton shimmer 1.4s | static sand blocks |

## Audit (web-design-guidelines, exported HTML)

- Search inputs without a label association, `outline: none` without focus-visible, `transition: all`; icon-only buttons (three-dot menus, view toggle) without `aria-label` (8 on the grid). Build rules: the three-dot button is `aria-label="More actions for <title>"`, the view toggle is a labelled SegmentedControl, search uses a real label.

## Deviations

1. **The list needs backend-gap #7 (P0-2).** The build reads it through the listing adapter behind `VITE_MOCK_SELLER_LISTS` (#184).
2. **Views and statuses other than active** (draft, archived, sold) are backend-gap #139/#140 content; same mock.
3. **Pagination** is not drawn; with the mock's page size the list fits. The build uses the M2 Pagination below the grid when needed.

## Open questions

- None.

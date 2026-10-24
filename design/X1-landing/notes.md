# X1 Landing: notes

Status: Specced (2026-10-24). No Stitch render. Built in M14 (#68).

## Build map

| Part | Component |
| --- | --- |
| Nav, footer | new `PublicLayout` (frosted nav, footer) |
| Phone mockup | `VaultCard`, `MoneyPath` and `LockRing` inside a device frame, driven by a looping state timer |
| Steps, cards, trust strip | `Card`, lucide icons |
| FAQ | the X3 accordion and shared help entries (`lib/copy`) |

The landing is a public, lazy route chunk with no API calls except the session check.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

- [x] Full page; track-order form specced and flagged off
- [x] No regulator, licence, speed or "guaranteed" claims; no stock photos of people; no logos of other companies
- [x] One primary per section; headings in order; anchors are links

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Hero phone | 8s loop: lock closes, truck moves, check, coins glide | a single static frame ("Complete, seller paid") |
| Steps | fade up on scroll into view (stagger 60ms) | static |
| Nav | hairline appears after 8px of scroll | same, no transition |

## Backend dependencies

- None (the track form waits for gaps #10 and #11).

## Deviations from PAGES.md

1. The hero track form is flagged off (FRONTEND_CONTRACT A: order ID plus phone is never a credential).
2. "Secure" in the trust strip is replaced by specific statements, per DESIGN.md voice.

## Open questions

- None.

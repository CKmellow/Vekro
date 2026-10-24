# B7 Transaction timeline: notes

Status: Specced (2026-10-24), reconciling the build from M7 (#97, PR #227) and the role-aware timeline from M9 (#235). No Stitch render.

## Build map (as built)

| Part | Component |
| --- | --- |
| Rail and nodes | `Timeline` (`views/components/domain`) |
| Page | `TimelinePage`; tab content `TimelinePanel` (shared by B3 and S6) |
| Data | `useOrderTimelineView`: `GET /transactions/{id}/timeline` plus `upcomingSteps` from the order's deadline |

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Populated with typed nodes, future dashed steps with deadlines, empty, loading (plus not found and error)

Content
- [x] The timeline never shows the delivery code (the server never returns notification messages or payloads)
- [x] Titles are server copy worded for the viewer's role

Usability and accessibility
- [x] An ordered list with an accessible label; times are text in EAT

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Nodes | draw in with a 60ms stagger; the newest pulses once | static |

## Deviations from PAGES.md

1. **Quote blocks** for dispute categories and descriptions come with the dispute summary (M11); the timeline events themselves carry no quotes from the server.
2. **"Copy receipt link"** is "Copy link" (there's no receipt).
3. The sample event "You pressed Courier is here" doesn't exist: the seller marks arrival (open question 1, default a).

## Backend dependencies

- `GET /transactions/{id}/timeline` (shipped, gap #142 closed).

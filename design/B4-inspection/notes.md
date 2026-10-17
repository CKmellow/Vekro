# B4 Arrival, inspection and decision: notes

Status: Specced (2026-10-17). No Stitch render (Cyprian's M5 decision). Built in M7 (#94, #95, #96). Brief: [`prompt.md`](prompt.md).

## Build map

| Part | Component |
| --- | --- |
| Countdown chip | `CountdownRing` (`announceAt={[600, 60]}`) in the header slot |
| Notice, consequences | `Card`, `Banner` |
| Checklist | new `InspectionChecklist` view (local ticks only) |
| Code | `CodeCells` with `length={6}` |
| Decisions | `ConfirmDialog` (accept), `Sheet` + `RadioCardGroup` + `TextArea` (reject) |
| Outcomes | `VaultCard`, `LockRing` (`released`, `returned`, `draining`) |
| Dock | shared frosted action dock |

Controller `useInspection(orderId)` reads the transaction and deadline, submits `otp-give` (`otp_code`) and `otp-withhold`, maps 422 to the wrong-code message and 409 to a refetch, and keeps the screen awake (Wake Lock API, when supported) while the buyer is at the door.

## Self-review (docs/DESIGN_REVIEW_CHECKLIST.md)

Completeness
- [x] Arrival notice with the countdown; checklist (standard and serialized with ••••1234); code entry "Enter the code we sent you"; the code is never displayed (contract C)
- [x] Accept copy by item type; accept confirm; reject sheet "What's wrong?"; rejected; timeout; done standard; 24h window (serialized) with report-an-issue; already completed
- [x] Six code cells (the code is 6 digits)

Design system
- [x] Saffron for the timer and arrival, coral only for reject and failures, emerald only for accept
- [x] Lucide icons: package-check, check, info, lock, undo-2, hourglass, alert-circle

Content
- [x] Consequence copy exactly as contract C
- [x] Reasons come from the seller's declared policy; serial shown as ••••1234; phone masked
- [x] Nothing from the removed list: no photo evidence, no photo comparison, no courier tracking (the photo strip is for the buyer's own eyes)

Usability and accessibility
- [x] One primary ("Accept item"); reject is a danger outline, never the default focus
- [x] `ConfirmDialog` traps focus and starts on "Not yet"
- [x] Code cells are one labelled group ("Delivery code, 6 digits"); errors announced; `autocomplete="one-time-code"`
- [x] Countdown announces at 10 minutes and 1 minute only

Life and motion
- [x] Motion below with reduced-motion fallbacks

## Motion

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Checklist tick | checkmark draws with a small spring; progress line updates | instant tick |
| Countdown | drains every second; coral under 10% | numbers update |
| Wrong code | cells shake once (360ms) | coral outline only |
| Accept button | lock icon closes when 6 digits are in | swaps icon |
| Release (done, standard) | ring fills, lock opens, three coin dots arc to the Seller node, check draws (600ms) | final state |
| Rejected | coral return arrow draws; money-path dot glides back to Buyer | final state |
| Sheets and dialog | slide up 360ms; dialog scales from 0.98 | appear |

## Backend dependencies (build in `../backend`, no frontend mocks)

- Transaction read and the at-door deadline: gaps #6 and #141.
- Listing photos for the comparison strip: gap #139.
- **Reject reason**: `otp-withhold` takes no body, so the chosen reason and note aren't stored. New backend gap to file in M7: accept an optional `reason` (from the listing's `door_reject_reasons`) and `note`. Until it ships, the sheet hides the reason list and note and is a plain confirm (title, body, "Confirm rejection", "Go back"), so nothing is asked that isn't saved.

## Deviations from PAGES.md

1. No "Show my code" button, no blurred code cells, no reveal or copy (contract C). The buyer types the code instead.
2. Six cells, not four (the code is 6 digits).
3. The arrival notice and the "What accepting means" block are added (contract C flow: notice, checklist, decision).
4. Reject reasons come from the seller's policy rather than a fixed list.

## Audit (web-design-guidelines, applied to the brief)

- The code group never autofocuses on page load (the buyer reads the checklist first); it focuses after "Didn't get the code?" or a wrong code.
- Danger and primary buttons are distinguishable without colour (outline vs fill, different labels).
- Countdown text uses `tabular-nums`; time zone EAT.

## Open questions

- Confirm filing the reject-reason backend gap in M7.

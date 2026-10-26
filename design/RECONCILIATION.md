# Design versus build (M17 #138)

Every page compared with its approved reference on 2026-10-26. Stitch-approved pages (D0, S1, S2, S3, S7, S8, S9) were compared side by side with fresh screenshots of the build; specced pages (no Stitch render, Cyprian's M5 decision) were checked against their `prompt.md` and `notes.md` checklist, and the built page with its PR screenshots is the visual reference.

"Recorded" counts the numbered items already written in each folder's `notes.md` ("Deviations from PAGES.md" and "Build notes"). Differences found in this pass are listed in the last column and were either fixed (in #138) or recorded here.

| Page | Reference | Built in | Result | Recorded | Found in this pass |
| --- | --- | --- | --- | --- | --- |
| D0 Design system | Stitch, approved | #171 to #182 | Matches; tokens generated from DESIGN.md | 6 | none |
| B1 Pay | spec | #214, #215, #216, #219 | Matches | 4 | none |
| B2 Payment | spec | #217, #218 | Matches | 3 | none |
| B3 Tracker and phone gate | spec | #222, #223, #227, #249, #260 | Matches | 6 | none |
| B4 Inspection | spec | #224, #225, #226 | Matches | 4 | none |
| B5 Report an issue | spec | #243 | Matches | 3 | none |
| B6 Return | spec | #244 | Matches | 3 | none |
| B7 Timeline | spec | #227, #240 | Matches | 3 | none |
| B8 Sign in | spec | #258 | Matches | 4 | none |
| B9 My orders | spec | #259 | Matches | 3 | none |
| S1 Sign up | Stitch, approved | #190 | Matches (layout, copy, rules checklist, brand panel) | 3 | none |
| S2 Log in and reset | Stitch, approved | #191, #263 | Matches; "Forgot password?" added once #149 shipped | 3 | none |
| S3 Payout setup | Stitch, approved | #192, #261 | Matches the steps, preview and fee example | 4 | The preview showed "YO" (from the placeholder) instead of initials: **fixed**, now "AG" or a shop icon. The design's privacy note under the preview and "Save & exit" link are not built: recorded (onboarding saves at the end; the note's claim about "verified escrow milestones" isn't a product feature). |
| S4 Dashboard | spec | #236 | Matches | 3 | none |
| S5 Orders | spec | #233 | Matches | 3 | none |
| S6 Order detail | spec | #235, #249 | Matches | 4 | none |
| S7 Create listing | Stitch, approved | #193 to #196 | Matches (stepper, photo slots, live buyer preview) | 4 | none |
| S8 Listings | Stitch, approved | #197 | Matches (filters with counts, grid and list, card actions) | 3 | View counts on cards are not shown: the backend doesn't record views (already recorded in S8 and S9 notes). |
| S9 Listing detail | Stitch, approved | #198 | Matches (Trust Link card, QR, share buttons, paid and archived states) | 3 | The weekly impressions chart and "Link clicks" aren't built (not recorded by the backend); no "Verified seller" badge (no verification exists). Recorded. |
| S10 Returns | spec | #246 | Matches | 3 | none |
| S11 Return case | spec | #247 | Matches | 4 | none |
| S12 Analytics | spec | #264 | Matches, except the Insights card | 6 | none |
| S13 Settings | spec | #261, #262 | Matches | 9 | none |
| S14 Notifications | spec | #237 | Matches | 2 | The new-row layout animation became a fade (#271, bundle size). Recorded here. |
| A1 Console log in | spec | #252 | Matches | 2 | none |
| A2 Queue | spec | #253 | Matches | 2 | none |
| A3 Case and decision | spec | #254 | Matches | 1 | none |
| A4 Transactions | spec | #255 | Matches | 1 | none |
| X1 Landing | spec | #256 | Matches | 2 | none |
| X2 Not found and offline | spec | #257 | Matches | 4 | none |
| X3 Help | spec | #257 | Matches | 4 | none |

## Shell-level differences (all seller pages)

- The approved Stitch shells show a help (?) icon and an avatar menu in the seller header; the build has the notification bell, with Help in the footer and the phone's "More" menu, and the account under Settings. Recorded: it keeps the header uncluttered on phones and every action has one home.
- The Stitch roundness setting (`ROUND_EIGHT`) never matched DESIGN.md; the build uses DESIGN.md's 14 px controls, 20 px cards and 28 px vault cards (see `INDEX.md`).

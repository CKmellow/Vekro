# Page states audit (M16 #126)

Every page against loading, empty, error and offline. "Stale" means the page keeps showing what it last loaded, dimmed or with a "You're offline. Showing the last update at 14:36." notice. Pages opened with no connection and no data get the offline page (X2) from the route guard or error boundary. Actions that need the network say so when they fail ("You're offline. Connect and try again.").

| Page | Loading | Empty | Error | Offline |
| --- | --- | --- | --- | --- |
| X1 Landing | static | n/a | n/a | static content |
| X2 Not found / offline | n/a | n/a | n/a | is the offline page |
| X3 Help | static | no search results | n/a | static content |
| B1 Pay | skeleton | sold / archived listing states | banner + retry | stale banner, pay disabled |
| B2 Payment | ring + skeleton | n/a | failure reasons, resend | stale banner, polling pauses |
| B3 Order tracker | skeleton | not found | banner + retry | stale, dimmed |
| B3 Phone gate | public summary | unknown order banner | shared with B8 | shared with B8 |
| B4 Inspection | skeleton | n/a | banner + retry | stale banner, code disabled |
| B5 Report issue | skeleton | n/a | banner | stale banner, submit disabled |
| B6 Return | skeleton | n/a | banner | stale banner, actions disabled |
| B7 Timeline | skeleton | not found | banner + retry | stale banner (added in #126) |
| B8 Sign in | button spinner | n/a | wrong, expired, locked, server | offline banner on send/verify |
| B9 My orders | skeleton cards | no orders, no results, empty segment | banner + retry | stale, dimmed |
| S1 Sign up | button spinner | n/a | field and server errors | offline message on submit |
| S2 Log in / forgot password | button spinner | n/a | wrong details, lockout | offline banner on submit |
| S3 Payout setup | button spinner | n/a | banner | offline message on save |
| S4 Dashboard | skeletons | first-run empty | banner + retry | stale banner |
| S5 Orders | skeleton rows | no orders, no results, empty segment | banner + retry | stale, dimmed |
| S6 Order detail | skeleton | not found | banner + retry | stale, actions disabled |
| S7 Create / edit listing | skeleton (edit) | n/a | step and submit errors | offline message on publish |
| S8 Listings | skeleton grid | no listings, no results | banner + retry | stale banner (added in #126) |
| S9 Listing detail | skeleton | not found | banner + retry | stale banner (added in #126) |
| S10 Returns | skeleton | empty inbox | banner + retry | stale banner |
| S11 Return case | skeleton | not found | banner + retry | stale, actions disabled |
| S12 Analytics | tile and chart skeletons | locked under 5 sales, empty charts | banner + retry | stale, dimmed |
| S13 Settings | per-tab skeletons | n/a | per-tab banners | offline banner, saving paused |
| S14 Notifications | skeleton | empty | banner + retry | stale banner |
| A1 Console log in | button spinner | n/a | wrong details, wrong role, lockout | offline banner on submit |
| A2 Queue | skeleton rows | nothing waiting, no matches | banner + retry | stale notice |
| A3 Case | skeleton | not found | banner + retry, execution failure | stale notice (added in #126) |
| A4 Transactions | skeleton rows | no matches | banner + retry | stale notice (added in #126) |

Shared: `OfflineBanner` (`src/views/components/ui/OfflineBanner.tsx`) and `useStaleSince` (`src/controllers/useOnline.ts`).

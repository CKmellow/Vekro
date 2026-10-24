# S5 Orders list: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` S5 and its Deviations, `docs/COPILOT_PROMPT.md` 4.3, `.stitch/DESIGN.md`.

Route `/seller/orders` (query `?segment=needs_action&q=VK-7K3P9Q&page=2`, so filters survive reloads and the top-bar search lands here). Seller. Devices: desktop 1440px and mobile 390px.

Goal: find any order fast and act on the ones that need you. Feeling: an organised shop counter.

## Foundation

- Shell: `SellerLayout`, "Orders" active, with the Needs action badge.
- Seller labels from `STATE_META`; references in mono; buyers masked (`+254 712 *** 678`); money as `KES 52,000`.

## Layout, top to bottom

1. **Header**: `type-display-lg` "Orders" with a total count chip (sand-100, mono). No primary button.
2. **Filter row**: `SegmentedControl` with counts: "Needs action" (3), "In transit" (4), "Held" (2), "Completed" (31), "Issues" (1). Right of it on desktop: search field (search icon, placeholder "Order ID or item"). Mobile: the segments scroll horizontally above a full-width search.
3. **Table** (`DataTable`, from 768px): columns
   - "Item": 40px thumbnail and title (truncate).
   - "Order": reference in mono.
   - "Buyer": name and masked phone under it in text-muted.
   - "Amount": right aligned, `KES 52,000`.
   - "Status": `StatusPill` (seller label).
   - "Next deadline": a 28px mini `CountdownRing` and "41h 12m" when the state has a deadline; "—" otherwise.
   - "Placed": relative ("2 hours ago"), with the EAT date and time in a `title`.
   Sortable headers: Amount and Placed. Row hover tints sand-50; rows are links to S6.
   Row action column: "Dispatch" (secondary, compact) on `locked` rows; "Mark arrived" on `out_for_delivery` rows. Shown always on touch, revealed on hover and focus on desktop.
4. **Pagination** (`Pagination`): 20 per page, "Showing 21 to 40 of 46".
5. Mobile: each row becomes a card: thumbnail, title, reference, amount, status pill, deadline, and the row action as a full-width secondary button.

## Segments (backend statuses)

| Segment | Statuses |
| --- | --- |
| Needs action | `locked`, `out_for_delivery`, `return_in_transit`, `return_received` |
| In transit | `initiated`, `awaiting_payment`, `at_door_pending_inspection`, `dispatched` |
| Held | `hold_24h` |
| Completed | `released`, `resolved_release`, `refunded_buyer`, `resolved_refund`, `returned_to_seller`, `resolved_split` |
| Issues | `disputed_functional`, `awaiting_buyer_reconfirmation`, `escalated_admin_review` |

The backend owns this mapping (one source for counts and filters).

## Controls

| Control | Label | Style | Result |
| --- | --- | --- | --- |
| Segment | name and count | `SegmentedControl` | filters; resets to page 1; updates the URL |
| Search | placeholder "Order ID or item", `aria-label="Search orders"` | field | filters by reference or item title (debounced 300ms); updates the URL |
| Sort | "Amount", "Placed" | sortable header | toggles ascending and descending |
| Row | whole row | link | S6 |
| Dispatch | "Dispatch" | secondary, compact | the S6 dispatch confirm dialog, in place |
| Mark arrived | "Mark arrived" | secondary, compact | the S6 arrival confirm dialog, in place |
| Pagination | "Previous", "Next", page numbers | `Pagination` | pages |

## States

| State | Design |
| --- | --- |
| Loading | header, segments with no counts, 6 skeleton rows |
| Empty per segment | inside the table area: icon and one sentence. Needs action: "Nothing needs your action" / "New paid orders show here first." In transit: "No orders on the way." Held: "No payments are on hold." Completed: "Completed orders will show here." Issues: "No open issues. Nice." |
| No results | "No orders match "VK-1234"" with "Clear search" |
| No orders at all | `EmptyState` (parcel) "No orders yet" / "Share a Trust Link and your first order shows up here." action "Go to listings" |
| Error | coral `Banner` "We couldn't load your orders." with "Try again" |
| Offline | sand `Banner` with the last update time; rows dimmed to 70%; row actions disabled |

# B4 Arrival, inspection and decision: design brief

Code-ready brief (no Stitch render, Cyprian 2026-10-17). Sources: `docs/PAGES.md` B4 and its Deviations, `docs/FRONTEND_CONTRACT.md` C (replaces the PAGES.md "show my code" design), `.stitch/DESIGN.md`.

Route `/order/:orderId/inspect`. Buyer. Device: mobile 390px.

Goal: help the buyer inspect properly and decide safely. The most important screen. Feeling: "calm, careful, in charge".

**Contract C, in one line:** the buyer types the 6-digit code they received by SMS or in-app notification. The code is never displayed on this screen. There is no "reveal your code" step.

## Foundation

- Shell: `BuyerLayout`; the header's right side shows a countdown chip instead of the escrow pill: small `CountdownRing` + "54:12 left to inspect" (saffron, coral under 10%). Deadline from the server (arrival + about 1 hour).
- Serious but friendly: lots of sand, one saffron warning, emerald only for the accept action, coral only for reject.

## Layout, top to bottom

1. **Arrival notice** (saffron-50 card, package-check icon): `type-title` "Your item has arrived" / "Check it before you decide. If you do nothing, the item goes back to the seller and you're refunded when the timer ends."
2. Heading "Inspect before you confirm" (`type-display-lg`).
3. **Inspection checklist** (`Card`, tappable 56px rows with animated checkboxes, guidance only):
   - "Open the package in front of the courier"
   - "It's the right item and matches the photos"
   - "Nothing is damaged or missing"
   - Serialized only: "Serial number matches ••••1234" with muted helper "On an iPhone: Settings > General > About"
   - Progress line under the list: "3 of 4 checked".
4. **Listing photos strip**: three 72px thumbnails, "Compare with the seller's photos"; tap opens the zoom viewer.
5. **What accepting means** (sand-100 sunken block, info icon):
   - Standard: "Accepting is final and releases payment to the seller."
   - Serialized: "Payment is held for 24 hours; you can report a functional issue in that window."
6. **Accept card** (`Card`): label "Delivery code", heading "Enter the code we sent you", helper "We sent a 6-digit code to +254 712 *** 678 by SMS and in your Vekro notifications. Only enter it once you're happy with the item." `CodeCells` length 6 (SMS autofill and paste supported). Ghost "Didn't get the code?" opens help text: "Codes arrive within a minute. Check your SMS inbox and notifications. Still nothing? Get help."
7. **Action dock**: primary "Accept item" (enabled once 6 digits are entered); under it a danger outline "Item isn't right, reject".

## Controls

| Control | Label | Style | Enabled when | Result |
| --- | --- | --- | --- | --- |
| Checklist rows | as above | tappable rows, checkbox | always | Ticks locally; guidance only, not required |
| Photo thumbnails | `aria-label="Seller photo 1 of 3"` | 72px buttons | photos exist | Opens the zoom viewer |
| Code entry | "Delivery code" | `CodeCells` length 6 | at the door | Fills the code |
| Didn't get the code | "Didn't get the code?" | ghost text | always | Expands help |
| Accept | "Accept item" | primary, 52px | 6 digits entered | Accept confirm dialog |
| Reject | "Item isn't right, reject" | danger outline, 52px | always | Reject sheet |

**Accept confirm** (`ConfirmDialog`): title "Accept this item?"; body standard "KES 52,000 goes to Amina Gadgets. Accepting is final." / serialized "KES 52,000 stays held for 24 hours while you test the item. After that it goes to Amina Gadgets."; confirm "Yes, accept", cancel "Not yet" (focus starts on "Not yet"). Confirm calls `otp-give` with the code; a wrong code returns to the card with the cells shaking and "That code doesn't match. Check the SMS and try again."

**Reject sheet** (`Sheet`): title "What's wrong?"; body "The item goes back to the seller and you're refunded. Your code stays unused."; radio list from the seller's declared `door_reject_reasons` (shown with human labels, e.g. "Wrong item", "Damaged", "Not as described", "Missing parts"), plus "Something else"; optional note "Tell the seller what's wrong (optional)"; coral primary "Confirm rejection"; ghost "Go back". Confirm calls `otp-withhold`.

## States and variants

| Variant | Design |
| --- | --- |
| Arrived (default), standard | Nike Air Force 1 size 42, KES 6,500; three checklist rows; standard consequence copy |
| Arrived, serialized | iPhone 13 with the ••••1234 row; serialized consequence copy |
| Code entered | cells filled, Accept enabled, the lock icon on the button closes |
| Wrong code | cells shake once, coral message under them, cells cleared and focused |
| Accept confirm | dialog as above |
| Reject sheet | sheet as above |
| Rejected | `VaultCard` with the coral return arrow; pill "Returned to seller"; "The item is going back to the seller" / "Your refund of KES 6,500 is on its way to +254 712 *** 678." primary "Track my order" |
| Timed out | ring empty; coral-50 card "Time ran out" / "The item goes back to the seller and you're refunded." primary "Track my order" |
| Done, standard | release moment; pill "Complete, seller paid"; "All done" / "You accepted the item. Amina Gadgets has been paid." primary "Track my order" |
| Done, serialized (24h window) | ring `draining` (saffron); pill "Held 24 hours for checks"; `CountdownRing` "23:59:12 left to report"; "Held for 24 hours. Test your item." / "If something doesn't work, report it before the timer ends." Category list preview from the seller's policy (Won't power on, Screen or touch problem, Battery drains fast, …); danger outline "Report a problem" (to B5); ghost "Everything works" returns to B3 |
| Already completed | opening the page later shows the done state that matches the status, with "Track my order" |
| Loading, error, offline | skeleton of notice + checklist; coral banner with "Try again"; offline banner, Accept disabled with "You're offline" |

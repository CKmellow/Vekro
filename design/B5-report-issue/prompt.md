# B5 Report an issue: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` B5 and its Deviations ("Serialized accepted items: 24h window screen with report-an-issue"), `docs/COPILOT_PROMPT.md` 4.3, `api/openapi.json` (`POST /transactions/{id}/report-functional-issue`), `.stitch/DESIGN.md`.

Route `/order/:orderId/report`. Buyer, serialized items in `hold_24h` only. Device: mobile 390px (content max 480px).

Goal: report a functional problem quickly, without photos, and know exactly what happens next. Feeling: heard and taken seriously, not blamed.

## Layout, top to bottom

1. **Header**: back arrow (`aria-label="Back to your order"`), title "Report a problem", and on the right a saffron countdown chip: a 20px ring and "Report within 21h 04m" (server `hold_until`).
2. **Headline** `type-headline` "What's wrong with your item?"; line text-muted "Your money stays held while we sort this out."
3. **Item card**: 56px photo, "iPhone 13, 128GB, Midnight", "Serial ••••1234" (mono).
4. **Step 1 card, "Choose the problem"**: radio cards (`Choice`, 56px min height, icon left):
   - "It doesn't work properly" (power icon) → `not_working`
   - "Damaged when it arrived" (crack icon) → `damaged_on_arrival`
   - "Parts are missing" (puzzle icon) → `missing_parts`
   - "Not as described" (file-x icon) → `not_as_described`
   - "Something else" (help icon) with a plum tag "Goes to Vekro support" → `other`
   Under the cards, text-muted: "Amina Gadgets covers: Won't power on, Screen or touch problem." (the listing's `accepted_problems`, when declared).
5. **Step 2 card, "Tell us more"**: textarea label "What's happening?", helper "What happens? When did it start?", 20 to 500 characters, live counter "120/500" (mono; coral outside the range).
6. **What happens next** card: a three-step mini `Timeline` (dashed, upcoming): "Send the item back", "The seller checks it", "The seller {refunds you | repairs it | replaces it}" with the seller's declared resolution highlighted (emerald text). For "Something else": "Vekro support reviews your report" replaces steps 2 and 3. Note: "The seller must follow the policy they declared when listing."
7. **Confirmation**: checkbox "I understand I need to send the item back." (hidden for "Something else", which skips the return).
8. **Action dock**: primary "Submit report", ghost "Cancel" (to B3).

## Success screen (same route, replaces the form)

Vault card with a coral ring and pill "Issue reported", headline "We've told the seller", numbered steps "1. Send the item back to Amina Gadgets. 2. Tap "I've sent it back" so the seller knows it's coming." Primary "Next: send the item back" (to B6). For "Something else": headline "Vekro support has your report", body "We'll message you by SMS. Your money stays in the vault until it's decided.", primary "See your order" (to B3).

## Controls

| Control | Label | Style | Enabled when | Result |
| --- | --- | --- | --- | --- |
| Back | arrow | icon button | always | B3 |
| Problem card | as above | radio cards | window open | selects one |
| Description | "What's happening?" | textarea | always | counter updates |
| Confirm | "I understand I need to send the item back." | checkbox | not "Something else" | required |
| Submit report | "Submit report" | primary | category + 20 to 500 chars + checkbox (when shown), online | `POST report-functional-issue` `{ category, description }`; success screen |
| Cancel | "Cancel" | ghost | always | B3 |

## States

| State | Design |
| --- | --- |
| Loading | header, item and card skeletons |
| Window closed (not `hold_24h`, deadline passed) | form disabled, saffron `Banner` "The reporting window has closed." action "Get help" (X3) |
| Not eligible (standard item) | `EmptyState` "Sales of this type are final once you give your code." action "Back to your order" |
| Already reported (dispute states) | redirect to B6 |
| Submit error | coral `Banner` with the reason; form keeps its values |
| Offline | sand `Banner`; Submit disabled; the draft stays in the form |

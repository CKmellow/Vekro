# A3 Case detail and decision: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` A3, `.stitch/DESIGN.md` (dark console), `api/openapi.json` (`GET /admin/disputes/{id}/timeline`, `POST /admin/disputes/{id}/force-resolve`).

Route `/admin/cases/:id` (`:id` is the dispute id). Admin. Device: desktop 1440px (7 / 5 columns).

Goal: read the whole story calmly, then make one clear, binding decision. Feeling: careful and accountable.

## Layout

1. **Header**: back "Queue", case id (mono, copy button), order reference (mono, copy), trigger tag (plum), amount held "KES 52,000" (Bricolage), age badge.
2. **Left (7)**:
   - **Party cards** side by side: Buyer (name, full phone with a `tel:` link "Call", orders with Vekro count), Seller (shop name, full phone with "Call", completed sales, dispute rate).
   - **Item card**: title, serial in full (admins only), the seller's declared policy ("Repair then release"; options as chips).
   - **Two accounts** side by side: "Buyer says" (category chip and the quoted description), "Seller says" (their chosen action and note, or "No response yet"; and the escalation reason when the seller escalated).
   - **Timeline**: every event with exact EAT timestamps (date and seconds) and actor, including automatic escalations ("Seller didn't confirm receipt in 3 days"). Message bodies only; payloads are never shown (they can hold delivery codes).
3. **Right (5, sticky)**: **Decision panel** (`dark-surface-raised`):
   - Radio cards: "Refund buyer" (the buyer gets KES 52,000), "Release to seller" (the seller gets KES 52,000), "Split" (shows the division).
   - Split: two KES inputs "To the buyer" / "To the seller" that always add up to the amount held (editing one updates the other), and a live bar (lake for the buyer, emerald for the seller) with percentages.
   - Reason textarea, required, 20 to 1,000 characters, label "Reason for the decision", helper "Shown to both parties and logged."
   - Primary (plum) "Review decision" (disabled until a decision and a valid reason).
4. **Confirm dialog** (plum): restates the outcome in words ("Refund KES 52,000 to Brian Otieno. Amina Gadgets receives nothing."), shows the reason, asks to type the case id ("Type D-7K3P to confirm"), and ends with "Confirm and execute" (enabled only when the id matches) and "Cancel".

## States

| State | Design |
| --- | --- |
| Undecided | as above |
| Split selected | inputs and bar visible |
| Confirm dialog | as above |
| Executing | dialog button spinner; panel locked; "Executing… don't close this page." |
| Failed | coral banner in the panel with the server's message and "Retry" (same decision and reason) |
| Split unsupported | the backend refuses split (capability error): coral line under the Split card "Split payouts aren't available with the current payment provider. Choose refund or release." and Split is disabled |
| Decided (read only) | the panel becomes a summary: decision, amounts, admin name, EAT time, reason; no inputs |
| Loading / error / not found | skeleton; coral banner with "Try again"; "This case doesn't exist" with "Back to queue" |

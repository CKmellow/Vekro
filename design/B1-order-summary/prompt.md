# B1 Order summary and pay: design brief

Code-ready brief (no Stitch render, Cyprian 2026-10-17). Sources: `docs/PAGES.md` B1 and its Deviations, `docs/FRONTEND_CONTRACT.md` A and B, `.stitch/DESIGN.md`. Where the contract changes PAGES.md, this brief follows the contract.

Route `/pay/:listingId` (public `GET /listings/{listing_id}`). Buyer, no login needed to view. Device: mobile 390px; from 600px the 480px column stays centred over the mesh.

Goal: in five seconds the buyer knows what they are buying, from whom, for how much and why the money is safe, then pays. Feeling: "this looks professional and I am protected".

## Foundation

- Shell: `BuyerLayout` (56px frosted header, Vekro mark left, "Protected by Vekro Escrow" pill right, 480px column on `bg-mesh` over `bg-background`). Header overflow adds "Need help?" (to X3).
- Tokens only: `bg-surface` cards at 20px radius with `shadow-1`; `bg-vault` only for the money moment; emerald-700 for the single primary; saffron for time, coral for problems, lake for "serial-numbered" and in-motion.
- Type: `type-headline` (Bricolage) for the title, `type-amount` for money, DM Sans body at 15px minimum, JetBrains Mono for phone digits and references.
- Spacing: 16px between cards, 20px card padding, 20px side gutters. Action dock: frosted, sticky, safe-area aware, `pb-32` on the column so nothing hides under it.

## Layout, top to bottom

1. **Hero product card** (`Card`, 20px radius, image bleeds to the card edge at the top)
   - 4:3 photo carousel, 14px inner radius, 1px inner border; dots below the photo; swipe; tap opens a full-screen zoom viewer with pinch.
   - Floating pill top-left on the photo: "Serial-numbered" (lake, scan-barcode icon) or "Inspect at your door" (emerald, eye icon).
   - Title "iPhone 13, 128GB, Midnight" (`type-headline`, two lines max, balanced).
   - Seller row: 40px initials avatar "AG" on emerald-50, "Amina Gadgets" with a verified check, then muted "Kilimani, Nairobi · 412 sales".
   - Price "KES 52,000" in `type-amount`, counting up once on first render.
2. **Description**: three lines clamped, "Read more" ghost text expands in place.
3. **Seller promise strip** (emerald-50 card, shield-check icon): "Seller offers: Refund · Repair". Serialized adds a second line: "You have 24 hours after delivery to report a problem."
4. **"How your money stays safe"** card, collapsed to one line with a "See how it works" chevron; expands with a spring into a four-step vertical stepper:
   1. smartphone: "Pay with M-Pesa"
   2. lock: "Vekro holds your money"
   3. eye: "Inspect at your door"
   4. key: "Enter your code to release payment" (contract C wording; the buyer types the code, never shows it)
5. **Pay card** (`Card`):
   - **Signed out: "Save your details to track this order"** (contract A, compact, not a signup page). Sub line: "We'll send the M-Pesa prompt to this number and text you a link to track your order."
     - `PhoneField` label "M-Pesa phone number", placeholder "712 345 678", `+254` chip.
     - `TextField` "Your name" (register variant only; required by the API, so not "optional").
     - `PasswordField` "Create a password" (register) or "Password" (log in), with the password rules hint from S1.
     - Variant switch as one ghost text line: "Already have a Vekro account? Log in" / "New to Vekro? Save your details instead".
   - **Signed in**: a single row "Paying as +254 712 *** 678" with ghost "Not you?" (logs out, returns to the signed-out card).
   - **Receipt summary** (sunken `bg-surface-sunken` block, mono amounts right-aligned): "Item" KES 52,000; "Vekro fee" "No extra fees for you" (muted, no strike-through); divider; "Total" KES 52,000 in bold.
   - **Terms**: checkbox "I agree to the Terms and understand how Vekro escrow works"; "Terms" is an inline link that opens a bottom sheet.
6. **Action dock** (frosted, sticky): primary `Button` full width, 52px, lock icon then "Pay KES 52,000 with M-Pesa". Under it, centred muted `type-body-sm`: "Secured by Vekro Escrow".

## Controls

| Control | Label | Style | Enabled when | Result |
| --- | --- | --- | --- | --- |
| Photo carousel | (swipe) | n/a | photos exist | Opens the full-screen zoom viewer |
| Read more | "Read more" / "Show less" | ghost text | description longer than three lines | Expands in place |
| How it works | "See how it works" / "Hide steps" | ghost text, chevron | always | Expands the four steps |
| Phone | "M-Pesa phone number", placeholder "712 345 678" | `PhoneField` | signed out | Live format; 9 digits starting 7 or 1 |
| Name | "Your name" | `TextField` | register variant | Required, 2 to 120 characters |
| Password | "Create a password" / "Password" | `PasswordField` | signed out | S1 rules on register |
| Variant switch | "Already have a Vekro account? Log in" / "New to Vekro? Save your details instead" | ghost text | signed out | Swaps register and log in |
| Not you | "Not you?" | ghost text | signed in | Logs out, shows the signed-out card |
| Terms checkbox | "I agree to the Terms and understand how Vekro escrow works" | `Checkbox` | always | Required |
| Terms link | "Terms" | inline link | always | Opens the terms sheet ("Close" button) |
| Pay | "Pay KES 52,000 with M-Pesa" | primary, 52px, lock icon | form valid and terms ticked | Saves details if needed, creates the transaction, goes to B2 |
| Help | "Need help?" | header overflow item | always | Opens X3 |

No order ID field: before payment there is no order (contract A). The reference (`VK-7K3P9Q` style) first appears on B2.

## States and variants

| Variant | What changes |
| --- | --- |
| Default, serialized | iPhone 13, KES 52,000, "Serial-numbered" pill, 24-hour promise line |
| Default, standard | Nike Air Force 1 size 42, KES 6,500, "Inspect at your door" pill, promise strip without the 24-hour line |
| Save details: register | phone, name, create password |
| Save details: log in | phone, password; "Welcome back" sub line |
| Signed in | "Paying as +254 712 *** 678 · Not you?" row, no fields |
| Loading | `SkeletonGroup` in the final layout: 4:3 photo block, three text lines, promise strip, form block |
| Link not found | `EmptyState`, broken-link illustration: "We can't find this item" / "The link may be old or mistyped. Ask the seller to send it again." No action button (there is nothing to retry) |
| Listing withdrawn | Hero card dimmed to 60%, sand banner "The seller has withdrawn this item"; pay card and dock hidden |
| Already paid | Emerald `Banner` "This item has already been paid for"; dock primary becomes "Track this order" only if the signed-in buyer owns the order, otherwise no dock |
| Phone invalid | Inline coral icon + "Enter a Kenyan mobile number, like 712 345 678", announced politely |
| Payment provider slow | Saffron `Banner` above the pay card: "M-Pesa is slow right now. You can still try." |
| Submit error | 422 shows field errors; 409 refetches and toasts; other failures show a coral banner "We couldn't start the payment. Try again." |
| Offline | Network banner; Pay disabled with "You're offline" helper |
| Terms sheet | `Sheet` titled "Terms", scrollable plain-language summary, "Close" |

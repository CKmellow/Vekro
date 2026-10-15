# S3: Stitch prompts

Design system: Vekro (`assets/3f76e23767ff46c69a4931548f3cd1b2`). Each prompt was enhanced with the enhance-prompt skill from `docs/PAGES.md` S3 plus the Deviations section and `docs/FRONTEND_CONTRACT.md`. Edit passes follow each prompt.

## S3-step1-desktop

Desktop (1440px) seller onboarding, step 1 of 2 "Your shop", for Vekro. Feeling: clear and fair. No sidebar: a focused onboarding page.

**DESIGN SYSTEM (REQUIRED): Vekro**
- Theme: light, warm, premium Kenyan fintech, "a warm, confident vault". Generous whitespace, calm, never a template look.
- Background: Warm Sand (#FBF9F4). Cards: white (#FFFFFF), 20px radius, soft two-layer shadow. Sunken areas Sand-100 (#F5F1E7). Borders Sand-200 (#EAE4D4).
- Primary: Emerald-700 (#0A6E4C) for the ONE primary button per screen (white text, 52px tall, 14px radius). Vault surfaces: 140deg gradient Emerald-950 (#04251C) to Emerald-800 (#084D3B) with a soft glow (#3DEBA6) top-right and an inner top highlight, 28px radius.
- Text: Ink-950 (#0B1512) primary, Ink-500 (#5E6D67) muted. No pure black, no cold grey, no purple gradients.
- Semantic: Saffron #F2A516 fills with #8A5B00 text on #FFF6E0 tints (time, warnings); Coral #E5484D with #C93238 text on #FDECEC (errors, irreversible); Lake #1F66C8 on #E8F1FD (info, in motion); Plum #4F36B0 on #EFEBFC (Vekro support).
- Type: Bricolage Grotesque 700-800 for headlines and money; DM Sans for body; small uppercase tracked DM Sans labels ABOVE each field; JetBrains Mono for phone numbers, links, references and serials.
- Inputs 56px, 14px radius, Sand-200 border, emerald focus ring; errors show a coral icon plus message (never colour alone). Status pills: icon + label on a tint, full radius.
- Icons: Lucide-style 2px line icons. No emoji, no photos of people, no crypto imagery.
- Copy: only the text given below. No regulatory or compliance claims or badges (no CBK, "regulated", "licensed", "insured", "bank-grade"), no invented order numbers, no flags. The Vekro logo is an emerald rounded square with a white "V" of two strokes.
- Sample data: seller "Amina Gadgets", Kilimani, Nairobi, phone +254 722 118 904 (masked +254 722 *** 904); item "iPhone 13, 128GB, Midnight" KES 52,000; network fee KES 130; seller receives KES 51,870.

**Page Structure:**
1. **Top bar:** Vekro mark + wordmark left; right muted text "Signed in as Amina Wanjiru".
2. **Progress:** centered two-step progress bar, 560px wide: step 1 "Your shop" (current, emerald filled node with "1"), step 2 "Get paid" (upcoming, sand outline node "2"); emerald segment half filled. Small label "STEP 1 OF 2".
3. **Main card (white, 640px, centered):** headline "Tell buyers who you are"; muted line "This shows on every Trust Link you share."
   - Logo upload: 96px dashed circle with an image-plus icon and "Add logo" (link "Upload"), helper "Optional. Square photos work best; we crop to a circle."
   - "SHOP DISPLAY NAME" field "Amina Gadgets".
   - "CITY OR AREA" select showing "Kilimani, Nairobi" with a chevron.
   - "SHORT DESCRIPTION" textarea "Genuine phones and laptops with warranty. Delivery across Nairobi." with counter "68/160", helper "Shown to buyers on your listings."
4. **Right of the card, a small live preview (300px):** label "HOW BUYERS SEE YOU", a mini white card: circular "AG" avatar, "Amina Gadgets", "Kilimani, Nairobi", and an emerald "Protected by Vekro Escrow" pill.
5. **Footer row in the card:** primary emerald button "Next" on the right (only primary). No Back on step 1.

## S3-step2-desktop

Desktop (1440px) seller onboarding, step 2 of 2 "Get paid", for Vekro. Feeling: clear and fair; the fees are explained honestly.

**DESIGN SYSTEM (REQUIRED): Vekro**
- Theme: light, warm, premium Kenyan fintech, "a warm, confident vault". Generous whitespace, calm, never a template look.
- Background: Warm Sand (#FBF9F4). Cards: white (#FFFFFF), 20px radius, soft two-layer shadow. Sunken areas Sand-100 (#F5F1E7). Borders Sand-200 (#EAE4D4).
- Primary: Emerald-700 (#0A6E4C) for the ONE primary button per screen (white text, 52px tall, 14px radius). Vault surfaces: 140deg gradient Emerald-950 (#04251C) to Emerald-800 (#084D3B) with a soft glow (#3DEBA6) top-right and an inner top highlight, 28px radius.
- Text: Ink-950 (#0B1512) primary, Ink-500 (#5E6D67) muted. No pure black, no cold grey, no purple gradients.
- Semantic: Saffron #F2A516 fills with #8A5B00 text on #FFF6E0 tints (time, warnings); Coral #E5484D with #C93238 text on #FDECEC (errors, irreversible); Lake #1F66C8 on #E8F1FD (info, in motion); Plum #4F36B0 on #EFEBFC (Vekro support).
- Type: Bricolage Grotesque 700-800 for headlines and money; DM Sans for body; small uppercase tracked DM Sans labels ABOVE each field; JetBrains Mono for phone numbers, links, references and serials.
- Inputs 56px, 14px radius, Sand-200 border, emerald focus ring; errors show a coral icon plus message (never colour alone). Status pills: icon + label on a tint, full radius.
- Icons: Lucide-style 2px line icons. No emoji, no photos of people, no crypto imagery.
- Copy: only the text given below. No regulatory or compliance claims or badges (no CBK, "regulated", "licensed", "insured", "bank-grade"), no invented order numbers, no flags. The Vekro logo is an emerald rounded square with a white "V" of two strokes.
- Sample data: seller "Amina Gadgets", Kilimani, Nairobi, phone +254 722 118 904 (masked +254 722 *** 904); item "iPhone 13, 128GB, Midnight" KES 52,000; network fee KES 130; seller receives KES 51,870.

**Page Structure:**
1. **Top bar:** Vekro mark + wordmark; right muted "Signed in as Amina Wanjiru".
2. **Progress:** two-step bar: step 1 "Your shop" done (emerald node with check), step 2 "Get paid" current (emerald node "2", pulsing ring); bar fully emerald. Label "STEP 2 OF 2".
3. **Two-column content, 1040px:**
   - **Left card (white):** headline "Where should we send your money?"; muted line "Payouts go to M-Pesa. You're paid only after the buyer accepts the item."
     - "M-PESA PAYOUT NUMBER" field with "+254" chip, value "722 118 904".
     - "CONFIRM M-PESA NUMBER" field with "+254" chip, value "722 118 904" and a small emerald check "Numbers match".
     - "NAME ON M-PESA" field "AMINA WANJIRU", helper "We check this matches before the first payout."
     - Trust note row with a shield icon on an emerald-50 tint: "You're paid only after the buyer accepts the item. Money waits safely in the vault until then."
   - **Right card: fee explainer (white, emerald-50 header strip):** title "How your payout works"; label "SALE AMOUNT" with a large slider (emerald track, thumb) at "KES 52,000" (range KES 500 to KES 200,000); a full-width stacked horizontal bar, 48px tall, 14px radius: large emerald segment "You receive KES 51,870" and a thin sand segment "Network fee KES 130"; below, three rows in a mini table with mono amounts: "Buyer pays" KES 52,000; "Network fee" KES 130; "You receive" KES 51,870 (bold, emerald). Caption: "The network fee is what M-Pesa charges to move the money. Vekro shows it before every sale."
4. **Footer:** ghost button "Back" on the left; primary emerald "Save and finish" on the right.

### Edit pass 1

Targeted copy fixes only; keep the layout and styling exactly as they are.
1. Remove the footer row ("© 2024 Vekro Technologies Inc. Escrow Security." and its links).
2. Under "How your payout works", replace "Zero hidden deductions. What you see is precisely what arrives in your M-Pesa account." with "See exactly what reaches your M-Pesa before every sale." Remove the "FAIR & CLEAR" tag.
3. Remove the broken icon box after "Network fee" in the table, and the lightning icon at the end of the stacked bar.
4. Remove "Simulated Sale".

### Edit pass 2

One fix only; keep everything else exactly as it is: the helper under "NAME ON M-PESA" reads "As it appears on your M-Pesa account." (replace "We check this matches before the first payout.").

## S3-step2-mobile

Mobile (390px) seller onboarding step 2 "Get paid" for Vekro, showing the MISMATCHED NUMBER state.

**DESIGN SYSTEM (REQUIRED): Vekro**
- Theme: light, warm, premium Kenyan fintech, "a warm, confident vault". Generous whitespace, calm, never a template look.
- Background: Warm Sand (#FBF9F4). Cards: white (#FFFFFF), 20px radius, soft two-layer shadow. Sunken areas Sand-100 (#F5F1E7). Borders Sand-200 (#EAE4D4).
- Primary: Emerald-700 (#0A6E4C) for the ONE primary button per screen (white text, 52px tall, 14px radius). Vault surfaces: 140deg gradient Emerald-950 (#04251C) to Emerald-800 (#084D3B) with a soft glow (#3DEBA6) top-right and an inner top highlight, 28px radius.
- Text: Ink-950 (#0B1512) primary, Ink-500 (#5E6D67) muted. No pure black, no cold grey, no purple gradients.
- Semantic: Saffron #F2A516 fills with #8A5B00 text on #FFF6E0 tints (time, warnings); Coral #E5484D with #C93238 text on #FDECEC (errors, irreversible); Lake #1F66C8 on #E8F1FD (info, in motion); Plum #4F36B0 on #EFEBFC (Vekro support).
- Type: Bricolage Grotesque 700-800 for headlines and money; DM Sans for body; small uppercase tracked DM Sans labels ABOVE each field; JetBrains Mono for phone numbers, links, references and serials.
- Inputs 56px, 14px radius, Sand-200 border, emerald focus ring; errors show a coral icon plus message (never colour alone). Status pills: icon + label on a tint, full radius.
- Icons: Lucide-style 2px line icons. No emoji, no photos of people, no crypto imagery.
- Copy: only the text given below. No regulatory or compliance claims or badges (no CBK, "regulated", "licensed", "insured", "bank-grade"), no invented order numbers, no flags. The Vekro logo is an emerald rounded square with a white "V" of two strokes.
- Sample data: seller "Amina Gadgets", Kilimani, Nairobi, phone +254 722 118 904 (masked +254 722 *** 904); item "iPhone 13, 128GB, Midnight" KES 52,000; network fee KES 130; seller receives KES 51,870.

**Page Structure:**
1. **Top:** Vekro mark; two-step progress bar "Your shop" (done, check) and "Get paid" (current); label "STEP 2 OF 2".
2. **Headline:** "Where should we send your money?" and muted line "Payouts go to M-Pesa after the buyer accepts the item."
3. **Fields:** "M-PESA PAYOUT NUMBER" with "+254" chip value "722 118 904"; "CONFIRM M-PESA NUMBER" with "+254" chip value "722 118 940", coral border and coral message with alert icon "The numbers don't match. Check the last digits."; "NAME ON M-PESA" "AMINA WANJIRU".
4. **Fee explainer card (white):** title "How your payout works"; slider "SALE AMOUNT KES 52,000"; stacked bar: emerald "You receive KES 51,870" and thin sand "Fee KES 130"; mini table Buyer pays KES 52,000 / Network fee KES 130 / You receive KES 51,870.
5. **Sticky bottom action dock (frosted white, top hairline):** ghost "Back" and primary emerald "Save and finish" (shown disabled while numbers don't match).

### Edit pass 1

Targeted copy fixes only; keep the layout and styling exactly as they are (including the mismatched-number error).
1. Remove the "VERIFIED" badge from the NAME ON M-PESA field.
2. Replace the note "Funds stay safely held in escrow and disburse instantly to this registered M-Pesa line upon package delivery." with "You're paid only after the buyer accepts the item. Money waits safely in the vault until then."
3. Remove the "ESCROW PROTECTION" pill.

## S3-saved

Mobile (390px) seller onboarding SUCCESS screen for Vekro: "You're ready to sell". A calm celebration, no confetti.

**DESIGN SYSTEM (REQUIRED): Vekro**
- Theme: light, warm, premium Kenyan fintech, "a warm, confident vault". Generous whitespace, calm, never a template look.
- Background: Warm Sand (#FBF9F4). Cards: white (#FFFFFF), 20px radius, soft two-layer shadow. Sunken areas Sand-100 (#F5F1E7). Borders Sand-200 (#EAE4D4).
- Primary: Emerald-700 (#0A6E4C) for the ONE primary button per screen (white text, 52px tall, 14px radius). Vault surfaces: 140deg gradient Emerald-950 (#04251C) to Emerald-800 (#084D3B) with a soft glow (#3DEBA6) top-right and an inner top highlight, 28px radius.
- Text: Ink-950 (#0B1512) primary, Ink-500 (#5E6D67) muted. No pure black, no cold grey, no purple gradients.
- Semantic: Saffron #F2A516 fills with #8A5B00 text on #FFF6E0 tints (time, warnings); Coral #E5484D with #C93238 text on #FDECEC (errors, irreversible); Lake #1F66C8 on #E8F1FD (info, in motion); Plum #4F36B0 on #EFEBFC (Vekro support).
- Type: Bricolage Grotesque 700-800 for headlines and money; DM Sans for body; small uppercase tracked DM Sans labels ABOVE each field; JetBrains Mono for phone numbers, links, references and serials.
- Inputs 56px, 14px radius, Sand-200 border, emerald focus ring; errors show a coral icon plus message (never colour alone). Status pills: icon + label on a tint, full radius.
- Icons: Lucide-style 2px line icons. No emoji, no photos of people, no crypto imagery.
- Copy: only the text given below. No regulatory or compliance claims or badges (no CBK, "regulated", "licensed", "insured", "bank-grade"), no invented order numbers, no flags. The Vekro logo is an emerald rounded square with a white "V" of two strokes.
- Sample data: seller "Amina Gadgets", Kilimani, Nairobi, phone +254 722 118 904 (masked +254 722 *** 904); item "iPhone 13, 128GB, Midnight" KES 52,000; network fee KES 130; seller receives KES 51,870.

**Page Structure:**
1. **Hero:** a large vault card (28px radius, emerald gradient, glow) centered: a 96px mint lock ring with the lock OPEN and a check badge, label "PAYOUTS GO TO", mono "+254 722 *** 904", and "Amina Gadgets".
2. **Headline (display 34px):** "You're ready to sell"; body "Create a listing, share your Trust Link on WhatsApp or Instagram, and get paid when the buyer accepts the item."
3. **Three numbered mini steps (row cards with icons):** "1 · List your item", "2 · Share the link", "3 · Get paid after the buyer accepts".
4. **Bottom:** full-width primary emerald button "Create your first listing"; ghost link button "Go to dashboard".

### Edit pass 1

Targeted copy fixes only; keep the layout and styling exactly as they are.
1. Step 3 title: "3 · Get paid after the buyer accepts"; its line: "The money moves from the vault to your M-Pesa once the buyer accepts the item."
2. Step 1 line: "Add photos, a price and what happens if something is wrong."
3. Step 2 line: "Share your Trust Link on WhatsApp, Instagram or Facebook."
4. Remove the lock icon at the top right of the header.

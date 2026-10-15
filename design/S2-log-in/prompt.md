# S2: Stitch prompts

Design system: Vekro (`assets/3f76e23767ff46c69a4931548f3cd1b2`). Each prompt was enhanced with the enhance-prompt skill from `docs/PAGES.md` S2 plus the Deviations section and `docs/FRONTEND_CONTRACT.md`. Edit passes follow each prompt.

## S2-desktop

Desktop (1440px) seller log-in screen for Vekro, matching the seller sign-up screen. Feeling: welcome back, quick.

**DESIGN SYSTEM (REQUIRED): Vekro**
- Theme: light, warm, premium Kenyan fintech, "a warm, confident vault". Generous whitespace, calm, never a template look.
- Background: Warm Sand (#FBF9F4). Cards: white (#FFFFFF), 20px radius, soft two-layer shadow. Sunken areas Sand-100 (#F5F1E7). Borders Sand-200 (#EAE4D4).
- Primary: Emerald-700 (#0A6E4C) for the ONE primary button per screen (white text, 52px tall, 14px radius). Vault surfaces: 140deg gradient Emerald-950 (#04251C) to Emerald-800 (#084D3B) with a soft glow (#3DEBA6) top-right and an inner top highlight, 28px radius.
- Text: Ink-950 (#0B1512) primary, Ink-500 (#5E6D67) muted. No pure black, no cold grey, no purple gradients.
- Semantic: Saffron #F2A516 fills with #8A5B00 text on #FFF6E0 tints (time, warnings); Coral #E5484D with #C93238 text on #FDECEC (errors, irreversible); Lake #1F66C8 on #E8F1FD (info, in motion); Plum #4F36B0 on #EFEBFC (Vekro support).
- Type: Bricolage Grotesque 700-800 for headlines and money; DM Sans for body; small uppercase tracked DM Sans labels ABOVE each field; JetBrains Mono for phone numbers, links, references and serials.
- Inputs 56px, 14px radius, Sand-200 border, emerald focus ring; errors show a coral icon plus message (never colour alone). Status pills: icon + label on a tint, full radius.
- Icons: Lucide-style 2px line icons. No emoji, no photos of people, no crypto imagery.
- Sample data: seller "Amina Gadgets", Kilimani, Nairobi, phone +254 722 118 904 (masked +254 722 *** 904); item "iPhone 13, 128GB, Midnight" KES 52,000; network fee KES 130; seller receives KES 51,870.

**Page Structure (split screen, no sidebar):**
1. **Left panel (55%):** emerald vault gradient with grain and glow; Vekro mark + wordmark; headline (white, display 44px) "Welcome back"; line "Your money is safe in the vault. Let's get your orders moving."; a floating mini vault card: mono "VK-7K3P9Q", "AMOUNT HELD", "KES 52,000", mint closed lock ring, dot "Paid, ready to dispatch".
2. **Right panel (45%):** warm sand, white form card (max 440px) centered:
   - Saffron banner at the top of the card (tint #FFF6E0, clock icon, text #8A5B00): "Your session expired. Log in again."
   - Headline "Log in to Vekro".
   - "PHONE NUMBER" field with "+254" chip, value "722 118 904".
   - "PASSWORD" field with eye toggle (show/hide).
   - Full-width emerald button "Log in".
   - Link line "New here? Create an account".
   - No "Forgot password?" link.

### Edit pass 1

Targeted copy and brand fixes only. Keep the layout, colours, fonts and every other element as they are.
1. Remove every regulatory, security or infrastructure claim and badge: "KENYA CBK REGULATED ESCROW", "Regulated P2P Escrow Services", "Regulated Escrow Infrastructure · CBK Compliant", "Bank-grade 256-bit encrypted Kenyan escrow channel", "End-to-end 256-bit encrypted Kenyan escrow channel", "GATEWAY v2.8.4 · NBO-NODE-1", "Dual-key release authorization", "Instant M-Pesa B2C settlement", "Protected by Vekro Vault · Kenyan Trust Layer", "SELLER · Secure". Do not replace them.
2. Remove every "Forgot password?" / "Forgot?" link.
3. Logo: the Vekro mark is an emerald (#0A6E4C) rounded square with a white "V" of two strokes, next to the wordmark "Vekro". Not a lock or shield.
4. Mini vault card: remove "Order #8834" and the payout and fee line; keep "VK-7K3P9Q", "AMOUNT HELD", "KES 52,000", the lock ring and the pill "Paid, ready to dispatch".
5. Wrong-details card: the only error text is the coral banner "Phone or password doesn't match. Check them and try again." Remove the field message "Incorrect password. Check your capital letters."
6. Replace the heading "Seller Verification Gateways" and the tag "ERROR STATES VISUAL COMPARISON" with nothing.
7. Sub line under "Log in to Vekro": "Use the phone number you signed up with."
8. Remove the "Back to Vekro.co.ke" link.

## S2-mobile

Mobile (390px) seller log-in screen for Vekro.

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
1. **Emerald header strip (about 180px):** vault gradient with glow; Vekro mark + wordmark; headline (white) "Welcome back"; small line "Log in to manage your orders and payouts."
2. **White form card overlapping the strip by 40px:**
   - Plum-tint banner (#EFEBFC, shield icon, text #4F36B0): "This area is for sellers. Log in with a seller account."
   - Headline "Log in to Vekro".
   - "PHONE NUMBER" field with "+254" chip and value "722 118 904".
   - "PASSWORD" field with eye toggle.
   - Full-width emerald button "Log in".
   - Link "New here? Create an account".
   - No "Forgot password?" link, no footer, no copyright line, no security badges.

### Edit pass 1

Targeted copy and brand fixes only. Keep the layout, colours, fonts and every other element as they are.
1. Remove every regulatory, security or infrastructure claim and badge: "KENYA CBK REGULATED ESCROW", "Regulated P2P Escrow Services", "Regulated Escrow Infrastructure · CBK Compliant", "Bank-grade 256-bit encrypted Kenyan escrow channel", "End-to-end 256-bit encrypted Kenyan escrow channel", "GATEWAY v2.8.4 · NBO-NODE-1", "Dual-key release authorization", "Instant M-Pesa B2C settlement", "Protected by Vekro Vault · Kenyan Trust Layer", "SELLER · Secure". Do not replace them.
2. Remove every "Forgot password?" / "Forgot?" link.
3. Logo: the Vekro mark is an emerald (#0A6E4C) rounded square with a white "V" of two strokes, next to the wordmark "Vekro". Not a lock or shield.
4. Mini vault card: remove "Order #8834" and the payout and fee line; keep "VK-7K3P9Q", "AMOUNT HELD", "KES 52,000", the lock ring and the pill "Paid, ready to dispatch".
5. Wrong-details card: the only error text is the coral banner "Phone or password doesn't match. Check them and try again." Remove the field message "Incorrect password. Check your capital letters."
6. Replace the heading "Seller Verification Gateways" and the tag "ERROR STATES VISUAL COMPARISON" with nothing.
7. Sub line under "Log in to Vekro": "Use the phone number you signed up with."
8. Remove the "Back to Vekro.co.ke" link.

### Edit pass 2

Restore this mobile screen to a single log-in form (it is not a states comparison):
1. Keep the emerald header strip with the Vekro mark, "Welcome back" and the mini vault card exactly as they are.
2. Below it show ONE white form card only: a plum-tint banner (#EFEBFC, shield icon, text #4F36B0) "This area is for sellers. Log in with a seller account."; headline "Log in to Vekro"; sub line "Use the phone number you signed up with."; "PHONE NUMBER" field with the "+254" chip and "722 118 904"; "PASSWORD" field with an eye toggle (normal border, no error); full-width emerald "Log in" button; link "New here? Create an account".
3. Remove the "WRONG DETAILS" and "TOO MANY ATTEMPTS" captions, the coral banner, the second card and the countdown.

## S2-states

Desktop (1440px) Vekro seller log-in screen, ERROR STATES variant. Same split as the log-in screen: left 55% emerald vault gradient panel with "Welcome back" and a mini vault card "KES 52,000"; right 45% warm sand with TWO white form cards side by side (each max 400px), labelled above in small muted caps "WRONG DETAILS" and "TOO MANY ATTEMPTS".

**DESIGN SYSTEM (REQUIRED): Vekro**
- Theme: light, warm, premium Kenyan fintech, "a warm, confident vault". Generous whitespace, calm, never a template look.
- Background: Warm Sand (#FBF9F4). Cards: white (#FFFFFF), 20px radius, soft two-layer shadow. Sunken areas Sand-100 (#F5F1E7). Borders Sand-200 (#EAE4D4).
- Primary: Emerald-700 (#0A6E4C) for the ONE primary button per screen (white text, 52px tall, 14px radius). Vault surfaces: 140deg gradient Emerald-950 (#04251C) to Emerald-800 (#084D3B) with a soft glow (#3DEBA6) top-right and an inner top highlight, 28px radius.
- Text: Ink-950 (#0B1512) primary, Ink-500 (#5E6D67) muted. No pure black, no cold grey, no purple gradients.
- Semantic: Saffron #F2A516 fills with #8A5B00 text on #FFF6E0 tints (time, warnings); Coral #E5484D with #C93238 text on #FDECEC (errors, irreversible); Lake #1F66C8 on #E8F1FD (info, in motion); Plum #4F36B0 on #EFEBFC (Vekro support).
- Type: Bricolage Grotesque 700-800 for headlines and money; DM Sans for body; small uppercase tracked DM Sans labels ABOVE each field; JetBrains Mono for phone numbers, links, references and serials.
- Inputs 56px, 14px radius, Sand-200 border, emerald focus ring; errors show a coral icon plus message (never colour alone). Status pills: icon + label on a tint, full radius.
- Icons: Lucide-style 2px line icons. No emoji, no photos of people, no crypto imagery.
- Sample data: seller "Amina Gadgets", Kilimani, Nairobi, phone +254 722 118 904 (masked +254 722 *** 904); item "iPhone 13, 128GB, Midnight" KES 52,000; network fee KES 130; seller receives KES 51,870.

**Card A (wrong details):** headline "Log in to Vekro"; coral tint banner with alert icon "Phone or password doesn't match. Check them and try again."; "PHONE NUMBER" field with "+254" chip value "722 118 904"; "PASSWORD" field with coral border; emerald button "Log in"; link "New here? Create an account".

**Card B (locked):** headline "Log in to Vekro"; saffron tint banner with a 56px saffron countdown ring showing "04:59" in mono and text "Too many attempts. For your security, try again in 5 minutes."; both fields disabled (sand-100 fill); emerald "Log in" button disabled; link "New here? Create an account".

### Edit pass 1

Targeted copy and brand fixes only. Keep the layout, colours, fonts and every other element as they are.
1. Remove every regulatory, security or infrastructure claim and badge: "KENYA CBK REGULATED ESCROW", "Regulated P2P Escrow Services", "Regulated Escrow Infrastructure · CBK Compliant", "Bank-grade 256-bit encrypted Kenyan escrow channel", "End-to-end 256-bit encrypted Kenyan escrow channel", "GATEWAY v2.8.4 · NBO-NODE-1", "Dual-key release authorization", "Instant M-Pesa B2C settlement", "Protected by Vekro Vault · Kenyan Trust Layer", "SELLER · Secure". Do not replace them.
2. Remove every "Forgot password?" / "Forgot?" link.
3. Logo: the Vekro mark is an emerald (#0A6E4C) rounded square with a white "V" of two strokes, next to the wordmark "Vekro". Not a lock or shield.
4. Mini vault card: remove "Order #8834" and the payout and fee line; keep "VK-7K3P9Q", "AMOUNT HELD", "KES 52,000", the lock ring and the pill "Paid, ready to dispatch".
5. Wrong-details card: the only error text is the coral banner "Phone or password doesn't match. Check them and try again." Remove the field message "Incorrect password. Check your capital letters."
6. Replace the heading "Seller Verification Gateways" and the tag "ERROR STATES VISUAL COMPARISON" with nothing.
7. Sub line under "Log in to Vekro": "Use the phone number you signed up with."
8. Remove the "Back to Vekro.co.ke" link.

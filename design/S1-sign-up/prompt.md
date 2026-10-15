# S1: Stitch prompts

Design system: Vekro (`assets/3f76e23767ff46c69a4931548f3cd1b2`). Each prompt was enhanced with the enhance-prompt skill from `docs/PAGES.md` S1 plus the Deviations section and `docs/FRONTEND_CONTRACT.md`. Edit passes follow each prompt.

## S1-desktop

Desktop (1440px) seller sign-up screen for Vekro, an escrow app for Kenyan social-commerce sellers. Feeling: "this is for people like me". Get started in under a minute.

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
1. **Left panel (55% width):** full-height emerald vault gradient with faint film grain and glow. Vekro mark + wordmark top-left. Headline (display 44px, white): "Sell on social media without getting scammed". Three benefit rows, each a 40px translucent icon tile + one line: lock icon "Buyers pay into escrow, you ship with confidence"; truck icon "Get paid when the buyer accepts the item"; shield icon "Fewer fake orders and no cash-on-delivery losses". Below, a floating mini vault card (28px radius, slight tilt, deeper shadow): mono "VK-7K3P9Q", label "AMOUNT HELD", "KES 52,000", a 56px mint lock ring (closed lock) and a status dot "Paid, funds held safely".
2. **Right panel (45%):** warm sand background, a white form card (max 440px, 20px radius) vertically centered:
   - Headline "Create your seller account", muted line "It takes under a minute."
   - Field "FULL NAME" value "Amina Wanjiru".
   - Field "PHONE NUMBER" with a "+254" prefix chip and value "722 118 904"; helper "You'll log in with this number. We also text payout updates here."
   - Field "SHOP NAME (OPTIONAL)" value "Amina Gadgets".
   - Field "PASSWORD" with an eye toggle (show/hide), value dots; under it a four-segment strength meter (three segments emerald, label "Strong") and a rules checklist with check icons: "8 or more characters", "A number", "A letter".
   - Field "CONFIRM PASSWORD" with an eye toggle and a small emerald check "Passwords match".
   - Checkbox "I agree to the Terms and Privacy Policy" (links underlined emerald).
   - Full-width primary emerald button "Create account".
   - Centered link line "Already selling with Vekro? Log in" (Log in in emerald, semibold).

### Edit pass 1

Targeted copy and brand fixes only. Keep the layout, colours, fonts and every other element exactly as they are.
1. Remove every regulatory or compliance claim, including "Regulated P2P Escrow Services", "CBK & Data Protection Compliant", "CBK REGULATED BANK ESCROW" and "INSTANT M-PESA". Do not replace them with other badges.
2. Replace the left-panel sub line "Emerald carries the money. Everything else is calm sand and ink." with "Buyers pay into a vault locked to the order. You're paid when they accept the item."
3. Logo: use the Vekro mark, an emerald (#0A6E4C) rounded square with a white "V" drawn from two strokes, next to the wordmark "Vekro". Not a shield.
4. Phone prefix chip: remove the flag; show a small neutral emerald dot followed by "+254".
5. Mini vault card: remove "Order #8834" and "M-Pesa ref QK92XY7A1"; keep "VK-7K3P9Q", "AMOUNT HELD", "KES 52,000", the lock ring, the pill "Paid, funds held safely" and the line "Held until the buyer accepts".
6. Remove "Can be changed later" next to the shop name field.
7. Mobile only: the sub line under "Create your seller account" should read "It takes under a minute."

### Edit pass 2

One fix only: remove the stray small green dot that sits outside the right edge of the PHONE NUMBER field. Keep everything else exactly as it is.

## S1-mobile

Mobile (390px) seller sign-up screen for Vekro, an escrow app for Kenyan social-commerce sellers.

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

**Page Structure:**
1. **Emerald header strip (about 220px):** emerald vault gradient with glow; Vekro mark + wordmark; headline (white, display 34px) "Sell on social media without getting scammed"; one small line with a lock icon "Buyers pay into escrow. You ship with confidence."
2. **Form card overlapping the strip by 40px:** white, 20px radius, 20px padding:
   - Title "Create your seller account".
   - "FULL NAME" field "Amina Wanjiru".
   - "PHONE NUMBER" field with "+254" chip, value "722 118 904", helper "You'll log in with this number."
   - "SHOP NAME (OPTIONAL)" field "Amina Gadgets".
   - "PASSWORD" with eye toggle, four-segment strength meter (two segments saffron, label "Fair") and checklist: check "8 or more characters", check "A letter", empty circle "A number".
   - "CONFIRM PASSWORD" with eye toggle.
   - Checkbox "I agree to the Terms and Privacy Policy".
   - Full-width emerald button "Create account" (52px).
   - Link "Already selling with Vekro? Log in".

### Edit pass 1

Targeted copy and brand fixes only. Keep the layout, colours, fonts and every other element exactly as they are.
1. Remove every regulatory or compliance claim, including "Regulated P2P Escrow Services", "CBK & Data Protection Compliant", "CBK REGULATED BANK ESCROW" and "INSTANT M-PESA". Do not replace them with other badges.
2. Replace the left-panel sub line "Emerald carries the money. Everything else is calm sand and ink." with "Buyers pay into a vault locked to the order. You're paid when they accept the item."
3. Logo: use the Vekro mark, an emerald (#0A6E4C) rounded square with a white "V" drawn from two strokes, next to the wordmark "Vekro". Not a shield.
4. Phone prefix chip: remove the flag; show a small neutral emerald dot followed by "+254".
5. Mini vault card: remove "Order #8834" and "M-Pesa ref QK92XY7A1"; keep "VK-7K3P9Q", "AMOUNT HELD", "KES 52,000", the lock ring, the pill "Paid, funds held safely" and the line "Held until the buyer accepts".
6. Remove "Can be changed later" next to the shop name field.
7. Mobile only: the sub line under "Create your seller account" should read "It takes under a minute."

### Edit pass 2

One fix only: remove the stray small green dot that sits outside the right edge of the PHONE NUMBER field. Keep everything else exactly as it is.

## S1-states

Desktop (1440px) Vekro seller sign-up screen, ERROR STATES variant. Same split layout as the sign-up screen: left 55% emerald vault gradient panel with the headline "Sell on social media without getting scammed", three benefit rows (lock, truck, shield) and a floating mini vault card "KES 52,000"; right 45% warm sand panel with the white form card.

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

**Show these states on the form card at once (it is a state reference):**
1. **Server error banner** at the top of the card: coral tint (#FDECEC) banner with an alert icon, title "We couldn't create your account" and body "Something went wrong on our side. Your details are still here. Try again." with a small secondary "Try again" button.
2. "FULL NAME" field "Amina Wanjiru" (valid).
3. "PHONE NUMBER" field with "+254" chip, value "722 118 904", coral border and coral message with alert icon: "This number already has a Vekro account." followed by an emerald link "Log in instead".
4. "PASSWORD" field with coral border, strength meter with one coral segment and label "Too weak", checklist: coral x "8 or more characters", check "A letter", coral x "A number".
5. "CONFIRM PASSWORD" field with coral border and message "Passwords don't match".
6. Checkbox "I agree to the Terms and Privacy Policy" (checked).
7. Primary button "Create account" shown in its disabled state (40% opacity), plus link "Already selling with Vekro? Log in".

### Edit pass 1

Targeted copy and brand fixes only. Keep the layout, colours, fonts and every other element exactly as they are.
1. Remove every regulatory or compliance claim, including "Regulated P2P Escrow Services", "CBK & Data Protection Compliant", "CBK REGULATED BANK ESCROW" and "INSTANT M-PESA". Do not replace them with other badges.
2. Replace the left-panel sub line "Emerald carries the money. Everything else is calm sand and ink." with "Buyers pay into a vault locked to the order. You're paid when they accept the item."
3. Logo: use the Vekro mark, an emerald (#0A6E4C) rounded square with a white "V" drawn from two strokes, next to the wordmark "Vekro". Not a shield.
4. Phone prefix chip: remove the flag; show a small neutral emerald dot followed by "+254".
5. Mini vault card: remove "Order #8834" and "M-Pesa ref QK92XY7A1"; keep "VK-7K3P9Q", "AMOUNT HELD", "KES 52,000", the lock ring, the pill "Paid, funds held safely" and the line "Held until the buyer accepts".
6. Remove "Can be changed later" next to the shop name field.
7. Mobile only: the sub line under "Create your seller account" should read "It takes under a minute."

### Edit pass 2

One fix only: remove the stray small green dot that sits outside the right edge of the PHONE NUMBER field. Keep everything else exactly as it is.

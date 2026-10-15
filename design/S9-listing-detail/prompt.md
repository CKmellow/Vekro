# S9: Stitch prompts

Design system: Vekro (`assets/3f76e23767ff46c69a4931548f3cd1b2`). Each prompt was enhanced with the enhance-prompt skill from `docs/PAGES.md` S9 plus the Deviations section and `docs/FRONTEND_CONTRACT.md`. Edit passes follow each prompt.

## S9-published-desktop

Desktop (1440px) Vekro seller "Listing detail and share" page, JUST PUBLISHED. The moment of success: "my link is ready, share it now".

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
- Seller desktop shell (1440px): 264px sidebar in Emerald-950 (#04251C) with the Vekro mark (emerald rounded square with a white "V" of two strokes) and wordmark; items Dashboard, Orders, Listings, Returns, Analytics, Notifications, Settings (active item = emerald-700 pill, white text; small saffron count badges on Orders "3" and Returns "1"); bottom: a mint (#3DEBA6) "Create listing" button and a profile row "AG · Amina Gadgets · Verified seller". 72px white top bar with a search field "Order ID or item" and a bell with a coral dot.
- Seller mobile shell (390px): top bar "Habari, Amina" with a bell; bottom navigation Home, Orders, a raised emerald circular "+" (New listing), Returns, More.

**Content (inside the seller desktop shell, Listings active):**
1. **Header:** back arrow "Listings"; title "iPhone 13, 128GB, Midnight"; emerald pill "Active"; on the right secondary buttons "Edit", "Duplicate" and a coral-outline "Archive".
2. **Success banner (emerald-50 tint, check icon):** "Your listing is live. Share the link so buyers can pay safely."
3. **Share hero card (full width, emerald vault gradient, 28px radius, glow):** headline (white) "Your Trust Link is ready"; the link in mono on a translucent pill "vekro.co.ke/pay/VK-4299" with a mint "Copy" button; a row of share buttons: WhatsApp (primary in this card: white button with a green WhatsApp-style chat icon "Share on WhatsApp"), "Facebook", "Telegram", "Copy message"; on the right a white rounded tile with a QR code and under it a "Download QR card" text button. Below the buttons, a translucent caption box "iPhone 13 128GB, KES 52,000. Pay safely with Vekro escrow: vekro.co.ke/pay/VK-4299" with a small copy icon.
4. **Two columns below:**
   - Left "Item" card: photo strip of 3 thumbnails, details rows (Price KES 52,000; Category Phones and tablets; Type Serial-numbered, IMEI ends 1234; Policy 24-hour check · Repair then release).
   - Right "Activity" card: "Views 214 · Link clicks 38" and a small 7-day emerald bar mini chart; under it a muted line "No orders yet. You'll see the buyer here once they pay."

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags, metrics or claims.
1. Remove "ESCROW TRUST LAYER", "LISTING ID: VK-4299", "LIVE METRICS", "High conversion interest within the first hour of posting.", "+42% spike", "Stock: 1 unit available", "Escrow settlement" and "M-Pesa Auto-Release Enabled".
2. Rename "Buyer verification" to "Dispute policy" and "Device identifier" to "Item type".
3. Replace the second item photo (an app screenshot) with a product photo of the phone's back on a warm sand backdrop.
4. Hero sub line: "Send this link to buyers on WhatsApp, Instagram or Facebook. They pay into the vault before you dispatch."
5. Sidebar header: "Vekro" with no "Seller Console" subtitle.

## S9-published-mobile

Mobile (390px) Vekro seller "Listing detail and share", JUST PUBLISHED.

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
1. **Top:** back arrow, title "Listing", emerald pill "Active", three-dot menu.
2. **Share hero card (emerald vault gradient, 28px radius):** small mint check "Listing published"; headline (white) "Your Trust Link is ready"; mono link pill "vekro.co.ke/pay/VK-4299" with a "Copy" button; a large full-width white button with a green chat icon "Share on WhatsApp"; a row of three small translucent buttons "Facebook", "Telegram", "Copy message"; a caption box with the suggested message and copy icon.
3. **QR card (white):** QR code, "Download QR card" secondary button.
4. **Item summary card:** thumbnail, "iPhone 13, 128GB, Midnight", "KES 52,000", lake tag "Serial-numbered".
5. Bottom navigation of the seller mobile shell (Home, Orders, raised +, Returns, More).

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags, metrics or claims.
1. Replace "Escrow net payout / Platform service fee (0.25%) KES 130" with three rows: "Price KES 52,000", "Network fee KES 130", "You receive KES 51,870".
2. Replace "Auto-settlement to linked M-Pesa once buyer confirms inspection" with "Paid to your M-Pesa after the buyer accepts the item."
3. Remove "ESCROW SHIELDED" under the QR code; keep "VK-4299" only if it is the link code.
4. Bottom navigation labels: Home, Orders, "+" New, Returns, More.

## S9-paid-desktop

Desktop (1440px) Vekro seller "Listing detail and share", PAID state with the linked order panel.

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
- Seller desktop shell (1440px): 264px sidebar in Emerald-950 (#04251C) with the Vekro mark (emerald rounded square with a white "V" of two strokes) and wordmark; items Dashboard, Orders, Listings, Returns, Analytics, Notifications, Settings (active item = emerald-700 pill, white text; small saffron count badges on Orders "3" and Returns "1"); bottom: a mint (#3DEBA6) "Create listing" button and a profile row "AG · Amina Gadgets · Verified seller". 72px white top bar with a search field "Order ID or item" and a bell with a coral dot.
- Seller mobile shell (390px): top bar "Habari, Amina" with a bell; bottom navigation Home, Orders, a raised emerald circular "+" (New listing), Returns, More.

**Content (inside the seller desktop shell, Listings active):**
1. **Header:** back arrow "Listings"; title "iPhone 13, 128GB, Midnight"; saffron pill "Awaiting dispatch"; secondary "Duplicate"; "Edit" and "Archive" shown DISABLED with a small dark tooltip "This listing has a paid order, so it can't be changed."
2. **Linked order panel (prominent, white card with an emerald left accent):** label "ORDER"; mono "VK-7K3P9Q"; buyer "Brian Otieno · +254 712 *** 678"; emerald pill "Paid, ready to dispatch"; a small vault strip "KES 52,000 held in the vault"; a 56px saffron countdown ring "41h 12m" with "Dispatch within 48 hours or the buyer is refunded"; primary emerald "Open order".
3. **Share card (collapsed, white):** mono link "vekro.co.ke/pay/VK-4299", "Copy", muted "This link is now closed to new buyers."
4. **Two columns:** "Item" summary card (photos, Price KES 52,000, Serial-numbered IMEI ends 1234, policy Repair then release) and "Activity" card (Views 214 · Link clicks 38, 7-day bar mini chart).

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags, metrics or claims.
1. Remove the top bar pill "KES 52,000 Vault", "VAULT SECURED", "Escrow locked value", "SPEC:", "Verified by listing" and "17.8% Conversion".
2. Rename "LISTING TELEMETRY" to "ACTIVITY", "7-Day Visitor Velocity" to "Views, last 7 days" and "ITEM SPECIFICATIONS" to "ITEM".
3. Vault strip line: "KES 52,000 held in the vault" with the sub line "Released to you after the buyer accepts the item."
4. The disabled Edit and Archive buttons show a small dark tooltip: "This listing has a paid order, so it can't be changed."
5. Sidebar header: "Vekro" with no "Seller Console" subtitle.

## S9-archived-mobile

Mobile (390px) Vekro seller "Listing detail", ARCHIVED state.

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
1. **Top:** back arrow, title "Listing", sand pill "Archived".
2. **Sand info banner (sand-100, archive icon):** "This listing is archived. Its link no longer accepts payments." with a secondary button "Restore listing".
3. **Share card (muted, white with sand-200 border):** mono link "vekro.co.ke/pay/VK-4299" struck through in muted ink, label "Link closed".
4. **Item summary card:** greyed-out thumbnail (desaturated), "Kitenge wrap dress", "KES 3,200", sand tag "Standard", policy "Reject at the door for: Damaged · Wrong item · Not as described".
5. **Bottom:** one full-width primary emerald button "Duplicate as new listing".
6. Seller mobile bottom navigation.

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags, metrics or claims.
1. Remove "1 unit ·", "Payments disabled", "ID: VK-4299" and the "Settlement breakdown" row.
2. Replace the greyscale thumbnail with a desaturated product photo of a kitenge wrap dress laid flat (no mannequin, no people).
3. Bottom navigation labels: Home, Orders, "+" New, Returns, More.

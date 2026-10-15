# S7: Stitch prompts

Design system: Vekro (`assets/3f76e23767ff46c69a4931548f3cd1b2`). Each prompt was enhanced with the enhance-prompt skill from `docs/PAGES.md` S7 plus the Deviations section and `docs/FRONTEND_CONTRACT.md`. Edit passes follow each prompt.

## S7-step1-desktop

Desktop (1440px) Vekro seller "Create listing" wizard, STEP 1 "Item", with a sticky live buyer preview. Feeling: professional, quick.

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
1. **Header:** breadcrumb "Listings / New listing"; headline "Create a listing"; horizontal stepper "Item" (current, emerald), "Item type", "Dispute policy", "Review".
2. **Left column (720px), white card "Item":**
   - Photo uploader: label "PHOTOS" with "3/4"; a 4-column grid of square 14px-radius tiles: tile 1 a phone product photo with an emerald "COVER" badge, reorder arrows and a white size chip "182 KB"; tile 2 a photo of the phone back with a small spinner chip (uploading); tile 3 a coral-tint failed tile "This photo couldn't be uploaded" with a coral outline "Try again" button; tile 4 a dashed sand tile with an image-plus icon "Add photo" "or drop it here". Helper "Up to 4 photos. The first is the cover. Drag to reorder."
   - "TITLE" field "iPhone 13, 128GB, Midnight".
   - "CATEGORY" select "Phones and tablets".
   - "DESCRIPTION" textarea "Barely used, battery health 91%. Comes with charger and original box." counter "74/600".
   - "PRICE" large mono input with "KES" prefix and value "52,000".
   - "BUYER NAME (OPTIONAL)" field "Brian Otieno", helper "For a private link to one buyer."
3. **Footer row:** ghost "Save draft" left; primary emerald "Next" right.
4. **Right column (360px), sticky:** label "LIVE BUYER PREVIEW" and a phone frame showing the buyer page: frosted header with the Vekro mark and "Protected by Vekro Escrow" pill, the product photo, "iPhone 13, 128GB, Midnight", "KES 52,000", seller row "Amina Gadgets · Kilimani, Nairobi · Verified", and an emerald "Pay KES 52,000 with M-Pesa" button. The price row has a soft emerald highlight (it just updated).

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags or claims.
1. Sidebar items exactly: Dashboard, Orders, Listings (active), Returns, Analytics, Notifications, Settings. Remove "Escrow Vault"; rename "Overview" to "Dashboard". Header "Vekro" with no "SELLER CONSOLE" subtitle.
2. Sub line under "Item details": "Buyers see this on your Trust Link."
3. Preview footnote: "Your money stays in the vault until you accept the item."

## S7-step1-mobile

Mobile (390px) Vekro seller "Create listing" STEP 1 "Item".

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

**Page Structure (mobile shell top bar replaced by a back arrow + "New listing" title and a "Save draft" ghost text button on the right):**
1. **Stepper:** four compact nodes "Item" (current, label shown), 2, 3, 4.
2. **Photos:** label "PHOTOS" "2/4"; 2-column grid: tile 1 phone photo with "COVER" badge and size chip "182 KB"; tile 2 coral-tint failed tile with "Try again"; tile 3 dashed "Add photo".
3. **Fields:** "TITLE" "iPhone 13, 128GB, Midnight"; "CATEGORY" select "Phones and tablets"; "DESCRIPTION" textarea with counter "74/600"; "PRICE" large mono "KES 52,000"; "BUYER NAME (OPTIONAL)".
4. **Sticky bottom dock (frosted):** secondary button "Preview" with an eye icon and primary emerald "Next".

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags or claims.
1. Stepper labels: "Item", "Item type", "Dispute policy", "Review".
2. Remove the "M-Pesa" tag inside the price field and "Lock link to specific buyer"; the buyer name helper reads "For a private link to one buyer."
3. Remove the "SELLER" tag on the seller card.

## S7-preview-sheet

Mobile (390px) Vekro seller "Create listing": the PREVIEW BOTTOM SHEET open over step 1.

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
1. **Behind:** the step-1 form (photos, title, price fields), dimmed by a 40% ink scrim.
2. **Bottom sheet (white, 28px top radius, grab handle), 85% height:** title "What the buyer sees" and a close X; inside, the buyer page at reduced scale in a sand-100 frame: frosted Vekro header with "Protected by Vekro Escrow" pill; product photo; "iPhone 13, 128GB, Midnight"; "KES 52,000" in the amount style; seller row "Amina Gadgets · Kilimani, Nairobi · Verified"; a white policy card "If something's wrong: reject at the door for Damaged, Wrong item or Not as described"; and an emerald button "Pay KES 52,000 with M-Pesa". Footer of the sheet: secondary "Back to editing".

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags or claims.
1. Behind the scrim, show the "New listing" step 1 form (title "New listing", photo grid, title and price fields), not "Seller Registration".
2. Remove "1 / 4 Verified" from the photo and the "Verified Seller" tag box; keep the small verified check next to "Amina Gadgets".
3. Policy card title: "If something's wrong"; body: "Reject at the door for Damaged, Wrong item or Not as described. Your money stays in the vault until you confirm."

## S7-step2-desktop

Desktop (1440px) Vekro seller "Create listing" wizard, STEP 2 "Item type", with the sticky live buyer preview.

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
1. **Header:** breadcrumb "Listings / New listing"; headline "Create a listing"; stepper "Item" (done, check), "Item type" (current), "Dispute policy", "Review".
2. **Left column (720px):** title "What kind of item is it?"; two LARGE selectable cards side by side (20px radius):
   - **Standard item** (unselected, sand border): shirt icon, title "Standard item", body "Clothes, shoes, furniture. The buyer inspects at the door; the sale is final when they give the code."
   - **Serial-numbered item** (SELECTED: lake-blue #2F80ED 2px border, lake-50 tint, check badge top-right): smartphone icon, title "Serial-numbered item", body "Phones, laptops, TVs. The buyer gets 24 hours after delivery to report functional problems."
   - Revealed under the selected card: "UNIQUE ID (IMEI OR SERIAL)" field in mono with value "35 209 811 437 1234" and a scan icon button inside the field; helper with an eye icon "Buyers will check the last 4 characters at the door: 1234".
3. **Footer:** ghost "Back", ghost "Save draft", primary emerald "Next".
4. **Right column (360px), sticky "LIVE BUYER PREVIEW":** phone frame with the buyer page (Vekro header, product photo, "iPhone 13, 128GB, Midnight", "KES 52,000"), now showing a lake info row "Serial-numbered · 24-hour check after delivery" and "IMEI ends 1234", plus the emerald "Pay KES 52,000 with M-Pesa" button.

## S7-step3-standard

Desktop (1440px) Vekro seller "Create listing" wizard, STEP 3 "Dispute policy" for a STANDARD item. Must feel guided, not legal.

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
1. **Header:** "Create a listing"; stepper "Item" (done), "Item type" (done), "Dispute policy" (current), "Review".
2. **Left column (720px):**
   - Read-only explainer card (emerald-50 tint, shield icon): title "How it works for standard items"; three short numbered rows: "The buyer inspects the item at the door.", "If it's right, they enter their delivery code and the money is released to you.", "If it's wrong, they reject at the door and the item comes back to you."
   - Card "Buyer may reject at the door for:" with three checked checkboxes: "Damaged", "Wrong item", "Not as described"; helper "These reasons show on your Trust Link so buyers know the rules up front."
3. **Footer:** ghost "Back", ghost "Save draft", primary emerald "Next".
4. **Right column (360px) sticky "LIVE BUYER PREVIEW":** phone frame with the buyer page, now showing a white policy card "Reject at the door for: Damaged · Wrong item · Not as described", with a soft emerald highlight.

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags or claims.
1. Stepper labels: "Item", "Item type", "Dispute policy", "Review". Remove the "Standard Escrow Flow" pill and the sub line under "Create a listing".
2. Remove "Clear door-to-door handoff with zero ambiguity for both parties.", "3 standard criteria active" and "Standard consumer protection protocol guarantees buyer confidence and lowers checkout drop-off."; under "Buyer may reject at the door for:" write "Pick the reasons a buyer can reject at the door."
3. Preview: rename "INSPECTION GUARANTEE" to "IF SOMETHING'S WRONG"; replace "Escrow Secured" with "Protected by Vekro Escrow"; remove "Condition: Excellent / Unlocked"; the inner note reads "Check the item before you enter your 6-digit delivery code. Entering it releases the money to the seller."; the footnote reads "Your money stays in the vault until you accept the item."
4. Header: "Vekro" with no "SELLER CONSOLE"; account shows "Amina Gadgets" with no "Kilimani Store".

### Edit pass 2

One fix only; keep everything else exactly as it is: remove the small line "Funds held securely in Vekro Vault until delivery" under the "Pay KES 52,000 with M-Pesa" button inside the phone preview.

## S7-step3-serialized

Desktop (1440px) Vekro seller "Create listing" wizard, STEP 3 "Dispute policy" for a SERIAL-NUMBERED item. Premium, polished, friendly; guided, not legal.

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
1. **Header:** "Create a listing"; stepper "Item" (done), "Item type" (done), "Dispute policy" (current), "Review".
2. **Left column (720px):**
   - Small lake info row: "Serial-numbered item · the buyer has 24 hours after delivery to report a functional problem."
   - Card "Problems you accept" with helper "Pick the problems a buyer can report in the 24 hours. Presets for phones." and a chip group: selected chips (emerald-50 fill, emerald border, check) "Won't power on", "Screen or touch problem", "Battery drains fast"; unselected chips (white, sand border) "Software or app problem", "Camera problem"; a dashed chip "+ Add".
   - Card "If a problem is confirmed, you will:" with three radio cards in a row: "Refund" (money goes back to the buyer), "Repair then release" (you fix it, buyer confirms, then you're paid) SELECTED with emerald border, lift shadow and a filled radio, "Replacement" (you send a new one, buyer confirms, then you're paid).
3. **Footer:** ghost "Back", ghost "Save draft", primary emerald "Next".
4. **Right column (360px) sticky "LIVE BUYER PREVIEW":** phone frame with the buyer page showing a policy card "24-hour check · Won't power on, Screen or touch, Battery · Seller repairs then releases".

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags or claims.
1. Remove "3 coverage tags active", "Standard phone escrow guarantee tier", "Highest buyer trust rate", "SN Verified", "#VK-8821", "Binding seller conditions" and "Updated in real-time as you tweak seller conditions."
2. Under "If a problem is confirmed, you will:" replace the sub line with "Pick what you'll do if the buyer reports one of these problems."
3. Preview: header "Vekro" with a "Protected by Vekro Escrow" pill; card title "If something's wrong"; the buyer button reads "Pay KES 52,000 with M-Pesa"; the footnote reads "Your money stays in the vault until the 24-hour check ends."
4. Sidebar: "Vekro" with no "SELLER CONSOLE" subtitle.

## S7-step3-warning

Mobile (390px) Vekro seller "Create listing" STEP 3 "Dispute policy", serial-numbered item, MISSING POLICY state.

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
1. **Top:** back arrow, "New listing", ghost "Save draft"; compact stepper with "Dispute policy" current (step 3 of 4).
2. **Saffron warning banner** (tint #FFF6E0, triangle icon, text #8A5B00): "Serial-numbered listings need a policy before you can publish."
3. **Card "Problems you accept":** all chips unselected (white, sand border): "Won't power on", "Screen or touch problem", "Battery drains fast", "Software or app problem", "Camera problem", dashed "+ Add".
4. **Card "If a problem is confirmed, you will:"** three stacked radio cards "Refund", "Repair then release", "Replacement", none selected, with one-line descriptions.
5. **Sticky bottom dock:** secondary "Back" and primary emerald "Next" shown disabled.

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags or claims.
1. Remove the "STANDARD" tag next to Refund and "REVIEW NEXT".
2. Replace "Policy terms are locked into the escrow agreement once both parties accept." with "Your policy shows on the Trust Link and can't change once a buyer pays."
3. Replace "Default resolution rule for escrow payout" with "Pick what you'll do if the buyer reports a problem."

## S7-step4-desktop

Desktop (1440px) Vekro seller "Create listing" wizard, STEP 4 "Review", before publishing.

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
1. **Header:** "Create a listing"; stepper first three done (checks), "Review" current.
2. **Left column (720px):** summary cards, each with a title and an emerald "Edit" text link:
   - "Item": thumbnail, "iPhone 13, 128GB, Midnight", "Phones and tablets", "KES 52,000", "3 photos".
   - "Item type": lake pill "Serial-numbered", mono "IMEI ends 1234".
   - "Dispute policy": "24-hour check", chips "Won't power on", "Screen or touch problem", "Battery drains fast", "Resolution: Repair then release".
   - "Your payout" fee breakdown card: rows "Price" KES 52,000; "Estimated network fee" KES 130; "You receive" KES 51,870 (bold emerald), with a thin stacked bar.
   - "Link preview" card: how the link looks when shared on WhatsApp: a chat-bubble style card with the product photo, title "iPhone 13, 128GB · KES 52,000", "Pay safely with Vekro escrow", mono "vekro.co.ke/pay/VK-4299".
3. **Footer:** ghost "Back", ghost "Save draft", primary emerald "Publish and get link".
4. **Right column (360px) sticky "LIVE BUYER PREVIEW":** the full buyer page in a phone frame.

# S8: Stitch prompts

Design system: Vekro (`assets/3f76e23767ff46c69a4931548f3cd1b2`). Each prompt was enhanced with the enhance-prompt skill from `docs/PAGES.md` S8 plus the Deviations section and `docs/FRONTEND_CONTRACT.md`. Edit passes follow each prompt.

## S8-grid-desktop

Desktop (1440px) Vekro seller "Listings" page, GRID view. Warm and polished.

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
1. **Header row:** headline "Listings" with a muted count chip "12"; primary emerald "New listing" button with a plus icon on the right.
2. **Toolbar:** segmented filter on a sand-100 track: "Active 7" (selected, white), "Awaiting payment 2", "Sold 2", "Draft 1", "Archived 0"; search field "Search listings"; a grid/list view toggle (grid selected).
3. **4-column card grid (8 cards):** each white card (20px radius): square product photo (14px radius), title, price "KES …" in bold, a type tag ("Serial-numbered" lake tint or "Standard" sand tint), a status pill, a muted views line with an eye icon "214 views", a secondary "Copy link" button with a link icon, and a three-dot menu button. Cards: "iPhone 13, 128GB, Midnight" KES 52,000 Serial-numbered, saffron pill "Awaiting dispatch"; "Nike Air Force 1, size 42" KES 6,500 Standard, emerald pill "Active"; "Kitenge wrap dress" KES 3,200 Standard "Active"; "HP Pavilion 15 laptop" KES 68,500 Serial-numbered "Active"; "3-seater sofa" KES 38,000 Standard, saffron pill "Waiting for payment"; "Samsung Galaxy A54" KES 41,000 Serial-numbered "Active"; "JBL Flip 6 speaker" KES 14,500 Serial-numbered "Active"; "Leather sandals" KES 2,800 Standard, sand pill "Draft".
4. One card shows its three-dot menu open: "Share", "Edit", "Duplicate", "Archive" (Archive in coral).
5. A dark ink toast pill at the top center: check icon "Link copied".

## S8-list-mobile

Mobile (390px) Vekro seller "Listings" page, LIST view.

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

**Page Structure (mobile shell with bottom navigation):**
1. **Header:** "Listings" with count "12" and a small emerald "New" button with a plus icon.
2. **Horizontal scrolling filter pills:** "Active 7" (selected), "Awaiting payment 2", "Sold 2", "Draft 1", "Archived".
3. **Search field** "Search listings" with a grid/list toggle (list selected).
4. **List rows (white cards, 12px gap):** 64px rounded thumbnail, title, price, type tag and status pill on one line, and on the right a "Copy link" icon button and a three-dot button. Rows: "iPhone 13, 128GB, Midnight" KES 52,000 Serial-numbered, saffron "Awaiting dispatch"; "Nike Air Force 1, size 42" KES 6,500 Standard "Active"; "Kitenge wrap dress" KES 3,200 "Active"; "HP Pavilion 15 laptop" KES 68,500 Serial-numbered "Active"; "3-seater sofa" KES 38,000 "Waiting for payment".

## S8-states

Desktop (1440px) Vekro seller "Listings" page, STATES reference: three panels stacked in the content area of the seller desktop shell (Listings active), each with a small muted caps caption above it.

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

1. **Caption "EMPTY":** a large white card with a centered geometric emerald-and-sand vault illustration, headline "Create your first listing", body "Make a Trust Link and share it on WhatsApp or Instagram. Buyers pay into escrow, so you ship with confidence.", primary emerald "New listing".
2. **Caption "NO RESULTS":** toolbar with search "sofa red" and filter "Sold"; a short centered message with a search icon "No listings match "sofa red"" and a secondary button "Clear search and filters".
3. **Caption "LOADING":** a row of four skeleton cards in warm sand shimmer blocks (square photo block, two text lines, a pill block, a button block).

### Edit pass 1

Targeted copy fixes only; keep the layout, colours and every other element exactly as they are. Do not add any new badges, tags, metrics or claims.
1. Remove "UI REF V2.4", "Zero inventory initialized", "Query mismatch / Active filters", "Skeleton shimmer grid" and the whole footer ("Vekro Escrow Layer · Active Merchant Sandbox", "REF: VK-LST-09", "ESCROW STATUS: ACTIVE").
2. Under the "Listings" headline replace the sub line with nothing.
3. Sidebar header: "Vekro" with no "Seller Console" subtitle. The sidebar button reads "Create listing" in sentence case.

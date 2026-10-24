# X3 Help and support: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` X3, `.stitch/DESIGN.md` (voice: plain, warm, specific).

Route `/help`. Everyone. Device: mobile 390px first (content max 640px on desktop).

Goal: answer the common questions fast and make reaching a person easy. Feeling: someone has your back.

## Layout, top to bottom

1. **Header**: buyer header on its own; inside the seller shell when a seller is signed in.
2. **Headline** `type-display-lg` "How can we help?".
3. **Search**: field "Search help" filtering the questions below as you type (title and answer text); "No answers match "refund later"" with "Clear search".
4. **Quick answers**: accordion groups (`type-label` group headings), each question a disclosure:
   - **Paying**: "How does Vekro keep my money safe?", "Why did the M-Pesa prompt fail?", "Can I pay later?"
   - **Delivery and inspection**: "What happens when the item arrives?", "Where do I find my delivery code?", "What if I'm not happy at the door?"
   - **Returns and refunds**: "What is the 24-hour hold?", "How do I report a problem?", "When do I get my refund?"
   - **Selling**: "When do I get paid?", "What does it cost?", "What happens if I don't dispatch in time?"
   Answers follow the product rules (money moves only on button presses or timeouts; payout after the buyer accepts; no photos needed for disputes).
5. **Track your order** card: "Have an order link? Open it from your SMS. Signed in? See all your orders." with a link to B9.
6. **Contact card**: "Talk to Vekro support", buttons "Call support", "WhatsApp support", "Email support" (only those configured are shown), hours line "Every day, 8:00 to 20:00 EAT" (from config).
7. Footer link: "Report a problem with this page" (opens the email link with the page URL).

## Controls

| Control | Label | Result |
| --- | --- | --- |
| Search | "Search help" | filters questions |
| Question | question text | expands its answer (one open at a time per group) |
| My orders | "See all your orders" | B9 (or B8 when signed out) |
| Call / WhatsApp / Email | as labelled | `tel:`, `https://wa.me/…`, `mailto:` from configuration |
| Report a problem with this page | as labelled | `mailto:` with the page URL |

## States

| State | Design |
| --- | --- |
| Static | the content ships with the app; works offline |
| No search results | message with "Clear search" |
| No contact configured | the contact card says "Reply to any Vekro SMS to reach support." |

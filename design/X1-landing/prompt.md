# X1 Landing: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` X1 and Deviations ("Find my order" flagged until #10 and #11), `docs/FRONTEND_CONTRACT.md` A, `.stitch/DESIGN.md` (voice; no regulator or speed claims).

Route `/`. Everyone (signed-in sellers and admins are sent to their apps). Devices: desktop 1440px and mobile 390px.

Goal: explain Vekro in ten seconds and send sellers to sign up. Feeling: modern, trustworthy, Kenyan.

## Layout, top to bottom

1. **Nav** (sticky, frosted, hairline on scroll): Vekro mark, links "How it works" and "For sellers" (anchors), "Log in", primary "Start selling". Mobile: mark, "Log in", and a menu button for the links.
2. **Hero** (sand with the emerald mesh at the top): display headline "Sell on social media. Get paid when they're happy." Sub: "Vekro holds the buyer's money until they've checked the item. No cash-on-delivery losses, no 'send money first' worries." CTAs: primary "Start selling", secondary "How it works". Right (desktop) or below (mobile): a phone mockup built from real components, the B3 vault card, with a looping story: the lock closes ("Paid, funds held safely"), the courier truck moves, the ring turns to a check and the coins glide to the seller ("Complete, seller paid").
3. **How it works** (`id="how-it-works"`): four steps with icons and one line each: "List" ("Add photos, a price and your dispute policy."), "Share" ("Send your Trust Link on WhatsApp, Instagram or Facebook."), "Pay into the vault" ("The buyer pays by M-Pesa. The money is locked to that one order."), "Inspect and release" ("The buyer checks the item and gives a code. Then you're paid.").
4. **Protection** (`id="for-sellers"`): two cards. "For buyers": pay only into the vault; check before you release; report a fault on serial-numbered items within 24 hours. "For sellers": know the buyer has paid before you ship; payout after they accept, or automatically when the timer runs out; clear rules if something goes wrong.
5. **Trust strip**: "Pay with M-Pesa", "Money held for each order", "Clear timers, no guesswork", "Real people for disputes" (icons, no logos of other companies).
6. **FAQ** accordion (5 questions from X3).
7. **CTA band** (emerald-900 to emerald-700 gradient): "Ready to sell with confidence?" primary on dark "Start selling".
8. **Footer**: mark, links "Help", "Log in", "Start selling", "Support console" (small, `/admin/login`), and "© 2026 Vekro".

Flagged (off until gaps #10 and #11 ship): a small hero form "Have an order? Track it" (phone, then SMS code); never order ID plus phone as a credential.

## Controls

| Control | Label | Result |
| --- | --- | --- |
| Start selling | "Start selling" | `/register` |
| Log in | "Log in" | `/login` |
| How it works / For sellers | nav anchors | smooth scroll (instant with reduced motion) |
| FAQ | questions | expand |
| Footer links | as labelled | routes |

## States

| State | Design |
| --- | --- |
| Signed-in seller or admin | redirected to `/seller` or `/admin` (as today) |
| Loading the session | the page renders at once; the redirect follows when the session is known |

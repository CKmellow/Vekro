# X2 Not found and offline: design brief

Code-ready brief, reconciling the 404 page built in M4 (#203). No Stitch render. Sources: `docs/PAGES.md` X2, `.stitch/DESIGN.md`.

Routes: `*` (404) and the offline fallback (service worker navigation fallback and an in-app offline screen). Everyone. Devices: mobile 390px and desktop.

## Layout (both)

Centred: geometric illustration in an emerald-50 tile, headline, one sentence, primary and secondary buttons, the Vekro mark at the top.

| Variant | Illustration | Headline | Sentence | Primary | Secondary |
| --- | --- | --- | --- | --- | --- |
| 404 | vault with a question mark (lucide `vault` + `circle-help` badge) | "We can't find that page" | "The link may be old or mistyped. If someone sent you a Vekro link, ask them to send it again." | "Go home" | "Get help" |
| Offline | unplugged cable (`unplug`) | "You're offline" | "Check your connection. Your orders are safe in the vault while you're away." | "Try again" | "Get help" |

Signed-in sellers on a 404 see "Go to your dashboard" as the primary.

The offline screen appears when a page is opened without a connection and no cached copy exists. Pages that already loaded keep their data dimmed with the "You're offline" banner (as built in B3, S5 and S6).

## States

| State | Design |
| --- | --- |
| 404 | as above, document title "Page not found · Vekro" |
| Offline | as above; "Try again" reloads; it turns back automatically when the browser goes online |

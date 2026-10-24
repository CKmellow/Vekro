# A1 Admin log in: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` A1, `.stitch/DESIGN.md` (dark console roles), `api/openapi.json` (`POST /auth/login`, `GET /auth/me` with `role`).

Route `/admin/login` (with `?returnTo=` and `?reason=expired`). Admin staff. Device: desktop 1440px; usable down to 390px.

Goal: let authorised staff in, and nobody else. Feeling: serious, calm, accountable.

## Layout

1. **Background**: `dark-background` full screen with two soft radial glows (emerald-900 top left, plum-900 bottom right), no imagery.
2. **Card** (420px, centred, `dark-surface`, 28px radius, `dark-border` hairline, shadow):
   - Shield mark: 48px plum-500 rounded square with a shield-check icon.
   - `type-headline` "Vekro Support Console"; text `dark-text-muted` "Authorized staff only".
   - `PhoneField`-style field "Phone number" (staff log in with their phone, as the backend expects) and `PasswordField` "Password" with show/hide.
   - Primary "Log in" (plum-500 fill, white text, full width; the console's accent replaces emerald here).
3. **Footer** under the card, `dark-text-muted`: "All actions are logged."

## States

| State | Design |
| --- | --- |
| Loading | button spinner; fields read-only |
| Wrong credentials | coral line in the card: "That phone number and password don't match." (generic; never says which) |
| Not an admin | the login succeeds but the role isn't `admin`: the session is ended and the card says "This account doesn't have console access." with a link "Go to the seller app" |
| Session expired | `?reason=expired`: a saffron line "Your session ended. Log in again to continue." |
| Locked out (429) | "Too many tries. Try again in 4:59." with the server's Retry-After |
| Success | to `returnTo` (only `/admin…` paths) or `/admin` |

## Controls

| Control | Label | Result |
| --- | --- | --- |
| Phone | "Phone number" | validated as a Kenyan number |
| Password | "Password" | show/hide toggle "Show password" |
| Log in | "Log in" | `POST /auth/login`, then checks the role |

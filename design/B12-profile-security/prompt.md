# B12 Profile & security: design brief

Code-ready brief. Route `/buyer/profile`. Any signed-in member. X4 shell. Stacked `Card` sections, one column (max 640px).

## Sections

1. **Profile**: name (`Field`, Save → `PATCH /account/profile`); phone (masked, "Change" opens a `Sheet`: new number `PhoneField` → "Send code" `POST /account/phone/request-code` → `CodeCells` → `PUT /account/phone`; success toast "Your sign-in number changed. Other devices were signed out."); e-mail from Google (read only, when linked).
2. **Sign-in methods**:
   - Password: "Change password" (existing form, `POST /auth/password/change`); without one (`has_password` false): "Set a password" → `/forgot-password`.
   - "Sign in with an SMS code" `Switch` (`PUT /account/sms-login`). A 409 shows "Set a password or link Google first, so you can still sign in." inline.
   - Continue with Google: the existing `GoogleAccountCard` (link / unlink).
3. **USSD PIN**: "Set or change your 4-digit PIN for *384*…#" (existing `POST /account/ussd-pin` form, needs the password).
4. **Signed-in devices**: the existing list (`GET /auth/sessions`, sign out one / all others).
5. **Selling**: no store → "Start selling" button; with a store → "Go to your store" (`/seller`).

## States

Each section has its own loading skeleton, inline error (`Banner` inside the card) and success toast. 401 anywhere → `/login?returnTo=/buyer/profile`.

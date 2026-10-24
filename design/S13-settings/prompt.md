# S13 Settings: design brief

Code-ready brief (no Stitch render, following Cyprian's M5 decision). Sources: `docs/PAGES.md` S13, `.stitch/DESIGN.md`, the S3 payout setup design (`design/S3-payout-setup/`).

Route `/seller/settings` with the tab in the query (`?tab=payout`). Seller. Devices: desktop 1440px (tab list left, 3 / 9 columns) and mobile 390px (tabs as a horizontal `SegmentedControl` above the card).

Goal: change shop details, payout number and alerts without fear of breaking anything. Feeling: safe and reversible.

## Layout

1. **Header**: `type-display-lg` "Settings".
2. **Tab list** (vertical on desktop, `role="tablist"`): "Profile", "Payout", "Notifications", "Security".
3. **Content card** per tab (white, 20px radius):

### Profile
- Logo: 96px circle with initials until uploaded; `ImageUploader` "Upload logo" (square crop, compressed client-side).
- "Shop name" (required, 2 to 60 characters) "Amina Gadgets".
- "City or area" "Kilimani, Nairobi".
- "About your shop" textarea (280 characters) with a counter.

### Payout
- Current number card: phone icon, "M-Pesa payout number", masked "+254 722 ••• 904", line "Payouts go here after buyers accept their items." Secondary "Change".
- Change flow (inline, replaces the card): `PhoneField` "New M-Pesa number", `PhoneField` "Type it again", note "We'll text a code to the new number to confirm it's yours." primary "Send code"; then six `CodeCells` "Enter the code we sent to +254 733 ••• 210" with "Confirm number" and "Resend code" (30s cooldown). Success toast "Payout number updated".
- Warning (saffron-50, saffron-700 text): "Orders already paid keep paying out to the number they started with."

### Notifications
- Toggle matrix (a real table): rows "Payment received", "Dispatch reminders", "Return updates", "Support messages"; columns "In-app" and "SMS". In-app for "Support messages" is always on (disabled toggle, tooltip "Support decisions are always shown in the app").

### Security
- "Change password": "Current password", "New password" (strength meter from S1), "Confirm new password", secondary "Update password".
- "Signed-in devices" list: device icon, "Chrome on Android · Nairobi", "Active now" (this device, emerald pill "This device") or "Last active 2 days ago"; ghost "Sign out" per other device.
- Secondary "Sign out other devices".
- Divider, coral ghost "Log out".

## Save bar

When Profile or Notifications have unsaved edits, a sticky bottom bar slides up (frosted surface, `shadow-2`): "You have unsaved changes" with ghost "Discard" and primary "Save changes". Leaving the tab or the page with unsaved edits opens `ConfirmDialog` "Discard your changes?" / "Your edits to this tab haven't been saved." confirm "Discard", cancel "Keep editing". Payout and Security save through their own buttons (they need confirmation steps), so they never show the bar.

## Controls

| Control | Label | Style | Result |
| --- | --- | --- | --- |
| Tab | "Profile" / "Payout" / "Notifications" / "Security" | tab | switches; guarded when dirty |
| Upload logo | "Upload logo" | `ImageUploader` | preview, marks dirty |
| Save changes | "Save changes" | primary in the save bar | saves; toast "Settings saved" |
| Discard | "Discard" | ghost | resets the form |
| Change | "Change" | secondary | opens the change flow |
| Send code / Confirm number / Resend code | as labelled | primary / primary / link | phone change steps |
| Toggle | row and column name, for example "Payment received by SMS" | switch | marks dirty |
| Update password | "Update password" | secondary | changes the password; toast "Password updated" |
| Sign out (device) | "Sign out" | ghost | ends that session |
| Sign out other devices | "Sign out other devices" | secondary | ends every other session; toast |
| Log out | "Log out" | coral ghost | ends this session, to `/login` |

## States

| State | Design |
| --- | --- |
| Loading | tab list and a card skeleton |
| Saving | button spinner, fields read-only |
| Success | toast per action |
| Error | coral `Banner` at the top of the card with what failed; field errors under fields (422) |
| Offline | sand `Banner`; save and action buttons disabled |

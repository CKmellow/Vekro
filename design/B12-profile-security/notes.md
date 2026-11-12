# B12 Profile & security: notes

Status: Specced (2026-11-11). Build #316.

| Part | Reuse |
| --- | --- |
| Password change, devices | the S13 Settings sections (move into shared `views/components/domain/account/`) |
| Google | `GoogleAccountCard` |
| Phone change | `PhoneCodeSteps` (as in Google sign-up) |
| SMS switch | `Switch` |

Backend: `PATCH /account/profile`, `POST /account/phone/request-code`, `PUT /account/phone` (#336); `PUT /account/sms-login` (#332). Admins never see this page.

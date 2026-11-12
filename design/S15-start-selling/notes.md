# S15 Start selling: notes

Status: Specced (2026-11-11). Build #317. Backend: `POST /account/store` (#334), payout verification (#330: a store takes orders only once a code proves its payout number).

Reuse: `Stepper`, S3 payout step (`usePayoutSetup`, with the code made mandatory), `PhoneCodeSteps`, S7.

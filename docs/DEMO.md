# Demo script

A 15-minute walkthrough of the web app for the defense, using the PAGES.md sample data. It follows Scenario 1 (normal flow) of the backend's `docs/demo-script.md` through the screens, then the dispute and support paths; Scenarios 2 to 5 (failover, unknown outcome, duplicate funding, eConfirm) are run from the backend script, and the web app shows their results.

What to say about custody (same as the backend script): simulated custody is enforced by this application and is not regulated. Don't describe Vekro or eConfirm as licensed, regulated or insured.

## Setup (once, about 2 minutes)

```bash
# Backend: fresh database, simulated rail, no real SMS, codes echoed for the demo
cd ../backend
export ENVIRONMENT=development AFRICASTALKING_API_KEY= PHONE_CODE_DEV_ECHO=true
.venv/bin/alembic upgrade head
VEKRO_ADMIN_PASSWORD='choose-a-long-one' .venv/bin/python -m app.cli create-admin --phone 0700000103 --name "Ada Admin"
make run

# Frontend
cd ../frontend
npm run dev -- --port 4173
npm run seed:demo                 # DEMO_PASSWORD defaults to demo-pass-123
```

The seed prints the order references. Use three browser profiles (or one normal and two private windows): seller, buyer, support.

| Who | Log in | Phone |
| --- | --- | --- |
| Seller, Amina Gadgets | `/login` | 722 118 904 |
| Buyer, Brian Otieno | `/buyer/sign-in` (SMS code; with `PHONE_CODE_DEV_ECHO` the code is in the network response) or the B1 card | 712 345 678 |
| Support, Ada Admin | `/admin/login` | 700 000 103 |

## 1. The seller's day (S4, S5, S6), 3 minutes

1. Seller logs in. S4 shows money in escrow and "Needs your action": the iPhone 13 order is paid and ready to dispatch.
2. Open it (S6): the action panel says what to do and how long is left (server deadline). Press **Dispatch**.
3. S12 Analytics: KPIs against the previous period, sales over time, outcomes, top listings.

## 2. A new sale through a Trust Link (S7, B1, B2, B3), 4 minutes

1. Seller creates a listing (S7): Nike Air Force 1, KES 6,500, standard; publish and copy the Trust Link (S9).
2. Buyer opens the link (B1): item, seller, protection, price. Pay with M-Pesa.
3. B2 waits for the PIN. Confirm the payment as the provider would (backend script, Scenario 1 step 2: the simulated callback). B2 turns to "Payment received" and the money path shows the vault.
4. B3: "Paid, funds held safely", with the next step and the seller's dispatch deadline.

## 3. At the door (B4), 2 minutes

1. Seller dispatches and marks arrival (S6). The buyer gets the delivery code by SMS (in-app notifications for the demo).
2. Buyer opens B4, enters the code, **Accept item**. A standard item releases to the seller; a serial-numbered one is held 24 hours (the HP laptop shows this state).
3. Show **Reject at the door** on another order: the buyer is refunded and the seller sees why.

## 4. Something's wrong (B5, B6, S10, S11, A2, A3), 4 minutes

1. The Samsung Galaxy A54 return is already escalated by the seller. Show the buyer's B3 ("With Vekro support") and the seller's S11.
2. Support logs in (A1): the queue (A2) shows the case with its trigger and age.
3. Open it (A3): both sides' words, the timeline, the policy. Choose **Refund buyer**, write the reason, **Review decision**, type the case ID, **Confirm and execute**.
4. The buyer's B3 now shows "Refund issued".

## 5. Trust without accounts (B3 phone gate, B9), 2 minutes

1. Open a buyer's order link in a fresh private window: only the item, reference and amount show, then "Confirm it's you". Enter the phone and the SMS code: the order opens.
2. B9 lists every order for that phone; **Track an order** only opens the buyer's own references.

## Backend scenarios 2 to 5

Run them from the backend's `docs/demo-script.md`. In the web app, the orders they create show the same human states (A4 Transactions explorer finds them by reference), and payouts that are pending or unknown show as such in S6's payout line.

## Reset

Drop and recreate the database, run the migrations, the admin command and `node scripts/seed-demo.mjs` again (the seed is meant to run once per database).

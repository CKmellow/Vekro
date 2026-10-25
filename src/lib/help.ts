/** Help and FAQ copy (X3, and the X1 FAQ). Plain, specific, and true to how Vekro works. */
export interface HelpItem {
  id: string
  q: string
  a: string
}

export interface HelpSection {
  title: string
  items: HelpItem[]
}

export const HELP: HelpSection[] = [
  {
    title: 'Paying',
    items: [
      {
        id: 'safe',
        q: 'How does Vekro keep my money safe?',
        a: "You pay by M-Pesa into a vault that holds the money for that one order. It doesn't go to the seller until you've checked the item and given your delivery code, or a timer runs out.",
      },
      {
        id: 'prompt-failed',
        q: 'Why did the M-Pesa prompt fail?',
        a: 'The prompt can be cancelled, time out, or meet a wrong PIN or a low balance. Nothing is taken when it fails. Open your order and tap Resend to get a new prompt.',
      },
      {
        id: 'pay-later',
        q: 'Can I pay later?',
        a: "Your order is saved while you're paying. If you leave, open the link again and pay from there. The seller only ships once the money is in the vault.",
      },
    ],
  },
  {
    title: 'Delivery and inspection',
    items: [
      {
        id: 'arrives',
        q: 'What happens when the item arrives?',
        a: 'The seller marks it as arrived and you get a text with a delivery code. Check the item in front of the courier. You have about an hour to decide.',
      },
      {
        id: 'code',
        q: 'Where do I find my delivery code?',
        a: 'It comes by SMS and in your Vekro notifications when the item reaches your door. Only give it if you are happy with the item: the code releases the payment.',
      },
      {
        id: 'not-happy',
        q: "What if I'm not happy at the door?",
        a: "Don't give the code. Choose Reject and say what's wrong. The item goes back to the seller and you're refunded.",
      },
    ],
  },
  {
    title: 'Returns and refunds',
    items: [
      {
        id: 'hold',
        q: 'What is the 24-hour hold?',
        a: 'For items with a serial number, like phones and laptops, the payment stays in the vault for 24 hours after you accept. Test it, and report a fault in that time if something is wrong.',
      },
      {
        id: 'report',
        q: 'How do I report a problem?',
        a: 'Open your order during the hold and tap Report a problem. Describe it in words; Vekro never asks for photos. Then send the item back so the seller can refund, repair or replace it, as their policy says.',
      },
      {
        id: 'refund-when',
        q: 'When do I get my refund?',
        a: 'As soon as the refund is decided, it goes back to the M-Pesa number you paid with. The order page shows where your money is at every step.',
      },
    ],
  },
  {
    title: 'Selling',
    items: [
      {
        id: 'paid-when',
        q: 'When do I get paid?',
        a: 'After the buyer accepts the item, or when their timer runs out in your favour. For serial-numbered items, after the 24-hour hold.',
      },
      {
        id: 'cost',
        q: 'What does it cost?',
        a: 'Vekro charges no platform fee today. The M-Pesa network fee for sending your payout is deducted from it, and your order page shows the amount.',
      },
      {
        id: 'dispatch-late',
        q: "What happens if I don't dispatch in time?",
        a: 'You have 48 hours after payment to dispatch. After that the buyer is refunded automatically, so dispatch early or contact the buyer.',
      },
    ],
  },
]

/** The landing FAQ: the five questions people ask first. */
export const LANDING_FAQ: HelpItem[] = ['safe', 'arrives', 'not-happy', 'hold', 'paid-when'].map(
  (id) => HELP.flatMap((s) => s.items).find((i) => i.id === id) as HelpItem,
)

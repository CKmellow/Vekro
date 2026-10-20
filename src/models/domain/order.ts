import type { DisputePolicy } from './listing'
import type { TransactionStatus, ViewerRole } from './stateMeta'

/** What the buyer was asked to do to pay (FRONTEND_CONTRACT B). Never names a payment provider. */
export interface PaymentInstruction {
  /** STK_PROMPT: a PIN prompt went to the buyer's phone. REDIRECT: send the buyer to `redirectUrl`. */
  kind: 'STK_PROMPT' | 'REDIRECT'
  redirectUrl?: string
  /** `succeeded` is not success: only the transaction status `locked` is (contract B). */
  status: 'pending' | 'succeeded' | 'failed' | 'expired' | 'failed_to_initiate'
  failureReason: PaymentFailure | null
  sentAt: string
  expiresAt: string
  /** Earliest moment a resend is accepted (server time). */
  resendAvailableAt: string
}

export type PaymentFailure = 'cancelled' | 'wrong_pin' | 'insufficient_funds' | 'timeout' | 'provider_error'

export interface OrderParty {
  name: string
  /** Already masked by the server, e.g. "+254 712 *** 678". */
  phoneMasked: string | null
}

/** When the current state times out (server time, ISO). Only the current state's field is set. */
export interface OrderDeadlines {
  dispatchBy: string | null
  inspectBy: string | null
  holdUntil: string | null
  returnSendBy: string | null
  returnConfirmBy: string | null
}

/** One transaction as its buyer, seller or an admin sees it. */
export interface Order {
  id: string
  /** Human reference such as VK-7K3P9Q. Show this, never the id. */
  reference: string
  status: TransactionStatus
  /** KES, whole shillings. */
  amount: number
  viewerRole: ViewerRole
  /** Simulated custody: no real money moves, and the screens say so. */
  simulated: boolean
  listing: {
    id: string
    title: string
    price: number
    isSerialized: boolean
    policy: DisputePolicy
  }
  buyer: OrderParty
  seller: OrderParty
  deadlines: OrderDeadlines
  /** Server time minus device time when this was fetched; countdowns add it to the device clock. */
  serverOffsetMs: number
  /** Only for the buyer and admins. */
  payment: PaymentInstruction | null
  createdAt: string
  updatedAt: string
}

/** The transaction POST /transactions just created, with the payment prompt sent for it. */
export interface CreatedOrder {
  id: string
  reference: string
  status: TransactionStatus
  payment: PaymentInstruction
}

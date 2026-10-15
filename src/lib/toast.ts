export type ToastTone = 'success' | 'info' | 'danger'

export interface ToastMessage {
  id: number
  tone: ToastTone
  message: string
}

type Listener = (toasts: ToastMessage[]) => void

let toasts: ToastMessage[] = []
let nextId = 1
const listeners = new Set<Listener>()
const emit = () => listeners.forEach((listener) => listener(toasts))

/** App-wide toasts. Controllers and the API error handler call `toast.show`; the Toaster view renders them. */
export const toast = {
  show(message: string, tone: ToastTone = 'success'): number {
    const id = nextId++
    toasts = [...toasts, { id, tone, message }]
    emit()
    return id
  },
  dismiss(id: number) {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  current: () => toasts,
}

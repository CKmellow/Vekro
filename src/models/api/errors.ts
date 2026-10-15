/** Every failed API call becomes an ApiError with a kind the UI can switch on. */
export type ApiErrorKind =
  | 'unauthorized' // 401: send to login with a return URL
  | 'forbidden' // 403: friendly no-permission page (also CSRF failures)
  | 'not_found' // 404
  | 'conflict' // 409: refetch and toast (state changed underneath)
  | 'validation' // 422: field errors
  | 'rate_limited' // 429
  | 'server' // 5xx
  | 'network' // no response (offline, DNS, CORS)
  | 'unknown'

export type FieldErrors = Record<string, string>

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly fieldErrors: FieldErrors

  constructor(kind: ApiErrorKind, message: string, status: number | null, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 422 || status === 400) return 'validation'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'server'
  return 'unknown'
}

interface FastApiValidationItem {
  loc?: (string | number)[]
  msg?: string
}

/** Maps FastAPI error bodies ({detail: string} or {detail: [{loc, msg}]}) to a message and field errors. */
export function parseErrorBody(body: unknown): { message: string; fieldErrors: FieldErrors } {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return { message: detail, fieldErrors: {} }
  if (Array.isArray(detail)) {
    const fieldErrors: FieldErrors = {}
    for (const item of detail as FastApiValidationItem[]) {
      const loc = (item.loc ?? []).filter((part) => part !== 'body' && part !== 'query' && part !== 'path')
      const field = loc.length ? loc.join('.') : '_'
      if (item.msg && !fieldErrors[field]) fieldErrors[field] = item.msg
    }
    return { message: Object.values(fieldErrors)[0] ?? 'Please check the highlighted fields.', fieldErrors }
  }
  return { message: 'Something went wrong. Please try again.', fieldErrors: {} }
}

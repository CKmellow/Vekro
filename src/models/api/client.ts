import { CSRF_HEADER, csrfToken } from './csrf'
import { ApiError, kindForStatus, parseErrorBody } from './errors'
import type { components, paths } from './schema'

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'
type PathsWith<M extends Method> = {
  [P in keyof paths]: paths[P][M] extends undefined | never ? never : P
}[keyof paths]
type Operation<P extends keyof paths, M extends Method> = NonNullable<paths[P][M]>

type Json<T> = T extends { content: { 'application/json': infer B } } ? B : undefined
type SuccessBody<O> = O extends { responses: infer R }
  ? 200 extends keyof R
    ? Json<R[200]>
    : 201 extends keyof R
      ? Json<R[201]>
      : 202 extends keyof R
        ? Json<R[202]>
        : undefined
  : never
type RawBody<O> = O extends { requestBody?: infer R } ? R : never
type RequestBody<O> = [NonNullable<RawBody<O>>] extends [never]
  ? never
  : NonNullable<RawBody<O>> extends { content: { 'application/json': infer B } }
    ? undefined extends RawBody<O>
      ? B | undefined
      : B
    : never
type PathParams<O> = O extends { parameters: { path: infer PP } } ? PP : never
type QueryParams<O> = O extends { parameters: { query?: infer Q } } ? Q : never

type Options<O> = ([PathParams<O>] extends [never] ? { path?: never } : { path: PathParams<O> }) &
  ([RequestBody<O>] extends [never] ? { body?: never } : { body: RequestBody<O> }) &
  ([QueryParams<O>] extends [never] | [undefined] ? { query?: never } : { query?: QueryParams<O> }) & {
    signal?: AbortSignal
  }

/** Same-origin base path. Dev: Vite proxies /api to the backend. Prod: the reverse proxy does. */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function buildUrl(path: string, params?: Record<string, unknown>, query?: Record<string, unknown>) {
  const filled = path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = params?.[key]
    if (value === undefined || value === null) throw new Error(`Missing path parameter "${key}" for ${path}`)
    return encodeURIComponent(String(value))
  })
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    // Arrays repeat the key (?status=a&status=b), as FastAPI expects for list parameters.
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== null) search.append(key, String(item))
    }
  }
  const qs = search.toString()
  return `${API_BASE}${filled}${qs ? `?${qs}` : ''}`
}

async function request<P extends keyof paths, M extends Method>(
  method: M,
  path: P,
  options: Options<Operation<P, M>>,
): Promise<SuccessBody<Operation<P, M>>> {
  const {
    path: params,
    body,
    query,
    signal,
  } = options as {
    path?: Record<string, unknown>
    body?: unknown
    query?: Record<string, unknown>
    signal?: AbortSignal
  }
  const upper = method.toUpperCase()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (UNSAFE.has(upper)) {
    const token = csrfToken()
    if (token) headers[CSRF_HEADER] = token
  }

  const raw = body instanceof Blob
  if (raw) headers['Content-Type'] = body.type || 'application/octet-stream'

  let response: Response
  try {
    response = await fetch(new URL(buildUrl(String(path), params, query), window.location.origin), {
      method: upper,
      headers,
      credentials: 'include',
      // Bytes rather than the Blob itself: every fetch implementation sends an ArrayBuffer as is.
      body: body === undefined ? undefined : raw ? await body.arrayBuffer() : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError('network', "You're offline or the server can't be reached.", null)
  }

  const text = await response.text()
  const data: unknown = text ? safeJson(text) : undefined
  if (!response.ok) {
    const { message, fieldErrors } = parseErrorBody(data)
    const retryAfter = Number(response.headers.get('Retry-After'))
    throw new ApiError(
      kindForStatus(response.status),
      message,
      response.status,
      fieldErrors,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    )
  }
  return data as SuccessBody<Operation<P, M>>
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Typed client. Paths, params, bodies and responses come from api/openapi.json. */
export const api = {
  get: <P extends PathsWith<'get'>>(path: P, options: Options<Operation<P, 'get'>>) =>
    request('get', path, options),
  post: <P extends PathsWith<'post'>>(path: P, options: Options<Operation<P, 'post'>>) =>
    request('post', path, options),
  put: <P extends PathsWith<'put'>>(path: P, options: Options<Operation<P, 'put'>>) =>
    request('put', path, options),
  patch: <P extends PathsWith<'patch'>>(path: P, options: Options<Operation<P, 'patch'>>) =>
    request('patch', path, options),
  delete: <P extends PathsWith<'delete'>>(path: P, options: Options<Operation<P, 'delete'>>) =>
    request('delete', path, options),
  /** POST a file as the raw request body (its `type` becomes the Content-Type), e.g. listing photos. */
  upload: <P extends PathsWith<'post'>>(
    path: P,
    options: Omit<Options<Operation<P, 'post'>>, 'body'> & { body: Blob },
  ) => request('post', path, options as unknown as Options<Operation<P, 'post'>>),
  /** PUT a file as the raw request body, e.g. the shop logo. */
  uploadPut: <P extends PathsWith<'put'>>(
    path: P,
    options: Omit<Options<Operation<P, 'put'>>, 'body'> & { body: Blob },
  ) => request('put', path, options as unknown as Options<Operation<P, 'put'>>),
}

export type { paths }
export type Schemas = components['schemas']

import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
import { listingResponse } from '@/test/fixtures'
import { server } from '@/test/server'
import { api, buildUrl, type Schemas } from './client'
import { CSRF_HEADER, readCookie } from './csrf'
import { ApiError } from './errors'

const LISTING_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
const listing: Schemas['ListingResponse'] = listingResponse({
  id: LISTING_ID,
  unique_id: 'IMEI-1234',
  dispute_policy: {},
})

function setCookie(value: string) {
  document.cookie = value
}

afterEach(() => {
  document.cookie = 'vekro_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

describe('buildUrl', () => {
  it('fills path params and encodes them, under the same-origin /api base', () => {
    expect(buildUrl('/listings/{listing_id}', { listing_id: 'a b' })).toBe('/api/listings/a%20b')
  })
  it('adds defined query params only', () => {
    expect(buildUrl('/notifications', {}, { limit: 20, offset: undefined })).toBe(
      '/api/notifications?limit=20',
    )
  })
  it('throws on a missing path param', () => {
    expect(() => buildUrl('/listings/{listing_id}', {})).toThrow(/listing_id/)
  })
})

describe('api client', () => {
  it('GETs a typed resource with cookies included and no CSRF header', async () => {
    let seen: Request | undefined
    server.use(
      http.get('/api/listings/:id', ({ request }) => {
        seen = request
        return HttpResponse.json(listing)
      }),
    )
    const result = await api.get('/listings/{listing_id}', { path: { listing_id: LISTING_ID } })
    expectTypeOf(result).toEqualTypeOf<Schemas['ListingResponse']>()
    expect(result.title).toBe('iPhone 13, 128GB, Midnight')
    expect(seen?.credentials).toBe('include')
    expect(seen?.headers.get(CSRF_HEADER)).toBeNull()
  })

  it('sends the CSRF cookie value as the header on unsafe methods', async () => {
    setCookie('vekro_csrf=tok%3D123; path=/')
    let header: string | null = null
    let body: unknown
    server.use(
      http.post('/api/transactions', async ({ request }) => {
        header = request.headers.get(CSRF_HEADER)
        body = await request.json()
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    await api.post('/transactions', { body: { listing_id: LISTING_ID } })
    expect(header).toBe('tok=123')
    expect(body).toEqual({ listing_id: LISTING_ID })
  })

  it('uploads a file as the raw body with its type and the CSRF header', async () => {
    setCookie('vekro_csrf=tok; path=/')
    let seen: { type: string | null; csrf: string | null; size: number } | undefined
    server.use(
      http.post('/api/listings/:id/photos', async ({ request }) => {
        seen = {
          type: request.headers.get('Content-Type'),
          csrf: request.headers.get(CSRF_HEADER),
          size: (await request.arrayBuffer()).byteLength,
        }
        return HttpResponse.json({ id: 'p1', url: '/listings/l1/photos/p1' }, { status: 201 })
      }),
    )
    const photo = await api.upload('/listings/{listing_id}/photos', {
      path: { listing_id: 'l1' },
      body: new Blob(['abcd'], { type: 'image/jpeg' }),
    })
    expect(photo).toEqual({ id: 'p1', url: '/listings/l1/photos/p1' })
    expect(seen).toEqual({ type: 'image/jpeg', csrf: 'tok', size: 4 })
  })

  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [429, 'rate_limited'],
    [503, 'server'],
  ] as const)('maps HTTP %i to kind "%s" with the detail message', async (status, kind) => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({ detail: 'Nope.' }, { status })))
    const error = await api.get('/auth/me', {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind, status, message: 'Nope.' })
  })

  it('maps FastAPI 422 details to field errors', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          {
            detail: [
              {
                loc: ['body', 'phone'],
                msg: 'String should have at least 7 characters',
                type: 'string_too_short',
              },
              { loc: ['body', 'password'], msg: 'Field required', type: 'missing' },
            ],
          },
          { status: 422 },
        ),
      ),
    )
    const error = (await api
      .post('/auth/login', { body: { phone: '07', password: '' } })
      .catch((e) => e)) as ApiError
    expect(error.kind).toBe('validation')
    expect(error.fieldErrors).toEqual({
      phone: 'String should have at least 7 characters',
      password: 'Field required',
    })
    expect(error.message).toBe('String should have at least 7 characters')
  })

  it('maps a failed connection to kind "network"', async () => {
    server.use(http.get('/api/health', () => HttpResponse.error()))
    await expect(api.get('/health', {})).rejects.toMatchObject({ kind: 'network', status: null })
  })
})

describe('readCookie', () => {
  it('reads and decodes one cookie among many', () => {
    expect(readCookie('vekro_csrf', 'a=1; vekro_csrf=x%2Fy; b=2')).toBe('x/y')
    expect(readCookie('missing', 'a=1')).toBeNull()
  })
})

describe('api client types', () => {
  it('rejects unknown paths, missing bodies and missing path params at compile time', () => {
    const typeOnly = () => {
      // @ts-expect-error unknown path
      void api.get('/not-a-route', {})
      // @ts-expect-error POST /transactions requires a body
      void api.post('/transactions', {})
      // @ts-expect-error missing path param
      void api.get('/listings/{listing_id}', {})
      // @ts-expect-error wrong body field type
      void api.post('/auth/login', { body: { phone: 712345678, password: 'secret-pass' } })
    }
    expect(typeof typeOnly).toBe('function')
  })
})

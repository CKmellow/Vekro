import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { sampleUser } from '@/test/session'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { AdminLogInPage } from './AdminLogInPage'

function renderAt(url: string) {
  server.use(
    http.get('/api/auth/me', () =>
      HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
    ),
  )
  const router = createMemoryRouter(
    [
      { path: '/admin/login', element: <AdminLogInPage /> },
      { path: '/admin/*', element: <h1>Console</h1> },
      { path: '/seller/*', element: <h1>Seller area</h1> },
    ],
    { initialEntries: [url] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

async function logIn(u: ReturnType<typeof renderAt>['user']) {
  await u.type(screen.getByLabelText('Phone number'), '700000001')
  await u.type(screen.getByLabelText('Password'), 'console2026')
  await u.click(screen.getByRole('button', { name: 'Log in' }))
}

describe('A1 admin log in', () => {
  it('lets staff in and returns them to the console page they asked for', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(sampleUser('admin'))))
    const { user, router } = renderAt('/admin/login?returnTo=%2Fadmin%2Ftransactions&reason=expired')
    expect(screen.getByRole('heading', { name: 'Vekro Support Console' })).toBeInTheDocument()
    expect(screen.getByText('Your session ended. Log in again to continue.')).toBeInTheDocument()
    expect(screen.getByText('All actions are logged.')).toBeInTheDocument()
    await logIn(user)
    await screen.findByRole('heading', { name: 'Console' })
    expect(router.state.location.pathname).toBe('/admin/transactions')
  })

  it('never returns outside the console', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(sampleUser('admin'))))
    const { user, router } = renderAt('/admin/login?returnTo=%2Fseller%2Forders')
    await logIn(user)
    await screen.findByRole('heading', { name: 'Console' })
    expect(router.state.location.pathname).toBe('/admin')
  })

  it('signs a seller straight back out', async () => {
    let signedOut = false
    server.use(
      http.post('/api/auth/login', () => HttpResponse.json(sampleUser('seller'))),
      http.post('/api/auth/logout', () => {
        signedOut = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderAt('/admin/login')
    await logIn(user)
    expect(await screen.findByText("This account doesn't have console access.")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to the seller app' })).toHaveAttribute('href', '/login')
    await waitFor(() => expect(signedOut).toBe(true))
  })

  it('keeps the credential error generic', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid credentials.' }, { status: 401 }),
      ),
    )
    const { user } = renderAt('/admin/login')
    await logIn(user)
    expect(await screen.findByText("That phone number and password don't match.")).toBeInTheDocument()
  })
})

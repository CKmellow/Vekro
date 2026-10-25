import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { ForgotPasswordPage } from './ForgotPasswordPage'

function renderPage() {
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json({ detail: 'x' }, { status: 401 })),
    http.post('/api/auth/password/reset/request-code', () =>
      HttpResponse.json({ resend_after_seconds: 30, dev_code: null }, { status: 202 }),
    ),
    http.post('/api/auth/password/reset', async ({ request }) => {
      const body = (await request.json()) as { code: string }
      return body.code === '482913'
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json({ detail: "That code doesn't match." }, { status: 422 })
    }),
  )
  const router = createMemoryRouter(
    [
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/login', element: <h1>Log in page</h1> },
    ],
    { initialEntries: ['/forgot-password'] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

describe('Forgot password', () => {
  it('texts a code, refuses a wrong one, then sets the new password and returns to log in', async () => {
    const { user, router } = renderPage()
    await user.type(screen.getByLabelText('Phone number'), '722118904')
    await user.click(screen.getByRole('button', { name: 'Send code' }))
    expect(await screen.findByText(/If \+254 722 \*\*\* 904 has a Vekro account/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Digit 1 of 6'), '111111')
    await user.type(screen.getByLabelText('New password'), 'Papaya2027')
    await user.type(screen.getByLabelText('Confirm new password'), 'Papaya2027')
    await user.click(screen.getByRole('button', { name: 'Set new password' }))
    expect(await screen.findByText(/That code doesn't match/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Digit 1 of 6'), '482913')
    await user.click(screen.getByRole('button', { name: 'Set new password' }))
    await screen.findByRole('heading', { name: 'Log in page' })
    expect(router.state.location.search).toBe('?reason=reset')
  })

  it('checks the new password before sending', async () => {
    const { user } = renderPage()
    await user.type(screen.getByLabelText('Phone number'), '722118904')
    await user.click(screen.getByRole('button', { name: 'Send code' }))
    await user.click(await screen.findByRole('button', { name: 'Set new password' }))
    expect(screen.getByText('Use 8 or more characters with a letter and a number')).toBeInTheDocument()
    expect(screen.getByText('Enter the 6-digit code')).toBeInTheDocument()
  })
})

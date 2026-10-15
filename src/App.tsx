import { useState } from 'react'
import { RouterProvider } from 'react-router'
import { AppProviders } from './app/providers'
import { createQueryClient } from './app/queryClient'
import { createAppRouter } from './app/router'

export function App() {
  const [client] = useState(createQueryClient)
  const [router] = useState(createAppRouter)
  return (
    <AppProviders client={client}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

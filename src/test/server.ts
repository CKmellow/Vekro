import { setupServer } from 'msw/node'

// Shared MSW server for tests. Tests add handlers with server.use(...).
export const server = setupServer()

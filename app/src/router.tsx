import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

import type { AuthContextState } from '#/contexts/auth.context'

export interface RouterContext {
  auth: AuthContextState
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    context: {
      auth: {
        authUser: null,
        profile: null,
        loading: true,
      },
    } satisfies RouterContext,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

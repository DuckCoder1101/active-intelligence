import type { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { routeTree } from './routeTree.gen';

import type { CustomClaims } from '@/types/custom-claims.type';
import { createQueryClient } from '@/utils/queryClient.util';

export interface RouterContext {
  sessionUser: CustomClaims | null;
  queryClient: QueryClient;
}

export function getRouter() {
  const queryClient = createQueryClient();

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    context: {
      sessionUser: null,
      queryClient,
    } satisfies RouterContext,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

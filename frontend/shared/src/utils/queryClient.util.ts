import { MutationCache, QueryCache, QueryClient, type Query } from '@tanstack/react-query';
import { FirebaseError } from 'firebase/app';
import { toast } from 'react-toastify';

import { mapFirebaseError } from '@/utils/mapFirebaseError.util';

// Queries de fundo (ex: notificações) marcam `meta.silentOnUnauthenticated`
// porque disparam sozinhas assim que o usuário autentica — se pegarem o token
// numa janela de corrida e falharem com "unauthenticated", isso não é um erro
// que o usuário causou, e um toast nesse momento parece (erradamente) erro da
// ação que ele acabou de fazer (ex: completar cadastro).
function isSilencedUnauthenticatedError(
  error: unknown,
  query: Query<unknown, unknown, unknown, readonly unknown[]>,
): boolean {
  return (
    query.meta?.silentOnUnauthenticated === true &&
    error instanceof FirebaseError &&
    error.code === 'functions/unauthenticated'
  );
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // React Query default is `staleTime: 0`, which refetches on every
        // mount/window-focus even when the cached data is seconds old. Most
        // of this app's data (reference lists, profiles, dashboards) doesn't
        // need second-by-second freshness, so a sane baseline here cuts a
        // large share of redundant callable invocations across the board.
        // Queries that genuinely need faster updates (e.g. unread counts)
        // opt back in with a shorter `staleTime`/`refetchInterval` locally.
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isSilencedUnauthenticatedError(error, query)) {
          console.error('[query] unauthenticated (silenced)', query.queryKey, error);
          return;
        }
        toast.error(mapFirebaseError(error));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => toast.error(mapFirebaseError(error)),
    }),
  });
}

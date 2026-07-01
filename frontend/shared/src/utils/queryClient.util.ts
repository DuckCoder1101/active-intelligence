import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { pushSnackbarViaBridge } from '@/contexts/snackbar.bridge';
import { mapFirebaseError } from '@/utils/mapFirebaseError.util';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => pushSnackbarViaBridge(mapFirebaseError(error)),
    }),
    mutationCache: new MutationCache({
      onError: (error) => pushSnackbarViaBridge(mapFirebaseError(error)),
    }),
  });
}

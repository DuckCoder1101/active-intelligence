import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { mapFirebaseError } from '@/utils/mapFirebaseError.util';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => toast.error(mapFirebaseError(error)),
    }),
    mutationCache: new MutationCache({
      onError: (error) => toast.error(mapFirebaseError(error)),
    }),
  });
}

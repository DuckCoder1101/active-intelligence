import { onCall, HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import type {
  CallableRequest,
  CallableFunction,
  CallableOptions,
} from 'firebase-functions/https';

type Handler<T, R> = (req: CallableRequest<T>) => Promise<R>;

export function onCallHandler<T = unknown, R = unknown>(
  handler: Handler<T, R>,
  options: CallableOptions = {},
): CallableFunction<T, Promise<R>> {
  return onCall(
    {
      invoker: 'public',
      region: 'southamerica-east1',
      ...options,
    },
    async (req) => {
      try {
        return await handler(req);
      } catch (err) {
        if (err instanceof HttpsError) {
          logger.error(
            '[onCallHandler] HttpsError:',
            err.code,
            err.message,
            err.details,
          );
          throw err;
        }

        logger.error('Unhandled error in callable function', err);
        throw new HttpsError('internal', 'Erro interno inesperado.');
      }
    },
  );
}

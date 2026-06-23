import { onCall, HttpsError } from 'firebase-functions/https';
import { logger } from 'firebase-functions';

import type { CallableRequest, CallableFunction } from 'firebase-functions/https';

type Handler<T, R> = (req: CallableRequest<T>) => Promise<R>;

export function onCallHandler<T = unknown, R = unknown>(
  handler: Handler<T, R>,
): CallableFunction<T, Promise<R>> {
  return onCall(async (req) => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof HttpsError) {
        console.error('[onCallHandler] HttpsError:', err.code, err.message, err.details);
        throw err;
      }

      console.error('[onCallHandler] Unhandled error:', err);
      logger.error('Unhandled error in callable function', err);
      throw new HttpsError('internal', 'Erro interno inesperado.');
    }
  });
}

import { onCall, HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import type {
  CallableRequest,
  CallableFunction,
  CallableOptions,
} from "firebase-functions/https";

type Handler<T, R> = (req: CallableRequest<T>) => Promise<R>;

function buildDiagnosticContext(req: CallableRequest<unknown>) {
  const headers = req.rawRequest?.headers ?? {};

  return {
    function: process.env.FUNCTION_TARGET ?? process.env.K_SERVICE ?? null,
    uid: req.auth?.uid ?? null,
    hasAuthHeader: Boolean(headers.authorization),
    hasAppCheck: Boolean(req.app),
    userAgent: headers["user-agent"] ?? null,
    origin: headers.origin ?? null,
    ip: req.rawRequest?.ip ?? null,
  };
}

export function onCallHandler<T = unknown, R = unknown>(
  handler: Handler<T, R>,
  options: CallableOptions = {},
): CallableFunction<T, Promise<R>> {
  return onCall(
    {
      invoker: "public",
      region: "southamerica-east1",
      concurrency: 80,
      cpu: 1,
      ...options,
    },
    async (req: CallableRequest<T>): Promise<R> => {
      try {
        return await handler(req);
      } catch (err) {
        const context = buildDiagnosticContext(req);

        if (err instanceof HttpsError) {
          logger.error(
            "[onCallHandler] HttpsError:",
            err.code,
            err.message,
            { details: err.details, ...context },
          );
          throw err;
        }

        logger.error("Unhandled error in callable function", err, context);
        throw new HttpsError("internal", "Erro interno inesperado.");
      }
    },
  );
}

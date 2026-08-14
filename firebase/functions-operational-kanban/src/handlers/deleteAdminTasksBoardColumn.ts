import { z } from "zod";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";

import {
  onCallHandler,
  requireAccess,
  AdminTasksBoardRepository,
} from "functions-shared";

const ACCESS = { minAccessLevel: "owner" as const };

const schema = z.object({ columnId: z.string().min(1) });

/**
 * Deletes an internal admin-tasks-board column.
 * Auth: requireAccess(req, {minAccessLevel:"owner"}).
 * Schema: inline z.object({columnId}).
 */
export const deleteAdminTasksBoardColumnHandler =
  onCallHandler(async (req) => {
    requireAccess(req, ACCESS);

    const { success, data, error } = schema.safeParse(req.data);
    if (!success) {
      throw new HttpsError(
        "invalid-argument",
        "columnId obrigatório",
        error.issues,
      );
    }

    logger.info("deleteAdminTasksBoardColumn", { columnId: data.columnId });

    return AdminTasksBoardRepository.delete(data.columnId);
  });

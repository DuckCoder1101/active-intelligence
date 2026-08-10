import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";
import {
  onCallHandler,
  requireAccess,
  AdminTasksBoardRepository,
} from "functions-shared";
import { AdminTasksBoardSchema } from "../data/admin-tasks-board.schema";

const ACCESS = { minAccessLevel: "owner" as const };

/**
 * Creates/updates an admin-tasks-board column.
 * Auth: requireAccess(req, {minAccessLevel:"owner"}).
 * Schema: ../data/admin-tasks-board.schema -> AdminTasksBoardSchema.saveColumnSchema.
 */
export const saveAdminTasksBoardColumnHandler =
  onCallHandler(async (req) => {
    requireAccess(req, ACCESS);

    const { success, data, error } =
      AdminTasksBoardSchema.saveColumnSchema.safeParse(req.data);

    if (!success) {
      throw new HttpsError(
        "invalid-argument",
        error.issues.map((i) => i.message).join(", "),
      );
    }

    logger.info("saveAdminTasksBoardColumn", {
      action: data.columnId ? "update" : "create",
      columnId: data.columnId,
    });

    return AdminTasksBoardRepository.save(data);
  });

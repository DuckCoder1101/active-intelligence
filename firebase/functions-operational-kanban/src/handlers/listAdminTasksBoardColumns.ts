import { logger } from "firebase-functions";

import {
  onCallHandler,
  requireAccess,
  AdminTasksBoardRepository,
} from "functions-shared";

const ACCESS = { minAccessLevel: "user" as const };

/**
 * Lists internal admin-tasks-board columns.
 * Auth: requireAccess(req, {minAccessLevel:"user"}).
 * Schema: none.
 */
export const listAdminTasksBoardColumnsHandler =
  onCallHandler(async (req) => {
    requireAccess(req, ACCESS);
    const result = await AdminTasksBoardRepository.listAll();
    logger.info("listAdminTasksBoardColumns: retornando N itens", {
      count: result.length,
    });
    return result;
  });

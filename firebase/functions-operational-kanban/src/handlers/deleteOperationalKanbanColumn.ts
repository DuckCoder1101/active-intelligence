import {z} from "zod";
import {HttpsError} from "firebase-functions/https";
import {logger} from "firebase-functions";

import {
  onCallHandler,
  requireAccess,
  OperationalKanbanRepository,
} from "functions-shared";

const ACCESS = {minAccessLevel: "owner" as const};

const schema = z.object({columnId: z.string().min(1)});

export const deleteOperationalKanbanColumnHandler =
  onCallHandler(async (req) => {
    requireAccess(req, ACCESS);

    const {success, data, error} = schema.safeParse(req.data);
    if (!success) {
      throw new HttpsError(
        "invalid-argument",
        "columnId obrigatório",
        error.issues,
      );
    }

    logger.info("deleteOperationalKanbanColumn", {columnId: data.columnId});

    return OperationalKanbanRepository.delete(data.columnId);
  });

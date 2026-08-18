import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { deleteAdminTasksBoardColumnHandler } from "../../src/handlers/deleteAdminTasksBoardColumn";
import {
  AdminTasksBoardRepository,
  requireAccess,
  PENDING_APPROVAL_COLUMN_ID,
} from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteAdminTasksBoardColumnHandler", () => {
  beforeEach(() => {
    vi.mocked(AdminTasksBoardRepository.delete).mockResolvedValue({
      movedTo: "next-column",
    } as any);
  });

  it("rejects missing columnId with invalid-argument", async () => {
    await expect(
      deleteAdminTasksBoardColumnHandler(makeReq({})),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an empty columnId with invalid-argument", async () => {
    await expect(
      deleteAdminTasksBoardColumnHandler(makeReq({ columnId: "" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteAdminTasksBoardColumnHandler(makeReq({ columnId: "col-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the column and returns the repository result", async () => {
    const result = await deleteAdminTasksBoardColumnHandler(
      makeReq({ columnId: "col-1" }),
    );

    expect(AdminTasksBoardRepository.delete).toHaveBeenCalledWith("col-1");
    expect(result).toEqual({ movedTo: "next-column" });
  });

  it("propagates the repository's protected-column guard error", async () => {
    // The real AdminTasksBoardRepository.delete() blocks deleting
    // PROTECTED_COLUMN_IDS (PENDING_APPROVAL_COLUMN_ID / APPROVED_COLUMN_ID)
    // with a failed-precondition HttpsError. The handler itself has no such
    // guard — it purely delegates, so this test verifies the handler
    // faithfully propagates that repository-level rejection instead of
    // swallowing it.
    vi.mocked(AdminTasksBoardRepository.delete).mockImplementationOnce(() => {
      throw new HttpsError(
        "failed-precondition",
        "Este quadro é usado pelo fluxo de aprovação do cliente e não " +
          "pode ser excluído.",
      );
    });

    await expect(
      deleteAdminTasksBoardColumnHandler(
        makeReq({ columnId: PENDING_APPROVAL_COLUMN_ID }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
});

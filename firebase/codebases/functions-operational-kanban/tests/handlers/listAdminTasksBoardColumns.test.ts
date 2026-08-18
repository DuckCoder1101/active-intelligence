import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { listAdminTasksBoardColumnsHandler } from "../../src/handlers/listAdminTasksBoardColumns";
import { AdminTasksBoardRepository, requireAccess } from "functions-shared";

function makeReq() {
  return { data: {}, auth: { uid: "u1", token: {} } } as any;
}

describe("listAdminTasksBoardColumnsHandler", () => {
  beforeEach(() => {
    vi.mocked(AdminTasksBoardRepository.listAll).mockResolvedValue([
      { columnId: "col-1", name: "Requisitada", color: "#94a3b8", order: 0 },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listAdminTasksBoardColumnsHandler(makeReq()),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists all admin-tasks-board columns", async () => {
    const result = await listAdminTasksBoardColumnsHandler(makeReq());

    expect(AdminTasksBoardRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([
      { columnId: "col-1", name: "Requisitada", color: "#94a3b8", order: 0 },
    ]);
  });

  it("returns an empty list when there are no columns", async () => {
    vi.mocked(AdminTasksBoardRepository.listAll).mockResolvedValue([]);

    const result = await listAdminTasksBoardColumnsHandler(makeReq());

    expect(result).toEqual([]);
  });
});

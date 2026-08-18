import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { saveAdminTasksBoardColumnHandler } from "../../src/handlers/saveAdminTasksBoardColumn";
import { AdminTasksBoardRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

const validData = {
  name: "Em revisão",
  color: "#3b82f6",
};

describe("saveAdminTasksBoardColumnHandler", () => {
  beforeEach(() => {
    vi.mocked(AdminTasksBoardRepository.save).mockResolvedValue({
      columnId: "col-1",
      name: "Em revisão",
      color: "#3b82f6",
      order: 0,
    } as any);
  });

  it("rejects a name that's too short with invalid-argument", async () => {
    await expect(
      saveAdminTasksBoardColumnHandler(
        makeReq({ name: "A", color: "#3b82f6" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a name longer than 20 characters with invalid-argument", async () => {
    await expect(
      saveAdminTasksBoardColumnHandler(
        makeReq({ name: "Um nome muito longo demais", color: "#3b82f6" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a missing color with invalid-argument", async () => {
    await expect(
      saveAdminTasksBoardColumnHandler(makeReq({ name: "Válido" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveAdminTasksBoardColumnHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("creates a new column when columnId is absent", async () => {
    const result = await saveAdminTasksBoardColumnHandler(
      makeReq(validData),
    );

    expect(AdminTasksBoardRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Em revisão", color: "#3b82f6" }),
    );
    expect(result).toEqual({
      columnId: "col-1",
      name: "Em revisão",
      color: "#3b82f6",
      order: 0,
    });
  });

  it("updates an existing column when columnId is present", async () => {
    await saveAdminTasksBoardColumnHandler(
      makeReq({ ...validData, columnId: "col-1" }),
    );

    expect(AdminTasksBoardRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ columnId: "col-1" }),
    );
  });
});

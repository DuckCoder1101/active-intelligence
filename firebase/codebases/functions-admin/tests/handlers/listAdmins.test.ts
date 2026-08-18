import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { listAdminsHandler } from "../../src/handlers/listAdmins";
import { AdminRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listAdminsHandler", () => {
  beforeEach(() => {
    vi.mocked(AdminRepository.listAll).mockResolvedValue([
      { uid: "admin-1" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listAdminsHandler(makeReq())).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists all admins", async () => {
    const result = await listAdminsHandler(makeReq());
    expect(AdminRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ uid: "admin-1" }]);
  });
});

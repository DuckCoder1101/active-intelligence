import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { listMyCompanyUsersHandler } from "../../src/handlers/listMyCompanyUsers";
import { CompanyUserRepository, requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listMyCompanyUsersHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyUserRepository.listByCompany).mockResolvedValue([
      { uid: "user-1" },
    ] as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(listMyCompanyUsersHandler(makeReq({}))).rejects.toMatchObject(
      { code: "invalid-argument" },
    );
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listMyCompanyUsersHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists company users", async () => {
    const result = await listMyCompanyUsersHandler(
      makeReq({ companyId: "company-1" }),
    );
    expect(CompanyUserRepository.listByCompany).toHaveBeenCalledWith(
      "company-1",
    );
    expect(result).toEqual([{ uid: "user-1" }]);
  });
});

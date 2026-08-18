import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { listCompanyUsersHandler } from "../../src/handlers/listUsers";
import { CompanyUserRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listCompanyUsersHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyUserRepository.listByCompany).mockResolvedValue([
      { uid: "user-1" },
    ] as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(listCompanyUsersHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("rejects empty companyId with invalid-argument", async () => {
    await expect(
      listCompanyUsersHandler(makeReq({ companyId: "" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listCompanyUsersHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists users for the given company", async () => {
    const result = await listCompanyUsersHandler(
      makeReq({ companyId: "company-1" }),
    );

    expect(CompanyUserRepository.listByCompany).toHaveBeenCalledWith(
      "company-1",
    );
    expect(result).toEqual([{ uid: "user-1" }]);
  });
});

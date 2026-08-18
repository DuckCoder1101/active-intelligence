import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { listCompaniesHandler } from "../../src/handlers/listCompanies";
import { CompanyRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listCompaniesHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyRepository.getAllCompanies).mockResolvedValue([
      { companyId: "company-1" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listCompaniesHandler(makeReq())).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists all companies", async () => {
    const result = await listCompaniesHandler(makeReq());
    expect(CompanyRepository.getAllCompanies).toHaveBeenCalled();
    expect(result).toEqual([{ companyId: "company-1" }]);
  });
});

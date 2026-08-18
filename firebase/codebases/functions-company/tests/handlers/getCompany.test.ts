import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { getCompanyHandler } from "../../src/handlers/getCompany";
import { CompanyRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("getCompanyHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyRepository.getCompanyById).mockResolvedValue({
      companyId: "company-1",
      displayName: "Empresa Teste",
    } as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(getCompanyHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      getCompanyHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns the company by id", async () => {
    const result = await getCompanyHandler(
      makeReq({ companyId: "company-1" }),
    );
    expect(CompanyRepository.getCompanyById).toHaveBeenCalledWith(
      "company-1",
    );
    expect(result).toEqual({
      companyId: "company-1",
      displayName: "Empresa Teste",
    });
  });
});

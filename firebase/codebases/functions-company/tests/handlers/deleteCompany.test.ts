import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { deleteCompanyHandler } from "../../src/handlers/deleteCompany";
import { CompanyRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteCompanyHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyRepository.deleteCompany).mockResolvedValue(
      undefined as any,
    );
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(deleteCompanyHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteCompanyHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the company and returns true", async () => {
    const result = await deleteCompanyHandler(
      makeReq({ companyId: "company-1" }),
    );
    expect(CompanyRepository.deleteCompany).toHaveBeenCalledWith(
      "company-1",
    );
    expect(result).toBe(true);
  });
});

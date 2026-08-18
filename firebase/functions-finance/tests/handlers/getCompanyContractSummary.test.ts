import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/subcategory.repository", () => ({
  SubcategoryRepository: { findOrCreate: vi.fn() },
}));

import { getCompanyContractSummaryHandler } from "../../src/handlers/getCompanyContractSummary";
import { SubcategoryRepository } from "../../src/repositories/subcategory.repository";
import { CompanyRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("getCompanyContractSummaryHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyRepository.getCompanyById).mockResolvedValue({
      companyId: "company-1",
      displayName: "Empresa X",
      financial: { contractType: "mrr", mrr: { monthlyValue: 1000 } },
    } as any);
    vi.mocked(SubcategoryRepository.findOrCreate).mockResolvedValue({
      subcategoryId: "sub-1",
      categoryType: "receitaRecorrente",
      name: "MRR",
      order: 0,
    } as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(
      getCompanyContractSummaryHandler(makeReq({})),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      getCompanyContractSummaryHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("throws failed-precondition when the company has no contract", async () => {
    vi.mocked(CompanyRepository.getCompanyById).mockResolvedValueOnce({
      companyId: "company-1",
      displayName: "Empresa X",
      financial: undefined,
    } as any);
    await expect(
      getCompanyContractSummaryHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("builds the MRR subcategory for an mrr contract", async () => {
    const result = await getCompanyContractSummaryHandler(
      makeReq({ companyId: "company-1" }),
    );

    expect(SubcategoryRepository.findOrCreate).toHaveBeenCalledWith(
      "receitaRecorrente",
      "MRR",
    );
    expect(result).toEqual({
      companyId: "company-1",
      displayName: "Empresa X",
      contractType: "mrr",
      category: "receitaRecorrente",
      subcategoryId: "sub-1",
      subcategoryName: "MRR",
      mrr: { monthlyValue: 1000 },
      tcv: undefined,
    });
  });

  it("builds the TCV subcategory for a tcv contract", async () => {
    vi.mocked(CompanyRepository.getCompanyById).mockResolvedValueOnce({
      companyId: "company-1",
      displayName: "Empresa X",
      financial: { contractType: "tcv", tcv: { totalValue: 5000 } },
    } as any);
    vi.mocked(SubcategoryRepository.findOrCreate).mockResolvedValueOnce({
      subcategoryId: "sub-2",
      categoryType: "receitaPontual",
      name: "TCV",
      order: 0,
    } as any);

    const result = await getCompanyContractSummaryHandler(
      makeReq({ companyId: "company-1" }),
    );

    expect(SubcategoryRepository.findOrCreate).toHaveBeenCalledWith(
      "receitaPontual",
      "TCV",
    );
    expect(result).toMatchObject({
      contractType: "tcv",
      category: "receitaPontual",
      subcategoryId: "sub-2",
      subcategoryName: "TCV",
      tcv: { totalValue: 5000 },
    });
  });
});

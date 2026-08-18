import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/real-estate.repository", () => ({
  RealEstateRepository: { listByCompany: vi.fn() },
}));

import { exportRealEstateHandler } from "../../src/handlers/exportRealEstate";
import { RealEstateRepository } from "../../src/repositories/real-estate.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("exportRealEstateHandler", () => {
  beforeEach(() => {
    vi.mocked(RealEstateRepository.listByCompany).mockResolvedValue([
      { realEstateId: "re-1" },
      { realEstateId: "re-2" },
    ] as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(exportRealEstateHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      exportRealEstateHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns the full dataset for the company", async () => {
    const result = await exportRealEstateHandler(
      makeReq({ companyId: "company-1" }),
    );
    expect(RealEstateRepository.listByCompany).toHaveBeenCalledWith(
      "company-1",
    );
    expect(result).toEqual([{ realEstateId: "re-1" }, { realEstateId: "re-2" }]);
  });
});

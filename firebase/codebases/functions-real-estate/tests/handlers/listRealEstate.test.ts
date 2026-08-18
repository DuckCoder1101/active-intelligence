import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/real-estate.repository", () => ({
  RealEstateRepository: { listByCompany: vi.fn() },
}));

import { listRealEstateHandler } from "../../src/handlers/listRealEstate";
import { RealEstateRepository } from "../../src/repositories/real-estate.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listRealEstateHandler", () => {
  beforeEach(() => {
    vi.mocked(RealEstateRepository.listByCompany).mockResolvedValue([
      { realEstateId: "re-1" },
    ] as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(listRealEstateHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listRealEstateHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists real estates for the company", async () => {
    const result = await listRealEstateHandler(
      makeReq({ companyId: "company-1" }),
    );
    expect(RealEstateRepository.listByCompany).toHaveBeenCalledWith(
      "company-1",
    );
    expect(result).toEqual([{ realEstateId: "re-1" }]);
  });
});

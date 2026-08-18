import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/real-estate.repository", () => ({
  RealEstateRepository: { updateStatus: vi.fn() },
}));

import { updateRealEstateStatusHandler } from "../../src/handlers/updateRealEstateStatus";
import { RealEstateRepository } from "../../src/repositories/real-estate.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("updateRealEstateStatusHandler", () => {
  beforeEach(() => {
    vi.mocked(RealEstateRepository.updateStatus).mockResolvedValue(
      undefined as any,
    );
  });

  it("rejects missing realEstateId with invalid-argument", async () => {
    await expect(
      updateRealEstateStatusHandler(
        makeReq({ companyId: "company-1", status: "disponivel" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an invalid status with invalid-argument", async () => {
    await expect(
      updateRealEstateStatusHandler(
        makeReq({
          companyId: "company-1",
          realEstateId: "re-1",
          status: "not-a-status",
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      updateRealEstateStatusHandler(
        makeReq({
          companyId: "company-1",
          realEstateId: "re-1",
          status: "vendido",
        }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("updates the listing's status and returns true", async () => {
    const result = await updateRealEstateStatusHandler(
      makeReq({
        companyId: "company-1",
        realEstateId: "re-1",
        status: "vendido",
      }),
    );

    expect(RealEstateRepository.updateStatus).toHaveBeenCalledWith(
      "company-1",
      "re-1",
      "vendido",
    );
    expect(result).toBe(true);
  });
});

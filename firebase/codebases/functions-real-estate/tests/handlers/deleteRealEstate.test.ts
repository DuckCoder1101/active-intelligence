import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/real-estate.repository", () => ({
  RealEstateRepository: { delete: vi.fn() },
}));

import { deleteRealEstateHandler } from "../../src/handlers/deleteRealEstate";
import { RealEstateRepository } from "../../src/repositories/real-estate.repository";
import { bucket, requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteRealEstateHandler", () => {
  beforeEach(() => {
    vi.mocked(RealEstateRepository.delete).mockResolvedValue(undefined as any);
    // bucket is a lazy Proxy stub — property access returns a bare vi.fn()
    // resolving to undefined by default. The handler calls
    // `.deleteFiles({ prefix }).catch(...)` directly, so without a real
    // resolved Promise here, calling `.catch` on `undefined` throws.
    vi.mocked(bucket.deleteFiles).mockResolvedValue(undefined);
  });

  it("rejects missing realEstateId with invalid-argument", async () => {
    await expect(
      deleteRealEstateHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteRealEstateHandler(
        makeReq({ companyId: "company-1", realEstateId: "re-1" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the listing and cleans up storage files", async () => {
    const result = await deleteRealEstateHandler(
      makeReq({ companyId: "company-1", realEstateId: "re-1" }),
    );

    expect(RealEstateRepository.delete).toHaveBeenCalledWith(
      "company-1",
      "re-1",
    );
    expect(bucket.deleteFiles).toHaveBeenCalledWith({
      prefix: "client/company-1/real_estate/re-1/",
    });
    expect(result).toBe(true);
  });

  it("still returns true when storage cleanup fails", async () => {
    vi.mocked(bucket.deleteFiles).mockRejectedValueOnce(new Error("boom"));

    const result = await deleteRealEstateHandler(
      makeReq({ companyId: "company-1", realEstateId: "re-1" }),
    );

    expect(result).toBe(true);
  });
});

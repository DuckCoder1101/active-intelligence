import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/real-estate.repository", () => ({
  RealEstateRepository: { save: vi.fn() },
}));

import { saveRealEstateHandler } from "../../src/handlers/saveRealEstate";
import { RealEstateRepository } from "../../src/repositories/real-estate.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = {
  companyId: "company-1",
  propertyType: "apartamento",
  purposes: ["venda"],
  owner: { name: "Owner Name", phone: "11999999999" },
  address: "Rua das Flores",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
};

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveRealEstateHandler", () => {
  beforeEach(() => {
    vi.mocked(RealEstateRepository.save).mockResolvedValue({
      realEstateId: "re-1",
    } as any);
  });

  it("rejects a missing required field (propertyType) with invalid-argument", async () => {
    const { propertyType, ...rest } = validData;
    await expect(
      saveRealEstateHandler(makeReq(rest)),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an invalid propertyType enum value with invalid-argument", async () => {
    await expect(
      saveRealEstateHandler(
        makeReq({ ...validData, propertyType: "not-a-type" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an empty purposes array with invalid-argument", async () => {
    await expect(
      saveRealEstateHandler(makeReq({ ...validData, purposes: [] })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an owner name that is too short", async () => {
    await expect(
      saveRealEstateHandler(
        makeReq({
          ...validData,
          owner: { name: "Bob", phone: "11999999999" },
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireCompanyAccess", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveRealEstateHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("saves the listing using the authenticated user and companyId", async () => {
    const result = await saveRealEstateHandler(makeReq(validData));

    expect(RealEstateRepository.save).toHaveBeenCalledWith(
      "company-1",
      "test-uid",
      expect.objectContaining({
        companyId: "company-1",
        propertyType: "apartamento",
        address: "Rua das Flores",
      }),
    );
    expect(result).toEqual({ realEstateId: "re-1" });
  });

  it("defaults optional booleans/arrays when omitted", async () => {
    await saveRealEstateHandler(makeReq(validData));

    expect(RealEstateRepository.save).toHaveBeenCalledWith(
      "company-1",
      "test-uid",
      expect.objectContaining({
        furnishings: "nao",
        acceptsFinancing: false,
        acceptsExchange: false,
        negotiable: false,
        features: [],
        photos: [],
        portals: [],
        visibleOnWebsite: false,
        featured: false,
      }),
    );
  });
});

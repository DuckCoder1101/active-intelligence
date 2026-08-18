import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { saveCompanyHandler } from "../../src/handlers/saveCompany";
import { CompanyRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

const validData = {
  displayName: "Empresa Teste",
  legalInformation: {
    documentNumber: "11.222.333/0001-81",
  },
  contact: {
    email: "contato@empresa.com",
    phone: "11999999999",
  },
  location: {
    city: "São Paulo",
    state: "SP",
  },
};

describe("saveCompanyHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyRepository.saveCompany).mockResolvedValue(
      undefined as any,
    );
  });

  it("saves a valid new company and returns true", async () => {
    const result = await saveCompanyHandler(makeReq(validData));

    expect(CompanyRepository.saveCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Empresa Teste",
        companyStage: "comercial",
        legalInformation: expect.objectContaining({
          documentNumber: "11.222.333/0001-81",
        }),
        contact: { email: "contato@empresa.com", phone: "11999999999" },
        location: expect.objectContaining({ city: "São Paulo", state: "SP" }),
      }),
    );
    expect(result).toBe(true);
  });

  it("passes the existing companyId through on update", async () => {
    await saveCompanyHandler(
      makeReq({ ...validData, companyId: "company-1" }),
    );

    expect(CompanyRepository.saveCompany).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: "company-1" }),
    );
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveCompanyHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects an invalid CNPJ", async () => {
    await expect(
      saveCompanyHandler(
        makeReq({
          ...validData,
          legalInformation: { documentNumber: "11.111.111/1111-11" },
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a too-short displayName", async () => {
    await expect(
      saveCompanyHandler(makeReq({ ...validData, displayName: "A" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects when contact.email is missing", async () => {
    const { email: _email, ...contactWithoutEmail } = validData.contact;
    await expect(
      saveCompanyHandler(
        makeReq({ ...validData, contact: contactWithoutEmail }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects when location.city is missing", async () => {
    const { city: _city, ...locationWithoutCity } = validData.location;
    await expect(
      saveCompanyHandler(
        makeReq({ ...validData, location: locationWithoutCity }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects mrr contractType without mrr details (business rule)", async () => {
    await expect(
      saveCompanyHandler(
        makeReq({
          ...validData,
          financial: { contractType: "mrr" },
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("accepts a complete mrr contract", async () => {
    const result = await saveCompanyHandler(
      makeReq({
        ...validData,
        financial: {
          contractType: "mrr",
          mrr: {
            monthlyValue: 1000,
            paymentMethod: "pix",
            dueDay: 10,
            startDate: Date.now(),
          },
        },
      }),
    );

    expect(result).toBe(true);
    expect(CompanyRepository.saveCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        financial: expect.objectContaining({ contractType: "mrr" }),
      }),
    );
  });
});

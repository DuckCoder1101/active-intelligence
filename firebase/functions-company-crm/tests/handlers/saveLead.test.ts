import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/lead.repository", () => ({
  LeadRepository: { save: vi.fn() },
}));
vi.mock("../../src/repositories/crm-column.repository", () => ({
  CrmColumnRepository: { listAll: vi.fn() },
}));

import { saveLeadHandler } from "../../src/handlers/saveLead";
import { LeadRepository } from "../../src/repositories/lead.repository";
import { CrmColumnRepository } from "../../src/repositories/crm-column.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = {
  companyId: "company-1",
  funnelId: "funnel-1",
  name: "John Doe",
  phone: "11999999999",
  originId: "origin-1",
  businessType: "compra",
};

function makeReq(data: unknown, auth: any = { uid: "u1", token: {} }) {
  return { data, auth } as any;
}

describe("saveLeadHandler", () => {
  beforeEach(() => {
    vi.mocked(CrmColumnRepository.listAll).mockResolvedValue([
      { columnId: "col-1" },
    ] as any);
    vi.mocked(LeadRepository.save).mockResolvedValue({
      leadId: "lead-1",
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      saveLeadHandler(makeReq({ companyId: "c1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireCompanyAccess", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(saveLeadHandler(makeReq(validData))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("rejects priceMin greater than priceMax", async () => {
    await expect(
      saveLeadHandler(
        makeReq({ ...validData, priceMin: 500_000, priceMax: 100_000 }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("saves the lead using the funnel's first column as default status", async () => {
    const result = await saveLeadHandler(makeReq(validData));

    expect(CrmColumnRepository.listAll).toHaveBeenCalledWith(
      "company-1",
      "funnel-1",
    );
    expect(LeadRepository.save).toHaveBeenCalledWith(
      "company-1",
      "test-uid",
      expect.objectContaining({ name: "John Doe" }),
      "col-1",
    );
    expect(result).toEqual({ leadId: "lead-1" });
  });

  it("falls back to an empty default status when the funnel has no columns", async () => {
    vi.mocked(CrmColumnRepository.listAll).mockResolvedValueOnce([]);

    await saveLeadHandler(makeReq(validData));

    expect(LeadRepository.save).toHaveBeenCalledWith(
      "company-1",
      "test-uid",
      expect.anything(),
      "",
    );
  });
});

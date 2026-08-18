import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/lead.repository", () => ({
  LeadRepository: { listByCompany: vi.fn() },
}));

import { listLeadsHandler } from "../../src/handlers/listLeads";
import { LeadRepository } from "../../src/repositories/lead.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listLeadsHandler", () => {
  beforeEach(() => {
    vi.mocked(LeadRepository.listByCompany).mockResolvedValue([
      { leadId: "lead-1" },
    ] as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(listLeadsHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listLeadsHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists leads for the company", async () => {
    const result = await listLeadsHandler(makeReq({ companyId: "company-1" }));
    expect(LeadRepository.listByCompany).toHaveBeenCalledWith("company-1");
    expect(result).toEqual([{ leadId: "lead-1" }]);
  });
});

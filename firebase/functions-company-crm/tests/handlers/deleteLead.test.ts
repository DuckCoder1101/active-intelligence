import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/lead.repository", () => ({
  LeadRepository: { delete: vi.fn() },
}));

import { deleteLeadHandler } from "../../src/handlers/deleteLead";
import { LeadRepository } from "../../src/repositories/lead.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteLeadHandler", () => {
  beforeEach(() => {
    vi.mocked(LeadRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects missing leadId with invalid-argument", async () => {
    await expect(
      deleteLeadHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteLeadHandler(makeReq({ companyId: "company-1", leadId: "lead-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the lead and returns true", async () => {
    const result = await deleteLeadHandler(
      makeReq({ companyId: "company-1", leadId: "lead-1" }),
    );
    expect(LeadRepository.delete).toHaveBeenCalledWith("company-1", "lead-1");
    expect(result).toBe(true);
  });
});

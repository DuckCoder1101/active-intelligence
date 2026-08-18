import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/lead.repository", () => ({
  LeadRepository: { updateStatus: vi.fn() },
}));

import { updateLeadStatusHandler } from "../../src/handlers/updateLeadStatus";
import { LeadRepository } from "../../src/repositories/lead.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("updateLeadStatusHandler", () => {
  beforeEach(() => {
    vi.mocked(LeadRepository.updateStatus).mockResolvedValue(undefined as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      updateLeadStatusHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      updateLeadStatusHandler(
        makeReq({ companyId: "company-1", leadId: "lead-1", status: "novo" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("updates the lead status and returns true", async () => {
    const result = await updateLeadStatusHandler(
      makeReq({ companyId: "company-1", leadId: "lead-1", status: "novo" }),
    );
    expect(LeadRepository.updateStatus).toHaveBeenCalledWith(
      "company-1",
      "lead-1",
      "novo",
    );
    expect(result).toBe(true);
  });
});

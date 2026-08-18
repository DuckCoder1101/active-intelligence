import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/lead.repository", () => ({
  LeadRepository: { updateDealStatus: vi.fn() },
}));

import { updateLeadDealStatusHandler } from "../../src/handlers/updateLeadDealStatus";
import { LeadRepository } from "../../src/repositories/lead.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("updateLeadDealStatusHandler", () => {
  beforeEach(() => {
    vi.mocked(LeadRepository.updateDealStatus).mockResolvedValue(
      undefined as any,
    );
  });

  it("rejects an invalid dealStatus with invalid-argument", async () => {
    await expect(
      updateLeadDealStatusHandler(
        makeReq({
          companyId: "company-1",
          leadId: "lead-1",
          dealStatus: "not-a-real-status",
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      updateLeadDealStatusHandler(
        makeReq({
          companyId: "company-1",
          leadId: "lead-1",
          dealStatus: "vendido",
        }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("updates the lead deal status and returns true", async () => {
    const result = await updateLeadDealStatusHandler(
      makeReq({
        companyId: "company-1",
        leadId: "lead-1",
        dealStatus: "vendido",
      }),
    );
    expect(LeadRepository.updateDealStatus).toHaveBeenCalledWith(
      "company-1",
      "lead-1",
      "vendido",
    );
    expect(result).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/crm-funnel.repository", () => ({
  CrmFunnelRepository: { delete: vi.fn() },
}));

import { deleteCrmFunnelHandler } from "../../src/handlers/deleteCrmFunnel";
import { CrmFunnelRepository } from "../../src/repositories/crm-funnel.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = { companyId: "company-1", funnelId: "funnel-1" };

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteCrmFunnelHandler", () => {
  beforeEach(() => {
    vi.mocked(CrmFunnelRepository.delete).mockResolvedValue(true as any);
  });

  it("rejects missing funnelId with invalid-argument", async () => {
    await expect(
      deleteCrmFunnelHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteCrmFunnelHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the funnel", async () => {
    const result = await deleteCrmFunnelHandler(makeReq(validData));
    expect(CrmFunnelRepository.delete).toHaveBeenCalledWith(
      "company-1",
      "funnel-1",
    );
    expect(result).toBe(true);
  });
});

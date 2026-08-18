import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/crm-funnel.repository", () => ({
  CrmFunnelRepository: { save: vi.fn() },
}));

import { saveCrmFunnelHandler } from "../../src/handlers/saveCrmFunnel";
import { CrmFunnelRepository } from "../../src/repositories/crm-funnel.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = { companyId: "company-1", name: "Vendas" };

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveCrmFunnelHandler", () => {
  beforeEach(() => {
    vi.mocked(CrmFunnelRepository.save).mockResolvedValue({
      funnelId: "funnel-1",
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      saveCrmFunnelHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveCrmFunnelHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("saves the funnel", async () => {
    const result = await saveCrmFunnelHandler(makeReq(validData));
    expect(CrmFunnelRepository.save).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ name: "Vendas" }),
    );
    expect(result).toEqual({ funnelId: "funnel-1" });
  });
});

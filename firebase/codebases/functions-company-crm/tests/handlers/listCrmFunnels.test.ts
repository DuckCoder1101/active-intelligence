import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/crm-funnel.repository", () => ({
  CrmFunnelRepository: { listAll: vi.fn() },
}));

import { listCrmFunnelsHandler } from "../../src/handlers/listCrmFunnels";
import { CrmFunnelRepository } from "../../src/repositories/crm-funnel.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listCrmFunnelsHandler", () => {
  beforeEach(() => {
    vi.mocked(CrmFunnelRepository.listAll).mockResolvedValue([
      { funnelId: "funnel-1" },
    ] as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(listCrmFunnelsHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listCrmFunnelsHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists funnels for the company", async () => {
    const result = await listCrmFunnelsHandler(
      makeReq({ companyId: "company-1" }),
    );
    expect(CrmFunnelRepository.listAll).toHaveBeenCalledWith("company-1");
    expect(result).toEqual([{ funnelId: "funnel-1" }]);
  });
});

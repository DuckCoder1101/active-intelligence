import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/crm-column.repository", () => ({
  CrmColumnRepository: { listAll: vi.fn() },
}));

import { listCrmColumnsHandler } from "../../src/handlers/listCrmColumns";
import { CrmColumnRepository } from "../../src/repositories/crm-column.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listCrmColumnsHandler", () => {
  beforeEach(() => {
    vi.mocked(CrmColumnRepository.listAll).mockResolvedValue([
      { columnId: "col-1" },
    ] as any);
  });

  it("rejects missing funnelId with invalid-argument", async () => {
    await expect(
      listCrmColumnsHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listCrmColumnsHandler(
        makeReq({ companyId: "company-1", funnelId: "funnel-1" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists columns for the funnel", async () => {
    const result = await listCrmColumnsHandler(
      makeReq({ companyId: "company-1", funnelId: "funnel-1" }),
    );
    expect(CrmColumnRepository.listAll).toHaveBeenCalledWith(
      "company-1",
      "funnel-1",
    );
    expect(result).toEqual([{ columnId: "col-1" }]);
  });
});

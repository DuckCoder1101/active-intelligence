import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/crm-column.repository", () => ({
  CrmColumnRepository: { delete: vi.fn() },
}));

import { deleteCrmColumnHandler } from "../../src/handlers/deleteCrmColumn";
import { CrmColumnRepository } from "../../src/repositories/crm-column.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = {
  companyId: "company-1",
  funnelId: "funnel-1",
  columnId: "col-1",
};

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteCrmColumnHandler", () => {
  beforeEach(() => {
    vi.mocked(CrmColumnRepository.delete).mockResolvedValue(true as any);
  });

  it("rejects missing columnId with invalid-argument", async () => {
    await expect(
      deleteCrmColumnHandler(
        makeReq({ companyId: "company-1", funnelId: "funnel-1" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteCrmColumnHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the column", async () => {
    const result = await deleteCrmColumnHandler(makeReq(validData));
    expect(CrmColumnRepository.delete).toHaveBeenCalledWith(
      "company-1",
      "funnel-1",
      "col-1",
    );
    expect(result).toBe(true);
  });
});

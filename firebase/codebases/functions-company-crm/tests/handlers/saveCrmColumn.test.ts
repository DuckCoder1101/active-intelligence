import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/crm-column.repository", () => ({
  CrmColumnRepository: { save: vi.fn() },
}));

import { saveCrmColumnHandler } from "../../src/handlers/saveCrmColumn";
import { CrmColumnRepository } from "../../src/repositories/crm-column.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = {
  companyId: "company-1",
  funnelId: "funnel-1",
  name: "Novo",
  color: "#fff",
};

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveCrmColumnHandler", () => {
  beforeEach(() => {
    vi.mocked(CrmColumnRepository.save).mockResolvedValue({
      columnId: "col-1",
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      saveCrmColumnHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveCrmColumnHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("saves the column", async () => {
    const result = await saveCrmColumnHandler(makeReq(validData));
    expect(CrmColumnRepository.save).toHaveBeenCalledWith(
      "company-1",
      "funnel-1",
      expect.objectContaining({ name: "Novo", color: "#fff" }),
    );
    expect(result).toEqual({ columnId: "col-1" });
  });
});

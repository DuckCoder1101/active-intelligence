import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/guide.repository", () => ({
  GuideRepository: { listByCompany: vi.fn() },
}));

import { listAssignedGuidesHandler } from "../../src/handlers/listAssignedGuides";
import { GuideRepository } from "../../src/repositories/guide.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listAssignedGuidesHandler", () => {
  beforeEach(() => {
    vi.mocked(GuideRepository.listByCompany).mockResolvedValue([
      { guideId: "guide-1" },
    ] as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(
      listAssignedGuidesHandler(makeReq({})),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireCompanyAccess", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listAssignedGuidesHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists guides assigned to the company", async () => {
    const result = await listAssignedGuidesHandler(
      makeReq({ companyId: "company-1" }),
    );
    expect(requireCompanyAccess).toHaveBeenCalledWith(
      expect.anything(),
      "company-1",
      "à Biblioteca",
    );
    expect(GuideRepository.listByCompany).toHaveBeenCalledWith("company-1");
    expect(result).toEqual([{ guideId: "guide-1" }]);
  });
});

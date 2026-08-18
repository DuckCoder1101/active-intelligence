import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/guide.repository", () => ({
  GuideRepository: { getForCompany: vi.fn() },
}));

import { getAssignedGuideHandler } from "../../src/handlers/getAssignedGuide";
import { GuideRepository } from "../../src/repositories/guide.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("getAssignedGuideHandler", () => {
  beforeEach(() => {
    vi.mocked(GuideRepository.getForCompany).mockResolvedValue({
      guideId: "guide-1",
    } as any);
  });

  it("rejects missing companyId/guideId with invalid-argument", async () => {
    await expect(
      getAssignedGuideHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireCompanyAccess", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      getAssignedGuideHandler(
        makeReq({ companyId: "company-1", guideId: "guide-1" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns the guide assigned to the company", async () => {
    const result = await getAssignedGuideHandler(
      makeReq({ companyId: "company-1", guideId: "guide-1" }),
    );
    expect(requireCompanyAccess).toHaveBeenCalledWith(
      expect.anything(),
      "company-1",
      "à Biblioteca",
    );
    expect(GuideRepository.getForCompany).toHaveBeenCalledWith(
      "company-1",
      "guide-1",
    );
    expect(result).toEqual({ guideId: "guide-1" });
  });
});

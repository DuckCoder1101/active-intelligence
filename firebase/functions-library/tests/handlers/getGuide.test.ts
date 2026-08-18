import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/guide.repository", () => ({
  GuideRepository: { getById: vi.fn() },
}));

import { getGuideHandler } from "../../src/handlers/getGuide";
import { GuideRepository } from "../../src/repositories/guide.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("getGuideHandler", () => {
  beforeEach(() => {
    vi.mocked(GuideRepository.getById).mockResolvedValue({
      guideId: "guide-1",
    } as any);
  });

  it("rejects missing guideId with invalid-argument", async () => {
    await expect(getGuideHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      getGuideHandler(makeReq({ guideId: "guide-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns the guide by id", async () => {
    const result = await getGuideHandler(makeReq({ guideId: "guide-1" }));
    expect(GuideRepository.getById).toHaveBeenCalledWith("guide-1");
    expect(result).toEqual({ guideId: "guide-1" });
  });
});

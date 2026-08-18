import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/guide.repository", () => ({
  GuideRepository: { getPublic: vi.fn() },
}));

import { getPublicGuideHandler } from "../../src/handlers/getPublicGuide";
import { GuideRepository } from "../../src/repositories/guide.repository";

function makeReq(data: unknown) {
  // Public/unauthenticated endpoint — no auth on the request object.
  return { data, auth: undefined } as any;
}

describe("getPublicGuideHandler", () => {
  beforeEach(() => {
    vi.mocked(GuideRepository.getPublic).mockResolvedValue({
      guideId: "guide-1",
    } as any);
  });

  it("rejects missing guideId with invalid-argument", async () => {
    await expect(getPublicGuideHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("returns the public content DTO without requiring auth", async () => {
    const result = await getPublicGuideHandler(makeReq({ guideId: "guide-1" }));
    expect(GuideRepository.getPublic).toHaveBeenCalledWith("guide-1");
    expect(result).toEqual({ guideId: "guide-1" });
  });
});

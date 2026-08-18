import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/guide.repository", () => ({
  GuideRepository: { delete: vi.fn() },
}));

import { deleteGuideHandler } from "../../src/handlers/deleteGuide";
import { GuideRepository } from "../../src/repositories/guide.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteGuideHandler", () => {
  beforeEach(() => {
    vi.mocked(GuideRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects missing guideId with invalid-argument", async () => {
    await expect(deleteGuideHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteGuideHandler(makeReq({ guideId: "guide-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the guide and returns true", async () => {
    const result = await deleteGuideHandler(makeReq({ guideId: "guide-1" }));
    expect(GuideRepository.delete).toHaveBeenCalledWith("guide-1");
    expect(result).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/guide.repository", () => ({
  GuideRepository: { save: vi.fn() },
}));

import { saveGuideHandler } from "../../src/handlers/saveGuide";
import { GuideRepository } from "../../src/repositories/guide.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveGuideHandler", () => {
  beforeEach(() => {
    vi.mocked(GuideRepository.save).mockResolvedValue({
      guideId: "guide-1",
      name: "G-001",
    } as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(saveGuideHandler(makeReq({}))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("rejects a name shorter than 5 characters", async () => {
    await expect(
      saveGuideHandler(makeReq({ name: "abcd" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a name longer than 20 characters", async () => {
    await expect(
      saveGuideHandler(makeReq({ name: "a".repeat(21) })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("accepts a request with no fields at all (all fields optional)", async () => {
    const result = await saveGuideHandler(makeReq({}));
    expect(GuideRepository.save).toHaveBeenCalledWith("test-uid", {});
    expect(result).toEqual({ guideId: "guide-1", name: "G-001" });
  });

  it("treats a null optional field as undefined (callable-function null coercion)", async () => {
    await saveGuideHandler(
      makeReq({ driveUrl: null, socialUrl: null, name: null }),
    );
    expect(GuideRepository.save).toHaveBeenCalledWith(
      "test-uid",
      expect.objectContaining({
        driveUrl: undefined,
        socialUrl: undefined,
        name: undefined,
      }),
    );
  });

  it("creates a new guide when guideId is absent", async () => {
    await saveGuideHandler(makeReq({ name: "Meu Guia" }));
    expect(GuideRepository.save).toHaveBeenCalledWith(
      "test-uid",
      expect.objectContaining({ name: "Meu Guia" }),
    );
    const [, dataArg] = vi.mocked(GuideRepository.save).mock.calls[0];
    expect((dataArg as any).guideId).toBeUndefined();
  });

  it("updates an existing guide when guideId is present", async () => {
    await saveGuideHandler(
      makeReq({ guideId: "guide-1", name: "Meu Guia" }),
    );
    expect(GuideRepository.save).toHaveBeenCalledWith(
      "test-uid",
      expect.objectContaining({ guideId: "guide-1", name: "Meu Guia" }),
    );
  });

  it("passes through scriptGuide blocks and tag arrays", async () => {
    const scriptGuide = [{ id: "b1", title: "Intro", content: "..." }];
    await saveGuideHandler(
      makeReq({
        name: "Meu Guia",
        intentTags: ["vendas"],
        platformTags: ["instagram"],
        scriptGuide,
        assignedCompanyIds: ["company-1"],
      }),
    );
    expect(GuideRepository.save).toHaveBeenCalledWith(
      "test-uid",
      expect.objectContaining({
        intentTags: ["vendas"],
        platformTags: ["instagram"],
        scriptGuide,
        assignedCompanyIds: ["company-1"],
      }),
    );
  });
});

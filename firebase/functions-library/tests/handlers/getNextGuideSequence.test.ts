import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/guide.repository", () => ({
  GuideRepository: { peekNextSequence: vi.fn() },
}));

import { getNextGuideSequenceHandler } from "../../src/handlers/getNextGuideSequence";
import { GuideRepository } from "../../src/repositories/guide.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("getNextGuideSequenceHandler", () => {
  beforeEach(() => {
    vi.mocked(GuideRepository.peekNextSequence).mockResolvedValue(1);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      getNextGuideSequenceHandler(makeReq()),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns the peeked next sequence wrapped in { next }", async () => {
    const result = await getNextGuideSequenceHandler(makeReq());
    expect(GuideRepository.peekNextSequence).toHaveBeenCalled();
    expect(result).toEqual({ next: 1 });
  });

  it("reflects whatever sequence number the repository peeks", async () => {
    vi.mocked(GuideRepository.peekNextSequence).mockResolvedValueOnce(42);
    const result = await getNextGuideSequenceHandler(makeReq());
    expect(result).toEqual({ next: 42 });
  });
});

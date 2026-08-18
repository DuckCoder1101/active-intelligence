import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/review.repository", () => ({
  ReviewRepository: { submit: vi.fn() },
}));

import { submitReviewHandler } from "../../src/handlers/submitReview";
import { ReviewRepository } from "../../src/repositories/review.repository";
import { auth } from "functions-shared";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const validData = {
  stars: 5,
  comment: "Ótimo atendimento",
  anonymous: false,
};

function makeReq(
  data: unknown,
  authOverride: any = { uid: "user-1", token: { companyId: "company-1" } },
) {
  return { data, auth: authOverride } as any;
}

describe("submitReviewHandler", () => {
  beforeEach(() => {
    vi.mocked(auth.getUser).mockResolvedValue({ customClaims: {} } as any);
    vi.mocked(auth.setCustomUserClaims).mockResolvedValue(undefined as any);
    vi.mocked(ReviewRepository.submit).mockResolvedValue(undefined as any);
  });

  it("rejects when the caller's accessLevel is not 'user'", async () => {
    await expect(
      submitReviewHandler(
        makeReq(validData, {
          uid: "user-1",
          token: { accessLevel: "admin", companyId: "company-1" },
        }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects when the caller has no companyId", async () => {
    await expect(
      submitReviewHandler(makeReq(validData, { uid: "user-1", token: {} })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      submitReviewHandler(makeReq({ stars: 0, anonymous: false })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a second review within the same 7-day window", async () => {
    const now = Date.now();
    vi.mocked(auth.getUser).mockResolvedValue({
      customClaims: { lastReviewAt: now - 1000 },
    } as any);

    await expect(
      submitReviewHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(ReviewRepository.submit).not.toHaveBeenCalled();
  });

  it("allows a new review once the 7-day window has elapsed", async () => {
    const now = Date.now();
    vi.mocked(auth.getUser).mockResolvedValue({
      customClaims: { lastReviewAt: now - SEVEN_DAYS_MS - 1000 },
    } as any);

    await submitReviewHandler(makeReq(validData));

    expect(ReviewRepository.submit).toHaveBeenCalledWith(
      "user-1",
      "company-1",
      expect.objectContaining({ stars: 5, anonymous: false }),
    );
  });

  it("submits the review and stamps lastReviewAt on the user's custom claims", async () => {
    await submitReviewHandler(makeReq(validData));

    expect(ReviewRepository.submit).toHaveBeenCalledWith(
      "user-1",
      "company-1",
      expect.objectContaining({
        stars: 5,
        comment: "Ótimo atendimento",
        anonymous: false,
      }),
    );
    expect(auth.setCustomUserClaims).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ lastReviewAt: expect.any(Number) }),
    );
  });

  it("preserves existing custom claims when stamping lastReviewAt", async () => {
    vi.mocked(auth.getUser).mockResolvedValue({
      customClaims: { someOtherClaim: true },
    } as any);

    await submitReviewHandler(makeReq(validData));

    expect(auth.setCustomUserClaims).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        someOtherClaim: true,
        lastReviewAt: expect.any(Number),
      }),
    );
  });
});

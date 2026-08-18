import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/review.repository", () => ({
  ReviewRepository: { delete: vi.fn() },
}));

import { deleteReviewHandler } from "../../src/handlers/deleteReview";
import { ReviewRepository } from "../../src/repositories/review.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteReviewHandler", () => {
  beforeEach(() => {
    vi.mocked(ReviewRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects missing reviewId with invalid-argument", async () => {
    await expect(deleteReviewHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("rejects an empty reviewId with invalid-argument", async () => {
    await expect(
      deleteReviewHandler(makeReq({ reviewId: "" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteReviewHandler(makeReq({ reviewId: "review-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the review by reviewId", async () => {
    const result = await deleteReviewHandler(
      makeReq({ reviewId: "review-1" }),
    );
    expect(ReviewRepository.delete).toHaveBeenCalledWith("review-1");
    expect(result).toBeUndefined();
  });
});

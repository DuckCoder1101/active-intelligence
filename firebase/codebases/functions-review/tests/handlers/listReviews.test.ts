import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/review.repository", () => ({
  ReviewRepository: { list: vi.fn() },
}));

import { listReviewsHandler } from "../../src/handlers/listReviews";
import { ReviewRepository } from "../../src/repositories/review.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listReviewsHandler", () => {
  beforeEach(() => {
    vi.mocked(ReviewRepository.list).mockResolvedValue([
      { reviewId: "review-1" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listReviewsHandler(makeReq())).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists all reviews", async () => {
    const result = await listReviewsHandler(makeReq());
    expect(ReviewRepository.list).toHaveBeenCalledWith();
    expect(result).toEqual([{ reviewId: "review-1" }]);
  });
});

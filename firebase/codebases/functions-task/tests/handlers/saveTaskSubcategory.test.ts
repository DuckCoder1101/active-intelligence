import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task-category.repository", () => ({
  TaskCategoryRepository: { saveSubcategory: vi.fn() },
}));

import { saveTaskSubcategoryHandler } from "../../src/handlers/saveTaskSubcategory";
import { TaskCategoryRepository } from "../../src/repositories/task-category.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveTaskSubcategoryHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskCategoryRepository.saveSubcategory).mockResolvedValue({
      subcategoryId: "sub-1",
      name: "Reels curtos",
      order: 0,
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      saveTaskSubcategoryHandler(makeReq({ categoryId: "feed", name: "a" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveTaskSubcategoryHandler(
        makeReq({ categoryId: "feed", name: "Reels curtos" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("saves the subcategory and returns the repository result", async () => {
    const result = await saveTaskSubcategoryHandler(
      makeReq({ categoryId: "feed", name: "Reels curtos" }),
    );

    expect(TaskCategoryRepository.saveSubcategory).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "feed", name: "Reels curtos" }),
    );
    expect(result).toEqual(
      expect.objectContaining({ subcategoryId: "sub-1", name: "Reels curtos" }),
    );
  });
});

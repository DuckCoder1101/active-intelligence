import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task-category.repository", () => ({
  TaskCategoryRepository: { deleteSubcategory: vi.fn() },
}));

import { deleteTaskSubcategoryHandler } from "../../src/handlers/deleteTaskSubcategory";
import { TaskCategoryRepository } from "../../src/repositories/task-category.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteTaskSubcategoryHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskCategoryRepository.deleteSubcategory).mockResolvedValue(
      undefined as any,
    );
  });

  it("rejects missing subcategoryId with invalid-argument", async () => {
    await expect(
      deleteTaskSubcategoryHandler(makeReq({ categoryId: "feed" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteTaskSubcategoryHandler(
        makeReq({ categoryId: "feed", subcategoryId: "sub-1" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the subcategory and returns true", async () => {
    const result = await deleteTaskSubcategoryHandler(
      makeReq({ categoryId: "feed", subcategoryId: "sub-1" }),
    );

    expect(TaskCategoryRepository.deleteSubcategory).toHaveBeenCalledWith(
      "feed",
      "sub-1",
    );
    expect(result).toBe(true);
  });
});

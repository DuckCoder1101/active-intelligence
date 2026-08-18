import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task-category.repository", () => ({
  TaskCategoryRepository: { saveCategory: vi.fn() },
}));

import { saveTaskCategoryHandler } from "../../src/handlers/saveTaskCategory";
import { TaskCategoryRepository } from "../../src/repositories/task-category.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveTaskCategoryHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskCategoryRepository.saveCategory).mockResolvedValue({
      categoryId: "feed",
      name: "Feed",
      color: "#3b82f6",
      order: 0,
      subcategories: [],
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      saveTaskCategoryHandler(makeReq({ name: "a", color: "#fff" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveTaskCategoryHandler(makeReq({ name: "Feed", color: "#3b82f6" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("saves the category and returns the repository result", async () => {
    const result = await saveTaskCategoryHandler(
      makeReq({ name: "Feed", color: "#3b82f6" }),
    );

    expect(TaskCategoryRepository.saveCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Feed", color: "#3b82f6" }),
    );
    expect(result).toEqual(
      expect.objectContaining({ categoryId: "feed", name: "Feed" }),
    );
  });
});

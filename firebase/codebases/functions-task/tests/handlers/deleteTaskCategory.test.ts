import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task-category.repository", () => ({
  TaskCategoryRepository: { deleteCategory: vi.fn() },
}));

import { deleteTaskCategoryHandler } from "../../src/handlers/deleteTaskCategory";
import { TaskCategoryRepository } from "../../src/repositories/task-category.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteTaskCategoryHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskCategoryRepository.deleteCategory).mockResolvedValue({
      movedTo: "stories",
    } as any);
  });

  it("rejects missing categoryId with invalid-argument", async () => {
    await expect(deleteTaskCategoryHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteTaskCategoryHandler(makeReq({ categoryId: "feed" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the category and returns the repository result", async () => {
    const result = await deleteTaskCategoryHandler(makeReq({ categoryId: "feed" }));

    expect(TaskCategoryRepository.deleteCategory).toHaveBeenCalledWith("feed");
    expect(result).toEqual({ movedTo: "stories" });
  });
});

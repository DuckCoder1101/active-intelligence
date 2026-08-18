import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task-category.repository", () => ({
  TaskCategoryRepository: { listAll: vi.fn() },
}));

import { listTaskCategoriesHandler } from "../../src/handlers/listTaskCategories";
import { TaskCategoryRepository } from "../../src/repositories/task-category.repository";
import { getAuthenticatedUser } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listTaskCategoriesHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskCategoryRepository.listAll).mockResolvedValue([
      { categoryId: "feed" },
    ] as any);
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem sessão");
    });
    await expect(listTaskCategoriesHandler(makeReq({}))).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("lists task categories", async () => {
    const result = await listTaskCategoriesHandler(makeReq({}));

    expect(TaskCategoryRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ categoryId: "feed" }]);
  });
});

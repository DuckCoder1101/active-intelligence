import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task-tag.repository", () => ({
  TaskTagRepository: { delete: vi.fn() },
}));

import { deleteTaskTagHandler } from "../../src/handlers/deleteTaskTag";
import { TaskTagRepository } from "../../src/repositories/task-tag.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteTaskTagHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskTagRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects missing tagId with invalid-argument", async () => {
    await expect(deleteTaskTagHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteTaskTagHandler(makeReq({ tagId: "tag-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the tag and returns true", async () => {
    const result = await deleteTaskTagHandler(makeReq({ tagId: "tag-1" }));

    expect(TaskTagRepository.delete).toHaveBeenCalledWith("tag-1");
    expect(result).toBe(true);
  });
});

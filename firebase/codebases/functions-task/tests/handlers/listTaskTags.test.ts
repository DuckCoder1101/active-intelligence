import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task-tag.repository", () => ({
  TaskTagRepository: { listAll: vi.fn() },
}));

import { listTaskTagsHandler } from "../../src/handlers/listTaskTags";
import { TaskTagRepository } from "../../src/repositories/task-tag.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listTaskTagsHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskTagRepository.listAll).mockResolvedValue([
      { tagId: "tag-1" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listTaskTagsHandler(makeReq({}))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists task tags", async () => {
    const result = await listTaskTagsHandler(makeReq({}));

    expect(TaskTagRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ tagId: "tag-1" }]);
  });
});

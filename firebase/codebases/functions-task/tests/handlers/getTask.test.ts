import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { getById: vi.fn() },
}));

import { getTaskHandler } from "../../src/handlers/getTask";
import { TaskRepository } from "../../src/repositories/task.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("getTaskHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskRepository.getById).mockResolvedValue({
      taskId: "task-1",
      title: "Post do feed",
    } as any);
  });

  it("rejects missing taskId with invalid-argument", async () => {
    await expect(getTaskHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      getTaskHandler(makeReq({ taskId: "task-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns the task", async () => {
    const result = await getTaskHandler(makeReq({ taskId: "task-1" }));

    expect(TaskRepository.getById).toHaveBeenCalledWith("task-1");
    expect(result).toEqual({ taskId: "task-1", title: "Post do feed" });
  });
});

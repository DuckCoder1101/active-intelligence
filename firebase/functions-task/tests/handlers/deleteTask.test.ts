import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { delete: vi.fn() },
}));

import { deleteTaskHandler } from "../../src/handlers/deleteTask";
import { TaskRepository } from "../../src/repositories/task.repository";
import { bucket, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteTaskHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskRepository.delete).mockResolvedValue({
      taskId: "task-1",
      companyId: "company-1",
      hasMedia: true,
    } as any);
    // Known gotcha: deleteTask.ts calls bucket.deleteFiles({prefix}).catch(...)
    // directly. The default Proxy stub resolves to undefined, and undefined
    // has no .catch — must give it a real resolved Promise.
    vi.mocked(bucket.deleteFiles).mockResolvedValue(undefined as any);
  });

  it("rejects missing taskId with invalid-argument", async () => {
    await expect(deleteTaskHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteTaskHandler(makeReq({ taskId: "task-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the task and cleans up storage when the task has media", async () => {
    const result = await deleteTaskHandler(makeReq({ taskId: "task-1" }));

    expect(TaskRepository.delete).toHaveBeenCalledWith("task-1");
    expect(bucket.deleteFiles).toHaveBeenCalledWith({
      prefix: "client/company-1/tasks/task-1/",
    });
    expect(result).toBe(true);
  });

  it("does not touch storage when the task has no media", async () => {
    vi.mocked(TaskRepository.delete).mockResolvedValueOnce({
      taskId: "task-2",
      companyId: "company-1",
      hasMedia: false,
    } as any);

    const result = await deleteTaskHandler(makeReq({ taskId: "task-2" }));

    expect(bucket.deleteFiles).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("swallows storage cleanup failures and still returns true", async () => {
    vi.mocked(bucket.deleteFiles).mockRejectedValue(new Error("boom"));

    const result = await deleteTaskHandler(makeReq({ taskId: "task-1" }));

    expect(result).toBe(true);
  });
});

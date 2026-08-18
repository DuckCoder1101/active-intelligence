import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { listAll: vi.fn() },
}));

import { listTasksHandler } from "../../src/handlers/listTasks";
import { TaskRepository } from "../../src/repositories/task.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listTasksHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskRepository.listAll).mockResolvedValue([
      { taskId: "task-1" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listTasksHandler(makeReq({}))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists all tasks", async () => {
    const result = await listTasksHandler(makeReq({}));

    expect(TaskRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ taskId: "task-1" }]);
  });
});

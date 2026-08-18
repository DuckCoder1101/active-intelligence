import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { getById: vi.fn(), updateStatus: vi.fn() },
}));

import { approveClientTaskHandler } from "../../src/handlers/approveClientTask";
import { TaskRepository } from "../../src/repositories/task.repository";
import {
  AuditRepository,
  getAuthenticatedUser,
  PENDING_APPROVAL_COLUMN_ID,
  APPROVED_COLUMN_ID,
} from "functions-shared";

function makeReq(data: unknown, auth: any = { uid: "u1", token: { companyId: "company-1" } }) {
  return { data, auth } as any;
}

describe("approveClientTaskHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskRepository.getById).mockResolvedValue({
      taskId: "task-1",
      companyId: "company-1",
      title: "Post do feed",
      status: PENDING_APPROVAL_COLUMN_ID,
    } as any);
    vi.mocked(TaskRepository.updateStatus).mockResolvedValue(undefined as any);
  });

  it("rejects non-client-user access levels with permission-denied", async () => {
    await expect(
      approveClientTaskHandler(
        makeReq({ taskId: "task-1" }, { uid: "u1", token: { accessLevel: "admin" } }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects a user with no companyId with failed-precondition", async () => {
    await expect(
      approveClientTaskHandler(makeReq({ taskId: "task-1" }, { uid: "u1", token: {} })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(approveClientTaskHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem sessão");
    });
    await expect(
      approveClientTaskHandler(makeReq({ taskId: "task-1" })),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("rejects when the task belongs to a different company", async () => {
    vi.mocked(TaskRepository.getById).mockResolvedValueOnce({
      taskId: "task-1",
      companyId: "other-company",
      title: "Post do feed",
      status: PENDING_APPROVAL_COLUMN_ID,
    } as any);

    await expect(
      approveClientTaskHandler(makeReq({ taskId: "task-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects when the task is not pending approval", async () => {
    vi.mocked(TaskRepository.getById).mockResolvedValueOnce({
      taskId: "task-1",
      companyId: "company-1",
      title: "Post do feed",
      status: "em_andamento",
    } as any);

    await expect(
      approveClientTaskHandler(makeReq({ taskId: "task-1" })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("approves the task, logs an audit entry and returns true", async () => {
    const result = await approveClientTaskHandler(
      makeReq({ taskId: "task-1", actorName: "Cliente Fulano" }),
    );

    expect(TaskRepository.updateStatus).toHaveBeenCalledWith(
      "task-1",
      APPROVED_COLUMN_ID,
    );
    expect(AuditRepository.log).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ taskId: "task-1", actorName: "Cliente Fulano" }),
    );
    expect(result).toBe(true);
  });
});

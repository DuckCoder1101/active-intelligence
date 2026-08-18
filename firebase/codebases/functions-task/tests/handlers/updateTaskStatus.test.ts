import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { getById: vi.fn(), updateStatus: vi.fn() },
}));

import { updateTaskStatusHandler } from "../../src/handlers/updateTaskStatus";
import { TaskRepository } from "../../src/repositories/task.repository";
import { AdminRepository, AuditRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("updateTaskStatusHandler", () => {
  beforeEach(() => {
    // Default requireAccess mock returns accessLevel "admin" (not "owner").
    vi.mocked(TaskRepository.getById).mockResolvedValue({
      taskId: "task-1",
      companyId: "company-1",
      title: "Post do feed",
      assignedTo: [],
    } as any);
    vi.mocked(TaskRepository.updateStatus).mockResolvedValue(undefined as any);
    vi.mocked(AdminRepository.getResumeByUid).mockResolvedValue({
      name: "Admin Fulano",
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      updateTaskStatusHandler(makeReq({ taskId: "task-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      updateTaskStatusHandler(makeReq({ taskId: "task-1", status: "entregue" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects a non-owner not assigned to the task", async () => {
    vi.mocked(TaskRepository.getById).mockResolvedValueOnce({
      taskId: "task-1",
      companyId: "company-1",
      title: "Post do feed",
      assignedTo: ["someone-else"],
    } as any);

    await expect(
      updateTaskStatusHandler(makeReq({ taskId: "task-1", status: "entregue" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("allows a non-owner assigned to the task to move it", async () => {
    vi.mocked(requireAccess).mockReturnValueOnce({
      uid: "test-uid",
      accessLevel: "admin",
    } as any);
    vi.mocked(TaskRepository.getById).mockResolvedValueOnce({
      taskId: "task-1",
      companyId: "company-1",
      title: "Post do feed",
      assignedTo: ["test-uid"],
    } as any);

    const result = await updateTaskStatusHandler(
      makeReq({ taskId: "task-1", status: "entregue" }),
    );

    expect(TaskRepository.updateStatus).toHaveBeenCalledWith(
      "task-1",
      "entregue",
    );
    expect(result).toBe(true);
  });

  it("allows the owner to move any task regardless of assignment", async () => {
    vi.mocked(requireAccess).mockReturnValueOnce({
      uid: "owner-1",
      accessLevel: "owner",
    } as any);
    vi.mocked(TaskRepository.getById).mockResolvedValueOnce({
      taskId: "task-1",
      companyId: "company-1",
      title: "Post do feed",
      assignedTo: ["someone-else"],
    } as any);

    const result = await updateTaskStatusHandler(
      makeReq({ taskId: "task-1", status: "entregue" }),
    );

    expect(result).toBe(true);
  });

  it("logs an audit entry using the resolved admin name", async () => {
    await updateTaskStatusHandler(
      makeReq({ taskId: "task-1", status: "entregue" }),
    );

    expect(AuditRepository.log).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ actorName: "Admin Fulano", taskId: "task-1" }),
    );
  });

  it("falls back to a generic actor name when the admin lookup fails", async () => {
    vi.mocked(AdminRepository.getResumeByUid).mockRejectedValueOnce(
      new Error("not found"),
    );

    await updateTaskStatusHandler(
      makeReq({ taskId: "task-1", status: "entregue" }),
    );

    expect(AuditRepository.log).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ actorName: "(admin)" }),
    );
  });
});

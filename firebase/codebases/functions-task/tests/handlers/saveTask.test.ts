import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { getById: vi.fn(), save: vi.fn() },
}));

import { saveTaskHandler } from "../../src/handlers/saveTask";
import { TaskRepository } from "../../src/repositories/task.repository";
import { AdminRepository, AuditRepository, requireAccess } from "functions-shared";

const validData = {
  companyId: "company-1",
  title: "Post do feed novo",
  categoryId: "feed",
  dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
};

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveTaskHandler", () => {
  beforeEach(() => {
    // Default requireAccess mock returns accessLevel "admin" (not "owner").
    vi.mocked(TaskRepository.save).mockResolvedValue({
      taskId: "task-1",
      companyId: "company-1",
      title: validData.title,
    } as any);
    vi.mocked(AdminRepository.getResumeByUid).mockResolvedValue({
      name: "Admin Fulano",
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(saveTaskHandler(makeReq({ companyId: "c1" }))).rejects.toMatchObject(
      { code: "invalid-argument" },
    );
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(saveTaskHandler(makeReq(validData))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("forces an empty assignedTo on creation for non-owner callers", async () => {
    await saveTaskHandler(makeReq({ ...validData, assignedTo: ["someone"] }));

    expect(TaskRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ assignedTo: [], createdBy: "test-uid" }),
    );
  });

  it("preserves the provided assignedTo on creation for owner callers", async () => {
    vi.mocked(requireAccess).mockReturnValueOnce({
      uid: "owner-1",
      accessLevel: "owner",
    } as any);

    await saveTaskHandler(makeReq({ ...validData, assignedTo: ["someone"] }));

    expect(TaskRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ assignedTo: ["someone"], createdBy: "owner-1" }),
    );
  });

  it("rejects updates from a non-owner not assigned to the task", async () => {
    vi.mocked(TaskRepository.getById).mockResolvedValueOnce({
      taskId: "task-1",
      companyId: "company-1",
      assignedTo: ["someone-else"],
    } as any);

    await expect(
      saveTaskHandler(makeReq({ ...validData, taskId: "task-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("allows updates from a non-owner assigned to the task and preserves assignment/company", async () => {
    vi.mocked(requireAccess).mockReturnValueOnce({
      uid: "test-uid",
      accessLevel: "admin",
    } as any);
    vi.mocked(TaskRepository.getById).mockResolvedValueOnce({
      taskId: "task-1",
      companyId: "existing-company",
      assignedTo: ["test-uid"],
    } as any);

    await saveTaskHandler(
      makeReq({ ...validData, taskId: "task-1", companyId: "attempted-company" }),
    );

    expect(TaskRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "task-1",
        companyId: "existing-company",
        assignedTo: ["test-uid"],
      }),
    );
  });

  it("allows updates from a non-owner when the task has no assignees yet", async () => {
    vi.mocked(TaskRepository.getById).mockResolvedValueOnce({
      taskId: "task-1",
      companyId: "company-1",
      assignedTo: [],
    } as any);

    const result = await saveTaskHandler(
      makeReq({ ...validData, taskId: "task-1" }),
    );

    expect(result).toEqual(expect.objectContaining({ taskId: "task-1" }));
  });

  it("does not override assignedTo/companyId when the caller is an owner", async () => {
    vi.mocked(requireAccess).mockReturnValueOnce({
      uid: "owner-1",
      accessLevel: "owner",
    } as any);
    vi.mocked(TaskRepository.getById).mockResolvedValueOnce({
      taskId: "task-1",
      companyId: "existing-company",
      assignedTo: ["someone-else"],
    } as any);

    await saveTaskHandler(
      makeReq({
        ...validData,
        taskId: "task-1",
        companyId: "new-company",
        assignedTo: ["fresh-assignee"],
      }),
    );

    expect(TaskRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "new-company",
        assignedTo: ["fresh-assignee"],
      }),
    );
  });

  it("logs an audit entry using the resolved admin name", async () => {
    await saveTaskHandler(makeReq(validData));

    expect(AuditRepository.log).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ actorName: "Admin Fulano", taskId: "task-1" }),
    );
  });

  it("falls back to a generic actor name when the admin lookup fails", async () => {
    vi.mocked(AdminRepository.getResumeByUid).mockRejectedValueOnce(
      new Error("not found"),
    );

    await saveTaskHandler(makeReq(validData));

    expect(AuditRepository.log).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ actorName: "(admin)" }),
    );
  });
});

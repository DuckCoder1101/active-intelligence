import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { save: vi.fn() },
}));

import { createClientTaskHandler } from "../../src/handlers/createClientTask";
import { TaskRepository } from "../../src/repositories/task.repository";
import {
  AdminTasksBoardRepository,
  AuditRepository,
  CompanyRepository,
  NotificationRepository,
  getAuthenticatedUser,
} from "functions-shared";

const validData = {
  title: "Novo post pro feed",
  categoryId: "feed",
  dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
};

function makeReq(data: unknown, auth: any = { uid: "u1", token: { companyId: "company-1" } }) {
  return { data, auth } as any;
}

describe("createClientTaskHandler", () => {
  beforeEach(() => {
    vi.mocked(AdminTasksBoardRepository.listAll).mockResolvedValue([
      { columnId: "requisitada" },
    ] as any);
    vi.mocked(CompanyRepository.checkAndIncrementUsage).mockResolvedValue(
      undefined as any,
    );
    vi.mocked(TaskRepository.save).mockResolvedValue({
      taskId: "task-1",
      companyId: "company-1",
      title: validData.title,
      assignedTo: [],
    } as any);
    vi.mocked(NotificationRepository.notify).mockResolvedValue(undefined as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      createClientTaskHandler(makeReq({ title: "no" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a user with no companyId with failed-precondition", async () => {
    await expect(
      createClientTaskHandler(makeReq(validData, { uid: "u1", token: {} })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("requires companyId in the payload for admins", async () => {
    await expect(
      createClientTaskHandler(
        makeReq(validData, { uid: "u1", token: { accessLevel: "admin" } }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects unknown access levels with permission-denied", async () => {
    await expect(
      createClientTaskHandler(
        makeReq(validData, { uid: "u1", token: { accessLevel: "guest" } }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem sessão");
    });
    await expect(createClientTaskHandler(makeReq(validData))).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("creates the task using the first board column as default status and notifies watchers", async () => {
    const result = await createClientTaskHandler(makeReq(validData));

    expect(CompanyRepository.checkAndIncrementUsage).toHaveBeenCalledWith(
      "company-1",
    );
    expect(TaskRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        status: "requisitada",
        assignedTo: [],
      }),
    );
    expect(AuditRepository.log).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ taskId: "task-1" }),
    );
    expect(NotificationRepository.notify).toHaveBeenCalledWith(
      { permission: "manage-projects" },
      expect.objectContaining({ type: "new-client-task", taskId: "task-1" }),
    );
    expect(result).toEqual(
      expect.objectContaining({ taskId: "task-1", companyId: "company-1" }),
    );
  });

  it("notifies the assigned users directly when the saved task already has assignees", async () => {
    vi.mocked(TaskRepository.save).mockResolvedValueOnce({
      taskId: "task-2",
      companyId: "company-1",
      title: validData.title,
      assignedTo: ["assignee-1"],
    } as any);

    await createClientTaskHandler(makeReq(validData));

    expect(NotificationRepository.notify).toHaveBeenCalledWith(
      { uids: ["assignee-1"] },
      expect.objectContaining({ taskId: "task-2" }),
    );
  });

  it("allows admins to create a task for an explicit companyId", async () => {
    await createClientTaskHandler(
      makeReq(
        { ...validData, companyId: "company-9" },
        { uid: "u1", token: { accessLevel: "owner" } },
      ),
    );

    expect(CompanyRepository.checkAndIncrementUsage).toHaveBeenCalledWith(
      "company-9",
    );
  });
});

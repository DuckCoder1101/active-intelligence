import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { listByCompany: vi.fn() },
}));

import { listClientTasksHandler } from "../../src/handlers/listClientTasks";
import { TaskRepository } from "../../src/repositories/task.repository";
import { CompanyRepository, getAuthenticatedUser } from "functions-shared";

function makeReq(data: unknown, auth: any = { uid: "u1", token: { companyId: "company-1" } }) {
  return { data, auth } as any;
}

describe("listClientTasksHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskRepository.listByCompany).mockResolvedValue([
      { taskId: "task-1" },
    ] as any);
    vi.mocked(CompanyRepository.getTaskUsage).mockResolvedValue({
      used: 1,
      limit: 10,
    } as any);
  });

  it("rejects a user with no companyId with failed-precondition", async () => {
    await expect(
      listClientTasksHandler(makeReq({}, { uid: "u1", token: {} })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("requires companyId in the payload for admins", async () => {
    await expect(
      listClientTasksHandler(
        makeReq({}, { uid: "u1", token: { accessLevel: "admin" } }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects unknown access levels with permission-denied", async () => {
    await expect(
      listClientTasksHandler(
        makeReq({}, { uid: "u1", token: { accessLevel: "guest" } }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem sessão");
    });
    await expect(listClientTasksHandler(makeReq({}))).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("lists tasks and usage for the company", async () => {
    const result = await listClientTasksHandler(makeReq({}));

    expect(TaskRepository.listByCompany).toHaveBeenCalledWith("company-1");
    expect(CompanyRepository.getTaskUsage).toHaveBeenCalledWith("company-1");
    expect(result).toEqual({
      tasks: [{ taskId: "task-1" }],
      usage: { used: 1, limit: 10 },
    });
  });

  it("allows admins to list tasks for an explicit companyId", async () => {
    await listClientTasksHandler(
      makeReq(
        { companyId: "company-9" },
        { uid: "u1", token: { accessLevel: "owner" } },
      ),
    );

    expect(TaskRepository.listByCompany).toHaveBeenCalledWith("company-9");
  });
});

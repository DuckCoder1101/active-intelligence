import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { listByCompanyAndMonth: vi.fn() },
}));

import { listCalendarTasksHandler } from "../../src/handlers/listCalendarTasks";
import { TaskRepository } from "../../src/repositories/task.repository";
import { getAuthenticatedUser } from "functions-shared";

function makeReq(data: unknown, auth: any = { uid: "u1", token: { companyId: "company-1" } }) {
  return { data, auth } as any;
}

describe("listCalendarTasksHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskRepository.listByCompanyAndMonth).mockResolvedValue([
      { taskId: "task-1" },
    ] as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      listCalendarTasksHandler(makeReq({ year: 2026, month: 13 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a user with no companyId with failed-precondition", async () => {
    await expect(
      listCalendarTasksHandler(
        makeReq({ year: 2026, month: 7 }, { uid: "u1", token: {} }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("requires companyId in the payload for admins", async () => {
    await expect(
      listCalendarTasksHandler(
        makeReq(
          { year: 2026, month: 7 },
          { uid: "u1", token: { accessLevel: "admin" } },
        ),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects unknown access levels with permission-denied", async () => {
    await expect(
      listCalendarTasksHandler(
        makeReq(
          { year: 2026, month: 7 },
          { uid: "u1", token: { accessLevel: "guest" } },
        ),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem sessão");
    });
    await expect(
      listCalendarTasksHandler(makeReq({ year: 2026, month: 7 })),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("lists tasks for the company and month", async () => {
    const result = await listCalendarTasksHandler(
      makeReq({ year: 2026, month: 7 }),
    );

    expect(TaskRepository.listByCompanyAndMonth).toHaveBeenCalledWith(
      "company-1",
      2026,
      7,
    );
    expect(result).toEqual({ tasks: [{ taskId: "task-1" }] });
  });
});

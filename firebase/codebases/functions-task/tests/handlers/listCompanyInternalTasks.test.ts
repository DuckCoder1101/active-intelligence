import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/company-internal-task.repository", () => ({
  CompanyInternalTaskRepository: { listByUser: vi.fn() },
}));

import { listCompanyInternalTasksHandler } from "../../src/handlers/listCompanyInternalTasks";
import { CompanyInternalTaskRepository } from "../../src/repositories/company-internal-task.repository";
import { getAuthenticatedUser } from "functions-shared";

function makeReq(data: unknown, auth: any = { uid: "u1", token: { companyId: "company-1" } }) {
  return { data, auth } as any;
}

describe("listCompanyInternalTasksHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyInternalTaskRepository.listByUser).mockResolvedValue([
      { companyInternalTaskId: "task-1" },
    ] as any);
  });

  it("rejects a user with no companyId with failed-precondition", async () => {
    await expect(
      listCompanyInternalTasksHandler(makeReq({}, { uid: "u1", token: {} })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("requires companyId in the payload for admins", async () => {
    await expect(
      listCompanyInternalTasksHandler(
        makeReq({}, { uid: "u1", token: { accessLevel: "admin" } }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects unknown access levels with permission-denied", async () => {
    await expect(
      listCompanyInternalTasksHandler(
        makeReq({}, { uid: "u1", token: { accessLevel: "guest" } }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem sessão");
    });
    await expect(listCompanyInternalTasksHandler(makeReq({}))).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("lists the user's company-internal tasks", async () => {
    const result = await listCompanyInternalTasksHandler(makeReq({}));

    expect(CompanyInternalTaskRepository.listByUser).toHaveBeenCalledWith(
      "company-1",
      "u1",
    );
    expect(result).toEqual([{ companyInternalTaskId: "task-1" }]);
  });

  it("allows admins to list tasks for an explicit companyId", async () => {
    await listCompanyInternalTasksHandler(
      makeReq(
        { companyId: "company-9" },
        { uid: "u1", token: { accessLevel: "owner" } },
      ),
    );

    expect(CompanyInternalTaskRepository.listByUser).toHaveBeenCalledWith(
      "company-9",
      "u1",
    );
  });
});

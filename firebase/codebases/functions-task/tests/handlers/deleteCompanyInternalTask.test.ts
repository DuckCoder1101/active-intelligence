import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/company-internal-task.repository", () => ({
  CompanyInternalTaskRepository: { delete: vi.fn() },
}));

import { deleteCompanyInternalTaskHandler } from "../../src/handlers/deleteCompanyInternalTask";
import { CompanyInternalTaskRepository } from "../../src/repositories/company-internal-task.repository";
import { getAuthenticatedUser } from "functions-shared";

function makeReq(data: unknown, auth: any = { uid: "u1", token: { companyId: "company-1" } }) {
  return { data, auth } as any;
}

describe("deleteCompanyInternalTaskHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyInternalTaskRepository.delete).mockResolvedValue(
      undefined as any,
    );
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(deleteCompanyInternalTaskHandler(makeReq({}))).rejects.toMatchObject(
      { code: "invalid-argument" },
    );
  });

  it("rejects a user with no companyId with failed-precondition", async () => {
    await expect(
      deleteCompanyInternalTaskHandler(
        makeReq({ companyInternalTaskId: "task-1" }, { uid: "u1", token: {} }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("requires companyId in the payload for admins", async () => {
    await expect(
      deleteCompanyInternalTaskHandler(
        makeReq(
          { companyInternalTaskId: "task-1" },
          { uid: "u1", token: { accessLevel: "admin" } },
        ),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects unknown access levels with permission-denied", async () => {
    await expect(
      deleteCompanyInternalTaskHandler(
        makeReq(
          { companyInternalTaskId: "task-1" },
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
      deleteCompanyInternalTaskHandler(makeReq({ companyInternalTaskId: "task-1" })),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("deletes the task and returns true", async () => {
    const result = await deleteCompanyInternalTaskHandler(
      makeReq({ companyInternalTaskId: "task-1" }),
    );

    expect(CompanyInternalTaskRepository.delete).toHaveBeenCalledWith(
      "company-1",
      "u1",
      "task-1",
    );
    expect(result).toBe(true);
  });
});

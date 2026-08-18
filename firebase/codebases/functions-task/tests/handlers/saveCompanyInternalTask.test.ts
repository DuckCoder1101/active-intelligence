import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/company-internal-task.repository", () => ({
  CompanyInternalTaskRepository: { save: vi.fn() },
}));

import { saveCompanyInternalTaskHandler } from "../../src/handlers/saveCompanyInternalTask";
import { CompanyInternalTaskRepository } from "../../src/repositories/company-internal-task.repository";
import { getAuthenticatedUser } from "functions-shared";

const validData = {
  title: "Reunião interna",
  dueDate: Date.now() + 24 * 60 * 60 * 1000,
};

function makeReq(data: unknown, auth: any = { uid: "u1", token: { companyId: "company-1" } }) {
  return { data, auth } as any;
}

describe("saveCompanyInternalTaskHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyInternalTaskRepository.save).mockResolvedValue({
      companyInternalTaskId: "task-1",
      companyId: "company-1",
      title: validData.title,
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      saveCompanyInternalTaskHandler(makeReq({ title: "no" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a user with no companyId with failed-precondition", async () => {
    await expect(
      saveCompanyInternalTaskHandler(makeReq(validData, { uid: "u1", token: {} })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("requires companyId in the payload for admins", async () => {
    await expect(
      saveCompanyInternalTaskHandler(
        makeReq(validData, { uid: "u1", token: { accessLevel: "admin" } }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects unknown access levels with permission-denied", async () => {
    await expect(
      saveCompanyInternalTaskHandler(
        makeReq(validData, { uid: "u1", token: { accessLevel: "guest" } }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem sessão");
    });
    await expect(saveCompanyInternalTaskHandler(makeReq(validData))).rejects.toMatchObject(
      { code: "unauthenticated" },
    );
  });

  it("creates a new task for the caller's company", async () => {
    const result = await saveCompanyInternalTaskHandler(makeReq(validData));

    expect(CompanyInternalTaskRepository.save).toHaveBeenCalledWith(
      "company-1",
      "u1",
      expect.objectContaining({ title: validData.title }),
    );
    expect(result).toEqual(
      expect.objectContaining({ companyInternalTaskId: "task-1" }),
    );
  });

  it("updates an existing task when companyInternalTaskId is provided", async () => {
    await saveCompanyInternalTaskHandler(
      makeReq({ ...validData, companyInternalTaskId: "task-1" }),
    );

    expect(CompanyInternalTaskRepository.save).toHaveBeenCalledWith(
      "company-1",
      "u1",
      expect.objectContaining({ companyInternalTaskId: "task-1" }),
    );
  });

  it("allows admins to save a task for an explicit companyId", async () => {
    await saveCompanyInternalTaskHandler(
      makeReq(
        { ...validData, companyId: "company-9" },
        { uid: "u1", token: { accessLevel: "owner" } },
      ),
    );

    expect(CompanyInternalTaskRepository.save).toHaveBeenCalledWith(
      "company-9",
      "u1",
      expect.anything(),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task.repository", () => ({
  TaskRepository: { updateImages: vi.fn() },
}));

import { updateClientTaskImagesHandler } from "../../src/handlers/updateClientTaskImages";
import { TaskRepository } from "../../src/repositories/task.repository";
import { getAuthenticatedUser } from "functions-shared";

function makeReq(data: unknown, auth: any = { uid: "u1", token: { companyId: "company-1" } }) {
  return { data, auth } as any;
}

describe("updateClientTaskImagesHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskRepository.updateImages).mockResolvedValue(undefined as any);
  });

  it("rejects missing taskId with invalid-argument", async () => {
    await expect(
      updateClientTaskImagesHandler(makeReq({})),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a user with no companyId with failed-precondition", async () => {
    await expect(
      updateClientTaskImagesHandler(
        makeReq({ taskId: "task-1" }, { uid: "u1", token: {} }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("requires companyId in the payload for admins", async () => {
    await expect(
      updateClientTaskImagesHandler(
        makeReq(
          { taskId: "task-1" },
          { uid: "u1", token: { accessLevel: "admin" } },
        ),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects unknown access levels with permission-denied", async () => {
    await expect(
      updateClientTaskImagesHandler(
        makeReq(
          { taskId: "task-1" },
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
      updateClientTaskImagesHandler(makeReq({ taskId: "task-1" })),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("defaults referenceImages to an empty array when omitted", async () => {
    await updateClientTaskImagesHandler(makeReq({ taskId: "task-1" }));

    expect(TaskRepository.updateImages).toHaveBeenCalledWith(
      "task-1",
      "company-1",
      [],
    );
  });

  it("updates the task's reference images and returns success", async () => {
    const result = await updateClientTaskImagesHandler(
      makeReq({ taskId: "task-1", referenceImages: ["img-1.png", "img-2.png"] }),
    );

    expect(TaskRepository.updateImages).toHaveBeenCalledWith(
      "task-1",
      "company-1",
      ["img-1.png", "img-2.png"],
    );
    expect(result).toEqual({ success: true });
  });

  it("allows admins to update images for an explicit companyId", async () => {
    await updateClientTaskImagesHandler(
      makeReq(
        { taskId: "task-1", companyId: "company-9" },
        { uid: "u1", token: { accessLevel: "owner" } },
      ),
    );

    expect(TaskRepository.updateImages).toHaveBeenCalledWith(
      "task-1",
      "company-9",
      [],
    );
  });
});

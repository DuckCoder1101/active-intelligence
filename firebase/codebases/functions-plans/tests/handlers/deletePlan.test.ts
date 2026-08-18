import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/plan.repository", () => ({
  PlanRepository: { delete: vi.fn() },
}));

import { deletePlanHandler } from "../../src/handlers/deletePlan";
import { PlanRepository } from "../../src/repositories/plan.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deletePlanHandler", () => {
  beforeEach(() => {
    vi.mocked(PlanRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects missing planId with invalid-argument", async () => {
    await expect(deletePlanHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deletePlanHandler(makeReq({ planId: "plan-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the plan", async () => {
    const result = await deletePlanHandler(makeReq({ planId: "plan-1" }));
    expect(PlanRepository.delete).toHaveBeenCalledWith("plan-1");
    expect(result).toBeUndefined();
  });
});

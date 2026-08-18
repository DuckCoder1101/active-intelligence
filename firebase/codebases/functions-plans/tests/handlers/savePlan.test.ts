import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/plan.repository", () => ({
  PlanRepository: { save: vi.fn() },
}));

import { savePlanHandler } from "../../src/handlers/savePlan";
import { PlanRepository } from "../../src/repositories/plan.repository";
import { requireAccess } from "functions-shared";

const validData = {
  name: "Plano Teste",
  billingType: "mrr",
  value: 100,
  features: ["schedule"],
  taskLimit: 10,
};

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("savePlanHandler", () => {
  beforeEach(() => {
    vi.mocked(PlanRepository.save).mockResolvedValue({
      planId: "plan-1",
      ...validData,
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      savePlanHandler(makeReq({ ...validData, name: "ab" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an invalid billingType", async () => {
    await expect(
      savePlanHandler(makeReq({ ...validData, billingType: "bogus" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a non-positive value", async () => {
    await expect(
      savePlanHandler(makeReq({ ...validData, value: 0 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a negative taskLimit", async () => {
    await expect(
      savePlanHandler(makeReq({ ...validData, taskLimit: -1 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(savePlanHandler(makeReq(validData))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("creates a new plan when planId is absent", async () => {
    const result = await savePlanHandler(makeReq(validData));

    expect(PlanRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Plano Teste" }),
    );
    expect(result).toEqual({ planId: "plan-1", ...validData });
  });

  it("updates an existing plan when planId is present", async () => {
    await savePlanHandler(makeReq({ ...validData, planId: "plan-1" }));

    expect(PlanRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ planId: "plan-1", name: "Plano Teste" }),
    );
  });
});

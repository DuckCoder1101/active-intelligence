import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/plan.repository", () => ({
  PlanRepository: { listAll: vi.fn() },
}));

import { listPlansHandler } from "../../src/handlers/listPlans";
import { PlanRepository } from "../../src/repositories/plan.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listPlansHandler", () => {
  beforeEach(() => {
    vi.mocked(PlanRepository.listAll).mockResolvedValue([
      { planId: "plan-1" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listPlansHandler(makeReq({}))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists all plans", async () => {
    const result = await listPlansHandler(makeReq({}));
    expect(PlanRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ planId: "plan-1" }]);
  });
});

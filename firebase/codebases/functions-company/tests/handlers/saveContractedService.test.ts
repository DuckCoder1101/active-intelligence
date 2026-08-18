import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/contracted-service.repository", () => ({
  ContractedServiceRepository: { save: vi.fn() },
}));

import { saveContractedServiceHandler } from "../../src/handlers/saveContractedService";
import { ContractedServiceRepository } from "../../src/repositories/contracted-service.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveContractedServiceHandler", () => {
  beforeEach(() => {
    vi.mocked(ContractedServiceRepository.save).mockResolvedValue({
      serviceId: "svc-1",
      name: "Consultoria",
    } as any);
  });

  it("rejects an empty name with invalid-argument", async () => {
    await expect(
      saveContractedServiceHandler(makeReq({ name: "" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a name longer than 60 characters", async () => {
    await expect(
      saveContractedServiceHandler(makeReq({ name: "a".repeat(61) })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveContractedServiceHandler(makeReq({ name: "Consultoria" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("saves the contracted service", async () => {
    const result = await saveContractedServiceHandler(
      makeReq({ name: "Consultoria" }),
    );
    expect(ContractedServiceRepository.save).toHaveBeenCalledWith(
      "Consultoria",
    );
    expect(result).toEqual({ serviceId: "svc-1", name: "Consultoria" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/contracted-service.repository", () => ({
  ContractedServiceRepository: { listAll: vi.fn() },
}));

import { listContractedServicesHandler } from "../../src/handlers/listContractedServices";
import { ContractedServiceRepository } from "../../src/repositories/contracted-service.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listContractedServicesHandler", () => {
  beforeEach(() => {
    vi.mocked(ContractedServiceRepository.listAll).mockResolvedValue([
      { serviceId: "svc-1", name: "Serviço 1" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listContractedServicesHandler(makeReq()),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists contracted services", async () => {
    const result = await listContractedServicesHandler(makeReq());
    expect(ContractedServiceRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ serviceId: "svc-1", name: "Serviço 1" }]);
  });
});

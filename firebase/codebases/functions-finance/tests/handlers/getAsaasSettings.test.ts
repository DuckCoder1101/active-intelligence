import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/integration-settings.repository", () => ({
  IntegrationSettingsRepository: { getEnvironment: vi.fn() },
}));

import { getAsaasSettingsHandler } from "../../src/handlers/getAsaasSettings";
import { IntegrationSettingsRepository } from "../../src/repositories/integration-settings.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("getAsaasSettingsHandler", () => {
  const originalApiKey = process.env.ASAAS_API_KEY;

  beforeEach(() => {
    vi.mocked(IntegrationSettingsRepository.getEnvironment).mockResolvedValue({
      environment: "sandbox",
      updatedAt: 1_700_000_000_000,
    });
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.ASAAS_API_KEY;
    } else {
      process.env.ASAAS_API_KEY = originalApiKey;
    }
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(getAsaasSettingsHandler(makeReq())).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("returns configured=true when ASAAS_API_KEY is set", async () => {
    process.env.ASAAS_API_KEY = "test-key";
    const result = await getAsaasSettingsHandler(makeReq());
    expect(IntegrationSettingsRepository.getEnvironment).toHaveBeenCalledWith(
      "asaas",
    );
    expect(result).toEqual({
      configured: true,
      environment: "sandbox",
      updatedAt: 1_700_000_000_000,
    });
  });

  it("returns configured=false when ASAAS_API_KEY is unset", async () => {
    delete process.env.ASAAS_API_KEY;
    const result = await getAsaasSettingsHandler(makeReq());
    expect(result).toEqual({
      configured: false,
      environment: "sandbox",
      updatedAt: 1_700_000_000_000,
    });
  });
});

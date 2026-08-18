import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/integration-settings.repository", () => ({
  IntegrationSettingsRepository: { saveEnvironment: vi.fn() },
}));

import { saveAsaasSettingsHandler } from "../../src/handlers/saveAsaasSettings";
import { IntegrationSettingsRepository } from "../../src/repositories/integration-settings.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveAsaasSettingsHandler", () => {
  const originalApiKey = process.env.ASAAS_API_KEY;

  beforeEach(() => {
    vi.mocked(IntegrationSettingsRepository.saveEnvironment).mockResolvedValue({
      environment: "production",
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

  it("rejects an invalid environment with invalid-argument", async () => {
    await expect(
      saveAsaasSettingsHandler(makeReq({ environment: "staging" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  // requireAccess runs BEFORE schema validation in this handler (opposite order
  // from the CRM reference handler), so a permission failure must win even when
  // the payload is otherwise invalid.
  it("propagates permission errors from requireAccess before schema validation runs", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveAsaasSettingsHandler(makeReq({ environment: "not-a-real-value" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns configured=true when ASAAS_API_KEY is set", async () => {
    process.env.ASAAS_API_KEY = "test-key";
    const result = await saveAsaasSettingsHandler(
      makeReq({ environment: "production" }),
    );

    expect(IntegrationSettingsRepository.saveEnvironment).toHaveBeenCalledWith(
      "asaas",
      "production",
    );
    expect(result).toEqual({
      configured: true,
      environment: "production",
      updatedAt: 1_700_000_000_000,
    });
  });

  it("returns configured=false when ASAAS_API_KEY is unset", async () => {
    delete process.env.ASAAS_API_KEY;
    const result = await saveAsaasSettingsHandler(
      makeReq({ environment: "sandbox" }),
    );
    expect(result.configured).toBe(false);
  });
});

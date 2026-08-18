import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/account.repository", () => ({
  AccountRepository: { save: vi.fn() },
}));

import { saveAccountHandler } from "../../src/handlers/saveAccount";
import { AccountRepository } from "../../src/repositories/account.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveAccountHandler", () => {
  beforeEach(() => {
    vi.mocked(AccountRepository.save).mockResolvedValue({
      accountId: "acc-1",
      name: "Conta Principal",
    } as any);
  });

  it("rejects missing name with invalid-argument", async () => {
    await expect(saveAccountHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("rejects a name longer than 60 characters", async () => {
    await expect(
      saveAccountHandler(makeReq({ name: "a".repeat(61) })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an invalid accountType", async () => {
    await expect(
      saveAccountHandler(
        makeReq({ name: "Conta Principal", accountType: "invalid" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveAccountHandler(makeReq({ name: "Conta Principal" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("creates an account with only a name, leaving optional fields undefined", async () => {
    const result = await saveAccountHandler(makeReq({ name: "Conta Principal" }));

    expect(AccountRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Conta Principal",
      }),
    );
    const [savedPayload] = vi.mocked(AccountRepository.save).mock.calls[0];
    expect(savedPayload).not.toHaveProperty("bankCode");
    expect(savedPayload).not.toHaveProperty("accountType");
    expect(savedPayload).not.toHaveProperty("holderDocumentType");
    expect(result).toEqual({ accountId: "acc-1", name: "Conta Principal" });
  });

  it("trims the name and updates an existing account when accountId is given", async () => {
    await saveAccountHandler(
      makeReq({ accountId: "acc-1", name: "  Conta Secundária  " }),
    );

    expect(AccountRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "acc-1",
        name: "Conta Secundária",
      }),
    );
  });

  it("passes through full bank details", async () => {
    await saveAccountHandler(
      makeReq({
        name: "Conta Completa",
        bankCode: "001",
        bankName: "Banco do Brasil",
        agency: "1234",
        accountNumber: "56789",
        accountType: "corrente",
        holderName: "John Doe",
        holderDocumentType: "cpf",
        holderDocument: "12345678900",
        pixKey: "john@example.com",
        asaasWalletId: "wallet-1",
      }),
    );

    expect(AccountRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        bankCode: "001",
        bankName: "Banco do Brasil",
        accountType: "corrente",
        holderDocumentType: "cpf",
        pixKey: "john@example.com",
        asaasWalletId: "wallet-1",
      }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/account.repository", () => ({
  AccountRepository: { delete: vi.fn() },
}));

import { deleteAccountHandler } from "../../src/handlers/deleteAccount";
import { AccountRepository } from "../../src/repositories/account.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteAccountHandler", () => {
  beforeEach(() => {
    vi.mocked(AccountRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects missing accountId with invalid-argument", async () => {
    await expect(deleteAccountHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteAccountHandler(makeReq({ accountId: "acc-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the account", async () => {
    await deleteAccountHandler(makeReq({ accountId: "acc-1" }));
    expect(AccountRepository.delete).toHaveBeenCalledWith("acc-1");
  });

  it("propagates a failed-precondition error when the account is still in use", async () => {
    vi.mocked(AccountRepository.delete).mockRejectedValueOnce(
      new HttpsError(
        "failed-precondition",
        "Não é possível excluir uma conta em uso por lançamentos.",
      ),
    );
    await expect(
      deleteAccountHandler(makeReq({ accountId: "acc-1" })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
});

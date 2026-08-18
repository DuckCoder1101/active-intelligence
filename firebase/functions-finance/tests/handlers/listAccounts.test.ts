import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/account.repository", () => ({
  AccountRepository: { listAll: vi.fn() },
}));

import { listAccountsHandler } from "../../src/handlers/listAccounts";
import { AccountRepository } from "../../src/repositories/account.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listAccountsHandler", () => {
  beforeEach(() => {
    vi.mocked(AccountRepository.listAll).mockResolvedValue([
      { accountId: "acc-1", name: "Conta Principal" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listAccountsHandler(makeReq())).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists accounts", async () => {
    const result = await listAccountsHandler(makeReq());
    expect(AccountRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ accountId: "acc-1", name: "Conta Principal" }]);
  });
});

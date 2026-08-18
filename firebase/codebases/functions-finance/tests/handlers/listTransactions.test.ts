import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/transaction.repository", () => ({
  TransactionRepository: { listAll: vi.fn() },
}));

import { listTransactionsHandler } from "../../src/handlers/listTransactions";
import { TransactionRepository } from "../../src/repositories/transaction.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listTransactionsHandler", () => {
  beforeEach(() => {
    vi.mocked(TransactionRepository.listAll).mockResolvedValue([
      { transactionId: "txn-1" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listTransactionsHandler(makeReq())).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists transactions", async () => {
    const result = await listTransactionsHandler(makeReq());
    expect(TransactionRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ transactionId: "txn-1" }]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/transaction.repository", () => ({
  TransactionRepository: { unmarkPaid: vi.fn() },
}));

import { unmarkTransactionPaidHandler } from "../../src/handlers/unmarkTransactionPaid";
import { TransactionRepository } from "../../src/repositories/transaction.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("unmarkTransactionPaidHandler", () => {
  beforeEach(() => {
    vi.mocked(TransactionRepository.unmarkPaid).mockResolvedValue({
      transactionId: "txn-1",
      status: "previsto",
      paidDate: undefined,
    } as any);
  });

  it("rejects missing transactionId with invalid-argument", async () => {
    await expect(
      unmarkTransactionPaidHandler(makeReq({})),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      unmarkTransactionPaidHandler(makeReq({ transactionId: "txn-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("reverts the transaction to previsto and clears paidDate", async () => {
    const result = await unmarkTransactionPaidHandler(
      makeReq({ transactionId: "txn-1" }),
    );
    expect(TransactionRepository.unmarkPaid).toHaveBeenCalledWith("txn-1");
    expect(result).toEqual({
      transactionId: "txn-1",
      status: "previsto",
      paidDate: undefined,
    });
  });

  it("propagates a not-found error for a nonexistent transaction", async () => {
    vi.mocked(TransactionRepository.unmarkPaid).mockRejectedValueOnce(
      new HttpsError("not-found", "Lançamento não encontrado."),
    );
    await expect(
      unmarkTransactionPaidHandler(makeReq({ transactionId: "missing" })),
    ).rejects.toMatchObject({ code: "not-found" });
  });
});

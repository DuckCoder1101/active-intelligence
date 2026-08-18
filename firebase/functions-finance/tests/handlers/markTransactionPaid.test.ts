import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/transaction.repository", () => ({
  TransactionRepository: { markPaid: vi.fn() },
}));

import { markTransactionPaidHandler } from "../../src/handlers/markTransactionPaid";
import { TransactionRepository } from "../../src/repositories/transaction.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("markTransactionPaidHandler", () => {
  beforeEach(() => {
    vi.mocked(TransactionRepository.markPaid).mockResolvedValue({
      transactionId: "txn-1",
      status: "realizado",
      paidDate: 1_700_000_000_000,
    } as any);
  });

  it("rejects missing transactionId with invalid-argument", async () => {
    await expect(
      markTransactionPaidHandler(makeReq({ paidDate: 1_700_000_000_000 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects missing paidDate with invalid-argument", async () => {
    await expect(
      markTransactionPaidHandler(makeReq({ transactionId: "txn-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      markTransactionPaidHandler(
        makeReq({ transactionId: "txn-1", paidDate: 1_700_000_000_000 }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("marks the transaction as paid", async () => {
    const result = await markTransactionPaidHandler(
      makeReq({ transactionId: "txn-1", paidDate: 1_700_000_000_000 }),
    );
    expect(TransactionRepository.markPaid).toHaveBeenCalledWith(
      "txn-1",
      1_700_000_000_000,
    );
    expect(result).toEqual({
      transactionId: "txn-1",
      status: "realizado",
      paidDate: 1_700_000_000_000,
    });
  });

  it("propagates a not-found error for a nonexistent transaction", async () => {
    vi.mocked(TransactionRepository.markPaid).mockRejectedValueOnce(
      new HttpsError("not-found", "Lançamento não encontrado."),
    );
    await expect(
      markTransactionPaidHandler(
        makeReq({ transactionId: "missing", paidDate: 1_700_000_000_000 }),
      ),
    ).rejects.toMatchObject({ code: "not-found" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/transaction.repository", () => ({
  TransactionRepository: { delete: vi.fn() },
}));

import { deleteTransactionHandler } from "../../src/handlers/deleteTransaction";
import { TransactionRepository } from "../../src/repositories/transaction.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteTransactionHandler", () => {
  beforeEach(() => {
    vi.mocked(TransactionRepository.delete).mockResolvedValue({
      transactionId: "txn-1",
    } as any);
  });

  it("rejects missing transactionId with invalid-argument", async () => {
    await expect(
      deleteTransactionHandler(makeReq({})),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteTransactionHandler(makeReq({ transactionId: "txn-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the transaction and returns the deleted record", async () => {
    const result = await deleteTransactionHandler(
      makeReq({ transactionId: "txn-1" }),
    );
    expect(TransactionRepository.delete).toHaveBeenCalledWith("txn-1");
    expect(result).toEqual({ transactionId: "txn-1" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/account.repository", () => ({
  AccountRepository: { getById: vi.fn() },
}));
vi.mock("../../src/repositories/subcategory.repository", () => ({
  SubcategoryRepository: { getById: vi.fn() },
}));
vi.mock("../../src/repositories/transaction.repository", () => ({
  TransactionRepository: { save: vi.fn(), col: { doc: vi.fn() } },
}));

import { saveTransactionHandler } from "../../src/handlers/saveTransaction";
import { AccountRepository } from "../../src/repositories/account.repository";
import { SubcategoryRepository } from "../../src/repositories/subcategory.repository";
import { TransactionRepository } from "../../src/repositories/transaction.repository";
import { CompanyRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

const validData = {
  type: "saida",
  category: "despesa",
  accountId: "acc-1",
  amount: 100,
  paymentMethod: "pix",
  dueDate: Date.UTC(2026, 0, 15),
  accrualDate: Date.UTC(2026, 0, 15),
};

describe("saveTransactionHandler", () => {
  beforeEach(() => {
    vi.mocked(AccountRepository.getById).mockResolvedValue({
      accountId: "acc-1",
      name: "Conta Principal",
    } as any);
    vi.mocked(SubcategoryRepository.getById).mockResolvedValue({
      subcategoryId: "sub-1",
      categoryType: "despesa",
      name: "Sub 1",
    } as any);
    vi.mocked(CompanyRepository.getCompanyResumeById).mockResolvedValue({
      companyId: "company-1",
      displayName: "Empresa X",
    } as any);
    vi.mocked(TransactionRepository.save).mockImplementation(
      async (input: any) => ({
        ...input,
        transactionId: input.transactionId ?? "generated-id",
      }),
    );
    vi.mocked(TransactionRepository.col.doc).mockReturnValue({
      id: "group-1",
    } as any);
  });

  it("rejects missing accountId with invalid-argument", async () => {
    const { accountId, ...rest } = validData;
    await expect(saveTransactionHandler(makeReq(rest))).rejects.toMatchObject(
      { code: "invalid-argument" },
    );
  });

  it("rejects setting both installments and isRecurring", async () => {
    await expect(
      saveTransactionHandler(
        makeReq({ ...validData, installments: 2, isRecurring: true }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveTransactionHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects when the subcategory doesn't belong to the selected category", async () => {
    vi.mocked(SubcategoryRepository.getById).mockResolvedValueOnce({
      subcategoryId: "sub-1",
      categoryType: "custo",
      name: "Servidores",
    } as any);

    await expect(
      saveTransactionHandler(
        makeReq({ ...validData, subcategoryId: "sub-1", category: "despesa" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
    expect(TransactionRepository.save).not.toHaveBeenCalled();
  });

  it("saves a simple transaction without subcategory or company", async () => {
    const result = await saveTransactionHandler(makeReq(validData));

    expect(SubcategoryRepository.getById).not.toHaveBeenCalled();
    expect(CompanyRepository.getCompanyResumeById).not.toHaveBeenCalled();
    expect(AccountRepository.getById).toHaveBeenCalledWith("acc-1");
    expect(TransactionRepository.save).toHaveBeenCalledTimes(1);
    expect(TransactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "saida",
        category: "despesa",
        subcategoryId: undefined,
        subcategoryName: undefined,
        companyId: undefined,
        companyName: undefined,
        accountId: "acc-1",
        accountName: "Conta Principal",
        createdBy: "test-uid",
        amount: 100,
        transactionId: undefined,
      }),
    );
    expect(result).toMatchObject({ transactionId: "generated-id" });
  });

  it("enriches with subcategory data when subcategoryId is given", async () => {
    await saveTransactionHandler(
      makeReq({ ...validData, subcategoryId: "sub-1" }),
    );

    expect(SubcategoryRepository.getById).toHaveBeenCalledWith("sub-1");
    expect(TransactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        subcategoryId: "sub-1",
        subcategoryName: "Sub 1",
      }),
    );
  });

  it("prefers the registered company's displayName over a free-text companyName", async () => {
    await saveTransactionHandler(
      makeReq({
        ...validData,
        companyId: "company-1",
        companyName: "ignored free text",
      }),
    );

    expect(CompanyRepository.getCompanyResumeById).toHaveBeenCalledWith(
      "company-1",
    );
    expect(TransactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        companyName: "Empresa X",
      }),
    );
  });

  it("keeps a free-text companyName when no companyId is given", async () => {
    await saveTransactionHandler(
      makeReq({ ...validData, companyName: "Cliente avulso" }),
    );

    expect(CompanyRepository.getCompanyResumeById).not.toHaveBeenCalled();
    expect(TransactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: undefined,
        companyName: "Cliente avulso",
      }),
    );
  });

  it("updates an existing transaction as a single save, ignoring installments", async () => {
    const result = await saveTransactionHandler(
      makeReq({
        ...validData,
        transactionId: "txn-1",
        installmentIndex: 2,
      }),
    );

    expect(TransactionRepository.save).toHaveBeenCalledTimes(1);
    expect(TransactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: "txn-1",
        installmentIndex: 2,
      }),
    );
    expect(result).toMatchObject({ transactionId: "txn-1" });
  });

  it("splits a new transaction into installments sharing a groupId, clamping day-of-month", async () => {
    const result = await saveTransactionHandler(
      makeReq({
        ...validData,
        amount: 100,
        dueDate: Date.UTC(2026, 0, 31), // Jan 31, 2026
        accrualDate: Date.UTC(2026, 0, 15),
        installments: 2,
      }),
    );

    expect(TransactionRepository.save).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(TransactionRepository.save).mock.calls;

    expect(calls[0][0]).toMatchObject({
      amount: 50,
      dueDate: Date.UTC(2026, 0, 31),
      accrualDate: Date.UTC(2026, 0, 15),
      groupId: "group-1",
      installmentIndex: 1,
      installmentTotal: 2,
      isRecurring: undefined,
    });
    // Feb 2026 has 28 days (not a leap year) -> Jan 31 + 1 month clamps to Feb 28.
    expect(calls[1][0]).toMatchObject({
      amount: 50,
      dueDate: Date.UTC(2026, 1, 28),
      accrualDate: Date.UTC(2026, 1, 15),
      groupId: "group-1",
      installmentIndex: 2,
      installmentTotal: 2,
    });
    expect(result).toHaveLength(2);
  });

  it("splits an odd amount across installments, remainder on the last share", async () => {
    await saveTransactionHandler(
      makeReq({ ...validData, amount: 100, installments: 3 }),
    );

    const calls = vi.mocked(TransactionRepository.save).mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[0][0].amount).toBeCloseTo(33.33, 2);
    expect(calls[1][0].amount).toBeCloseTo(33.33, 2);
    expect(calls[2][0].amount).toBeCloseTo(33.34, 2);
  });

  it("generates 12 monthly occurrences for a recurring transaction with no end date", async () => {
    await saveTransactionHandler(
      makeReq({
        ...validData,
        category: "receitaRecorrente",
        dueDate: Date.UTC(2026, 0, 1),
        accrualDate: Date.UTC(2026, 0, 1),
        isRecurring: true,
      }),
    );

    const calls = vi.mocked(TransactionRepository.save).mock.calls;
    expect(calls).toHaveLength(12);
    expect(calls[0][0]).toMatchObject({
      installmentIndex: 1,
      installmentTotal: 12,
      isRecurring: true,
      amount: 100,
    });
    expect(calls[11][0]).toMatchObject({
      installmentIndex: 12,
      installmentTotal: 12,
      dueDate: Date.UTC(2026, 11, 1),
    });
  });

  it("caps recurring occurrences based on recurrenceEndDate", async () => {
    await saveTransactionHandler(
      makeReq({
        ...validData,
        category: "receitaRecorrente",
        dueDate: Date.UTC(2026, 0, 1),
        accrualDate: Date.UTC(2026, 0, 1),
        isRecurring: true,
        recurrenceEndDate: Date.UTC(2026, 2, 1), // Mar 1, 2026 -> 3 occurrences
      }),
    );

    expect(TransactionRepository.save).toHaveBeenCalledTimes(3);
  });
});

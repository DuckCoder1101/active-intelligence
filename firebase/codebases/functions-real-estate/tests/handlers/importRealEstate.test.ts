import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/real-estate.repository", () => ({
  RealEstateRepository: { findByCode: vi.fn(), save: vi.fn() },
}));

import { importRealEstateHandler } from "../../src/handlers/importRealEstate";
import { RealEstateRepository } from "../../src/repositories/real-estate.repository";
import { requireCompanyAccess } from "functions-shared";

function makeRow(overrides: Record<string, unknown> = {}, rowNumber = 1) {
  return {
    propertyType: "apartamento",
    purposes: ["venda"],
    owner: { name: "Owner Name", phone: "11999999999" },
    address: "Rua A",
    neighborhood: "Centro",
    city: "SP",
    state: "SP",
    rowNumber,
    ...overrides,
  };
}

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("importRealEstateHandler", () => {
  beforeEach(() => {
    vi.mocked(RealEstateRepository.save).mockResolvedValue({
      code: "I-001",
    } as any);
    vi.mocked(RealEstateRepository.findByCode).mockResolvedValue(
      undefined as any,
    );
  });

  it("rejects an empty rows array with invalid-argument", async () => {
    await expect(
      importRealEstateHandler(makeReq({ companyId: "company-1", rows: [] })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects more than 200 rows with invalid-argument", async () => {
    const rows = Array.from({ length: 201 }, (_, i) => makeRow({}, i + 1));
    await expect(
      importRealEstateHandler(makeReq({ companyId: "company-1", rows })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a malformed row (invalid propertyType) with invalid-argument", async () => {
    const rows = [makeRow({ propertyType: "not-a-type" })];
    await expect(
      importRealEstateHandler(makeReq({ companyId: "company-1", rows })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a row missing a required field (address) with invalid-argument", async () => {
    const row = makeRow();
    delete (row as any).address;
    await expect(
      importRealEstateHandler(
        makeReq({ companyId: "company-1", rows: [row] }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireCompanyAccess", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      importRealEstateHandler(
        makeReq({ companyId: "company-1", rows: [makeRow()] }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("creates a new listing for a row without a code", async () => {
    vi.mocked(RealEstateRepository.save).mockResolvedValueOnce({
      code: "I-001",
    } as any);

    const result = await importRealEstateHandler(
      makeReq({ companyId: "company-1", rows: [makeRow({}, 1)] }),
    );

    expect(RealEstateRepository.findByCode).not.toHaveBeenCalled();
    expect(RealEstateRepository.save).toHaveBeenCalledWith(
      "company-1",
      "test-uid",
      expect.objectContaining({ companyId: "company-1", address: "Rua A" }),
    );
    expect(result).toEqual({
      created: 1,
      updated: 0,
      failed: 0,
      results: [{ rowNumber: 1, code: "I-001", status: "created" }],
    });
  });

  it("updates an existing listing when the row's code matches", async () => {
    vi.mocked(RealEstateRepository.findByCode).mockResolvedValueOnce({
      realEstateId: "existing-re-1",
      code: "I-005",
    } as any);
    vi.mocked(RealEstateRepository.save).mockResolvedValueOnce({
      code: "I-005",
    } as any);

    const result = await importRealEstateHandler(
      makeReq({
        companyId: "company-1",
        rows: [makeRow({ code: "I-005" }, 2)],
      }),
    );

    expect(RealEstateRepository.findByCode).toHaveBeenCalledWith(
      "company-1",
      "I-005",
    );
    expect(RealEstateRepository.save).toHaveBeenCalledWith(
      "company-1",
      "test-uid",
      expect.objectContaining({
        companyId: "company-1",
        realEstateId: "existing-re-1",
      }),
    );
    expect(result).toEqual({
      created: 0,
      updated: 1,
      failed: 0,
      results: [{ rowNumber: 2, code: "I-005", status: "updated" }],
    });
  });

  it("reports a row error when the code isn't found, without calling save", async () => {
    vi.mocked(RealEstateRepository.findByCode).mockResolvedValueOnce(
      undefined,
    );

    const result = await importRealEstateHandler(
      makeReq({
        companyId: "company-1",
        rows: [makeRow({ code: "I-999" }, 3)],
      }),
    );

    expect(RealEstateRepository.save).not.toHaveBeenCalled();
    expect(result).toEqual({
      created: 0,
      updated: 0,
      failed: 1,
      results: [
        {
          rowNumber: 3,
          code: "I-999",
          status: "error",
          message: `Código "I-999" não encontrado — linha não foi importada.`,
        },
      ],
    });
  });

  it("captures the HttpsError message when save fails with an HttpsError", async () => {
    vi.mocked(RealEstateRepository.save).mockRejectedValueOnce(
      new HttpsError("already-exists", "Código duplicado"),
    );

    const result = await importRealEstateHandler(
      makeReq({ companyId: "company-1", rows: [makeRow({}, 4)] }),
    );

    expect(result).toEqual({
      created: 0,
      updated: 0,
      failed: 1,
      results: [
        {
          rowNumber: 4,
          code: undefined,
          status: "error",
          message: "Código duplicado",
        },
      ],
    });
  });

  it("falls back to a generic error message when save fails with a non-HttpsError", async () => {
    vi.mocked(RealEstateRepository.save).mockRejectedValueOnce(
      new Error("db unavailable"),
    );

    const result = await importRealEstateHandler(
      makeReq({ companyId: "company-1", rows: [makeRow({}, 5)] }),
    );

    expect(result).toEqual({
      created: 0,
      updated: 0,
      failed: 1,
      results: [
        {
          rowNumber: 5,
          code: undefined,
          status: "error",
          message: "Erro inesperado ao salvar esta linha.",
        },
      ],
    });
  });

  it("aggregates counts across a mixed batch of created/updated/error rows", async () => {
    vi.mocked(RealEstateRepository.findByCode).mockImplementation(
      async (_companyId: string, code: string) => {
        if (code === "I-005") {
          return { realEstateId: "existing-re-1", code: "I-005" } as any;
        }
        return undefined;
      },
    );
    vi.mocked(RealEstateRepository.save).mockImplementation(
      async (_companyId, _uid, data: any) =>
        ({ code: data.realEstateId ? "I-005" : "I-001" }) as any,
    );

    const rows = [
      makeRow({}, 1),
      makeRow({ code: "I-005" }, 2),
      makeRow({ code: "I-999" }, 3),
    ];

    const result = await importRealEstateHandler(
      makeReq({ companyId: "company-1", rows }),
    );

    expect(result.created).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results).toHaveLength(3);
    expect(result.results.map((r: any) => r.rowNumber)).toEqual([1, 2, 3]);
  });
});

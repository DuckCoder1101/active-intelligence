import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/subcategory.repository", () => ({
  SubcategoryRepository: { save: vi.fn() },
}));

import { saveSubcategoryHandler } from "../../src/handlers/saveSubcategory";
import { SubcategoryRepository } from "../../src/repositories/subcategory.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveSubcategoryHandler", () => {
  beforeEach(() => {
    vi.mocked(SubcategoryRepository.save).mockResolvedValue({
      subcategoryId: "sub-1",
      categoryType: "despesa",
      name: "Aluguel",
      order: 0,
    } as any);
  });

  it("rejects missing name with invalid-argument", async () => {
    await expect(
      saveSubcategoryHandler(makeReq({ categoryType: "despesa" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an invalid categoryType", async () => {
    await expect(
      saveSubcategoryHandler(
        makeReq({ categoryType: "invalid", name: "Aluguel" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveSubcategoryHandler(
        makeReq({ categoryType: "despesa", name: "Aluguel" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("creates a subcategory without an explicit order", async () => {
    const result = await saveSubcategoryHandler(
      makeReq({ categoryType: "despesa", name: "Aluguel" }),
    );

    expect(SubcategoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryType: "despesa",
        name: "Aluguel",
      }),
    );
    const [savedPayload] = vi.mocked(SubcategoryRepository.save).mock.calls[0];
    expect(savedPayload).not.toHaveProperty("subcategoryId");
    expect(savedPayload).not.toHaveProperty("order");
    expect(result).toEqual({
      subcategoryId: "sub-1",
      categoryType: "despesa",
      name: "Aluguel",
      order: 0,
    });
  });

  it("updates an existing subcategory with a given order", async () => {
    await saveSubcategoryHandler(
      makeReq({
        subcategoryId: "sub-1",
        categoryType: "custo",
        name: "Servidores",
        order: 2,
      }),
    );

    expect(SubcategoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        subcategoryId: "sub-1",
        categoryType: "custo",
        name: "Servidores",
        order: 2,
      }),
    );
  });
});

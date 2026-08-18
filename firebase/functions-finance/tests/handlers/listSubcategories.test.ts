import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/subcategory.repository", () => ({
  SubcategoryRepository: { listAll: vi.fn() },
}));

import { listSubcategoriesHandler } from "../../src/handlers/listSubcategories";
import { SubcategoryRepository } from "../../src/repositories/subcategory.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listSubcategoriesHandler", () => {
  beforeEach(() => {
    vi.mocked(SubcategoryRepository.listAll).mockResolvedValue([
      { subcategoryId: "sub-1", name: "MRR" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listSubcategoriesHandler(makeReq())).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists subcategories", async () => {
    const result = await listSubcategoriesHandler(makeReq());
    expect(SubcategoryRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ subcategoryId: "sub-1", name: "MRR" }]);
  });
});

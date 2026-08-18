import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/subcategory.repository", () => ({
  SubcategoryRepository: { delete: vi.fn() },
}));

import { deleteSubcategoryHandler } from "../../src/handlers/deleteSubcategory";
import { SubcategoryRepository } from "../../src/repositories/subcategory.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteSubcategoryHandler", () => {
  beforeEach(() => {
    vi.mocked(SubcategoryRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects missing subcategoryId with invalid-argument", async () => {
    await expect(
      deleteSubcategoryHandler(makeReq({})),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteSubcategoryHandler(makeReq({ subcategoryId: "sub-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the subcategory", async () => {
    await deleteSubcategoryHandler(makeReq({ subcategoryId: "sub-1" }));
    expect(SubcategoryRepository.delete).toHaveBeenCalledWith("sub-1");
  });

  it("propagates a failed-precondition error when the subcategory is still in use", async () => {
    vi.mocked(SubcategoryRepository.delete).mockRejectedValueOnce(
      new HttpsError(
        "failed-precondition",
        "Não é possível excluir uma subcategoria em uso por lançamentos.",
      ),
    );
    await expect(
      deleteSubcategoryHandler(makeReq({ subcategoryId: "sub-1" })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
});

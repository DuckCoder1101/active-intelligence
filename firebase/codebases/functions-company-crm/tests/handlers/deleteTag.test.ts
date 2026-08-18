import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/tag.repository", () => ({
  TagRepository: { delete: vi.fn() },
}));

import { deleteTagHandler } from "../../src/handlers/deleteTag";
import { TagRepository } from "../../src/repositories/tag.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = { companyId: "company-1", tagId: "tag-1" };

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteTagHandler", () => {
  beforeEach(() => {
    vi.mocked(TagRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects missing tagId with invalid-argument", async () => {
    await expect(
      deleteTagHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(deleteTagHandler(makeReq(validData))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("deletes the tag and returns true", async () => {
    const result = await deleteTagHandler(makeReq(validData));
    expect(TagRepository.delete).toHaveBeenCalledWith("company-1", "tag-1");
    expect(result).toBe(true);
  });
});

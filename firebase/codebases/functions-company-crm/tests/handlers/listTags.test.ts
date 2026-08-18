import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/tag.repository", () => ({
  TagRepository: { listAll: vi.fn() },
}));

import { listTagsHandler } from "../../src/handlers/listTags";
import { TagRepository } from "../../src/repositories/tag.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listTagsHandler", () => {
  beforeEach(() => {
    vi.mocked(TagRepository.listAll).mockResolvedValue([
      { tagId: "tag-1" },
    ] as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(listTagsHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listTagsHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists tags for the company", async () => {
    const result = await listTagsHandler(makeReq({ companyId: "company-1" }));
    expect(TagRepository.listAll).toHaveBeenCalledWith("company-1");
    expect(result).toEqual([{ tagId: "tag-1" }]);
  });
});

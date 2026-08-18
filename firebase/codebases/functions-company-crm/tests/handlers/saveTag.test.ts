import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/tag.repository", () => ({
  TagRepository: { save: vi.fn() },
}));

import { saveTagHandler } from "../../src/handlers/saveTag";
import { TagRepository } from "../../src/repositories/tag.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = { companyId: "company-1", name: "Quente" };

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveTagHandler", () => {
  beforeEach(() => {
    vi.mocked(TagRepository.save).mockResolvedValue({ tagId: "tag-1" } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      saveTagHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(saveTagHandler(makeReq(validData))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("saves the tag", async () => {
    const result = await saveTagHandler(makeReq(validData));
    expect(TagRepository.save).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ name: "Quente" }),
    );
    expect(result).toEqual({ tagId: "tag-1" });
  });
});

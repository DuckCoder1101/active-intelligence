import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/guide.repository", () => ({
  GuideRepository: { listAll: vi.fn() },
}));

import { listGuidesHandler } from "../../src/handlers/listGuides";
import { GuideRepository } from "../../src/repositories/guide.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listGuidesHandler", () => {
  beforeEach(() => {
    vi.mocked(GuideRepository.listAll).mockResolvedValue([
      { guideId: "guide-1" },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listGuidesHandler(makeReq())).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists all guides", async () => {
    const result = await listGuidesHandler(makeReq());
    expect(GuideRepository.listAll).toHaveBeenCalled();
    expect(result).toEqual([{ guideId: "guide-1" }]);
  });
});

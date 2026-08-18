import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/origin.repository", () => ({
  OriginRepository: { save: vi.fn() },
}));

import { saveOriginHandler } from "../../src/handlers/saveOrigin";
import { OriginRepository } from "../../src/repositories/origin.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = { companyId: "company-1", name: "Instagram" };

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveOriginHandler", () => {
  beforeEach(() => {
    vi.mocked(OriginRepository.save).mockResolvedValue({
      originId: "origin-1",
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      saveOriginHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(saveOriginHandler(makeReq(validData))).rejects.toMatchObject(
      { code: "permission-denied" },
    );
  });

  it("saves the origin", async () => {
    const result = await saveOriginHandler(makeReq(validData));
    expect(OriginRepository.save).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({ name: "Instagram" }),
    );
    expect(result).toEqual({ originId: "origin-1" });
  });
});

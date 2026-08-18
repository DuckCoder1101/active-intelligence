import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/origin.repository", () => ({
  OriginRepository: { delete: vi.fn() },
}));

import { deleteOriginHandler } from "../../src/handlers/deleteOrigin";
import { OriginRepository } from "../../src/repositories/origin.repository";
import { requireCompanyAccess } from "functions-shared";

const validData = { companyId: "company-1", originId: "origin-1" };

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("deleteOriginHandler", () => {
  beforeEach(() => {
    vi.mocked(OriginRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects missing originId with invalid-argument", async () => {
    await expect(
      deleteOriginHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      deleteOriginHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes the origin and returns true", async () => {
    const result = await deleteOriginHandler(makeReq(validData));
    expect(OriginRepository.delete).toHaveBeenCalledWith(
      "company-1",
      "origin-1",
    );
    expect(result).toBe(true);
  });
});

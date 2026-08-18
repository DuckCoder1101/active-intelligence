import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/origin.repository", () => ({
  OriginRepository: { listAll: vi.fn() },
}));

import { listOriginsHandler } from "../../src/handlers/listOrigins";
import { OriginRepository } from "../../src/repositories/origin.repository";
import { requireCompanyAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("listOriginsHandler", () => {
  beforeEach(() => {
    vi.mocked(OriginRepository.listAll).mockResolvedValue([
      { originId: "origin-1" },
    ] as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(listOriginsHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors", async () => {
    vi.mocked(requireCompanyAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listOriginsHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("lists origins for the company", async () => {
    const result = await listOriginsHandler(
      makeReq({ companyId: "company-1" }),
    );
    expect(OriginRepository.listAll).toHaveBeenCalledWith("company-1");
    expect(result).toEqual([{ originId: "origin-1" }]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { saveCompanyOperationalRecordHandler } from "../../src/handlers/saveCompanyOperationalRecord";
import { CompanyOperationalRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveCompanyOperationalRecordHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyOperationalRepository.save).mockResolvedValue(
      undefined as any,
    );
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(
      saveCompanyOperationalRecordHandler(makeReq({})),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an invalid driveUrl", async () => {
    await expect(
      saveCompanyOperationalRecordHandler(
        makeReq({ companyId: "company-1", driveUrl: "not-a-url" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveCompanyOperationalRecordHandler(
        makeReq({ companyId: "company-1" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("saves the operational record using the authenticated uid", async () => {
    const result = await saveCompanyOperationalRecordHandler(
      makeReq({ companyId: "company-1", metaAdsAccountId: "act_123" }),
    );

    expect(CompanyOperationalRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        metaAdsAccountId: "act_123",
      }),
      "test-uid",
    );
    expect(result).toBe(true);
  });

  it("accepts a valid driveUrl and responsibleUids", async () => {
    const result = await saveCompanyOperationalRecordHandler(
      makeReq({
        companyId: "company-1",
        driveUrl: "https://drive.google.com/folder/abc",
        responsibleUids: { cronograma: "uid-1" },
      }),
    );

    expect(result).toBe(true);
    expect(CompanyOperationalRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        driveUrl: "https://drive.google.com/folder/abc",
        responsibleUids: expect.objectContaining({ cronograma: "uid-1" }),
      }),
      "test-uid",
    );
  });
});

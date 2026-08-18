import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { getCompanyOperationalRecordHandler } from "../../src/handlers/getCompanyOperationalRecord";
import { CompanyOperationalRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("getCompanyOperationalRecordHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyOperationalRepository.getByCompanyId).mockResolvedValue({
      companyId: "company-1",
      driveUrl: "https://drive.google.com/folder/abc",
    } as any);
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(
      getCompanyOperationalRecordHandler(makeReq({})),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      getCompanyOperationalRecordHandler(
        makeReq({ companyId: "company-1" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns the operational record by companyId", async () => {
    const result = await getCompanyOperationalRecordHandler(
      makeReq({ companyId: "company-1" }),
    );
    expect(CompanyOperationalRepository.getByCompanyId).toHaveBeenCalledWith(
      "company-1",
    );
    expect(result).toEqual({
      companyId: "company-1",
      driveUrl: "https://drive.google.com/folder/abc",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { unregisterFcmTokenHandler } from "../../src/handlers/unregisterFcmToken";
import {
  AdminRepository,
  CompanyUserRepository,
  requireAccess,
} from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "test-uid", token: {} } } as any;
}

describe("unregisterFcmTokenHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyUserRepository.removeFcmToken).mockResolvedValue(
      undefined as any,
    );
    vi.mocked(AdminRepository.removeFcmToken).mockResolvedValue(
      undefined as any,
    );
  });

  it("rejects a missing token with invalid-argument", async () => {
    await expect(unregisterFcmTokenHandler(makeReq({}))).rejects.toMatchObject(
      { code: "invalid-argument" },
    );
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      unregisterFcmTokenHandler(makeReq({ token: "fcm-token-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("removes the token via CompanyUserRepository when accessLevel is user", async () => {
    vi.mocked(requireAccess).mockReturnValueOnce({
      uid: "test-uid",
      email: "test@example.com",
      accessLevel: "user",
      complete: true,
      permissions: [],
      companyId: "company-1",
    } as any);

    const result = await unregisterFcmTokenHandler(
      makeReq({ token: "fcm-token-1" }),
    );

    expect(CompanyUserRepository.removeFcmToken).toHaveBeenCalledWith(
      "test-uid",
      "fcm-token-1",
    );
    expect(AdminRepository.removeFcmToken).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("removes the token via AdminRepository for any other accessLevel", async () => {
    const result = await unregisterFcmTokenHandler(
      makeReq({ token: "fcm-token-1" }),
    );

    expect(AdminRepository.removeFcmToken).toHaveBeenCalledWith(
      "test-uid",
      "fcm-token-1",
    );
    expect(CompanyUserRepository.removeFcmToken).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});

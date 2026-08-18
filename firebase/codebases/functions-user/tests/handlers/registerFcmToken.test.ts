import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { registerFcmTokenHandler } from "../../src/handlers/registerFcmToken";
import {
  AdminRepository,
  CompanyUserRepository,
  requireAccess,
} from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "test-uid", token: {} } } as any;
}

describe("registerFcmTokenHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyUserRepository.addFcmToken).mockResolvedValue(
      undefined as any,
    );
    vi.mocked(AdminRepository.addFcmToken).mockResolvedValue(undefined as any);
  });

  it("rejects a missing token with invalid-argument", async () => {
    await expect(registerFcmTokenHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      registerFcmTokenHandler(makeReq({ token: "fcm-token-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("registers the token via CompanyUserRepository when accessLevel is user", async () => {
    vi.mocked(requireAccess).mockReturnValueOnce({
      uid: "test-uid",
      email: "test@example.com",
      accessLevel: "user",
      complete: true,
      permissions: [],
      companyId: "company-1",
    } as any);

    const result = await registerFcmTokenHandler(
      makeReq({ token: "fcm-token-1" }),
    );

    expect(CompanyUserRepository.addFcmToken).toHaveBeenCalledWith(
      "test-uid",
      "fcm-token-1",
    );
    expect(AdminRepository.addFcmToken).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("registers the token via AdminRepository for any other accessLevel", async () => {
    const result = await registerFcmTokenHandler(
      makeReq({ token: "fcm-token-1" }),
    );

    expect(AdminRepository.addFcmToken).toHaveBeenCalledWith(
      "test-uid",
      "fcm-token-1",
    );
    expect(CompanyUserRepository.addFcmToken).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});

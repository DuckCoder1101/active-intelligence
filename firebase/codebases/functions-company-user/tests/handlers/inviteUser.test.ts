import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";
import { FirebaseAuthError, AuthClientErrorCode } from "firebase-admin/auth";

import { inviteCompanyUserHandler } from "../../src/handlers/inviteUser";
import { auth, requireAccess } from "functions-shared";

const validData = {
  email: "new-user@example.com",
  companyId: "company-1",
};

function makeReq(data: unknown, authCtx: any = { uid: "u1", token: {} }) {
  return { data, auth: authCtx } as any;
}

describe("inviteCompanyUserHandler", () => {
  beforeEach(() => {
    vi.mocked(auth.createUser).mockResolvedValue({ uid: "new-uid" } as any);
    vi.mocked(auth.setCustomUserClaims).mockResolvedValue(undefined as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      inviteCompanyUserHandler(makeReq({ email: "not-an-email" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(
      inviteCompanyUserHandler(
        makeReq({ email: "valid@example.com", companyId: "" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      inviteCompanyUserHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("creates an auth user and sets scoped custom claims for a valid invite", async () => {
    const result = await inviteCompanyUserHandler(makeReq(validData));

    expect(auth.createUser).toHaveBeenCalledWith({
      email: "new-user@example.com",
      emailVerified: false,
    });
    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("new-uid", {
      accessLevel: "user",
      companyId: "company-1",
      complete: false,
    });
    expect(result).toBe(true);
  });

  it("maps an email-already-exists auth error to already-exists", async () => {
    vi.mocked(auth.createUser).mockRejectedValueOnce(
      new FirebaseAuthError(AuthClientErrorCode.EMAIL_ALREADY_EXISTS),
    );

    await expect(
      inviteCompanyUserHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "already-exists" });
    expect(auth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it("rethrows other FirebaseAuthError codes unchanged", async () => {
    const invalidEmailError = new FirebaseAuthError(
      AuthClientErrorCode.INVALID_EMAIL,
    );
    vi.mocked(auth.createUser).mockRejectedValueOnce(invalidEmailError);

    await expect(
      inviteCompanyUserHandler(makeReq(validData)),
    ).rejects.toBe(invalidEmailError);
  });

  it("rethrows unexpected errors from auth.createUser", async () => {
    vi.mocked(auth.createUser).mockRejectedValueOnce(new Error("boom"));

    await expect(
      inviteCompanyUserHandler(makeReq(validData)),
    ).rejects.toThrow("boom");
  });
});

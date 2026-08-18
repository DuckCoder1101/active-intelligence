import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";
import { FirebaseAuthError } from "firebase-admin/auth";

import { inviteAdminHandler } from "../../src/handlers/inviteAdmin";
import { auth, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("inviteAdminHandler", () => {
  beforeEach(() => {
    vi.mocked(auth.createUser).mockResolvedValue({ uid: "new-uid" } as any);
    vi.mocked(auth.setCustomUserClaims).mockResolvedValue(undefined as any);
  });

  it("rejects invalid email with invalid-argument", async () => {
    await expect(
      inviteAdminHandler(makeReq({ email: "not-an-email" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects missing email with invalid-argument", async () => {
    await expect(inviteAdminHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      inviteAdminHandler(makeReq({ email: "new@example.com" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("creates the auth user and grants admin custom claims", async () => {
    const result = await inviteAdminHandler(
      makeReq({ email: "new@example.com" }),
    );

    expect(auth.createUser).toHaveBeenCalledWith({
      email: "new@example.com",
      emailVerified: false,
    });
    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("new-uid", {
      accessLevel: "admin",
      complete: false,
    });
    expect(result).toBe(true);
  });

  it("maps an already-exists auth error to already-exists", async () => {
    vi.mocked(auth.createUser).mockRejectedValueOnce(
      new FirebaseAuthError({
        code: "email-already-exists",
        message: "Este e-mail já está cadastrado.",
      }),
    );

    await expect(
      inviteAdminHandler(makeReq({ email: "dup@example.com" })),
    ).rejects.toMatchObject({ code: "already-exists" });
  });

  it("rethrows unexpected errors from auth.createUser", async () => {
    vi.mocked(auth.createUser).mockRejectedValueOnce(new Error("boom"));

    await expect(
      inviteAdminHandler(makeReq({ email: "err@example.com" })),
    ).rejects.toThrow("boom");
  });
});

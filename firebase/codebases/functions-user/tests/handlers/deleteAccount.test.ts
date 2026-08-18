import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { deleteAccountHandler } from "../../src/handlers/deleteAccount";
import {
  auth,
  bucket,
  AdminRepository,
  CompanyUserRepository,
  NotificationRepository,
  getAuthenticatedUser,
} from "functions-shared";

function makeReq(data: unknown, token: Record<string, unknown> = {}) {
  return { data, auth: { uid: "test-uid", token } } as any;
}

describe("deleteAccountHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.getUser).mockResolvedValue({
      customClaims: { accessLevel: "user" },
    } as any);
    vi.mocked(auth.deleteUser).mockResolvedValue(undefined as any);
    vi.mocked(bucket.file).mockReturnValue({
      delete: vi.fn().mockResolvedValue(undefined),
    } as any);
    vi.mocked(NotificationRepository.removeUidFromAll).mockResolvedValue(
      undefined as any,
    );
    vi.mocked(CompanyUserRepository.delete).mockResolvedValue(undefined as any);
    vi.mocked(AdminRepository.delete).mockResolvedValue(undefined as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      deleteAccountHandler(makeReq({ targetId: "a" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem autenticação");
    });
    await expect(
      deleteAccountHandler(makeReq({ targetId: "test-uid" })),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("rejects deleting another user's account when caller is not owner", async () => {
    await expect(
      deleteAccountHandler(
        makeReq({ targetId: "other-uid" }, { accessLevel: "user" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("allows a caller to delete their own account (company-user branch)", async () => {
    await deleteAccountHandler(
      makeReq({ targetId: "test-uid" }, { accessLevel: "user" }),
    );

    expect(auth.deleteUser).toHaveBeenCalledWith("test-uid");
    expect(CompanyUserRepository.delete).toHaveBeenCalledWith("test-uid");
    expect(AdminRepository.delete).not.toHaveBeenCalled();
  });

  it("allows an owner to delete another admin's account (admin branch)", async () => {
    vi.mocked(auth.getUser).mockResolvedValue({
      customClaims: { accessLevel: "admin" },
    } as any);

    await deleteAccountHandler(
      makeReq({ targetId: "other-uid" }, { accessLevel: "owner" }),
    );

    expect(auth.deleteUser).toHaveBeenCalledWith("other-uid");
    expect(AdminRepository.delete).toHaveBeenCalledWith("other-uid");
    expect(CompanyUserRepository.delete).not.toHaveBeenCalled();
  });

  it("cleans up avatar and notifications after deletion", async () => {
    await deleteAccountHandler(
      makeReq({ targetId: "test-uid" }, { accessLevel: "user" }),
    );

    expect(bucket.file).toHaveBeenCalledWith("users/test-uid/avatar");
    expect(NotificationRepository.removeUidFromAll).toHaveBeenCalledWith(
      "test-uid",
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateProfileHandler } from "../../src/handlers/updateProfile";
import { AdminRepository, CompanyUserRepository, auth } from "functions-shared";

function makeReq(data: unknown, authCtx: any = { uid: "test-uid", token: {} }) {
  return { data, auth: authCtx } as any;
}

function makeTargetUser(accessLevel: string | null) {
  return {
    uid: "target-uid",
    customClaims: accessLevel ? { accessLevel } : undefined,
  } as any;
}

describe("updateProfileHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyUserRepository.update).mockResolvedValue(undefined as any);
    vi.mocked(AdminRepository.update).mockResolvedValue(undefined as any);
  });

  it("rejects a name that's too short with invalid-argument", async () => {
    await expect(
      updateProfileHandler(makeReq({ targetId: "test-uid", name: "ab" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("maps a missing target user to not-found", async () => {
    vi.mocked(auth.getUser).mockRejectedValueOnce(new Error("no such user"));

    await expect(
      updateProfileHandler(
        makeReq({ targetId: "unknown-uid", name: "John Doe" }),
      ),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("rejects a non-owner trying to update someone else's profile", async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce(makeTargetUser("user"));

    await expect(
      updateProfileHandler(
        makeReq(
          { targetId: "target-uid", name: "John Doe" },
          { uid: "test-uid", token: { accessLevel: "admin" } },
        ),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects an owner trying to update another owner's profile", async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce(makeTargetUser("owner"));

    await expect(
      updateProfileHandler(
        makeReq(
          { targetId: "target-uid", name: "John Doe" },
          { uid: "test-uid", token: { accessLevel: "owner" } },
        ),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects a target user without an accessLevel claim", async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce(makeTargetUser(null));

    await expect(
      updateProfileHandler(
        makeReq(
          { targetId: "test-uid", name: "John Doe" },
          { uid: "test-uid", token: {} },
        ),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("updates its own profile through CompanyUserRepository when the target is a company user", async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce(makeTargetUser("user"));

    await updateProfileHandler(
      makeReq(
        { targetId: "test-uid", name: "John Doe" },
        { uid: "test-uid", token: { accessLevel: "user" } },
      ),
    );

    expect(CompanyUserRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: "test-uid", name: "John Doe" }),
    );
    expect(AdminRepository.update).not.toHaveBeenCalled();
  });

  it("lets an owner update another admin's profile through AdminRepository", async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce(makeTargetUser("admin"));

    await updateProfileHandler(
      makeReq(
        { targetId: "target-uid", name: "Jane Doe" },
        { uid: "test-uid", token: { accessLevel: "owner" } },
      ),
    );

    expect(AdminRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: "target-uid", name: "Jane Doe" }),
    );
    expect(CompanyUserRepository.update).not.toHaveBeenCalled();
  });
});

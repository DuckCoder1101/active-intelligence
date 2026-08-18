import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { updateAdminAccessLevelHandler } from "../../src/handlers/updateAdminAccessLevel";
import { auth, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("updateAdminAccessLevelHandler", () => {
  beforeEach(() => {
    vi.mocked(auth.getUser).mockResolvedValue({
      customClaims: { permissions: ["manage-team"], complete: true },
    } as any);
    vi.mocked(auth.setCustomUserClaims).mockResolvedValue(undefined as any);
  });

  it("rejects missing targetUid with invalid-argument", async () => {
    await expect(
      updateAdminAccessLevelHandler(makeReq({ accessLevel: "admin" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects an accessLevel outside admin/owner with invalid-argument", async () => {
    await expect(
      updateAdminAccessLevelHandler(
        makeReq({ targetUid: "target-uid", accessLevel: "superadmin" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      updateAdminAccessLevelHandler(
        makeReq({ targetUid: "target-uid", accessLevel: "admin" }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("blocks the caller from changing their own access level", async () => {
    await expect(
      updateAdminAccessLevelHandler(
        makeReq({ targetUid: "test-uid", accessLevel: "owner" }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
    expect(auth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it("merges the new access level into existing custom claims", async () => {
    const result = await updateAdminAccessLevelHandler(
      makeReq({ targetUid: "target-uid", accessLevel: "owner" }),
    );

    expect(auth.getUser).toHaveBeenCalledWith("target-uid");
    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("target-uid", {
      permissions: ["manage-team"],
      complete: true,
      accessLevel: "owner",
    });
    expect(result).toBe(true);
  });

  it("defaults existing claims to an empty object when the target has none", async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce({
      customClaims: undefined,
    } as any);

    await updateAdminAccessLevelHandler(
      makeReq({ targetUid: "target-uid", accessLevel: "admin" }),
    );

    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("target-uid", {
      accessLevel: "admin",
    });
  });
});

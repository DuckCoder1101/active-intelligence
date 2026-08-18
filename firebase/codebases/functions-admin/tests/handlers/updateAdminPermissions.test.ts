import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { updateAdminPermissionsHandler } from "../../src/handlers/updateAdminPermissions";
import { auth, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("updateAdminPermissionsHandler", () => {
  beforeEach(() => {
    vi.mocked(auth.getUser).mockResolvedValue({
      customClaims: { accessLevel: "admin" },
    } as any);
    vi.mocked(auth.setCustomUserClaims).mockResolvedValue(undefined as any);
  });

  it("rejects missing targetUid with invalid-argument", async () => {
    await expect(
      updateAdminPermissionsHandler(
        makeReq({ permissions: ["manage-clients"] }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects a permission outside the known list with invalid-argument", async () => {
    await expect(
      updateAdminPermissionsHandler(
        makeReq({
          targetUid: "target-uid",
          permissions: ["not-a-real-permission"],
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      updateAdminPermissionsHandler(
        makeReq({ targetUid: "target-uid", permissions: ["manage-clients"] }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("blocks the caller from changing their own permissions", async () => {
    await expect(
      updateAdminPermissionsHandler(
        makeReq({ targetUid: "test-uid", permissions: ["manage-clients"] }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
    expect(auth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it("merges the new permissions into existing custom claims and marks the target complete", async () => {
    const result = await updateAdminPermissionsHandler(
      makeReq({
        targetUid: "target-uid",
        permissions: ["manage-clients", "manage-crm"],
      }),
    );

    expect(auth.getUser).toHaveBeenCalledWith("target-uid");
    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("target-uid", {
      accessLevel: "admin",
      complete: true,
      permissions: ["manage-clients", "manage-crm"],
    });
    expect(result).toBe(true);
  });

  it("defaults existing claims to an empty object when the target has none", async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce({
      customClaims: undefined,
    } as any);

    await updateAdminPermissionsHandler(
      makeReq({ targetUid: "target-uid", permissions: [] }),
    );

    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("target-uid", {
      complete: true,
      permissions: [],
    });
  });
});

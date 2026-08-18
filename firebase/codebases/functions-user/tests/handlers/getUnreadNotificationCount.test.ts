import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { getUnreadNotificationCountHandler } from "../../src/handlers/getUnreadNotificationCount";
import { NotificationRepository, requireAccess } from "functions-shared";

function makeReq() {
  return { data: undefined, auth: { uid: "test-uid", token: {} } } as any;
}

describe("getUnreadNotificationCountHandler", () => {
  beforeEach(() => {
    vi.mocked(NotificationRepository.countForUser).mockResolvedValue(4 as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(getUnreadNotificationCountHandler(makeReq())).rejects.toMatchObject(
      { code: "permission-denied" },
    );
  });

  it("returns the unread count for the caller", async () => {
    const result = await getUnreadNotificationCountHandler(makeReq());

    expect(NotificationRepository.countForUser).toHaveBeenCalledWith(
      "test-uid",
    );
    expect(result).toEqual({ count: 4 });
  });
});

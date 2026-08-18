import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { listNotificationsHandler } from "../../src/handlers/listNotifications";
import { NotificationRepository, requireAccess } from "functions-shared";

function makeReq() {
  return { data: undefined, auth: { uid: "test-uid", token: {} } } as any;
}

describe("listNotificationsHandler", () => {
  beforeEach(() => {
    vi.mocked(NotificationRepository.listForUser).mockResolvedValue([
      { notificationId: "n1", read: false },
    ] as any);
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(listNotificationsHandler(makeReq())).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("lists notifications for the caller", async () => {
    const result = await listNotificationsHandler(makeReq());

    expect(NotificationRepository.listForUser).toHaveBeenCalledWith(
      "test-uid",
    );
    expect(result).toEqual([{ notificationId: "n1", read: false }]);
  });
});

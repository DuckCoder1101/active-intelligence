import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { markNotificationReadHandler } from "../../src/handlers/markNotificationRead";
import { NotificationRepository, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "test-uid", token: {} } } as any;
}

describe("markNotificationReadHandler", () => {
  beforeEach(() => {
    vi.mocked(NotificationRepository.markRead).mockResolvedValue(undefined as any);
  });

  it("rejects a missing notificationId with invalid-argument", async () => {
    await expect(markNotificationReadHandler(makeReq({}))).rejects.toMatchObject(
      { code: "invalid-argument" },
    );
    expect(NotificationRepository.markRead).not.toHaveBeenCalled();
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      markNotificationReadHandler(makeReq({ notificationId: "n1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("marks the notification as read for the caller and returns true", async () => {
    const result = await markNotificationReadHandler(
      makeReq({ notificationId: "n1" }),
    );

    expect(NotificationRepository.markRead).toHaveBeenCalledWith(
      "test-uid",
      "n1",
    );
    expect(result).toBe(true);
  });
});

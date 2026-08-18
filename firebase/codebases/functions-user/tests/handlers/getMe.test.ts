import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { getMeHandler } from "../../src/handlers/getMe";
import {
  AdminRepository,
  CompanyUserRepository,
  getAuthenticatedUser,
} from "functions-shared";

function makeReq(token: Record<string, unknown> = {}) {
  return { data: undefined, auth: { uid: "test-uid", token } } as any;
}

describe("getMeHandler", () => {
  beforeEach(() => {
    vi.mocked(CompanyUserRepository.getProfile).mockResolvedValue({
      uid: "test-uid",
      name: "Company User",
    } as any);
    vi.mocked(AdminRepository.getProfile).mockResolvedValue({
      uid: "test-uid",
      name: "Admin User",
    } as any);
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem autenticação");
    });
    await expect(getMeHandler(makeReq())).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("reads the profile from CompanyUserRepository when accessLevel is user", async () => {
    const result = await getMeHandler(makeReq({ accessLevel: "user" }));

    expect(CompanyUserRepository.getProfile).toHaveBeenCalledWith("test-uid");
    expect(AdminRepository.getProfile).not.toHaveBeenCalled();
    expect(result).toEqual({ uid: "test-uid", name: "Company User" });
  });

  it("reads the profile from AdminRepository for any other accessLevel", async () => {
    const result = await getMeHandler(makeReq({ accessLevel: "admin" }));

    expect(AdminRepository.getProfile).toHaveBeenCalledWith("test-uid");
    expect(CompanyUserRepository.getProfile).not.toHaveBeenCalled();
    expect(result).toEqual({ uid: "test-uid", name: "Admin User" });
  });
});

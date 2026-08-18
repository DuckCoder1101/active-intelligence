import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { completeProfileHandler } from "../../src/handlers/completeProfile";
import {
  auth,
  AdminRepository,
  CompanyUserRepository,
  getAuthenticatedUser,
} from "functions-shared";

const validData = {
  name: "John Doe",
  cpf: "529.982.247-25",
  phone: "11987654321",
};

function makeReq(data: unknown, token: Record<string, unknown> = {}) {
  return { data, auth: { uid: "test-uid", token } } as any;
}

describe("completeProfileHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CompanyUserRepository.create).mockResolvedValue(undefined as any);
    vi.mocked(AdminRepository.create).mockResolvedValue(undefined as any);
    vi.mocked(auth.updateUser).mockResolvedValue(undefined as any);
    vi.mocked(auth.setCustomUserClaims).mockResolvedValue(undefined as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      completeProfileHandler(makeReq({ name: "ab" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates errors thrown by getAuthenticatedUser", async () => {
    vi.mocked(getAuthenticatedUser).mockImplementationOnce(() => {
      throw new HttpsError("unauthenticated", "sem autenticação");
    });
    await expect(
      completeProfileHandler(makeReq(validData)),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("rejects a user role without companyId", async () => {
    await expect(
      completeProfileHandler(
        makeReq(validData, { accessLevel: "user", companyId: undefined }),
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("creates a company-user profile when accessLevel is user", async () => {
    await completeProfileHandler(
      makeReq(validData, { accessLevel: "user", companyId: "company-1" }),
    );

    expect(CompanyUserRepository.create).toHaveBeenCalledWith(
      "test-uid",
      "test@example.com",
      "company-1",
      expect.objectContaining({ name: "John Doe" }),
    );
    expect(AdminRepository.create).not.toHaveBeenCalled();
    expect(auth.updateUser).toHaveBeenCalledWith("test-uid", {
      emailVerified: true,
    });
    expect(auth.setCustomUserClaims).toHaveBeenCalledWith("test-uid", {
      accessLevel: "user",
      companyId: "company-1",
      complete: true,
    });
  });

  it("creates an admin profile when accessLevel is not user", async () => {
    await completeProfileHandler(makeReq(validData, { accessLevel: "admin" }));

    expect(AdminRepository.create).toHaveBeenCalledWith(
      "test-uid",
      "test@example.com",
      expect.objectContaining({ name: "John Doe" }),
    );
    expect(CompanyUserRepository.create).not.toHaveBeenCalled();
  });
});

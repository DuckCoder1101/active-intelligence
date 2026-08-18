import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

vi.mock("../../src/repositories/task-tag.repository", () => ({
  TaskTagRepository: { save: vi.fn() },
}));

import { saveTaskTagHandler } from "../../src/handlers/saveTaskTag";
import { TaskTagRepository } from "../../src/repositories/task-tag.repository";
import { requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

describe("saveTaskTagHandler", () => {
  beforeEach(() => {
    vi.mocked(TaskTagRepository.save).mockResolvedValue({
      tagId: "tag-1",
      name: "Urgente",
      color: "#ef4444",
    } as any);
  });

  it("rejects invalid input with invalid-argument", async () => {
    await expect(
      saveTaskTagHandler(makeReq({ name: "Urgente", color: "not-a-color" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      saveTaskTagHandler(makeReq({ name: "Urgente", color: "#ef4444" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("saves the tag and returns the repository result", async () => {
    const result = await saveTaskTagHandler(
      makeReq({ name: "Urgente", color: "#ef4444" }),
    );

    expect(TaskTagRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Urgente", color: "#ef4444" }),
    );
    expect(result).toEqual(
      expect.objectContaining({ tagId: "tag-1", name: "Urgente" }),
    );
  });
});

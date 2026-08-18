import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { listAuditLogsHandler } from "../../src/handlers/listAuditLogs";
import { AdminRepository, database, requireAccess } from "functions-shared";

function makeReq(data: unknown) {
  return { data, auth: { uid: "u1", token: {} } } as any;
}

function makeAuditDoc(
  id: string,
  companyId: string,
  overrides: Record<string, unknown> = {},
) {
  const data = {
    action: "task_created",
    actorUid: "actor-1",
    actorName: "Actor One",
    createdAt: { toMillis: () => 1000 },
    ...overrides,
  };
  return {
    id,
    data: () => data,
    ref: { parent: { parent: { id: companyId } } },
  } as any;
}

function createQueryChain(docs: any[]) {
  const snapshot = { empty: docs.length === 0, docs };
  const chain: any = {};
  chain.doc = vi.fn(() => chain);
  chain.collection = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.get = vi.fn(async () => snapshot);
  return chain;
}

describe("listAuditLogsHandler", () => {
  beforeEach(() => {
    vi.mocked(AdminRepository.getNamesByUids).mockResolvedValue(
      new Map([["actor-1", "Actor One"]]) as any,
    );
  });

  it("rejects missing companyId with invalid-argument", async () => {
    await expect(listAuditLogsHandler(makeReq({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listAuditLogsHandler(makeReq({ companyId: "company-1" })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns an empty array when there are no audit logs", async () => {
    vi.mocked(database.collection).mockReturnValue(createQueryChain([]));

    const result = await listAuditLogsHandler(
      makeReq({ companyId: "company-1" }),
    );

    expect(result).toEqual([]);
    expect(AdminRepository.getNamesByUids).not.toHaveBeenCalled();
  });

  it("lists mapped audit logs, resolving actor names not denormalized on the doc", async () => {
    const doc = makeAuditDoc("audit-1", "company-1", {
      actorName: undefined,
      actorUid: "actor-1",
    });
    vi.mocked(database.collection).mockReturnValue(createQueryChain([doc]));

    const result = await listAuditLogsHandler(
      makeReq({ companyId: "company-1" }),
    );

    expect(database.collection).toHaveBeenCalledWith("companies");
    expect(AdminRepository.getNamesByUids).toHaveBeenCalledWith(["actor-1"]);
    expect(result).toEqual([
      {
        id: "audit-1",
        companyId: "company-1",
        action: "task_created",
        actorName: "Actor One",
        targetName: null,
        taskId: null,
        taskTitle: null,
        details: null,
        createdAt: 1000,
      },
    ]);
  });
});

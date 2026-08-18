import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsError } from "firebase-functions/https";

import { listWorkspaceAuditLogsHandler } from "../../src/handlers/listWorkspaceAuditLogs";
import { AdminRepository, database, requireAccess } from "functions-shared";

function makeReq(data: unknown = {}) {
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
  chain.collectionGroup = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.get = vi.fn(async () => snapshot);
  return chain;
}

describe("listWorkspaceAuditLogsHandler", () => {
  beforeEach(() => {
    vi.mocked(AdminRepository.getNamesByUids).mockResolvedValue(
      new Map() as any,
    );
  });

  it("rejects an out-of-range limit with invalid-argument", async () => {
    await expect(
      listWorkspaceAuditLogsHandler(makeReq({ limit: 0 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("propagates permission errors from requireAccess", async () => {
    vi.mocked(requireAccess).mockImplementationOnce(() => {
      throw new HttpsError("permission-denied", "sem acesso");
    });
    await expect(
      listWorkspaceAuditLogsHandler(makeReq()),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("returns an empty array when there are no logs (collectionGroup branch)", async () => {
    vi.mocked(database.collectionGroup).mockReturnValue(createQueryChain([]));

    const result = await listWorkspaceAuditLogsHandler(makeReq());

    expect(database.collectionGroup).toHaveBeenCalledWith("audits");
    expect(result).toEqual([]);
  });

  it("queries collectionGroup across all companies when no companyIds are given", async () => {
    const doc = makeAuditDoc("audit-1", "company-1");
    vi.mocked(database.collectionGroup).mockReturnValue(
      createQueryChain([doc]),
    );

    const result = await listWorkspaceAuditLogsHandler(makeReq());

    expect(database.collectionGroup).toHaveBeenCalledWith("audits");
    expect(result).toEqual([
      expect.objectContaining({ id: "audit-1", companyId: "company-1" }),
    ]);
  });

  it("queries per-company and merges/sorts results by createdAt desc when companyIds are given", async () => {
    const olderDoc = makeAuditDoc("audit-old", "company-1", {
      createdAt: { toMillis: () => 1000 },
    });
    const newerDoc = makeAuditDoc("audit-new", "company-2", {
      createdAt: { toMillis: () => 2000 },
    });

    vi.mocked(database.collection).mockImplementation(() => {
      let targetCompanyId = "";
      const chain: any = {};
      chain.doc = vi.fn((id: string) => {
        targetCompanyId = id;
        return chain;
      });
      chain.collection = vi.fn(() => chain);
      chain.orderBy = vi.fn(() => chain);
      chain.limit = vi.fn(() => chain);
      chain.get = vi.fn(async () => {
        const doc = targetCompanyId === "company-1" ? olderDoc : newerDoc;
        return { empty: false, docs: [doc] };
      });
      return chain;
    });

    const result = await listWorkspaceAuditLogsHandler(
      makeReq({ companyIds: ["company-1", "company-2"] }),
    );

    expect(database.collection).toHaveBeenCalledWith("companies");
    expect(result.map((r: any) => r.id)).toEqual(["audit-new", "audit-old"]);
  });
});

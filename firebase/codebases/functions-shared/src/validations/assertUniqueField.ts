import { HttpsError } from "firebase-functions/https";

/**
 * Lança `already-exists` se algum outro documento da coleção já tiver o mesmo
 * valor (comparado sem diferenciar maiúsculas/minúsculas e sem espaços nas
 * pontas) no campo informado. Passe `excludeId` ao editar um documento
 * existente para não disparar o erro contra ele mesmo.
 */
export async function assertUniqueField(
  collectionRef: FirebaseFirestore.CollectionReference,
  field: string,
  value: string,
  options: { excludeId?: string; label?: string } = {},
): Promise<void> {
  const target = value.trim().toLowerCase();
  const snap = await collectionRef.get();

  const clash = snap.docs.some((doc) => {
    if (doc.id === options.excludeId) return false;
    const existing = doc.data()[field];
    return typeof existing === "string" && existing.trim().toLowerCase() === target;
  });

  if (clash) {
    throw new HttpsError(
      "already-exists",
      `${options.label ?? "Este valor"} já está em uso.`,
    );
  }
}

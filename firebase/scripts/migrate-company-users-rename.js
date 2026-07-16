// Copia todos os documentos da coleção antiga company-users para a nova
// company_users, preservando ID e todos os campos. NÃO apaga a coleção
// antiga — isso é uma decisão manual, feita só depois de validar que o app
// está lendo do novo caminho.
// Uso: node scripts/migrate-company-users-rename.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

const OLD_COLLECTION = 'company-users';
const NEW_COLLECTION = 'company_users';
const BATCH_LIMIT = 450;

async function commitInChunks(writes) {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + BATCH_LIMIT)) {
      batch.set(write.ref, write.data);
    }
    await batch.commit();
  }
}

async function main() {
  const oldSnap = await db.collection(OLD_COLLECTION).get();

  if (oldSnap.empty) {
    console.log(`Nenhum documento encontrado em "${OLD_COLLECTION}". Nada a migrar.`);
    return;
  }

  const existingSnap = await db.collection(NEW_COLLECTION).listDocuments();
  const existingIds = new Set(existingSnap.map((ref) => ref.id));

  const writes = [];
  const skipped = [];

  for (const doc of oldSnap.docs) {
    if (existingIds.has(doc.id)) {
      skipped.push(doc.id);
      continue;
    }
    writes.push({
      ref: db.collection(NEW_COLLECTION).doc(doc.id),
      data: doc.data(),
    });
  }

  await commitInChunks(writes);

  console.log(`\n[${OLD_COLLECTION} → ${NEW_COLLECTION}] ${writes.length} documento(s) copiado(s).`);
  if (skipped.length > 0) {
    console.warn(
      `AVISO: ${skipped.length} documento(s) já existiam em "${NEW_COLLECTION}" e foram pulados (o dado novo foi preservado):`,
      skipped,
    );
  }

  console.log(
    `\n✓ Cópia concluída. A coleção antiga (${OLD_COLLECTION}) NÃO foi apagada — ` +
      'confira o app lendo do novo caminho antes de excluí-la manualmente.',
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

// Copia leads/crm_columns/crm_origins/crm_tags das coleções top-level pra
// dentro de companies/{companyId}/{mesma coleção}, preservando ID e todos os
// campos. NÃO apaga as coleções antigas — isso é uma decisão manual, feita só
// depois de validar que o app está lendo dos novos caminhos.
// Uso: node scripts/migrate-crm-to-subcollections.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

const COLLECTIONS = ['leads', 'crm_columns', 'crm_origins', 'crm_tags'];
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

async function migrateCollection(collectionName, validCompanyIds) {
  const snap = await db.collection(collectionName).get();

  const writes = [];
  const perCompanyCount = new Map();
  const orphaned = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const companyId = data.companyId;

    if (!companyId) {
      orphaned.push(doc.id);
      continue;
    }
    if (!validCompanyIds.has(companyId)) {
      orphaned.push(doc.id);
    }

    const ref = db
      .collection('companies')
      .doc(companyId)
      .collection(collectionName)
      .doc(doc.id);

    writes.push({ ref, data });
    perCompanyCount.set(companyId, (perCompanyCount.get(companyId) ?? 0) + 1);
  }

  await commitInChunks(writes);

  console.log(`\n[${collectionName}] ${writes.length} documento(s) copiado(s) para ${perCompanyCount.size} empresa(s).`);
  if (orphaned.length > 0) {
    console.warn(
      `[${collectionName}] AVISO: ${orphaned.length} documento(s) com companyId ausente ou que não corresponde a nenhuma empresa existente:`,
      orphaned,
    );
  }
}

async function main() {
  const companiesSnap = await db.collection('companies').listDocuments();
  const validCompanyIds = new Set(companiesSnap.map((ref) => ref.id));

  console.log(`Empresas encontradas: ${validCompanyIds.size}`);

  for (const collectionName of COLLECTIONS) {
    await migrateCollection(collectionName, validCompanyIds);
  }

  console.log(
    '\n✓ Cópia concluída. As coleções antigas (leads, crm_columns, ' +
      'crm_origins, crm_tags) NÃO foram apagadas — confira o app lendo dos ' +
      'novos caminhos (companies/{companyId}/...) antes de excluí-las ' +
      'manualmente.',
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

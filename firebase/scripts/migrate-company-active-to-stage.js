// A flag booleana `active` de companies foi substituída pelo valor
// companyStage = "inactive". Este script migra os dados existentes:
// - companies com active === false viram companyStage: "inactive"
// - o campo `active` é removido de todas as companies (não é mais lido pelo app)
// Uso: node scripts/migrate-company-active-to-stage.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

const COLLECTION = 'companies';
const BATCH_LIMIT = 450;

async function commitInChunks(writes) {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + BATCH_LIMIT)) {
      batch.update(write.ref, write.data);
    }
    await batch.commit();
  }
}

async function main() {
  const snap = await db.collection(COLLECTION).get();

  if (snap.empty) {
    console.log(`Nenhum documento encontrado em "${COLLECTION}". Nada a migrar.`);
    return;
  }

  const writes = [];
  let inactivated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!('active' in data)) {
      continue;
    }

    const update = { active: FieldValue.delete() };
    if (data.active === false) {
      update.companyStage = 'inactive';
      inactivated += 1;
    }

    writes.push({ ref: doc.ref, data: update });
  }

  await commitInChunks(writes);

  console.log(`\n[${COLLECTION}] ${writes.length} documento(s) atualizados.`);
  console.log(`  - ${inactivated} marcado(s) como companyStage: "inactive"`);
  console.log(`  - campo "active" removido de todos os ${writes.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

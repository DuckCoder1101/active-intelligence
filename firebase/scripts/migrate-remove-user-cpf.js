// Remove o campo `cpf` dos documentos de usuário já existentes, já que o
// campo foi removido do cadastro (completeProfile) e de todo o resto do
// sistema (admin/company-user):
//   - admins/{uid}
//   - company_users/{uid}
//
// Idempotente: um documento sem o campo `cpf` é ignorado (rodar de novo não
// falha nem re-escreve).
//
// Por padrão roda em modo --dry-run (só mostra o que mudaria). Passe --apply
// para gravar de verdade.
//
// Uso:
//   node scripts/migrate-remove-user-cpf.js [--apply]

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const BATCH_LIMIT = 450;

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function commitInChunks(writes) {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + BATCH_LIMIT)) {
      batch.update(write.ref, write.data);
    }
    await batch.commit();
  }
}

async function removeCpfFromCollection(collectionName) {
  const snap = await db.collection(collectionName).get();
  const writes = [];

  for (const doc of snap.docs) {
    if (doc.data().cpf === undefined) continue;

    console.log(`[${collectionName}/${doc.id}] remove cpf`);
    writes.push({ ref: doc.ref, data: { cpf: FieldValue.delete() } });
  }

  console.log(
    `${APPLY ? '' : '[dry-run] '}${collectionName}: ${writes.length} de ${snap.size} documento(s) terão o cpf removido.`,
  );
  if (APPLY) await commitInChunks(writes);
  return writes.length;
}

async function main() {
  const adminsCount = await removeCpfFromCollection('admins');
  const companyUsersCount = await removeCpfFromCollection('company_users');

  console.log(
    `\n${APPLY ? '✓ Concluído' : '[dry-run] Simulação concluída'}. ` +
      `${adminsCount} admin(s) e ${companyUsersCount} usuário(s) de empresa atualizados.`,
  );
  if (!APPLY) {
    console.log('Rode de novo com --apply para gravar de verdade.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

// Trunca campos que já ultrapassam os novos limites de tamanho definidos no
// dicionário de dados V2 (redução em cima de dados já existentes):
//   - plans.name                                  -> máximo 20 caracteres
//   - companies/{companyId}/real_estates.description -> máximo 2000 caracteres
//
// Decisão do usuário: truncar automaticamente (não deixar como está, não
// bloquear para revisão manual). Cada truncamento é logado com o valor
// ORIGINAL completo antes de cortar, para permitir auditoria/reversão manual
// depois se necessário. Idempotente: um valor já dentro do limite não é
// tocado (rodar de novo não corta de novo).
//
// Por padrão roda em modo --dry-run (só mostra o que mudaria). Passe --apply
// para gravar de verdade.
//
// Uso:
//   node scripts/migrate-truncate-oversized-fields.js [--apply]

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const BATCH_LIMIT = 450;

const PLAN_NAME_MAX = 20;
const REAL_ESTATE_DESCRIPTION_MAX = 2000;

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

async function truncatePlans() {
  const snap = await db.collection('plans').get();
  const writes = [];

  for (const doc of snap.docs) {
    const name = doc.data().name;
    if (typeof name !== 'string' || name.length <= PLAN_NAME_MAX) continue;

    const truncated = name.slice(0, PLAN_NAME_MAX).trimEnd();
    console.log(
      `[plans/${doc.id}] name (${name.length} chars) -> "${truncated}" (${truncated.length} chars). Original: "${name}"`,
    );
    writes.push({ ref: doc.ref, data: { name: truncated } });
  }

  console.log(
    `${APPLY ? '' : '[dry-run] '}plans: ${writes.length} documento(s) de ${snap.size} serão truncados.`,
  );
  if (APPLY) await commitInChunks(writes);
  return writes.length;
}

async function truncateRealEstateDescriptions() {
  const companiesSnap = await db.collection('companies').get();
  let total = 0;
  const writes = [];

  for (const companyDoc of companiesSnap.docs) {
    const realEstatesSnap = await companyDoc.ref.collection('real_estates').get();

    for (const doc of realEstatesSnap.docs) {
      const description = doc.data().description;
      if (
        typeof description !== 'string' ||
        description.length <= REAL_ESTATE_DESCRIPTION_MAX
      ) {
        continue;
      }

      const truncated = description.slice(0, REAL_ESTATE_DESCRIPTION_MAX).trimEnd();
      console.log(
        `[companies/${companyDoc.id}/real_estates/${doc.id}] description (${description.length} chars) -> ` +
          `${truncated.length} chars. Original salvo no log para auditoria:\n---\n${description}\n---`,
      );
      writes.push({ ref: doc.ref, data: { description: truncated } });
    }
  }

  console.log(
    `${APPLY ? '' : '[dry-run] '}real_estates: ${writes.length} documento(s) serão truncados (${companiesSnap.size} empresa(s) verificada(s)).`,
  );
  if (APPLY) await commitInChunks(writes);
  total = writes.length;
  return total;
}

async function main() {
  const plansCount = await truncatePlans();
  const realEstateCount = await truncateRealEstateDescriptions();

  console.log(
    `\n${APPLY ? '✓ Concluído' : '[dry-run] Simulação concluída'}. ` +
      `${plansCount} plano(s) e ${realEstateCount} imóve(is) truncado(s).`,
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

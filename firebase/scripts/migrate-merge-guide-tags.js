// Une os campos platformTags + formatTags de cada guia de conteúdo
// (library/hub/guides) num único campo platformTags (união sem duplicar),
// e remove o campo formatTags do documento. Decisão do usuário: os dois
// campos representavam conceitos parecidos (plataforma e formato de
// gravação) e foram unificados num só.
//
// Idempotente: um guia que já não tem formatTags é pulado.
//
// Por padrão roda em modo --dry-run (só mostra o que mudaria). Passe --apply
// para gravar de verdade.
//
// Uso:
//   node scripts/migrate-merge-guide-tags.js [--apply]

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

async function main() {
  const snap = await db.collection('library').doc('hub').collection('guides').get();
  const writes = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!('formatTags' in data)) continue;

    const merged = Array.from(
      new Set([...(data.platformTags ?? []), ...(data.formatTags ?? [])]),
    );

    console.log(
      `[guides/${doc.id}] platformTags=${JSON.stringify(data.platformTags ?? [])} + ` +
        `formatTags=${JSON.stringify(data.formatTags ?? [])} -> platformTags=${JSON.stringify(merged)}`,
    );

    writes.push({
      ref: doc.ref,
      data: { platformTags: merged, formatTags: FieldValue.delete() },
    });
  }

  console.log(
    `${APPLY ? '' : '[dry-run] '}guides: ${writes.length} documento(s) de ${snap.size} terão as tags unificadas.`,
  );
  if (APPLY) await commitInChunks(writes);

  console.log(
    `\n${APPLY ? '✓ Concluído' : '[dry-run] Simulação concluída'}. ${writes.length} guia(s) afetado(s).`,
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

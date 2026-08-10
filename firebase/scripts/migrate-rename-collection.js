// Copia todos os documentos de uma coleção para uma nova coleção com outro
// nome, preservando o id de cada documento (crítico quando outro lugar do
// sistema guarda esse id como string solta — ex: tasks.status = columnId).
// NÃO apaga a coleção de origem — isso é uma decisão manual, feita só depois
// de confirmar que o app já está lendo do caminho novo e o deploy do código
// que usa o novo nome já foi publicado. Idempotente: documentos já copiados
// (mesmo id, já existente no destino) são pulados.
//
// Uso:
//   node scripts/migrate-rename-collection.js --from=<nome> --to=<nome> [--dry-run]
//   node scripts/migrate-rename-collection.js --parent=<coleção-pai> --from=<nome> --to=<nome> [--dry-run]
//
// Sem --parent, renomeia uma coleção top-level. Com --parent, renomeia a
// subcoleção <from> dentro de CADA documento da coleção top-level <parent>
// (ex: --parent=companies --from=personal_tasks --to=company_internal_tasks
// renomeia companies/{id}/personal_tasks para companies/{id}/company_internal_tasks
// em toda empresa).
//
// Por padrão roda em modo --dry-run (só mostra o que faria). Passe --apply
// para gravar de verdade.
//
// Exemplos usados nesta rodada de migração:
//   node scripts/migrate-rename-collection.js --from=operational_kanban_columns --to=admin_tasks_board_columns --apply
//   node scripts/migrate-rename-collection.js --parent=companies --from=personal_tasks --to=company_internal_tasks --apply
//   node scripts/migrate-rename-collection.js --parent=companies --from=real_estate --to=real_estates --apply
//   node scripts/migrate-rename-collection.js --from=company_operational --to=company_operationals --apply
//   node scripts/migrate-rename-collection.js --parent=task_categories --from=subcategories --to=task_subcategories --apply

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, value] = arg.replace(/^--/, '').split('=');
      return [key, value ?? true];
    }),
);

const FROM = args.from;
const TO = args.to;
const PARENT = args.parent;
const APPLY = args.apply === true;
const BATCH_LIMIT = 450;

if (!FROM || !TO) {
  console.error(
    'Uso: node scripts/migrate-rename-collection.js --from=<nome> --to=<nome> [--parent=<coleção-pai>] [--apply]',
  );
  process.exit(1);
}

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function commitInChunks(writes) {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + BATCH_LIMIT)) {
      batch.set(write.ref, write.data, { merge: false });
    }
    await batch.commit();
  }
}

async function copyCollection(fromRef, toRef, label) {
  const [fromSnap, toSnap] = await Promise.all([fromRef.get(), toRef.get()]);
  const alreadyCopied = new Set(toSnap.docs.map((d) => d.id));

  const pending = fromSnap.docs.filter((doc) => !alreadyCopied.has(doc.id));
  if (pending.length === 0) {
    return { label, total: fromSnap.size, copied: 0, skipped: fromSnap.size };
  }

  console.log(
    `${APPLY ? '' : '[dry-run] '}${label}: ${pending.length} documento(s) a copiar` +
      (alreadyCopied.size > 0 ? ` (${alreadyCopied.size} já copiado(s), pulando)` : ''),
  );

  if (APPLY) {
    await commitInChunks(
      pending.map((doc) => ({ ref: toRef.doc(doc.id), data: doc.data() })),
    );
  }

  return { label, total: fromSnap.size, copied: pending.length, skipped: alreadyCopied.size };
}

async function main() {
  const results = [];

  if (PARENT) {
    const parentSnap = await db.collection(PARENT).get();
    console.log(
      `${PARENT}: ${parentSnap.size} documento(s) pai encontrado(s). ` +
        `Renomeando subcoleção "${FROM}" -> "${TO}" em cada um.`,
    );

    for (const parentDoc of parentSnap.docs) {
      const fromRef = parentDoc.ref.collection(FROM);
      const toRef = parentDoc.ref.collection(TO);
      const result = await copyCollection(
        fromRef,
        toRef,
        `${PARENT}/${parentDoc.id}/${FROM}`,
      );
      if (result.total > 0) {
        results.push(result);
      }
    }
  } else {
    const result = await copyCollection(
      db.collection(FROM),
      db.collection(TO),
      FROM,
    );
    results.push(result);
  }

  const totalCopied = results.reduce((acc, r) => acc + r.copied, 0);
  const totalSkipped = results.reduce((acc, r) => acc + r.skipped, 0);

  console.log(
    `\n${APPLY ? '✓ Concluído' : '[dry-run] Simulação concluída'}. ` +
      `${totalCopied} documento(s) copiado(s), ${totalSkipped} já existente(s) no destino (pulado(s)). ` +
      `A coleção "${FROM}" NÃO foi apagada — confira o app publicado lendo de "${TO}" antes de excluí-la manualmente.`,
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

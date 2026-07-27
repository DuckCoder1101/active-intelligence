// Cria um "Funil padrão" pra cada empresa que ainda não tem nenhum funil,
// copia os docs de companies/{companyId}/crm_columns (coleção antiga, flat)
// pra dentro de companies/{companyId}/crm_funnels/{funnelId}/crm_columns, e
// marca todo lead sem funnelId com o id desse funil padrão. Idempotente:
// empresas que já têm crm_funnels são puladas. NÃO apaga a coleção antiga
// crm_columns — isso é uma decisão manual, feita só depois de validar que o
// app está lendo dos novos caminhos.
// Uso: node scripts/migrate-crm-add-funnel.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const BATCH_LIMIT = 450;

async function commitInChunks(writes) {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + BATCH_LIMIT)) {
      batch.set(write.ref, write.data, write.options ?? {});
    }
    await batch.commit();
  }
}

async function migrateCompany(companyDoc) {
  const companyId = companyDoc.id;
  const funnelsRef = db.collection('companies').doc(companyId).collection('crm_funnels');
  const existingFunnels = await funnelsRef.get();
  if (!existingFunnels.empty) {
    return { companyId, skipped: true };
  }

  const funnelRef = funnelsRef.doc();
  const funnelId = funnelRef.id;

  const oldColumnsSnap = await db
    .collection('companies')
    .doc(companyId)
    .collection('crm_columns')
    .get();

  const leadsSnap = await db
    .collection('companies')
    .doc(companyId)
    .collection('leads')
    .get();
  const leadsMissingFunnel = leadsSnap.docs.filter((doc) => !doc.data().funnelId);

  if (oldColumnsSnap.empty && leadsMissingFunnel.length === 0) {
    return { companyId, skipped: true };
  }

  const writes = [
    {
      ref: funnelRef,
      data: {
        companyId,
        name: 'Funil padrão',
        order: 0,
        isDefault: true,
        createdAt: FieldValue.serverTimestamp(),
      },
    },
    ...oldColumnsSnap.docs.map((doc) => ({
      ref: funnelRef.collection('crm_columns').doc(doc.id),
      data: { ...doc.data(), funnelId },
    })),
    ...leadsMissingFunnel.map((doc) => ({
      ref: doc.ref,
      data: { funnelId },
      options: { merge: true },
    })),
  ];

  await commitInChunks(writes);

  return {
    companyId,
    skipped: false,
    columns: oldColumnsSnap.size,
    leads: leadsMissingFunnel.length,
  };
}

async function main() {
  const companiesSnap = await db.collection('companies').get();
  console.log(`Empresas encontradas: ${companiesSnap.size}`);

  let migrated = 0;
  let skipped = 0;

  for (const companyDoc of companiesSnap.docs) {
    const result = await migrateCompany(companyDoc);
    if (result.skipped) {
      skipped++;
      continue;
    }
    migrated++;
    console.log(
      `[${result.companyId}] funil padrão criado — ${result.columns} coluna(s) copiada(s), ${result.leads} lead(s) atualizado(s).`,
    );
  }

  console.log(
    `\n✓ Concluído. ${migrated} empresa(s) migrada(s), ${skipped} já tinham funil (puladas). ` +
      'A coleção antiga companies/{companyId}/crm_columns NÃO foi apagada — confira o app ' +
      'lendo dos novos caminhos antes de excluí-la manualmente.',
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

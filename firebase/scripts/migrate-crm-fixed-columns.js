// Garante que todo funil de CRM (companies/{companyId}/crm_funnels/{funnelId})
// tenha exatamente os 5 quadros fixos — Leads, Qualificação, Visitas,
// Propostas, Fechados (ids "leads"/"qualificacao"/"visitas"/"propostas"/
// "fechados", isFixed: true) — e SUBSTITUI qualquer outro quadro:
//   - quadros do default antigo (Novo, Contatado, Qualificado, Visita
//     agendada, Proposta, Fechado, Perdido) e variações customizadas são
//     mapeados por nome pro quadro fixo correspondente (ver NAME_SHORTCUTS);
//   - quadros com nome não reconhecido são distribuídos pelos 5 fixos de
//     acordo com a posição relativa (`order`) entre os quadros restantes;
//   - os leads de cada quadro removido são movidos (status) pro quadro fixo
//     de destino antes do quadro ser apagado.
// DESTRUTIVO: apaga os quadros antigos permanentemente. Idempotente — funis
// que já têm só os 5 fixos são pulados.
// Uso: node scripts/migrate-crm-fixed-columns.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const BATCH_LIMIT = 450;

const FIXED_COLUMNS = [
  { id: 'leads', name: 'Leads', color: '#94a3b8', order: 0 },
  { id: 'qualificacao', name: 'Qualificação', color: '#3b82f6', order: 1 },
  { id: 'visitas', name: 'Visitas', color: '#f59e0b', order: 2 },
  { id: 'propostas', name: 'Propostas', color: '#f97316', order: 3 },
  { id: 'fechados', name: 'Fechados', color: '#10b981', order: 4 },
];
const FIXED_IDS = new Set(FIXED_COLUMNS.map((c) => c.id));

const NAME_SHORTCUTS = {
  novo: 'leads',
  contatado: 'leads',
  leads: 'leads',
  qualificado: 'qualificacao',
  qualificacao: 'qualificacao',
  'visita agendada': 'visitas',
  visitas: 'visitas',
  visita: 'visitas',
  proposta: 'propostas',
  propostas: 'propostas',
  fechado: 'fechados',
  fechados: 'fechados',
  perdido: 'fechados',
};

function normalize(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

async function commitInChunks(writes) {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + BATCH_LIMIT)) {
      if (write.type === 'delete') {
        batch.delete(write.ref);
      } else {
        batch.set(write.ref, write.data, write.options ?? {});
      }
    }
    await batch.commit();
  }
}

/** Maps every non-fixed column to a target fixed column id. */
function buildTargetMap(nonFixedDocs) {
  const byOrder = [...nonFixedDocs].sort(
    (a, b) => (a.data().order ?? 0) - (b.data().order ?? 0),
  );

  const unmatched = [];
  const targetById = new Map();

  for (const doc of byOrder) {
    const shortcut = NAME_SHORTCUTS[normalize(doc.data().name ?? '')];
    if (shortcut) {
      targetById.set(doc.id, shortcut);
    } else {
      unmatched.push(doc);
    }
  }

  // Distribui os sem correspondência por posição relativa entre os 5 fixos.
  unmatched.forEach((doc, i) => {
    const bucket = Math.min(
      FIXED_COLUMNS.length - 1,
      Math.floor((i / unmatched.length) * FIXED_COLUMNS.length),
    );
    targetById.set(doc.id, FIXED_COLUMNS[bucket].id);
  });

  return targetById;
}

async function migrateFunnel(companyId, funnelDoc) {
  const funnelId = funnelDoc.id;
  const columnsRef = funnelDoc.ref.collection('crm_columns');
  const columnsSnap = await columnsRef.get();

  if (columnsSnap.empty) {
    return { companyId, funnelId, skipped: true };
  }

  const existingIds = new Set(columnsSnap.docs.map((d) => d.id));
  const alreadyFixedOnly =
    columnsSnap.size === FIXED_COLUMNS.length &&
    columnsSnap.docs.every((d) => FIXED_IDS.has(d.id) && d.data().isFixed);
  if (alreadyFixedOnly) {
    return { companyId, funnelId, skipped: true };
  }

  const nonFixedDocs = columnsSnap.docs.filter((d) => !FIXED_IDS.has(d.id));
  const targetById = buildTargetMap(nonFixedDocs);

  const writes = [];

  for (const column of FIXED_COLUMNS) {
    writes.push({
      ref: columnsRef.doc(column.id),
      data: {
        companyId,
        funnelId,
        name: column.name,
        color: column.color,
        order: column.order,
        isFixed: true,
        ...(existingIds.has(column.id) ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      options: { merge: true },
    });
  }

  let movedLeads = 0;
  for (const doc of nonFixedDocs) {
    const targetId = targetById.get(doc.id);

    const leadsSnap = await db
      .collection('companies')
      .doc(companyId)
      .collection('leads')
      .where('funnelId', '==', funnelId)
      .where('status', '==', doc.id)
      .get();

    for (const leadDoc of leadsSnap.docs) {
      writes.push({
        ref: leadDoc.ref,
        data: { status: targetId, updatedAt: FieldValue.serverTimestamp() },
        options: { merge: true },
      });
      movedLeads++;
    }

    writes.push({ type: 'delete', ref: doc.ref });
  }

  await commitInChunks(writes);

  return {
    companyId,
    funnelId,
    skipped: false,
    removedColumns: nonFixedDocs.length,
    movedLeads,
  };
}

async function main() {
  const companiesSnap = await db.collection('companies').get();
  console.log(`Empresas encontradas: ${companiesSnap.size}`);

  let migratedFunnels = 0;
  let skippedFunnels = 0;

  for (const companyDoc of companiesSnap.docs) {
    const funnelsSnap = await companyDoc.ref.collection('crm_funnels').get();
    for (const funnelDoc of funnelsSnap.docs) {
      const result = await migrateFunnel(companyDoc.id, funnelDoc);
      if (result.skipped) {
        skippedFunnels++;
        continue;
      }
      migratedFunnels++;
      console.log(
        `[${result.companyId}/${result.funnelId}] ${result.removedColumns} quadro(s) removido(s), ${result.movedLeads} lead(s) realocado(s).`,
      );
    }
  }

  console.log(
    `\n✓ Concluído. ${migratedFunnels} funil(is) migrado(s), ${skippedFunnels} já estavam com os 5 quadros fixos (pulados).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

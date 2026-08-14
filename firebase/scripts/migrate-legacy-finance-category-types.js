// Reclassifica as subcategorias/lançamentos de Financeiro que ficaram com
// categoryType/category="receita" depois da renomeação de FINANCE_CATEGORY_TYPES
// (de ["receita","custo","despesa","investimento"] para
// ["receitaRecorrente","receitaPontual","receitaVariavel","custo","despesa",
// "proLabore","imposto"]). Levantamento em scripts/audit-legacy-finance-category-types.js.
//
// Mapeamento decidido pelo usuário por nome de subcategoria (não existe
// forma automática de inferir recorrente/pontual/variável a partir do
// categoryType antigo "receita"):
//   Mensalidade de Cliente - MRR -> receitaRecorrente
//   Setup Inicial                -> receitaPontual
//   Reembolso de Cliente         -> receitaPontual
//   Projeto - TCV                -> receitaPontual
//   Upsell / Serviço Extra       -> receitaVariavel
//   Outro                        -> receitaVariavel
//
// Lançamentos (finance_transactions) não têm o próprio mapeamento: herdam o
// categoryType novo da subcategoria vinculada via subcategoryId.
//
// Por padrão roda em modo --dry-run (só mostra o que mudaria). Passe --apply
// para gravar de verdade.
//
// Uso:
//   node scripts/migrate-legacy-finance-category-types.js [--apply]

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const APPLY = process.argv.includes('--apply');

const SUBCATEGORY_MAPPING = {
  p7zalrMHmaOW2eCjDXqA: 'receitaRecorrente', // Mensalidade de Cliente - MRR
  IcKuIXXU3oGqaPpZWQD4: 'receitaPontual', // Setup Inicial
  ZZ5KhQdexjPSPtarZDFC: 'receitaPontual', // Reembolso de Cliente
  kPhwgPorUxxSU62Gf6uC: 'receitaPontual', // Projeto - TCV
  KXwSZGXVR2POCGKmr36W: 'receitaVariavel', // Upsell / Serviço Extra
  JK22VvCS0rvIp8AVVFLq: 'receitaVariavel', // Outro
};

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function migrateSubcategories() {
  const writes = [];

  for (const [subcategoryId, newType] of Object.entries(SUBCATEGORY_MAPPING)) {
    const ref = db.collection('finance_subcategories').doc(subcategoryId);
    const doc = await ref.get();
    if (!doc.exists) {
      console.log(`[subcategories] ${subcategoryId} não encontrado, pulando.`);
      continue;
    }
    const { categoryType, name } = doc.data();
    if (categoryType === newType) {
      console.log(`[subcategories] ${subcategoryId} (${name}) já é "${newType}", pulando.`);
      continue;
    }
    console.log(
      `[subcategories] ${subcategoryId} (${name}): "${categoryType}" -> "${newType}"`,
    );
    writes.push({ ref, data: { categoryType: newType } });
  }

  console.log(
    `${APPLY ? '' : '[dry-run] '}finance_subcategories: ${writes.length} documento(s) serão atualizados.`,
  );
  if (APPLY) {
    const batch = db.batch();
    writes.forEach((w) => batch.update(w.ref, w.data));
    await batch.commit();
  }
  return writes.length;
}

async function migrateTransactions() {
  const snap = await db.collection('finance_transactions').get();
  const writes = [];

  for (const doc of snap.docs) {
    const { category, subcategoryId, subcategoryName } = doc.data();
    if (category !== 'receita' && category !== 'investimento') continue;

    const newType = SUBCATEGORY_MAPPING[subcategoryId];
    if (!newType) {
      console.log(
        `[transactions] ${doc.id} (${subcategoryName ?? subcategoryId}) categoria antiga "${category}" mas subcategoryId não está no mapeamento — pulando, revisar manualmente.`,
      );
      continue;
    }
    console.log(
      `[transactions] ${doc.id} (${subcategoryName}): "${category}" -> "${newType}"`,
    );
    writes.push({ ref: doc.ref, data: { category: newType } });
  }

  console.log(
    `${APPLY ? '' : '[dry-run] '}finance_transactions: ${writes.length} documento(s) serão atualizados.`,
  );
  if (APPLY) {
    const batch = db.batch();
    writes.forEach((w) => batch.update(w.ref, w.data));
    await batch.commit();
  }
  return writes.length;
}

async function main() {
  const subsCount = await migrateSubcategories();
  const txCount = await migrateTransactions();
  console.log(
    `\n${APPLY ? '✓ Concluído' : '[dry-run] Simulação concluída'}. ${subsCount} subcategoria(s) e ${txCount} lançamento(s).`,
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

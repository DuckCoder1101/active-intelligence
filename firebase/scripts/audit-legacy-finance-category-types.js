// Levanta (read-only, não grava nada) registros de finance_subcategories e
// finance_transactions com categoryType/category fora do enum atual
// FINANCE_CATEGORY_TYPES (receitaRecorrente, receitaPontual, receitaVariavel,
// custo, despesa, proLabore, imposto). Esses valores antigos ("receita",
// "investimento") ficaram órfãos depois da renomeação do enum e hoje causam
// crash/label em branco no frontend — ver
// frontend/admin/src/utils/finance-settings-draft.util.ts.
//
// Uso:
//   node scripts/audit-legacy-finance-category-types.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const CURRENT_TYPES = new Set([
  'receitaRecorrente',
  'receitaPontual',
  'receitaVariavel',
  'custo',
  'despesa',
  'proLabore',
  'imposto',
]);

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function auditSubcategories() {
  const snap = await db.collection('finance_subcategories').get();
  const offenders = [];

  for (const doc of snap.docs) {
    const { categoryType, name } = doc.data();
    if (!CURRENT_TYPES.has(categoryType)) {
      offenders.push({ id: doc.id, categoryType, name });
    }
  }

  console.log(
    `finance_subcategories: ${offenders.length} de ${snap.size} com categoryType inválido.`,
  );
  for (const o of offenders) {
    console.log(`  [${o.id}] categoryType="${o.categoryType}" name="${o.name}"`);
  }
  return offenders;
}

async function auditTransactions() {
  const snap = await db.collection('finance_transactions').get();
  const offenders = [];

  for (const doc of snap.docs) {
    const { category, description, dueDate } = doc.data();
    if (!CURRENT_TYPES.has(category)) {
      offenders.push({
        id: doc.id,
        category,
        description,
        dueDate: dueDate?.toDate?.() ?? dueDate,
      });
    }
  }

  console.log(
    `\nfinance_transactions: ${offenders.length} de ${snap.size} com category inválida.`,
  );
  for (const o of offenders) {
    console.log(
      `  [${o.id}] category="${o.category}" description="${o.description ?? ''}" dueDate=${o.dueDate}`,
    );
  }
  return offenders;
}

async function main() {
  const subs = await auditSubcategories();
  const txs = await auditTransactions();
  console.log(
    `\nTotal: ${subs.length} subcategoria(s) e ${txs.length} lançamento(s) afetado(s). Nenhum dado foi alterado (script read-only).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

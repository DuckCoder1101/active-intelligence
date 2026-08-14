// Reformata CPF/CNPJ/telefone já salvos só com dígitos para o novo padrão
// (salvos COM máscara), decidido no dicionário de dados V2. Cobre:
//   - admins.cpf                          -> 000.000.000-00
//   - company_users.cpf                   -> 000.000.000-00
//   - companies.legalInformation.documentNumber -> 00.000.000/0000-00
//   - companies.cnpjIndex                 -> recalculado (só dígitos), a
//     partir do documentNumber já mascarado, para não ficar dependente do
//     formato salvo anteriormente
//   - companies.contact.phone             -> (00) 0000-0000 / (00) 00000-0000
//
// Telefone de admins/company_users NÃO é alterado — continua salvo só com
// dígitos (regra explícita do dicionário).
//
// Idempotente: um valor que já está mascarado (não bate com "só dígitos")
// é pulado. Por padrão roda em modo --dry-run (só mostra o que mudaria).
// Passe --apply para gravar de verdade.
//
// Uso:
//   node scripts/migrate-format-cpf-cnpj-phone.js [--apply]

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const BATCH_LIMIT = 450;

const serviceAccount = require(path.resolve(__dirname, 'serviceAccount.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const onlyDigits = (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : '');

function maskCpf(digits) {
  if (digits.length !== 11) return null;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function maskCnpj(digits) {
  if (digits.length !== 14) return null;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function maskPhone(digits) {
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return null;
}

async function commitInChunks(writes) {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const write of writes.slice(i, i + BATCH_LIMIT)) {
      batch.update(write.ref, write.data);
    }
    await batch.commit();
  }
}

async function migrateCpfCollection(collectionName) {
  const snap = await db.collection(collectionName).get();
  const writes = [];

  for (const doc of snap.docs) {
    const raw = doc.data().cpf;
    const digits = onlyDigits(raw);
    if (!raw || raw !== digits) continue; // vazio, ou já mascarado (contém não-dígito) -> pula
    const masked = maskCpf(digits);
    if (!masked) {
      console.warn(`[${collectionName}/${doc.id}] cpf com formato inesperado, pulando: "${raw}"`);
      continue;
    }
    writes.push({ ref: doc.ref, data: { cpf: masked } });
  }

  console.log(
    `${APPLY ? '' : '[dry-run] '}${collectionName}: ${writes.length} documento(s) de ${snap.size} terão o CPF remascarado.`,
  );
  if (APPLY) await commitInChunks(writes);
  return writes.length;
}

async function migrateCompanies() {
  const snap = await db.collection('companies').get();
  const writes = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const update = {};

    const cnpjRaw = data.legalInformation?.documentNumber;
    const cnpjDigits = onlyDigits(cnpjRaw);
    if (cnpjRaw && cnpjRaw === cnpjDigits) {
      const maskedCnpj = maskCnpj(cnpjDigits);
      if (maskedCnpj) {
        update['legalInformation.documentNumber'] = maskedCnpj;
        update.cnpjIndex = cnpjDigits;
      } else {
        console.warn(`[companies/${doc.id}] CNPJ com formato inesperado, pulando: "${cnpjRaw}"`);
      }
    }

    const phoneRaw = data.contact?.phone;
    const phoneDigits = onlyDigits(phoneRaw);
    if (phoneRaw && phoneRaw === phoneDigits) {
      const maskedPhone = maskPhone(phoneDigits);
      if (maskedPhone) {
        update['contact.phone'] = maskedPhone;
      } else {
        console.warn(`[companies/${doc.id}] telefone com formato inesperado, pulando: "${phoneRaw}"`);
      }
    }

    if (Object.keys(update).length > 0) {
      writes.push({ ref: doc.ref, data: update });
    }
  }

  console.log(
    `${APPLY ? '' : '[dry-run] '}companies: ${writes.length} documento(s) de ${snap.size} terão CNPJ e/ou telefone remascarados.`,
  );
  if (APPLY) await commitInChunks(writes);
  return writes.length;
}

async function main() {
  const admins = await migrateCpfCollection('admins');
  const companyUsers = await migrateCpfCollection('company_users');
  const companies = await migrateCompanies();

  console.log(
    `\n${APPLY ? '✓ Concluído' : '[dry-run] Simulação concluída'}. ` +
      `${admins + companyUsers} CPF(s) e ${companies} empresa(s) (CNPJ/telefone) afetados.`,
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

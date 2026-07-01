// Builda o pacote functions-shared e copia o resultado (lib/ + package.json) para
// dentro de <codebaseDir>/vendor/functions-shared, referenciado no package.json de
// cada codebase como "functions-shared": "file:./vendor/functions-shared".
//
// Isso existe porque o deploy do Firebase Functions empacota SOMENTE o diretório
// "source" de cada codebase — o Cloud Build remoto não tem acesso aos pacotes
// irmãos do monorepo. Vendorizar o build do pacote compartilhado para dentro do
// próprio diretório da codebase garante que a dependência resolva tanto local
// quanto remotamente, sem duplicar o código-fonte (a fonte única continua em
// functions-shared).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const codebaseDir = process.argv[2];

if (!codebaseDir) {
  console.error('Uso: node scripts/vendor-shared.js <codebaseDir>');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const SHARED_DIR = path.join(ROOT, 'functions-shared');
const TARGET_DIR = path.join(path.resolve(codebaseDir), 'vendor', 'functions-shared');

console.log(`[vendor-shared] Buildando ${SHARED_DIR}`);
if (!fs.existsSync(path.join(SHARED_DIR, 'node_modules'))) {
  execSync('npm install', { cwd: SHARED_DIR, stdio: 'inherit' });
}
execSync('npm run build', { cwd: SHARED_DIR, stdio: 'inherit' });

console.log(`[vendor-shared] Copiando para ${TARGET_DIR}`);
fs.rmSync(TARGET_DIR, { recursive: true, force: true });
fs.mkdirSync(TARGET_DIR, { recursive: true });
fs.cpSync(path.join(SHARED_DIR, 'lib'), path.join(TARGET_DIR, 'lib'), { recursive: true });
fs.copyFileSync(
  path.join(SHARED_DIR, 'package.json'),
  path.join(TARGET_DIR, 'package.json'),
);

console.log('[vendor-shared] OK');

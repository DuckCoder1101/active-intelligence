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
const TARGET_DIR = path.join(
  path.resolve(codebaseDir),
  'vendor',
  'functions-shared',
);
const ROOT_ENV = path.join(ROOT, '.env');
const TARGET_ENV = path.join(path.resolve(codebaseDir), '.env');

console.log(`[vendor-shared] Buildando ${SHARED_DIR}`);
if (!fs.existsSync(path.join(SHARED_DIR, 'node_modules'))) {
  execSync('npm install', { cwd: SHARED_DIR, stdio: 'inherit' });
}
execSync('npm run build', { cwd: SHARED_DIR, stdio: 'inherit' });

console.log(`[vendor-shared] Copiando para ${TARGET_DIR}`);
fs.rmSync(TARGET_DIR, { recursive: true, force: true });
fs.mkdirSync(TARGET_DIR, { recursive: true });
fs.cpSync(path.join(SHARED_DIR, 'lib'), path.join(TARGET_DIR, 'lib'), {
  recursive: true,
});
fs.copyFileSync(
  path.join(SHARED_DIR, 'package.json'),
  path.join(TARGET_DIR, 'package.json'),
);

if (fs.existsSync(ROOT_ENV)) {
  console.log(`[vendor-shared] Copiando .env global para ${TARGET_ENV}`);
  fs.copyFileSync(ROOT_ENV, TARGET_ENV);
} else {
  console.warn(
    `[vendor-shared] Aviso: ${ROOT_ENV} não existe, pulei a cópia de .env.`,
  );
}

console.log('[vendor-shared] OK');

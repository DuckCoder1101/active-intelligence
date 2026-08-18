const fs = require('fs');
const path = require('path');

const codebaseDir = process.argv[2];

if (!codebaseDir) {
  console.error('Uso: node scripts/vendor-test-mock.js <codebaseDir>');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'functions-shared', 'mock.ts');
const TARGET_DIR = path.join(path.resolve(codebaseDir), 'tests', 'mocks');
const TARGET = path.join(TARGET_DIR, 'functions-shared.ts');

const content = fs.readFileSync(SOURCE, 'utf8');

// A fonte canônica importa relativo a si mesma (./src/...); reescreve pro
// caminho relativo correto a partir de <codebase>/tests/mocks/.
const rewritten = content.replace(
  /from "\.\/src\//g,
  'from "../../../functions-shared/src/',
);

fs.mkdirSync(TARGET_DIR, { recursive: true });
fs.writeFileSync(TARGET, rewritten);

console.log(`[vendor-test-mock] ${path.basename(codebaseDir)} <- functions-shared/mock.ts`);

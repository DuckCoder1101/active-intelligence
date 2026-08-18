// Roda a suíte de testes (Vitest) de todas as codebases declaradas em
// firebase.json. Uso local: `npm test` na raiz de firebase/.

const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const firebaseJson = require(path.join(ROOT, 'firebase.json'));

const codebases = firebaseJson.functions.map((f) => f.source);
const results = [];

for (const source of codebases) {
  const codebaseDir = path.join(ROOT, source);

  console.log('='.repeat(60));
  console.log(`Codebase: ${source}`);
  console.log('='.repeat(60));

  try {
    execSync('npm install', {
      cwd: codebaseDir,
      stdio: 'inherit',
    });

    execSync('npm test', {
      cwd: codebaseDir,
      stdio: 'inherit',
    });

    results.push({ source, ok: true });
  } catch {
    results.push({ source, ok: false });
  }
}

console.log('\n' + '='.repeat(60));
console.log('Resumo');
console.log('='.repeat(60));

for (const { source, ok } of results) {
  console.log(`${ok ? '✓' : '✗'} ${source}`);
}

const failed = results.filter((r) => !r.ok);

if (failed.length > 0) {
  console.error(`\n${failed.length} codebase(s) com testes falhando.`);
  process.exitCode = 1;
} else {
  console.log('\nTodas as codebases passaram nos testes.');
}

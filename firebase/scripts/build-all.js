// Builda o pacote functions-shared e, em seguida, todas as codebases declaradas
// em firebase.json (vendorizando o shared em cada uma antes do build). Uso local:
// `npm run build` na raiz de firebase/. Serve também de base para o emulador.

const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const firebaseJson = require(path.join(ROOT, 'firebase.json'));

for (const { source } of firebaseJson.functions) {
  const codebaseDir = path.join(ROOT, source);

  console.log('='.repeat(60));
  console.log(`Codebase: ${source}`);
  console.log('='.repeat(60));

  execSync(
    `node "${path.join(__dirname, 'vendor-shared.js')}" "${codebaseDir}"`,
    {
      stdio: 'inherit',
    },
  );

  execSync('npm install', {
    cwd: codebaseDir,
    stdio: 'inherit',
  });

  execSync('npm run build', {
    cwd: codebaseDir,
    stdio: 'inherit',
  });
}

console.log('\nTodas as codebases foram buildadas com sucesso.');

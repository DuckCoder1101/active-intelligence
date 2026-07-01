// Faz o deploy de cada codebase separadamente, com espera entre elas, para não
// estourar a quota da API do Cloud Functions (CloudFunctionsWriteRequestsPerMinutePerProject).
// O build/vendorização de cada codebase já acontece via "predeploy" no firebase.json,
// então aqui só orquestramos a ordem e o intervalo entre os deploys.

const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const firebaseJson = require(path.join(ROOT, 'firebase.json'));

const WAIT_TIME = 120_000; // 120s entre deploys

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const codebases = firebaseJson.functions.map((f) => f.codebase);

  console.log(`Codebases a deployar: ${codebases.join(', ')}\n`);

  const errors = [];

  for (const [index, codebase] of codebases.entries()) {
    console.log('='.repeat(60));
    console.log(`Deploy da codebase: ${codebase}`);
    console.log('='.repeat(60));

    try {
      execSync(`npx firebase deploy --only functions:${codebase}`, {
        cwd: ROOT,
        stdio: 'inherit',
      });
      console.log(`\n${codebase} publicada com sucesso!`);
    } catch (err) {
      errors.push(codebase);
    }

    const isLast = index === codebases.length - 1;
    if (!isLast) {
      console.log(`\nAguardando ${WAIT_TIME / 1000}s antes da próxima codebase...\n`);
      await sleep(WAIT_TIME);
    }
  }

  if (errors.length > 0) {
    console.log('\nErro ao publicar as seguintes codebases:');
    errors.forEach((c) => console.error(` * ${c}`));
    process.exitCode = 1;
    return;
  }

  console.log('\nDeploy de todas as codebases concluído!');
})();

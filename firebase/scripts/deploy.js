const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const firebaseJson = require(path.join(ROOT, 'firebase.json'));

const WAIT_TIME = 300_000; // 5m entre codebases
const RETRY_WAIT_TIME = 300_000; // 5m entre tentativas de retry
const MAX_RETRIES = 5; // tentativas extras por codebase antes de desistir

const FAILED_FUNCTIONS_HEADER =
  'Functions deploy had errors with the following functions:';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runFirebaseDeploy(only) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['firebase', 'deploy', '--only', only], {
      cwd: ROOT,
      shell: true,
    });

    let output = '';

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      output += chunk.toString();
    });

    child.on('close', (code) => {
      resolve({ success: code === 0, output });
    });
  });
}

// Extrai a lista de functions que falharam do resumo que o firebase-tools
// imprime ao final do deploy (formato "codebase:functionId(region)").
function parseFailedFunctions(output) {
  const headerIndex = output.indexOf(FAILED_FUNCTIONS_HEADER);
  if (headerIndex === -1) {
    return [];
  }

  const lines = output
    .slice(headerIndex + FAILED_FUNCTIONS_HEADER.length)
    .split('\n');
  const failed = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    if (line.trim() === '') {
      continue;
    }
    const match = line.match(/^\t([^\t():]+):([^\t():]+)\(([^)]+)\)$/);
    if (!match) {
      break;
    }
    failed.push({ codebase: match[1], functionId: match[2] });
  }

  return failed;
}

async function deployCodebase(codebase) {
  let { success, output } = await runFirebaseDeploy(`functions:${codebase}`);
  if (success) {
    console.log(`\n${codebase} publicada com sucesso!`);
    return true;
  }

  let failedFunctions = parseFailedFunctions(output);
  if (failedFunctions.length === 0) {
    console.error(
      `\nFalha ao publicar ${codebase} (sem functions específicas para retentar).`,
    );
    return false;
  }

  let attempt = 0;
  while (failedFunctions.length > 0 && attempt < MAX_RETRIES) {
    attempt += 1;
    console.log(
      `\n${failedFunctions.length} function(s) falharam em ${codebase}. Aguardando ${RETRY_WAIT_TIME / 1000}s antes da tentativa ${attempt}/${MAX_RETRIES}...\n`,
    );
    await sleep(RETRY_WAIT_TIME);

    const only = failedFunctions
      .map((f) => `functions:${f.codebase}:${f.functionId}`)
      .join(',');

    console.log('-'.repeat(60));
    console.log(
      `Retentando ${failedFunctions.length} function(s) de ${codebase} (tentativa ${attempt}/${MAX_RETRIES})`,
    );
    console.log('-'.repeat(60));

    const retryResult = await runFirebaseDeploy(only);
    if (retryResult.success) {
      failedFunctions = [];
      break;
    }

    const stillFailed = parseFailedFunctions(retryResult.output);
    failedFunctions = stillFailed.length > 0 ? stillFailed : failedFunctions;
  }

  if (failedFunctions.length > 0) {
    console.error(
      `\n${codebase} ainda com falha após ${MAX_RETRIES} tentativa(s) de retry:`,
    );
    failedFunctions.forEach((f) => console.error(` * ${f.functionId}`));
    return false;
  }

  console.log(`\n${codebase} publicada com sucesso após retry!`);
  return true;
}

(async () => {
  const allCodebases = firebaseJson.functions.map((f) => f.codebase);
  const requested = process.argv.slice(2);

  let codebases;
  if (requested.length > 0) {
    const invalid = requested.filter((c) => !allCodebases.includes(c));
    if (invalid.length > 0) {
      console.error(
        `Codebase(s) inválida(s): ${invalid.join(', ')}\nCodebases disponíveis: ${allCodebases.join(', ')}`,
      );
      process.exitCode = 1;
      return;
    }
    codebases = requested;
  } else {
    codebases = allCodebases;
  }

  console.log(`Codebases a deployar: ${codebases.join(', ')}\n`);

  const errors = [];

  for (const [index, codebase] of codebases.entries()) {
    console.log('='.repeat(60));
    console.log(`Deploy da codebase: ${codebase}`);
    console.log('='.repeat(60));

    const ok = await deployCodebase(codebase);
    if (!ok) {
      errors.push(codebase);
    }

    const isLast = index === codebases.length - 1;
    if (!isLast) {
      console.log(
        `\nAguardando ${WAIT_TIME / 1000}s antes da próxima codebase...\n`,
      );
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

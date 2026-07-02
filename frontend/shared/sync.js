// Copia os arquivos-fonte compartilhados (src/ e api/) para dentro do app de
// destino (app/ ou admin/), nos mesmos caminhos relativos usados pelos aliases
// do tsconfig (@components/*, @t/*, etc.) — assim os imports não mudam.
// Rodado via predev/prebuild/predeploy de cada app; roda apenas localmente,
// onde o repositório completo está disponível (o build remoto do Vercel já
// recebe os arquivos sincronizados, empacotados junto com o restante do app).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const targetArg = process.argv[2];

if (!targetArg) {
  console.error('Uso: node sync.js <targetDir>');
  process.exit(1);
}

const SHARED_ROOT = path.dirname(fileURLToPath(import.meta.url));
const TARGET_ROOT = path.resolve(targetArg);

for (const dir of ['src', 'api']) {
  const from = path.join(SHARED_ROOT, dir);

  if (!fs.existsSync(from)) {
    continue;
  }

  fs.cpSync(from, path.join(TARGET_ROOT, dir), { recursive: true });
}

console.log(`[shared/sync] Sincronizado para ${TARGET_ROOT}`);

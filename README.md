# Guará

Plataforma de gestão para empresas: clientes, projetos, CRM de leads, propostas/contratos,
financeiro, planos, avaliações, biblioteca de conteúdo e equipe — com integração de Lead Ads do
Facebook. Dois portais web (cliente e admin) sobre um backend Firebase dividido em múltiplas
codebases de Cloud Functions.

## Estrutura

```
firebase/                  # Backend (Firebase: Functions, Firestore, Storage, Auth)
  codebases/
    functions-shared/      # Domínio compartilhado (repositories, DTOs, utils) — fonte única,
                            # vendorizada (cópia física) para dentro de cada codebase abaixo
    functions-admin/       # Uma pasta por codebase de deploy (ver "Backend" abaixo)
    functions-user/
    functions-company/
    functions-company-user/
    functions-company-crm/
    functions-task/
    functions-operational-kanban/
    functions-real-estate/
    functions-finance/
    functions-library/
    functions-plans/
    functions-review/
    functions-meta-integration/
  scripts/                 # Build/test/deploy de todas as codebases, vendorização do shared/.env
  docs/                    # DICTIONARY.md (campos de cada entidade), REPOSITORIES.md
  firebase.json, .env, tsconfig.base.json, eslint.config.mjs, prettier.config.js

frontend/
  shared/                  # Fonte única de código compartilhado entre app/admin (models, auth
                            # context, formatters, utils) — copiada via sync.js pra dentro de
                            # cada app antes de dev/build/deploy
  app/                     # Portal do cliente (empresas) — guara-client-portal
  admin/                   # Portal administrativo — guara-admin-portal
```

## Stack

- **Backend**: Firebase Functions (2ª geração, Node 24, TypeScript), Firestore, Storage, Auth,
  Secret Manager. Validação com Zod. Testes com Vitest.
- **Frontend**: React 19 + TanStack Start/Router/Query, Vite, Tailwind CSS v4. Deploy via Vercel.

## Por que múltiplas codebases no backend?

O Firebase tem cota de deploy por codebase; um único `functions/` com todos os handlers estourava
essa cota. A solução foi dividir por domínio, com `functions-shared` como fonte única de código
compartilhado (repositories, DTOs, validações) vendorizada — copiada fisicamente — para
`vendor/functions-shared/` dentro de cada codebase antes do build/deploy. Esse mesmo mecanismo
(`scripts/vendor-shared.js`) também copia `firebase/.env` (fonte única de variáveis de ambiente)
para dentro de cada codebase.

## Backend (`firebase/`)

```bash
cd firebase
npm run build      # builda functions-shared + vendoriza + builda todas as codebases
npm test           # roda a suíte (Vitest) de todas as codebases
npm run lint
npm run emulators  # sobe os emulators (Auth, Functions, Firestore, Storage) com dados de emulators-data/
npm run deploy    # builda e publica todas as codebases (aceita nomes específicos: node scripts/deploy.js user meta-integration)
```

Antes de rodar pela primeira vez, copie `firebase/.env.example` para `firebase/.env` e preencha os
valores. `firebase/scripts/serviceAccount.json` (credencial de admin, nunca vai pro git) é
necessário pros scripts de migração em `firebase/scripts/migrate-*.js`.

Documentação de referência: [`firebase/docs/DICTIONARY.md`](firebase/docs/DICTIONARY.md) (campos
de cada entidade/collection) e [`firebase/docs/REPOSITORIES.md`](firebase/docs/REPOSITORIES.md)
(padrão de referência dos repositories).

## Frontend (`frontend/app` e `frontend/admin`)

```bash
cd frontend/app   # ou frontend/admin
npm run dev       # sincroniza frontend/shared/ e sobe o Vite dev server
npm test
npm run lint
npm run deploy    # vercel deploy
```

`frontend/shared/` é a fonte única de models, contexto de auth, formatters e utils usados pelos
dois portais — nunca edite a cópia sincronizada dentro de `app/src` ou `admin/src` diretamente
(fica fora do git e é sobrescrita a cada `predev`/`prebuild`/`predeploy`). Edite em
`frontend/shared/src/` e rode `node ../shared/sync.js .` de dentro do app, se precisar sincronizar
manualmente.

## Licença

Apache 2.0 — ver [LICENSE](LICENSE).

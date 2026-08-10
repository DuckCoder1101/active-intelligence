# Dicionário de dados — Firestore

Gerado em 2026-08-03 a partir de uma auditoria completa de `functions-*/src/repositories/*.repository.ts` e
`functions-shared/src/domain/**/*.repository.ts` (as cópias em `vendor/` são ignoradas — sempre a fonte real).

`firestore.rules` nega tudo por padrão (`allow read, write: if false`); todo acesso passa pelas Cloud Functions
com o Admin SDK, então as regras não documentam nomes de collection. `firestore.indexes.json` referencia apenas
4 nomes (`company_users`, `tasks`, `notifications`, `audits`) — todos batem com repositories abaixo, sem órfãos.

Convenção de nomenclatura de arquivo: `<entidade>.document.ts` para o shape do Firestore, `<entidade>.dto.ts`
para o shape exposto pela API. Duas exceções ainda não corrigidas: `functions-company/src/types/contracted-service.type.ts`
(ver backlog).

---

## Collections top-level

### `admins`

- **Dono**: `functions-shared/src/domain/admin/admin.repository.ts` (`AdminRepository`)
- **Também lido por**: `notification.repository.ts` (busca de FCM tokens)
- **Tipo**: `admin.document.ts` → `AdminDocument`
  - `name: string`, `email: string`, `phone?: string`, `cpf: string`, `createdAt: Timestamp`, `updatedAt: Timestamp`, `fcmTokens?: string[]`
- Nível de acesso/permissões do admin vivem nos **custom claims do Firebase Auth**, não neste doc.

### `company_users`

- **Dono**: `functions-shared/src/domain/company-user/company-user.repository.ts` (`CompanyUserRepository`)
- **Também lido por**: `notification.repository.ts`
- **Tipo**: `company-user.document.ts` → `CompanyUserDocument`
  - `companyId: string`, `name: string`, `email: string`, `phone?: string`, `cpf: string`, `createdAt`, `updatedAt`, `fcmTokens?: string[]`
- Referenciado em `firestore.indexes.json`.
- Estrutura quase idêntica a `AdminDocument` sem tipo base compartilhado (ver backlog).

### `notifications`

- **Dono**: `functions-shared/src/domain/notification/notification.repository.ts`
- **Tipo**: `notification.document.ts` → `NotificationDocument`
  - `targetUids: string[]`, `type: NotificationType` (união com 1 literal: `"new-client-task"`), `message: string`, `taskId?: string`, `companyId?: string`, `createdAt: Timestamp`
- Índice: `targetUids` array-contains + `createdAt` desc.
- Entrega é por uid (`targetUids`) — ler mais em `NotificationRepository.markRead`.

### `companies`

- **Dono**: `functions-shared/src/domain/company/company.repository.ts` (`CompanyRepository`)
- **Ancorada por**: `audits` (subcollection), e como parent doc de `personal_tasks`, `real_estate`, e todas as subcollections de `functions-company-crm`.
- **Tipo**: `company.document.ts` → `CompanyDocument`
  - `displayName: string`, `cnpjIndex: string`, `legalInformation: {legalName?, tradeName?, documentNumber}`, `companyStage: CompanyStage`, `contact: {email, phone}`, `business?: {businessSector?, customSegment?, cnae?, revenueRange?, quantityOfEmployees?, quantityOfBrokers?}`, `location: {address?, number?, complement?, neighborhood?, city, state: BrazilianState, zipCode?}`, `social?: {websiteUrl?, instagramUsername?, linkedInUsername?}`, `extra?: {observations?}`, `financial?: {contractedServiceIds, contractType?: "mrr"|"tcv", administrativeResponsibleUid?, mrr?, tcv?}`, `monthlyTaskLimit?: number`, `taskUsage?: {yearMonth, count}`, `createdAt`, `updatedAt`

### `company_operational`

- **Dono**: `functions-shared/src/domain/company/company-operational.repository.ts` — doc id = `companyId` (não é subcollection de `companies`, é top-level com o mesmo id).
- **Tipo**: `company-operational.document.ts` → `CompanyOperationalDocument`
  - `driveUrl?: string`, `metaAdsAccountId?: string`, `metaApiKey?: string`, `responsibleUids?: {cronograma?, campanhas?, cs?}`, `updatedAt`, `updatedBy: string`
- `getByCompanyId` não lança erro se o doc não existir — retorna defaults vazios.

### `operational_kanban_columns`

- **Dono**: `functions-shared/src/domain/operational-kanban/operational-kanban.repository.ts`
- **Também referenciada por**: `tasks` (reatribuição ao deletar coluna)
- **Tipo**: `operational-kanban.document.ts` → `OperationalKanbanColumnDocument`
  - `name: string`, `color: string`, `order: number`, `createdAt`
- Global (não por empresa) — usado pelo Kanban Operacional interno.

### `tasks`

- **Dono**: `functions-task/src/repositories/task.repository.ts` (`TaskRepository`)
- **Também referenciada por**: `operational-kanban.repository.ts` (`tasksCol`), `task-category.repository.ts` (`tasksCol`)
- **Tipo**: `task.document.ts` → `TaskDocument`
  - `companyId: string`, `title: string`, `description: string`, `type?: string` (`@deprecated`, substituído por `categoryId`), `categoryId: string`, `subcategoryId?: string | null`, `tags: string[]`, `status: string`, `dueDate: Timestamp`, `createdBy: string`, `createdByName?: string`, `assignedTo: string[]`, `referenceLinks: string[]`, `referenceImages: string[]`, `hasMedia: boolean`, `createdAt`, `updatedAt`
- Escopo por empresa é feito via `where("companyId", "==", ...)`, não nesting de path — único caso assim entre as collections "por empresa".
- Índices compostos: `hasMedia`+`createdAt`, `companyId`+`dueDate`.

### `task_categories`

- **Dono**: `functions-task/src/repositories/task-category.repository.ts`
- **Tipo**: `task-category.document.ts` → `TaskCategoryDocument`
  - `name: string`, `color: string`, `order: number`, `createdAt`
- Mesmo arquivo define `TaskSubcategoryDocument` (subcollection abaixo) e a seed `DEFAULT_TASK_CATEGORIES`.

### `task_tags`

- **Dono**: `functions-task/src/repositories/task-tag.repository.ts`
- **Tipo**: `task-tag.document.ts` → `TaskTagDocument`
  - `name: string`, `color: string`, `createdAt`

### `finance_transactions`

- **Dono**: `functions-finance/src/repositories/transaction.repository.ts`
- **Também referenciada por**: `subcategory.repository.ts`, `account.repository.ts` (checagem de uso antes de deletar)
- **Tipo**: `transaction.document.ts` → `TransactionDocument`
  - `type: "entrada"|"saida"`, `status: "previsto"|"realizado"`, `category: FinanceCategoryType`, `subcategoryId?`, `subcategoryName?`, `companyId?`, `companyName?`, `amount: number`, `paymentMethod: "pix"|"boleto"|"transferencia"|"cartao"`, `accountId`, `accountName`, `dueDate`, `paidDate?`, `description?`, `externalId?`, `origin: "manual"|"asaas"`, `createdBy`, `createdAt`, `updatedAt`

### `finance_subcategories`

- **Dono**: `functions-finance/src/repositories/subcategory.repository.ts`
- **Tipo**: `subcategory.document.ts` (renomeado de `subcategory.type.ts`) → `FinanceSubcategoryDocument`
  - `categoryType: FinanceCategoryType`, `name: string`, `nameIndex: string`, `order: number`, `createdAt`
- DTO `FinanceSubcategoryDTO` no mesmo arquivo (convenção diferente do resto do backend, que separa document/dto — ver backlog).

### `finance_accounts`

- **Dono**: `functions-finance/src/repositories/account.repository.ts`
- **Tipo**: `account.document.ts` (renomeado de `account.type.ts`) → `FinanceAccountDocument`
  - `name: string`, `nameIndex: string`, `createdAt`
- DTO `FinanceAccountDTO` no mesmo arquivo.

### `plans`

- **Dono**: `functions-plans/src/repositories/plan.repository.ts`
- **Tipo**: `plan.document.ts` → `PlanDocument`
  - `name: string`, `billingType: "mrr"|"tcv"`, `value: number`, `features: ("schedule"|"crm"|"real-estate"|"library")[]`, `taskLimit: number`, `createdAt`, `updatedAt`

### `contracted_services`

- **Dono**: `functions-company/src/repositories/contracted-service.repository.ts`
- **Tipo**: `contracted-service.type.ts` (ainda não renomeado — ver backlog) → `ContractedServiceDocument`
  - `name: string`, `nameIndex: string`, `createdAt`

### `library` (singleton, doc fixo `"hub"`)

- **Dono**: `functions-library/src/repositories/guide.repository.ts`
- Guarda só `guideSequence: number` para alocar o próximo código de guia (`G-###`) — não existe tipo próprio pra esse doc, é acessado ad hoc via `hubSnap.data()?.guideSequence as number`.

---

## Subcollections

### `companies/{companyId}/audits`

- **Dono**: `functions-shared/src/domain/company/audit.repository.ts` (write-only — sem leitura/list aqui; consultas são feitas ad hoc por quem lê, ex. `listAuditLogs`/`listWorkspaceAuditLogs` em `functions-company`)
- **Tipo**: `company-audit.document.ts` → `CompanyAuditDocument`
  - `action: AuditAction` (enum), `actorUid`, `actorName`, `targetUid?`, `taskId?`, `taskTitle?`, `details?`, `createdAt`
- Índice: collectionGroup `audits` por `createdAt`.

### `companies/{companyId}/personal_tasks`

- **Dono**: `functions-task/src/repositories/personal-task.repository.ts`
- **Tipo**: `personal-task.document.ts` → `PersonalTaskDocument`
  - `companyId`, `createdBy`, `title`, `description?`, `dueDate`, `createdAt`, `updatedAt`

### `companies/{companyId}/real_estate`

- **Dono**: `functions-real-estate/src/repositories/real-estate.repository.ts`
- **Tipo**: `real-estate.document.ts` → `RealEstateDocument` (maior document do backend — ~40 campos: status, code, título/descrição, tipo/propósito, dono, condomínio, endereço completo, área/quartos/vagas, condição, mobília, preços, aceita financiamento/permuta, features, fotos/vídeo/tour, documentação, visibilidade pública)
- Compartilha os enums `PropertyType`/`PropertyFeature` (de `functions-shared/src/domain/real-estate/*.enum.ts`) com `leads`.

### `companies/{companyId}/counters` (doc fixo `real_estate`)

- **Dono**: `functions-real-estate/src/repositories/real-estate.repository.ts` (`counterRef`)
- Sem tipo próprio — shape ad hoc `{value: number}`, usado só pra alocar código sequencial (`I-001`, etc) atomicamente via transação.

### `companies/{companyId}/crm_origins`

- **Dono**: `functions-company-crm/src/repositories/origin.repository.ts`
- **Tipo**: `origin.document.ts` → `OriginDocument`: `companyId`, `name`, `createdAt`

### `companies/{companyId}/crm_tags`

- **Dono**: `functions-company-crm/src/repositories/tag.repository.ts`
- **Tipo**: `tag.document.ts` → `TagDocument`: `companyId`, `name`, `createdAt`

### `companies/{companyId}/crm_funnels`

- **Dono**: `functions-company-crm/src/repositories/crm-funnel.repository.ts`
- **Tipo**: `crm-funnel.document.ts` → `CrmFunnelDocument`: `companyId`, `name`, `order`, `isDefault: boolean`, `createdAt`

### `companies/{companyId}/crm_funnels/{funnelId}/crm_columns`

- **Dono**: `functions-company-crm/src/repositories/crm-column.repository.ts`
- **Tipo**: `crm-column.document.ts` → `CrmColumnDocument`: `companyId`, `funnelId`, `name`, `color`, `order`, `createdAt`

### `companies/{companyId}/leads`

- **Dono**: `functions-company-crm/src/repositories/lead.repository.ts` — repository de referência do backend
- **Tipo**: `lead.document.ts` → `LeadDocument` (segundo maior document: dados de contato, funil/status/tags, perfil de busca de imóvel completo — reaproveita `PropertyType`/`PropertyFeature` de `functions-shared`, reexportados "para não quebrar imports existentes")
- Sem prefixo `crm_` e sem snake_case, ao contrário das collections irmãs (`crm_origins`, `crm_tags`, `crm_funnels`) — ver backlog.

### `task_categories/{categoryId}/subcategories`

- **Dono**: `functions-task/src/repositories/task-category.repository.ts` (`subcategoriesCol`)
- **Tipo**: mesmo arquivo do pai, `TaskSubcategoryDocument`: `name`, `order`, `createdAt`

### `library/hub/guides`

- **Dono**: `functions-library/src/repositories/guide.repository.ts`
- **Tipo**: `guide.document.ts` → `GuideDocument`: `sequence`, `name`, `label?`, `driveUrl?`, `socialUrl?`, `intentTags`, `platformTags`, `formatTags`, `scriptPrompt`, `scriptGuide: {id,title,content}[]`, `assignedCompanyIds`, `createdBy`, `createdAt`, `updatedAt`

---

## Backlog de padronização (levantado, **não executado** — decisão do usuário)

Nada abaixo foi alterado nesta rodada; são mudanças estruturais/migração de dados, fora do escopo de "correção pequena".

1. **`leads`, `audits`, `counters` sem prefixo/snake_case**, diferente das demais subcollections (`crm_origins`, `crm_tags`, `crm_funnels`, `crm_columns`, `personal_tasks`, `real_estate`). Renomear collection = migração de dados em produção.
2. **`AdminDocument` e `CompanyUserDocument`** têm campos quase idênticos (`name`, `email`, `phone?`, `cpf`, `createdAt`, `updatedAt`, `fcmTokens?`) sem um tipo base compartilhado.
3. **Códigos de erro inconsistentes para "não encontrado"**: `personal-task.repository.ts` e `task.repository.ts#updateImages` usam `permission-denied` em vez de `not-found` para doc ausente/não pertencente ao usuário. Mudar isso muda o contrato com o frontend — não alterado sem confirmação separada.
4. **`export default class`** em `notification`/`admin`/`company-user` repositories (`functions-shared`) vs. `export class` nos demais. Mudar o export exige atualizar todos os imports vendorizados (`vendor/functions-shared` em 6+ codebases) — fora do escopo de correção mecânica.
5. **Duas soluções diferentes pra alocar sequência atômica**: `companies/{id}/counters` (doc dedicado) no real-estate vs. campo `guideSequence` no singleton `library/hub`. Nenhuma foi migrada pra outra.
6. **`functions-company/src/types/contracted-service.type.ts`** ainda não renomeado pra `*.document.ts` (as duas exceções em `functions-finance` já foram corrigidas nesta rodada).

Ver também `firebase/docs/REPOSITORIES.md` para a tabela de conformidade por repository.

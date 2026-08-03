# Índice de repositories

Mapa rápido dos 23 repositories do backend. Padrão de referência: `functions-company-crm/src/repositories/lead.repository.ts`
(`export class XRepository`, `private static col(companyId)`, métodos estáticos async, `toDTO(id,data)` no topo do
arquivo, `HttpsError("not-found", "X não encontrado.")`). Campos completos de cada collection estão em
[DATA_DICTIONARY.md](./DATA_DICTIONARY.md).

`✅` = bate com o padrão de referência (fora o `col()` sem `companyId`, esperado pra collection global) · `⚠️` = desvio a observar (comportamento, não bug)

## `functions-shared/src/domain` (compartilhado, vendorizado em `vendor/functions-shared` nas demais codebases)

| Arquivo | Classe | Collection | toDTO | Conformidade |
|---|---|---|---|---|
| `notification/notification.repository.ts` | `NotificationRepository` (export default) | `notifications` (+ lê `admins`/`company_users`) | inline | ⚠️ export default, sem `col()`, side-effect de push dentro do repository |
| `operational-kanban/operational-kanban.repository.ts` | `OperationalKanbanRepository` | `operational_kanban_columns` (+ `tasks`) | inline | ⚠️ collection global fixa, seed-on-read em `listAll` |
| `admin/admin.repository.ts` | `AdminRepository` (export default) | `admins` | inline | ⚠️ export default, mistura chamadas de Firebase Auth |
| `company-user/company-user.repository.ts` | `CompanyUserRepository` (export default) | `company_users` | inline | ⚠️ export default; `update()` não checa existência (diferente dos irmãos) |
| `company/audit.repository.ts` | `AuditRepository` | `companies/{companyId}/audits` | — (write-only) | ⚠️ só escreve, sem `col()`/leitura, erros engolidos e logados |
| `company/company-operational.repository.ts` | `CompanyOperationalRepository` | `company_operational` (doc id = companyId) | inline | ⚠️ `getByCompanyId` nunca lança not-found, retorna defaults |
| `company/company.repository.ts` | `CompanyRepository` | `companies` | inline | ⚠️ vocabulário de erro mais amplo (`already-exists`, `resource-exhausted`) |

## `functions-company-crm/src/repositories`

| Arquivo | Classe | Collection | toDTO | Conformidade |
|---|---|---|---|---|
| `lead.repository.ts` | `LeadRepository` | `companies/{companyId}/leads` | ✅ topo do arquivo | ✅ **é a referência** |
| `crm-column.repository.ts` | `CrmColumnRepository` | `companies/{companyId}/crm_funnels/{funnelId}/crm_columns` | ✅ (extraído) | `col()` de 2 args; seed-on-read; cascata de delete |
| `crm-funnel.repository.ts` | `CrmFunnelRepository` | `companies/{companyId}/crm_funnels` | ✅ (extraído) | seed-on-read; cascata cross-repository no delete |
| `origin.repository.ts` | `OriginRepository` | `companies/{companyId}/crm_origins` | ✅ (extraído) | seed-on-read; sem getById/update |
| `tag.repository.ts` | `TagRepository` | `companies/{companyId}/crm_tags` | ✅ (extraído) | sem getById/update |

## `functions-company/src/repositories`

| Arquivo | Classe | Collection | toDTO | Conformidade |
|---|---|---|---|---|
| `contracted-service.repository.ts` | `ContractedServiceRepository` | `contracted_services` (global) | inline | ⚠️ sem getById/update/delete, sem tratamento de erro (não há caminho not-found) |

## `functions-finance/src/repositories`

| Arquivo | Classe | Collection | toDTO | Conformidade |
|---|---|---|---|---|
| `transaction.repository.ts` | `TransactionRepository` | `finance_transactions` (global) | ✅ topo do arquivo | ✅ só difere no `col` fixo (esperado, collection global) |
| `subcategory.repository.ts` | `SubcategoryRepository` | `finance_subcategories` (+ lê `finance_transactions`) | ✅ topo do arquivo | ✅ idem; bloqueia delete se em uso |
| `account.repository.ts` | `AccountRepository` | `finance_accounts` (+ lê `finance_transactions`) | ✅ (extraído) | ✅ idem; dedupe por `nameIndex` |

## `functions-real-estate/src/repositories`

| Arquivo | Classe | Collection | toDTO | Conformidade |
|---|---|---|---|---|
| `real-estate.repository.ts` | `RealEstateRepository` | `companies/{companyId}/real_estate` (+ `counters/real_estate`) | ✅ topo do arquivo | ✅ bate bem; sem `getById` dedicado; transação p/ código sequencial |

## `functions-library/src/repositories`

| Arquivo | Classe | Collection | toDTO | Conformidade |
|---|---|---|---|---|
| `guide.repository.ts` | `GuideRepository` | `library/hub/guides` (singleton global) | ✅ dois mappers (`toDTO`, `toContentDTO`) | ⚠️ `col()`/`hubRef()` sem argumento (não é por empresa) |

## `functions-plans/src/repositories`

| Arquivo | Classe | Collection | toDTO | Conformidade |
|---|---|---|---|---|
| `plan.repository.ts` | `PlanRepository` | `plans` (global) | ✅ topo do arquivo | ✅ só difere no `col` fixo (esperado) |

## `functions-task/src/repositories`

| Arquivo | Classe | Collection | toDTO | Conformidade |
|---|---|---|---|---|
| `task-category.repository.ts` | `TaskCategoryRepository` | `task_categories` (+ `tasks`, + `task_categories/{id}/subcategories`) | inline | ⚠️ seed-on-read; cascata batched (limite de 500 ops do Firestore) |
| `task-tag.repository.ts` | `TaskTagRepository` | `task_tags` (global) | inline | ⚠️ sem getById/update, `save` sempre cria novo |
| `personal-task.repository.ts` | `PersonalTaskRepository` | `companies/{companyId}/personal_tasks` | ✅ topo do arquivo | ⚠️ usa `permission-denied` em vez de `not-found` p/ doc ausente/não-próprio (ver backlog no dicionário) |
| `task.repository.ts` | `TaskRepository` | `tasks` (global, escopo por `where("companyId", ...)`) | ✅ topo do arquivo | ✅ bate bem; `updateImages` usa `permission-denied` como checagem de autorização intencional |

## Codebases sem `repositories/` próprio (chamam direto nos repositories de `functions-shared`)

`functions-admin`, `functions-company-user`, `functions-operational-kanban`, `functions-user` — usam
`AdminRepository`, `CompanyUserRepository`, `OperationalKanbanRepository` e `NotificationRepository` de
`functions-shared/src/domain` (tabela acima) via o pacote vendorizado.

---

Ver [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) para os campos completos de cada collection e o backlog de
padronização (mudanças estruturais levantadas mas não executadas).

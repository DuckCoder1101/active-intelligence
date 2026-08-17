# Dicionário de dados - sistema Guará.

## Entidades

### Admin (administradores)

Coleção: `admins`.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| uid | String | Automático, não editável | Identificador único, criado pelo sistema quando o admin é convidado. |
| name | String | Sim | Nome completo. De 5 a 60 caracteres. |
| email | String | Sim | Imutável e único entre todos os usuários de quaisquer empresas ou administradores. |
| phone | String | Não | Telefone com máscara (DDD + celular). Se preenchido, precisa ser um número válido. Salvo sem formatação. |
| createdAt | Timestamp | Automático | Data de criação. |
| updatedAt | Timestamp | Automático | Data da última atualização. |
| fcmTokens | String[] | Automático | Usado para notificações push; gerenciado pelo sistema, nunca aparece na tela. |
| accessLevel *(fica na permissão de login, não no cadastro)* | lista de opções: proprietário ou admin | Sim | Todo admin convidado entra como "admin" comum — não existe tela para criar um "proprietário". Aparece bloqueado na edição. |
| permissions *(também fica na permissão de login)* | lista de opções, pode ficar vazia | Não | Editável só por um proprietário. Se a pessoa editada for proprietária, todas as permissões ficam marcadas e travadas. Opções: clientes, projetos, CRM, propostas, contratos, diagnósticos, criação de conteúdo, financeiro, inteligência, planos, avaliações, biblioteca, equipe e configurações. |

### CompanyUser (usuário de empresa)

Coleção: `company_users`.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| uid | String | Sim | Criado no convite. |
| companyId | String | Sim | Não é digitado — a empresa já vem definida pela tela onde o usuário está sendo convidado. Não há como trocar a empresa de um usuário depois. |
| name | String | Sim | Nome completo. De 5 a 60 caracteres. |
| email | String | Sim | Imutável e único entre todos os usuários de quaisquer empresas ou administradores. |
| phone | String | Não | Telefone com máscara (DDD + celular). Se preenchido, precisa ser um número válido. Salvo sem formatação. |
| fcmTokens | lista de Strings | Automático | Igual ao admin. |
| createdAt | Timestamp | Automático | Data de criação. |
| updatedAt | Timestamp | Automático | Data da última atualização. |

Observações: nenhum desses campos tem tamanho máximo definido na tela. As permissões de acesso não ficam no cadastro do usuário, e sim junto ao login. A foto de perfil é gerenciada à parte, não faz parte deste cadastro.

### Task (tarefa)

Coleção: `tasks`.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| companyId | String | Sim | No admin é uma lista de empresas para escolher; no cliente já vem definida automaticamente. |
| title | String | Sim | De 5 a 30 caracteres. |
| description | String | Não | Máximo de 300 caracteres. |
| categoryId | lista de opções | Sim, na prática | O formulário sempre já vem com uma categoria pré-selecionada. |
| subcategoryId | lista de opções | Não | Só aparece se a categoria escolhida tiver subcategorias cadastradas. |
| tags | lista de opções | Não | Só existe no formulário do admin — o cliente nunca vê nem escolhe etiquetas. Dá pra criar uma etiqueta nova direto na tela. |
| status | lista de opções (colunas do quadro) | Não, tem valor padrão | As opções mudam conforme as colunas cadastradas da empresa. O admin escolhe a coluna; o cliente não escolhe — a tarefa sempre entra na primeira coluna. |
| dueDate | Date | Sim | O sistema não permite data já passada.
| createdBy | String | Automático | Quem criou a tarefa. |
| assignedTo | lista de opções (responsáveis) | Não | Só aparece para o dono da conta escolher; vazio significa "para todos". Tarefas criadas pelo cliente nunca têm responsável definido. |
| referenceLinks | lista de links | Não | Precisa ser um link válido; a tela ajuda completando o começo do endereço, mas não impede erro de digitação. Sem limite de quantidade. |
| referenceImages | lista de imagens | Não | Sem limite de quantidade. |
| hasMedia | verdadeiro/falso | Automático | Calculado pelo sistema. |
| createdAt | Timestamp | Automático | Data de criação. |
| updatedAt | Timestamp | Automático | Data da última atualização. |

Nenhum formulário de tarefa avisa erro de tamanho ou formato na hora — os limites só são checados pelo sistema depois de salvar.

### TaskCategory (categoria de tarefa)

Coleção: `task_categories`. Unicidade (nome e cor) é validada entre todas as categorias (não é por empresa) — tentar salvar um nome ou cor já usados bloqueia com erro, não reaproveita a categoria existente.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | De 3 até 30 caracteres. Deve ser único. |
| color | cor | Sim | Escolhida numa paleta de 9 cores fixas, ou uma cor personalizada. Deve ser única também — com só 9 cores na paleta, a partir da 10ª categoria é preciso escolher uma cor personalizada. |
| order | número | Automático | Pela ordem em que aparece na lista (dá pra arrastar para reordenar). |
| createdAt | Timestamp | Automático | Data de criação. |
| updatedAt | Timestamp | Automático | Data da última atualização. |

Excluir uma categoria também remove suas subcategorias e move as tarefas para outra categoria.

### TaskSubcategory (subcategoria de tarefa)

Subcoleção: `task_categories/{categoryId}/task_subcategories` (renomeada de `subcategories`). Unicidade de nome é validada só dentro da mesma categoria-pai — duas categorias diferentes podem ter subcategorias com o mesmo nome.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | De 3 até 30 caracteres. Deve ser único dentro da categoria. |
| order | número | Automático | Pela ordem na lista. |
| createdAt | Timestamp | Automático | Data de criação. |
| updatedAt | Timestamp | Automático | Data da última atualização. |

Não tem cor própria — usa a cor da categoria à qual pertence. Ao excluir, as tarefas que a usavam ficam sem subcategoria.

### TaskTag (etiqueta de tarefa)

Coleção: `task_tags`.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | De 1 até 15 caracteres. Deve ser único entre as tags. |
| color | cor | Sim | Precisa ser uma cor válida; mesma paleta de 9 cores fixas. |
| createdAt | Timestamp | Automático | Data de criação. |
| updatedAt | Timestamp | Automático | Data da última atualização. |

Só existe para o admin — o cliente nunca vê etiquetas.

### AdminTasksBoardColumn (coluna do quadro de tarefas)

Coleção: `admin_tasks_board_columns` (renomeada de `operational_kanban_columns`).

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | De 2 até 20 caracteres, nome único entre as colunas. |
| color | cor | Sim | Mesma paleta de 9 cores. |
| order | número | Automático | Pela ordem na lista. |
| createdAt | Timestamp | Automático | Data de criação. |

Só é possível criar, excluir e reordenar colunas — não existe tela para editar nome ou cor depois de criada. Duas colunas ("aguardando cliente" e "entregue") são protegidas e não podem ser excluídas.

### CompanyInternalTask (tarefa interna da empresa)

Subcoleção: `companies/{companyId}/company_internal_tasks` (renomeada de `personal_tasks`).

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| companyId | String | Automático | Definido pela empresa atual. |
| createdBy | String | Automático | UId do criador da task |
| title | String | Sim | De 5 a 30 caracteres. |
| description | String | Não | Máximo de 300 caracteres. |
| color | cor | Sim, na prática | Cor padrão laranja. Tem paleta própria de 9 cores e não deixa escolher cores muito claras ou muito escuras. |
| dueDate | data e hora | Sim | Data e hora da tarefa, salva em UTC (já é o comportamento padrão do timestamp do Firestore). |
| createdAt | Timestamp | Automático | Data de criação. |
| updatedAt | Timestamp | Automático | Data da última atualização. |

Só existe no aplicativo do cliente, não no painel admin.

### Guide (guia de conteúdo)

Coleção: `library/hub/guides`. O nome final (`name`) é montado pelo sistema a partir do `code` sequencial e de um rótulo digitado pelo usuário (campo "Nome (opcional)" na tela) — é esse rótulo que precisa ter de 5 a 20 caracteres.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| code | número | Automático | Número usado para montar o código do guia (ex.: G-001). Nunca aparece para edição. |
| name | String | Automático | Nome final mostrado, montado juntando o código sequencial com o rótulo digitado. O rótulo digitado precisa ter de 5 a 20 caracteres. |
| driveUrl | link | Não | Link do Google Drive; sem validação real de formato. |
| socialUrl | link | Não | Link de referência (TikTok/Instagram); sem validação real de formato. |
| intentTags | lista de Strings | Não | Etiquetas livres, criadas pelo próprio usuário digitando — não é uma lista fixa. |
| platformTags | lista de Strings | Não | Etiquetas livres de plataforma e formato de gravação, unificadas num único campo (antes eram dois campos separados). |
| scriptPrompt | String longo | Não | Sem limite de tamanho. |
| scriptGuide | lista de blocos (título + conteúdo) | Não | Pode ter qualquer quantidade de blocos, inclusive nenhum. |
| scriptGuide (id de cada bloco) | String | Automático | Gerado ao criar o bloco. |
| scriptGuide (título de cada bloco) | String | Não | String livre. |
| scriptGuide (conteúdo de cada bloco) | String | Não | String livre. |
| assignedCompanyIds | lista de empresas | Não | Empresas com acesso a este guia; pode ficar vazia. |
| createdBy | String | Automático | — |
| createdAt / updatedAt | data | Automático | — |

Praticamente tudo é opcional — a validação de verdade só existe no sistema, não é reforçada pela tela.

### Company (empresa)

Coleção: `companies`. `cnpjIndex` (índice interno usado só para checar CNPJ duplicado) é sempre recalculado só com dígitos, independente do CNPJ estar salvo com máscara.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| displayName | String | Sim | Nome de exibição, mínimo 2 caracteres. |
| razão social | String | Não | String livre, de 5 a 80 caracteres. |
| nome fantasia | String | Não | String livre, de 5 a 80 caracateres |
| CNPJ | String | Sim | Com máscara de CNPJ; o sistema confere se os dígitos são válidos. Salvo com formatação |
| companyStage (estágio) | lista de opções | Sim, com valor padrão | Comercial, operacional ou inativa. No cadastro só dá pra escolher comercial ou operacional; "inativa" só aparece depois, na edição. |
| e-mail de contato | String | Sim | Precisa ser um e-mail válido. |
| telefone de contato | String | Sim | Salvo com máscara de telefone. |
| setor do negócio | lista de opções | Não | Imobiliária, construtora, incorporadora, corretor autônomo ou outro. Padrão: imobiliária. |
| segmento personalizado | String | Não | Só aparece quando o setor é "outro". |
| CNAE | String | Não | Com máscara própria. |
| faixa de faturamento | lista de opções | Não | Faixas pré-definidas, de até R$ 500 mil até acima de R$ 100 milhões. |
| quantidade de funcionários | número | Não | Não pode ser negativo. |
| quantidade de corretores | número | Não | Não pode ser negativo. |
| endereço, número, complemento, bairro | String | Não | String livre. |
| cidade | String | Sim | — |
| estado (UF) | lista de opções | Sim | Os 27 estados brasileiros. Padrão: SP. |
| CEP | String | Não | Salvo com máscara de CEP. |
| site | String (URL) | Não | URL, maximo de 50 caracteres |
| Instagram | String | Não | String livre. |
| LinkedIn | String | Não | String livre. |
| observações | String | Não | String livre. |
| serviços contratados | lista de opções | Não | Dá pra criar um serviço novo direto na tela. |
| tipo de contrato | lista de opções | No cadastro é opcional, mas na edição (aba financeira) é obrigatório — inconsistência entre as duas telas | Recorrente (mensal) ou fechado (valor único). |
| responsável administrativo | String | Não | Escolhido entre os admins. |
| valor mensal (contrato recorrente) | valor em reais | Obrigatório se o contrato for recorrente | Precisa ser positivo. |
| forma de pagamento (recorrente) | lista de opções | Obrigatório se recorrente | Pix, boleto ou cartão. |
| dia de vencimento (recorrente) | número | Obrigatório se recorrente | Entre 1 e 31. |
| meses de fidelidade | número | Não | Não pode ser negativo. |
| início do contrato (recorrente) | data | Obrigatório se recorrente | — |
| fim do contrato (recorrente) | data | Não | — |
| valor total (contrato fechado) | valor em reais | Obrigatório se o contrato for fechado | Precisa ser positivo. |
| forma de pagamento (fechado) | lista de opções | Obrigatório se fechado | À vista ou parcelado. |
| meio de pagamento à vista | lista de opções | Obrigatório só se for à vista | Pix, cartão ou boleto. |
| número de parcelas | número | Obrigatório só se for parcelado | — |
| valor de cada parcela | valor em reais | Obrigatório só se for parcelado | — |
| início do contrato (fechado) | data | Obrigatório se fechado | — |
| fim do contrato (fechado) | data | Obrigatório se fechado | Diferente do contrato recorrente, aqui é obrigatório. |
| limite mensal de tarefas | número | Não | Deixar em branco significa sem limite. |
| uso de tarefas no mês | String e número | Automático | Não aparece em formulário; controlado pelo sistema. |
| createdAt / updatedAt | data | Automático | — |
| e-mail do responsável (só no cadastro) | String | Não | Campo especial que não é salvo na empresa: se preenchido, o sistema convida automaticamente um admin com esse e-mail. |

### CompanyOperational (dados operacionais da empresa)

Coleção: `company_operationals` (renomeada de `company_operational`) — um documento por empresa, com o id do documento igual ao `companyId`.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| link do Drive | link | Não | — |
| conta de anúncios (Meta) | String | Não | Código da conta, String livre. |
| chave de API (Meta) | String | Não, sensível | Campo escondido como senha. Se deixado em branco, mantém o valor já salvo. O valor real nunca é mostrado de novo — a tela só indica se já está configurado. |
| responsável pelo cronograma | String | Não | Escolhido entre os admins. |
| responsável pelas campanhas | String | Não | Escolhido entre os admins. |
| responsável pelo CS | String | Não | Escolhido entre os admins. |
| updatedAt | data | Automático | — |
| updatedBy | String | Automático | Registra quem fez a última alteração. |

### CrmOrigin (origem do lead)

Não existe tela própria de configuração — é criada direto no cadastro de um lead, ao clicar em "+".

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | Até 40 caracteres. Sem checagem de nome repetido. |
| createdAt | data | Automático | — |

### CrmTag (etiqueta de CRM)

Mesma lógica da origem — criada direto no cadastro do lead.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | Até 40 caracteres. Sem checagem de repetição. |
| createdAt | data | Automático | — |

### CrmFunnel (funil de CRM)

Sem tela própria — criado direto no quadro de CRM.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | Até 40 caracteres. Sem checagem de repetição. |
| order | número | Automático | Pela ordem de criação. |
| isDefault (padrão) | verdadeiro/falso | Automático | Só o funil inicial vem marcado como padrão. Um funil não pode ser excluído se for o único restante. |
| createdAt | data | Automático | — |

### CrmColumn (coluna do funil de CRM)

Sem tela própria — criada direto no quadro do funil.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | Até 40 caracteres, sem checagem de repetição. |
| color | cor | Sim | Paleta de 9 cores fixas ou cor personalizada. |
| order | número | Automático | Pela ordem de criação. |
| isFixed (fixa) | verdadeiro/falso | Automático | As colunas criadas junto com o funil vêm marcadas como fixas e não podem ser excluídas — nem a última coluna restante do funil. |
| createdAt | data | Automático | — |

### Lead

Cadastro dividido em 4 partes: Contato, Negócio, Perfil de busca e Qualificação. A validação da tela é bem mais simples do que a exigida pelo sistema — só nome, telefone e origem realmente impedem salvar se estiverem vazios.

**Contato**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | Sem tamanho máximo. |
| phone | String | Sim | Com máscara de telefone. |
| email | String | Não | O formato de e-mail só é conferido pelo sistema, não pela tela. |
| originId (origem) | lista de opções | Sim | Dá pra criar uma origem nova direto ali. |
| referredBy (indicado por) | String | Não | Só aparece quando a origem escolhida é "indicação". |
| tagIds (etiquetas) | lista de opções | Não | Dá pra criar uma etiqueta nova direto ali. |
| assignedTo (responsáveis) | lista de opções | Não | Entre os membros da equipe. |
| notes (observações) | String | Não | Sem tamanho máximo. |

**Negócio**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| businessType (tipo de negócio) | lista de opções | Deveria ser obrigatório, mas a tela não impede salvar sem escolher | Compra, venda, locação ou outro. |
| businessTypeOther | String | Não | Só aparece quando o tipo é "outro". |
| propertyType (tipo de imóvel) | lista de opções | Não | Apartamento, casa, terreno, entre outros — mesma lista usada no cadastro de imóveis. |
| propertyTypeOther | String | Não | Só aparece quando o tipo é "outro". |
| purpose (finalidade) | lista de opções | Não | Moradia própria, investimento, segunda residência ou realocação. |

**Perfil de busca**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| city / state | String | Não | Digitados livremente (não é uma lista fixa de estados, diferente do cadastro de imóveis). |
| neighborhoods (bairros) | lista de Strings | Não | Um ou mais bairros de interesse. |
| acceptsNearbyNeighborhoods | verdadeiro/falso | Não | Aceita bairros próximos. |
| priceMin / priceMax (faixa de preço) | valor em reais | Na prática, sempre preenchidos | Controle deslizante. O valor mínimo não pode ser maior que o máximo. |
| propertySizeM2 | número | Não | Área em m². |
| bedrooms / suites / parkingSpots / floor | número | Não | Quartos, suítes, vagas e andar. |
| preferences (preferências) | lista de opções | Não | Dezenas de características desejadas (elevador, piscina, portaria 24h, entre outras) — mesma lista usada no cadastro de imóveis. |

**Qualificação**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| paymentMethod (forma de pagamento) | lista de opções | Não | À vista, financiamento, FGTS, consórcio ou permuta. |
| hasApprovedOrSimulatedCredit | verdadeiro/falso | Não | Tem crédito aprovado ou simulado. |
| decidesAlone (decide sozinho) | verdadeiro/falso | Não | Padrão: sim. |
| decidesWith (decide com quem) | String | Não | Só aparece quando "decide sozinho" está desmarcado. |
| consultedOtherRealtor | verdadeiro/falso | Não | Já consultou outro corretor. |
| temperature (temperatura) | lista de opções | Não | Frio, morno ou quente. |

**Campos automáticos**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| leadId / companyId / funnelId | String | Automático | — |
| status | String | Automático | Coluna do funil onde o lead está; muda ao arrastar no quadro. |
| dealStatus (status do negócio) | lista de opções | Automático, valor padrão "aberto" | Aberto, vendido ou perdido. Alterado por um menu separado no topo da tela. |
| source (origem do lead) | lista de opções | Automático | "Manual" (criado pela tela, valor padrão/ausente) ou "Facebook Ads" (criado pela integração de Lead Ads, ver `FacebookAdsIntegration`). |
| externalLeadId | String | Automático | Id do lead correspondente no Facebook (`leadgen_id`), preenchido só quando `source` é "Facebook Ads". Usado pra não duplicar o lead se a Meta reenviar a notificação do webhook. |
| sourcePageId / sourceFormId | String | Automático | Página e formulário do Facebook de onde o lead veio, preenchidos só quando `source` é "Facebook Ads". |
| createdBy / createdAt / updatedAt | String/data | Automático | — |

### Transaction (transação financeira)

Coleção: `finance_transactions`.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| type (tipo) | lista de opções | Sim | Entrada ou saída. |
| status | lista de opções | Editável (previsto/realizado) | Editável direto na tela (previsto ou realizado); "atrasado" continua sendo só calculado na hora (data já passou e ainda não foi marcado como pago), nunca salvo. Marcar como "realizado" sem uma `paidDate` preenchida usa a data de hoje; voltar pra "previsto" limpa `paidDate`. |
| category (categoria) | lista de opções | Sim | Muda conforme o tipo: entrada só tem "receita"; saída tem custo, despesa ou investimento. São categorias fixas, não dá pra criar novas. |
| subcategoryId / subcategoryName | lista de opções / String | Não / Automático | Filtrada pela categoria escolhida. Referência a `FinanceSubcategory`; `subcategoryName` é uma cópia do nome no momento do lançamento, pra não depender de join na hora de listar. |
| companyId / companyName (cliente / projeto) | lista de opções / String | Não | Campo híbrido: digitar o nome exato de um cliente cadastrado vincula `companyId` (e `companyName` vira cópia automática do nome); qualquer outro texto fica salvo livre em `companyName`, sem `companyId`, pra casos sem cliente formal (ex.: projeto interno). |
| amount (valor) | valor em reais | Sim | Precisa ser maior que zero. |
| paymentMethod (forma de pagamento) | lista de opções | Sim | Pix, boleto, transferência ou cartão. |
| accountId / accountName (conta) | lista de opções / String | Sim / Automático | Conta bancária cadastrada nas Configurações. Referência a `FinanceAccount`. `accountName` é uma cópia do nome no momento do lançamento. |
| dueDate (data prevista) | data | Sim | Data prevista de recebimento ou pagamento — base do controle de caixa. Não aparece como campo na tela; segue a data de pagamento quando informada, ou a data de criação. |
| accrualDate (competência) | mês/ano | Sim | Mês/ano ao qual o lançamento pertence financeiramente, independente de quando é efetivamente pago/recebido — base da DRE. Digitado como texto livre (numérico "MM-AAAA" ou escrito, ex. "JAN 2026"). |
| paidDate (data de pagamento) | data | Automático | Preenchida/limpa automaticamente junto com `status` (ver acima). |
| description | String | Não | Máximo de 200 caracteres. |
| groupId | String | Automático | Preenchido só quando o lançamento nasce de um parcelamento — todos os lançamentos da mesma compra parcelada compartilham o mesmo `groupId`. |
| installmentIndex / installmentTotal (parcela) | número | Automático / Editável | Só preenchidos quando `groupId` existe. Ex.: 2 de 5. `installmentIndex` pode ser corrigido direto na tela (só o índice — `installmentTotal` e `groupId` não mudam por ali). |
| origin (origem) | lista de opções | Automático | Manual (criado pela tela) ou Asaas (sincronizado da integração). |
| externalId | String | Automático | Id do lançamento correspondente no Asaas, preenchido só quando `origin` é "asaas". |
| createdBy / createdAt / updatedAt | String/data | Automático | — |

### FinanceSubcategory (subcategoria financeira)

Coleção: `finance_subcategories`.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| categoryType (categoria) | lista de opções | Automático | Definida pela categoria selecionada na tela, não é digitada. |
| name | String | Sim | Até 60 caracteres. Apesar de existir um mecanismo interno para evitar nome repetido, ele não funciona de verdade — dá pra cadastrar duas subcategorias com o mesmo nome. |
| order | número | Automático | Pela ordem na lista. |
| createdAt | data | Automático | — |

Não pode ser excluída se já tiver transações usando ela.

### FinanceAccount (conta bancária)

Coleção: `finance_accounts`.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | Até 60 caracteres. Nome de exibição da conta (apelido), não o nome do banco. Ao criar, o sistema evita nome repetido (reaproveita a conta já existente). Mas ao editar o nome de uma conta já existente, essa checagem não é feita. |
| bankCode / bankName (banco) | String | Sim | Código e nome do banco. Texto livre — não existe lista curada de bancos no sistema. |
| agency / agencyDigit (agência) | String | Sim / Não | Número da agência e dígito verificador (quando o banco usar). |
| accountNumber / accountDigit (conta) | String | Sim / Não | Número da conta e dígito verificador. |
| accountType (tipo de conta) | lista de opções | Sim | Corrente ou poupança. |
| holderName (titular) | String | Sim | Nome do titular da conta. |
| holderDocumentType | lista de opções | Sim | CPF ou CNPJ — define a máscara aplicada em `holderDocument`. |
| holderDocument | String | Sim | CPF ou CNPJ do titular, salvo com formatação (mesma regra do CPF/CNPJ da empresa). |
| pixKey (chave PIX) | String | Não | Chave PIX da conta, quando existir. Não tem validação de formato — aceita CPF/CNPJ/email/telefone/chave aleatória como texto livre. |
| asaasWalletId | String | Não | Id da carteira (subconta) Asaas vinculada a esta conta, usado por uma futura integração de repasse/split. A autenticação com a API do Asaas em si (apiKey) não fica aqui — é global, ver `IntegrationSettings`. |
| createdAt | data | Automático | — |

Não pode ser excluída se já tiver transações usando ela.

### IntegrationSettings (configuração de integração)

Coleção: `integration_settings` — um documento fixo por integração (hoje só `asaas`), não tem lista.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| apiKey | String | Sim | Chave de API do Asaas. Campo write-only: depois de salva, a tela nunca mostra o valor de volta, só se está configurada ou não. |
| environment (ambiente) | lista de opções | Sim | Sandbox ou produção. |
| updatedAt | data | Automático | — |

Tela de cadastro fica em Configurações → Integrações, restrita a administradores com a permissão de gerenciar configurações.

### FacebookAdsIntegration (integração de Lead Ads do Facebook)

Subcoleção: `companies/{companyId}/integration_settings` — um documento fixo por integração (hoje só `facebookAds`), não tem lista. Mesmo padrão do `IntegrationSettings` global, mas por empresa.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| connected | verdadeiro/falso | Automático | Se a empresa concluiu o OAuth com o Facebook. |
| fbUserId / fbUserName | String | Automático | Conta do Facebook que autorizou a integração. |
| secretRef | String | Automático | Nome do segredo no Google Secret Manager onde ficam os tokens (de usuário e de cada página conectada). O token em si nunca é salvo no Firestore. |
| pages | lista de objetos | Automático | Uma entrada por página do Facebook conectada: `pageId`, `pageName`, `subscribed` (se já está inscrita no webhook de leads da Meta), e `forms` — lista de formulários mapeados (`formId`, `formName`, `funnelId`, `originId`, `tagIds`, `active`). |
| connectedBy | String | Automático | uid de quem conectou. |
| connectedAt / updatedAt | data | Automático | — |

Conexão (OAuth via popup do Facebook JS SDK) implementada em `frontend/app/src/routes/_private/company/$companyId/ad-accounts.tsx`, chamando `connectFacebookAdsHandler`/`getFacebookAdsSettingsHandler` (codebase `functions-meta-integration`). Falta ainda: tela de seleção de páginas/mapeamento de formulários (`pages[].forms`), inscrição no webhook de leads e o endpoint que recebe o webhook em si.

### FacebookPageLink (vínculo de página do Facebook → empresa)

Coleção: `facebook_page_links` (top-level, chave do documento = `pageId` da página do Facebook).

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| companyId | String | Automático | Empresa dona da página. Existe só pra o webhook de leads da Meta (que manda apenas `pageId`, nunca `companyId`) saber em qual empresa gravar o lead recebido — sem esse índice não haveria como descobrir isso sem varrer todas as empresas. |

Nunca aparece em nenhuma tela.

### Plan (plano)

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | De 5 Até 20 caracteres. |
| billingType (cobrança) | lista de opções | Sim | Mensal (recorrente) ou projeto único. |
| value (valor) | valor em reais | Sim | Precisa ser maior que zero, mas a tela não impede digitar zero — só o sistema bloqueia. |
| features (módulos incluídos) | lista de opções | Não | Cronograma, CRM, imóveis, conteúdos. Pode ficar vazio. |
| taskLimit (limite de tarefas) | número | Sim | Não pode ser negativo. |
| createdAt / updatedAt | data | Automático | — |

### ContractedService (serviço contratado)

Sem tela própria — criado direto dentro do cadastro financeiro da empresa.

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| name | String | Sim | Até 60 caracteres. Ao criar, o sistema evita nomes repetidos (reaproveita o serviço já existente). |
| createdAt | data | Automático | — |

### RealEstate (imóvel)

Subcoleção: `companies/{companyId}/real_estates` (renomeada de `real_estate`). Cadastro mais completo do sistema (cerca de 40 campos). Compartilha as mesmas listas de tipo de imóvel e características do Lead. As pastas de arquivo no Storage (fotos/vídeo) continuam organizadas como `real_estate` — não fazem parte da regra de nomeação de coleções do Firestore.

**Sistema**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| companyId | String | Automático | — |
| status | lista de opções | Automático | Disponível, reservado, vendido, alugado ou inativo. Começa como "disponível"; é alterado por um controle separado, fora do formulário principal. |
| code (código) | String | Automático, não editável | Código sequencial gerado pelo sistema (ex.: I-001). |

**Identificação**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| title (título) | String | Não | De 5 até 60 caracteres. |
| description (descrição) | String | Não | Até 2000 caracteres. |
| propertyType (tipo do imóvel) | lista de opções | Sim | Apartamento, casa, terreno, entre outros. |
| propertyTypeOther | String | Não | Só aparece quando o tipo é "outro". |
| purposes (finalidade) | lista de opções | Sim | Venda e/ou locação — precisa escolher pelo menos uma. |
| internalNotes (observações internas) | String | Não | Sem tamanho máximo. |

**Proprietário**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| nome do proprietário | String | Sim | De 5 até 50 caracteres |
| telefone do proprietário | String | Sim | Com máscara de telefone. |
| e-mail do proprietário | String | Não | Formato de e-mail conferido só pelo sistema. |

**Condomínio**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| tem condomínio? | verdadeiro/falso | Não | Define se os campos abaixo aparecem. |
| nome do condomínio | String | Não | Só aparece com condomínio marcado. |
| taxa de condomínio | valor em reais | Não | Só aparece com condomínio marcado. |

**Localização**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| endereço | String | Sim | — |
| número, complemento, região | String | Não | — |
| bairro | String | Sim | — |
| cidade | String | Sim | — |
| estado (UF) | lista de opções | Sim | Estados brasileiros. |
| CEP | String | Não | Com máscara de CEP. |
| latitude / longitude | número | Não | Existem no cadastro, mas não têm campo na tela hoje. |
| bloco | String | Não | Só aparece com condomínio marcado. |

**Características**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| área útil / área total (m²) | número | Não | — |
| quartos, suítes, banheiros, vagas, andar, andares do prédio | número | Não | — |
| condição | lista de opções | Não | Novo, usado ou na planta. |
| mobiliado | lista de opções | Sim, com valor padrão | Sim, não ou parcialmente — padrão "não". |

**Valores**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| preço de venda | valor em reais | Só aparece se a finalidade incluir venda | — |
| preço de locação | valor em reais | Só aparece se a finalidade incluir locação | — |
| valor do IPTU | valor em reais | Não | — |
| aceita financiamento / aceita permuta / negociável | verdadeiro/falso | Não, padrão desmarcado | — |

**Comodidades**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| features (características) | lista de opções | Não | Dezenas de opções possíveis (elevador, piscina, portaria 24h, vaga coberta, entre muitas outras), organizadas em grupos. Pode não escolher nenhuma. |

**Mídia**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| fotos | lista de imagens | Não | Sem limite de quantidade nem de tamanho de arquivo. |
| foto de capa | imagem | Não | Se não escolhida, usa a primeira foto automaticamente. |
| link do vídeo / tour virtual | link | Não | Sem validação de formato. |

**Documentação**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| número da matrícula | String | Não | — |
| situação da documentação | lista de opções | Não | Regularizado ou pendente. |
| número do IPTU | String | Não | — |

**Publicação**

| Nome | Tipo | Obrigatório? | Especificações |
| ---- | ---- | ------------ | --------------- |
| visível no site / destaque | verdadeiro/falso | Não, padrão desmarcado | — |
| descrição pública | String | Não | Sem tamanho máximo. |
| portais | lista de Strings | Não | Existe no cadastro para integração futura com portais imobiliários, mas não tem campo na tela hoje. |

### Entidades sem formulário (só sistema)

Duas partes do banco de dados não têm nenhuma tela associada — são geradas e usadas só internamente:

- **Auditoria**: histórico de ações (quem fez o quê, quando), gravado automaticamente pelo sistema a cada ação relevante. Só é consultado em telas de histórico, nunca editado.
- **Contador**: usado só para gerar o código sequencial dos imóveis (I-001, I-002...). Não tem tela nenhuma.


# Importante:
* Todos os emails devem ter limites de até 60 caracteres.
* Todas as informações geradas externamente como CPF, CNPJ devem ser salvos com formatação.
* As coleções do sistema devem seguir os respectivos nomes das entidades só que no plural.
* As coleções, propriedades e entidades devem ser chamadas em ingles.
* Quando um campo é marcado como "deve ser único", o sistema bloqueia o salvamento com um erro — não reaproveita silenciosamente um registro já existente com o mesmo valor.

## Pendências manuais (não automatizadas pelo código)

- As 5 renomeações de coleção (`operational_kanban_columns`→`admin_tasks_board_columns`, `personal_tasks`→`company_internal_tasks`, `real_estate`→`real_estates`, `company_operational`→`company_operationals`, `subcategories`→`task_subcategories`) precisam rodar os scripts de `firebase/scripts/migrate-rename-collection.js` **antes** do deploy do código novo (que já lê/escreve só nos nomes novos), e a coleção antiga deve ser apagada manualmente só depois de confirmar que está tudo funcionando.
- Reformatar CPF/CNPJ/telefone já salvos: `firebase/scripts/migrate-format-cpf-cnpj-phone.js`.
- Truncar planos e descrições de imóveis que já excedem os novos limites: `firebase/scripts/migrate-truncate-oversized-fields.js`.
- Unificar `platformTags`/`formatTags` dos guias já cadastrados: `firebase/scripts/migrate-merge-guide-tags.js`.
- Todos os scripts rodam em modo `--dry-run` por padrão; passe `--apply` para gravar de verdade.
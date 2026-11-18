> DOCUMENTO HISTÓRICO: proposta anterior às definições do usuário. Foi substituída pelo resultado da etapa 1 em ../04-implementacao/etapa-1-contas-permissoes-e-migracao.md. A proposta de criação administrativa por comando foi descartada; o acesso inicial é configurado internamente em .env.local.

# Etapa 1 — Contas, permissões e migração profissional

Data: 16/11/2026. Estado: **em análise; três definições solicitadas ao usuário**.

Este é o pacote concreto da fase 1 do [plano de ação](../00-planejamento/plano-de-acao.md). A aplicação e o banco continuam na versão validada na etapa 0. Nenhuma regra proposta abaixo foi aplicada antes da definição correspondente.

## 1. Inspeção específica e preservação

- Nova cópia consistente do banco: `_seguranca/etapa-1-2026-11-16/cypher-antes.sqlite`.
- Fontes anteriores ao trabalho: `_seguranca/etapa-1-2026-11-16/cypher-fontes-antes.zip`.
- Banco atual no schema 20, com uma associação ativa: Rapper. Não há profissão retirada vinculada à conta atual.
- `CYPHER_ADMIN_EMAILS` não está configurada no ambiente observado. Isso não comprova ausência de configuração em outros ambientes.
- Fontes examinadas: catálogo profissional, questionários, autenticação, autorização compartilhada, criação/edição de perfil, relações e vertentes, catálogo de categorias aprovadas, revisão administrativa, controllers de eventos/beats e testes existentes.

## 2. Regras já definidas nos documentos

1. Catálogo vigente com 26 profissões em sete áreas; consumidor e cargos administrativos não contam como profissões.
2. Freestyler passa a Freestyleiro; mudanças de identificadores internos exigem migração das relações e respostas.
3. Somente Rapper seleciona vertentes profissionais de rap. As vertentes de obras são independentes.
4. Consumidor, Profissional e Administrativo são naturezas distintas. Categoria profissional não concede poder administrativo.
5. A conta administrativa não possui perfil artístico público e não nasce do cadastro geral.
6. Consumidor não cria obras, beats ou eventos; profissão não comprova experiência nem confirma crédito.
7. Usuários, IDs públicos, obras, créditos e participações legítimas devem ser preservados.
8. O cadastro com uma pergunta obrigatória e as mudanças visuais de cadastro são da fase 2. A fase 1 não deve antecipar silenciosamente essa alteração.

Referências: [profissões oficiais](../02-dominios/profissoes-e-relacoes.md), [contas e permissões](tipos-de-conta-cadastro-e-permissoes.md), [administração](../02-dominios/administracao-seguranca-e-moderacao.md).

## 3. Matriz concreta proposta para os módulos existentes

**Proposta aguardando definição:** ampliar a criação de obras às oito profissões da área Música. Hoje a função `podeCriarObra` aceita apenas Rapper, MC, Beatmaker, Produtor(a) e DJ. Compositor(a), Letrista e Freestyleiro passariam a ser aceitos; essa ampliação ainda não foi autorizada como regra final.

| Ação existente | Consumidor | Profissional | Administrativo |
|---|---|---|---|
| Consultar conteúdo permitido | Sim, conforme visibilidade | Sim, conforme visibilidade | Não usar identidade administrativa para simular consumo/perfil artístico |
| Criar obra musical | Não | Proposta: qualquer uma das oito profissões de Música | Não |
| Criar beat | Não | Beatmaker | Não |
| Criar evento | Não | Organizador(a) de eventos | Não |
| Editar/excluir obra, beat ou evento próprio | Não | Proposta: preservar gestão de conteúdo legítimo já pertencente à conta, mesmo se retirar a profissão | Não por propriedade artística; futuras ações de moderação têm permissão própria |
| Declarar interesse em evento elegível | Sim | Sim | Não como participante artístico |
| Gerenciar interessados | Não | Responsável pelo evento | Somente eventual competência de moderação especificada separadamente |
| Editar o próprio perfil | Dados pessoais permitidos | Dados pessoais e atuação permitida | Identidade interna própria |
| Alterar permissões ou confirmar crédito em nome de terceiro | Não | Não | Somente ação administrativa específica quando prevista, nunca por autodeclaração |

Conta sem profissão ativa: o acesso à gestão de conteúdo prévio e o fluxo para selecionar nova profissão dependem da política de migração a seguir. Não converter automaticamente para consumidor nem conceder uma profissão substituta.

Publicações não musicais serão implementadas nos pacotes de mídia/publicação. Ter profissão visual, audiovisual ou de gestão não cria agora um endpoint fictício de galeria.

## 4. Tratamento proposto para profissões retiradas

**Aguardando definição do usuário:** conservar associação e respostas como histórico inativo; não converter para outra profissão. Se não restar profissão ativa, permitir escolher uma das 26, sem perder a conta ou trabalhos.

Profissões a deixar de oferecer: Muralista, Artista digital, Manager, Produtor(a) executivo(a), Crítico(a) musical, Social media, Educador(a), Pesquisador(a) cultural, Articulador(a) cultural e Diretor(a) audiovisual.

Fluxo proposto após a definição:

1. Capturar estado anterior do perfil e relações na transação de migração.
2. Normalizar os rótulos antigos equivalentes às profissões mantidas; Freestyler vira Freestyleiro. Não confundir renomeação com atribuição de outra profissão.
3. Desativar somente associações retiradas e preservar sua identificação original, respostas e datas no histórico.
4. Atualizar categorias ativas usadas por sessão, busca, perfil, validação e permissões.
5. Se a conta ficar sem profissão ativa, exibir uma orientação e liberar seleção de uma profissão válida sem penalizar o prazo por uma retirada feita pelo sistema.
6. Manter obras, créditos, eventos e beats com os mesmos proprietários e IDs; preservar controle de gerenciamento conforme matriz decidida.
7. Recalcular a associação de vertentes: MC/Freestyleiro sem Rapper deixam de ter associação profissional ativa, sem eliminar o histórico dessas escolhas.
8. Preservar decisões administrativas históricas. Sugestão ou aprovação antiga de categoria não pode, sozinha, reintroduzir uma profissão retirada ou uma 27ª opção neste catálogo.

O banco atual tem apenas Rapper, mas a migração precisa funcionar também para bases antigas com as profissões retiradas. A inexistência do caso no banco local não resolve a regra do produto.

## 5. Administração proposta e transição

**Aguardando definição do usuário:** contas administrativas próprias; primeiro Super Admin por comando local protegido; não converter contas profissionais automaticamente. A allowlist deixa de conceder poder após uma transição explícita.

| Papel | Competência prevista | Limites no primeiro pacote |
|---|---|---|
| Super Admin | Gestão de identidades/cargos administrativos, decisões globais de taxonomia e auditoria | Aprovação global precisa respeitar o catálogo canônico e suas regras de publicação; não atribuir profissão automaticamente ao solicitante |
| Moderador | Exceções individuais, triagem e solicitações dentro das competências existentes | Não aprova novas opções globais nem eleva seu próprio papel |
| Editor | Conteúdo educativo da Cypher Central | Não concede exceção profissional, não administra cargos; editor de artigos será entregue na fase da Central |

Sequência proposta:

1. Adicionar suporte persistente à natureza da conta e ao papel administrativo, com leitura compatível dos usuários existentes.
2. Preservar contas profissionais e seus dados. Organizador deixa de ser uma natureza separada no modelo-alvo: continua Profissional com a profissão correspondente, mediante migração.
3. Provisionar primeiro Super Admin por operação local explícita, com senha protegida, sem conta padrão nem credencial fixa. Não executar essa criação com credenciais inventadas.
4. Registrar criação, concessão/revogação de papel e autor da operação, sem senha/token nos logs.
5. Implementar login e navegação administrativos próprios; impedir acesso artístico/público com essa identidade e ocultar contas administrativas da busca.
6. Implementar criação/convite dos demais papéis por Super Admin, sem depender de edição cotidiana do SQLite.
7. Substituir as verificações por e-mail por verificações de identidade, papel, ação e recurso no servidor.
8. Somente retirar o mecanismo antigo quando houver caminho verificável de provisionamento e testes de acesso; registrar o procedimento de transição para outros ambientes.

Não há ainda modelos de artigos, denúncias gerais, selos ou remoção de mensagens. Não conceder acesso universal em nome de competências que só existirão em fases posteriores.

## 6. Alterações técnicas identificadas

| Local | Alteração necessária |
|---|---|
| `modeloPerfil.ts` | Um catálogo canônico de 26 profissões; listas derivadas; matriz explícita e rótulos normalizados |
| `modeloProfissionalPersistido.ts` | Elegibilidade de vertentes apenas para Rapper |
| `questionarioAtuacao.ts` | Questionários somente das profissões mantidas e novo identificador de Freestyleiro; manter quatro eixos até a fase 2 |
| `bancoDados.ts` | Migração versionada/transacional; natureza da conta, papéis, histórico e validação coerentes; preservar relações |
| `autenticacaoCypher.ts` | Autenticação compatível com a natureza da conta e fluxo interno separado |
| Controllers e middleware | Autorização por conta, papel, ação e propriedade; não confiar em `tipoConta`, categorias ou papel enviados pelo cliente |
| Busca e perfil público | Excluir administrativos e consumidores da descoberta profissional, inclusive por URL direta |
| Cadastro e edição atuais | Usar apenas o catálogo canônico e recusar envio manual das profissões retiradas |
| Gestão de propostas | Preservar histórico sem ativar automaticamente opções fora das 26 nesta versão |
| Testes e README | Atualizar expectativas da regra aprovada, adicionar migrações e negativas de autorização, manter regressões dos fluxos existentes |

Segurança a integrar ao pacote depois de fechados os fluxos: proteção de escrita contra requisições falsificadas, cookies compatíveis com a política escolhida e limites de tentativas de autenticação. Não tratar ocultação de botão ou a existência do middleware atual como proteção suficiente.

## 7. Verificação exigida antes de concluir

- Catálogo contém exatamente 26 profissões, distribuídas em 8/3/3/3/3/3/3.
- As dez retiradas e os rótulos antigos não entram por cadastro, edição, escrita direta no model ou aprovação que burle o catálogo.
- Freestyler migra em categorias, relações e respostas; identificadores do usuário permanecem iguais.
- Banco novo e cópia v20 migram corretamente; repetir bootstrap não duplica associações nem altera histórico.
- Contas com profissão mantida, profissão retirada, combinação das duas e nenhuma ativa seguem a política aprovada.
- MC/Freestyleiro sem Rapper não selecionam vertentes; histórico legítimo é preservado conforme migração.
- Consumidor não publica por URL/POST; categorias forjadas não concedem capacidades; administrativo não aparece como profissional.
- Super Admin, Moderador e Editor só executam as ações previstas; papel administrativo não nasce de cadastro público nem de profissão.
- Conteúdos prévios e sessões seguem o tratamento explícito da migração, sem troca de proprietário ou exposição de dados.
- Executar os testes existentes relevantes e novas verificações de migração/autorização; testar a aplicação compilada em cópia antes de migrar o banco de trabalho.

## 8. Ponto de retomada

Foram apresentadas ao usuário três perguntas: matriz de criação/gestão, histórico de profissões retiradas e transição administrativa. Prosseguir com a implementação dependente após as respostas. O backup e a especificação estão prontos; a etapa 1 ainda não está concluída.


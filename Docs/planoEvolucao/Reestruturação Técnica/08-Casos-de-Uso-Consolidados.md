# Casos de uso consolidados — Cypher

Este documento reorganiza os **18 casos de uso** do material fornecido. Trata-se de **especificação planejada**, não de auditoria do código atual; os rótulos “implementado” encontrados no arquivo de origem não foram revalidados.

## 1. Atores e fronteiras
- **Visitante:** pode iniciar cadastro e autenticação; acessa conteúdos públicos se a rota permitir.
- **Consumidor:** explora, segue profissionais, curte, comenta, salva, comunica-se e participa de eventos permitidos; não publica conteúdo profissional.
- **Profissional:** possui uma ou mais categorias e capacidades específicas, respeitando propriedade, crédito e privacidade.
- **Organizador / Beatmaker:** especializações profissionais com permissões previstas para eventos/beats, sujeitas à matriz final.
- **Administrador Geral, Moderador e Editor:** identidade interna e navegação administrativa própria.
- **Persistência:** infraestrutura interna, não um usuário externo com decisão autônoma.

## 2. Catálogo de casos

| Código | Objetivo | Ator principal |
|---|---|---|
| UC-01 | Entrar na Cypher | Visitante |
| UC-02 | Criar conta | Visitante |
| UC-03 | Alternar modalidade no cadastro | Visitante |
| UC-04 | Tornar-se Profissional | Consumidor autenticado |
| UC-05 | Gerenciar perfil e privacidade | Consumidor ou Profissional |
| UC-06 | Buscar e consultar profissional | Usuário autenticado; visitante se rota permitir |
| UC-07 | Cadastrar e gerenciar obras/créditos | Profissional elegível |
| UC-08 | Publicar e gerenciar beat | Beatmaker autorizado |
| UC-09 | Explorar eventos e demonstrar interesse | Consumidor ou Profissional |
| UC-10 | Administrar evento e participações | Organizador autorizado |
| UC-11 | Consultar e tratar notificações | Usuário autenticado |
| UC-12 | Consultar Cypher Central | Usuário; visitante se permitido |
| UC-13 | Propor profissão/gênero/vertente/tipo | Usuário autorizado |
| UC-14 | Revisar solicitações e exceções | Moderador ou Super Admin conforme matriz |
| UC-15 | Moderar denúncia | Moderador autorizado |
| UC-16 | Gerenciar artigos da Central | Editor autorizado |
| UC-17 | Administrar cargos e taxonomia | Administrador Geral |
| UC-18 | Encerrar a própria conta | Usuário autenticado |

## 3. Casos detalhados

### UC-01 — Entrar na Cypher
- **Ator:** Visitante.
- **Pré-condições:** Conta válida.
- **Fluxo principal:** Informar e-mail/senha; validar credenciais; criar sessão protegida; redirecionar à **Descoberta** ou à área administrativa conforme autorização.
- **Alternativas e falhas:** Credenciais inválidas, sessão expirada, bloqueio ou tentativa repetida: recusar e informar sem divulgar existência do e-mail.
- **Resultado:** Sessão válida; nenhuma permissão além da conta.

### UC-02 — Criar conta
- **Ator:** Visitante.
- **Pré-condições:** Não possuir conta com o mesmo e-mail/@.
- **Fluxo principal:** Selecionar Consumidor ou Profissional no mesmo cadastro; preencher identidade comum; para Profissional, selecionar categorias e tempo de atuação; validar servidor; persistir atomicamente.
- **Alternativas e falhas:** Campos inválidos, e-mail/@ duplicado, idade não elegível conforme política futura, falha de transação.
- **Resultado:** Uma conta real com identidade e visibilidade inicial do tipo escolhido.

### UC-03 — Alternar modalidade no cadastro
- **Ator:** Visitante.
- **Pré-condições:** Cadastro iniciado.
- **Fluxo principal:** Escolher **Profissional | Consumidor**; interface de duas faces com transição de cartão; manter dados comuns; mostrar apenas campos pertinentes.
- **Alternativas e falhas:** Alternância após escolhas profissionais: preservar em rascunho ou descartar com aviso conforme decisão; não criar contas parciais.
- **Resultado:** Um único fluxo de cadastro ativo.

### UC-04 — Tornar-se Profissional
- **Ator:** Consumidor autenticado.
- **Pré-condições:** Conta não bloqueada; ainda Consumidor.
- **Fluxo principal:** Acionar Tornar-me Profissional; receber explicação de irreversibilidade; selecionar profissões, resposta de atuação e vertente do Rapper quando aplicável; confirmar; atualizar a mesma conta.
- **Alternativas e falhas:** Cancelamento deixa conta Consumidor; profissão inválida ou falha mantém modalidade anterior.
- **Resultado:** Mesma identidade, @ e histórico; capacidades profissionais conforme matriz. **Sem reversão automática.**

### UC-05 — Gerenciar perfil e privacidade
- **Ator:** Consumidor ou Profissional.
- **Pré-condições:** Autenticado e titular da conta.
- **Fluxo principal:** Abrir Perfil/Editar perfil/Configurações; editar campos permitidos; validar servidor; persistir e atualizar exibição pública.
- **Alternativas e falhas:** Prazo de mudança de profissão: impedir e orientar pedido de exceção; campo privado não deve aparecer em busca; falha não confirma sucesso.
- **Resultado:** Dados atualizados com regras de privacidade (Consumidor privado; Profissional público por padrão).

### UC-06 — Buscar e consultar profissional
- **Ator:** Usuário autenticado; visitante se rota permitir.
- **Pré-condições:** Perfil consultado público/autorizado.
- **Fluxo principal:** Buscar por texto, profissão, @ e filtros; exibir resultados pertinentes; abrir perfil; mostrar só campos permitidos.
- **Alternativas e falhas:** Sem resultado, perfil privado/bloqueado ou handle inexistente: estado vazio/acesso negado; @ antigo redireciona quando disponível.
- **Resultado:** Consulta não expõe informações privadas nem contas administrativas/Consumidores como profissionais.

### UC-07 — Cadastrar e gerenciar obras/créditos
- **Ator:** Profissional elegível.
- **Pré-condições:** Autenticado; capacidade de obra; titularidade para edição.
- **Fluxo principal:** Abrir Publicar/Obras; preencher dados e participantes; validar gênero, direitos e créditos; salvar transação; exibir obra e ficha.
- **Alternativas e falhas:** Sem permissão, dados inválidos, crédito não confirmado ou falha da transação: não executar parcial; dono de outra obra não pode editar.
- **Resultado:** Registro único sem status de obra abolido; créditos associados, não necessariamente confirmados.

### UC-08 — Publicar e gerenciar beat
- **Ator:** Beatmaker autorizado.
- **Pré-condições:** Autenticado; permissão; próprio registro para edição.
- **Fluxo principal:** Informar título, BPM/tom/gênero/duração, descrição e ofertas quando aplicável; validar, persistir e exibir no Banco de Beats.
- **Alternativas e falhas:** Oferta inválida, outro titular, exclusividade conflitante ou falta de permissão: recusar.
- **Resultado:** Beat e ofertas persistidos; **não implica checkout, pagamento ou entrega de arquivo**.

### UC-09 — Explorar eventos e demonstrar interesse
- **Ator:** Consumidor ou Profissional.
- **Pré-condições:** Evento disponível.
- **Fluxo principal:** Abrir Eventos, filtrar Lista/Mapa, examinar ficha, salvar ou marcar Tenho interesse conforme regras.
- **Alternativas e falhas:** Interesse repetido não duplica; evento encerrado/inapto é recusado; local sem coordenada fica na lista.
- **Resultado:** Vínculo de interesse registrado sem provar inscrição ou presença.

### UC-10 — Administrar evento e participações
- **Ator:** Organizador autorizado.
- **Pré-condições:** Autenticado; titular do evento para gerir.
- **Fluxo principal:** Criar evento com data/local; validar; persistir; consultar interessados/inscritos; aprovar/rejeitar/cancelar transição autorizada.
- **Alternativas e falhas:** Sem permissão, outro organizador, inscrição inexistente ou transição ilegal: recusar.
- **Resultado:** Evento e estados de participação persistidos, com histórico pertinente.

### UC-11 — Consultar e tratar notificações
- **Ator:** Usuário autenticado.
- **Pré-condições:** Destinatário da notificação.
- **Fluxo principal:** Abrir sino ou histórico; ler e marcar lida/não lida; excluir uma ou limpar caixa expressamente.
- **Alternativas e falhas:** Notificação de outro usuário, link indisponível ou envio duplicado não pode revelar ou alterar registro de terceiro.
- **Resultado:** Notificações persistem até exclusão explícita; ler não é apagar.

### UC-12 — Consultar Cypher Central
- **Ator:** Usuário; visitante se permitido.
- **Pré-condições:** Artigo publicado/visível.
- **Fluxo principal:** Pesquisar guias por função, relações e uso da plataforma; abrir artigo; avaliar utilidade quando permitido.
- **Alternativas e falhas:** Busca sem resultado mostra orientação e pode gerar métrica; material arquivado não aparece como publicado.
- **Resultado:** Orientação acessada; feedback pode alimentar qualidade educativa.

### UC-13 — Propor profissão/gênero/vertente/tipo
- **Ator:** Usuário autorizado.
- **Pré-condições:** Opção não está no catálogo atual.
- **Fluxo principal:** Acionar Falar com a Cypher ou Sugerir opção; registrar proposta e justificativa; encaminhar à administração.
- **Alternativas e falhas:** Valor inválido/duplicado ou solicitação sem autorização: rejeitar; proposta recusada não vira categoria ativa.
- **Resultado:** Solicitação persistida; **não** cria opção global imediatamente.

### UC-14 — Revisar solicitações e exceções
- **Ator:** Moderador ou Super Admin conforme matriz.
- **Pré-condições:** Há demanda e permissão apropriada.
- **Fluxo principal:** Abrir fila, consultar justificativa, aprovar/rejeitar ou pedir esclarecimento; salvar decisão e auditoria.
- **Alternativas e falhas:** Requisição inexistente, sem competência, sem justificativa ou repetida: não aplicar alteração indevida.
- **Resultado:** Estado e resposta persistidos; nova profissão global só por autoridade própria.

### UC-15 — Moderar denúncia
- **Ator:** Moderador autorizado.
- **Pré-condições:** Denúncia registrada e evidências acessíveis.
- **Fluxo principal:** Revisar objeto e motivo; decidir manter, restringir, ocultar ou escalar segundo política; registrar justificativa e comunicar conforme regra.
- **Alternativas e falhas:** Evidência insuficiente, conflito de interesse ou recurso requer fluxo definido.
- **Resultado:** Ação proporcional e auditável; políticas de denúncia e desbloqueio ainda pendentes.

### UC-16 — Gerenciar artigos da Central
- **Ator:** Editor autorizado.
- **Pré-condições:** Área editorial disponível.
- **Fluxo principal:** Criar/revisar artigo, categorizar, salvar, publicar/arquivar; atualizar artigos recentes e métricas da Central.
- **Alternativas e falhas:** Artigo inválido, permissão insuficiente, conflito de versão ou tentativa de editar de outro setor: recusar.
- **Resultado:** Versão e visibilidade editorial persistidas; não confundir rascunho de **artigo** com status abolido de **obra musical**.

### UC-17 — Administrar cargos e taxonomia
- **Ator:** Administrador Geral.
- **Pré-condições:** Sessão administrativa autorizada.
- **Fluxo principal:** Gerenciar convites/papéis; analisar inclusão global de categorias; confirmar decisão e registrar log.
- **Alternativas e falhas:** Autoelevação, falta de justificativa, sessão expirada ou alteração concorrente devem ser bloqueadas conforme política.
- **Resultado:** Permissões e catálogo global atualizados de modo rastreável.

### UC-18 — Encerrar a própria conta
- **Ator:** Usuário autenticado.
- **Pré-condições:** Sessão válida; requisitos de encerramento atendidos.
- **Fluxo principal:** Solicitar encerramento em Configurações; confirmar senha e ação; validar dependências; encerrar sessão e conta de forma controlada.
- **Alternativas e falhas:** Senha/confirmação incorreta ou obras/itens dependentes bloqueiam exclusão até resolução permitida.
- **Resultado:** Conta não pode entrar; efeitos de retenção seguem política de integridade e privacidade.

## 4. Regras transversais
1. Cadastro público oferece **somente Consumidor ou Profissional**; administração é interna.
2. Catálogo de **26 profissões**, com profissões retiradas tratadas por migração; gênero musical do perfil não restringe a obra.
3. **Obras não possuem mais status Rascunho/Em produção/Lançado**; estados de artigo, evento, pedido e crédito continuam independentes.
4. Operações de escrita exigem autorização no servidor, titularidade e validação. Ações que alterem vários registros devem ser transacionais.
5. Créditos de terceiros não são confirmados automaticamente; interações sociais não equivalem a reputação.
6. Profissional público por padrão, Consumidor privado por padrão; data de nascimento e nome ocultado por vulgo não são públicos.
7. Consumidor → Profissional na mesma conta, **irreversível** pela especificação específica de Consumidor.
8. Mudança de profissões após primeira atualização livre segue **60 dias**; mudança do @ sugere **30 dias** ainda não confirmado.
9. Métricas e notificações devem ter origem real e persistente; links respeitam visibilidade.

## 5. Pendências anteriores à implementação
- Definir idade mínima, regras para menores, confirmação de e-mail e experiência de login/cadastro.
- Fechar matriz profissão × capacidade, definição de colaborador autorizado e estados de crédito.
- Definir denúncia, moderação, retenção, recurso, exclusão/bloqueio e papéis administrativos específicos.
- Definir políticas de upload, mapas, frequência/e-mail dos lembretes, comentários e exclusão de mensagens.
- Validar código atual para classificar cada UC como **implementado / parcial / não iniciado / stand-by** com evidências.

## 6. Relação com as demais especificações
Cada caso resume o **objetivo do ator**; os detalhes de apresentação estão nos arquivos da pasta Visual e as regras, persistência e dependências nos arquivos Técnicos e Relacionais. Essa separação evita manter duas versões integrais de uma mesma regra.

## 7. Evidências e rotas citadas no caso de uso original — conferir no código
Os materiais anteriores citam as rotas e arquivos abaixo como evidência de funcionamento parcial. **Este ZIP não prova que continuam existentes ou com o comportamento descrito.**
- Autenticação: `/login`, `/register`, `/register/validate`; `src/app/routes/rotasCypher.ts`, `src/app/controllers/controladorAutenticacao.ts` e `src/app/models/autenticacaoCypher.ts`.
- Perfil/privacidade: `/profile`, `/profile/secoes/:secao`, `/profile/categorias/sugerir`, `/profile/categorias/solicitar-excecao`, `/settings/privacy`.
- Busca e perfil público: `/search`, `/p/:identificador`.
- Obras: `/works`, `/works/new`, `/works/:id/edit`, `/works/:id/delete`; `src/app/controllers/controladorObras.ts`.
- Beats/eventos: `/beats`, `/beats/new`, `/events`, `/events/new`.
- Outros: `/notificacoes`, `/central`, `/admin/revisao`, `/settings`.
- Comportamento alegado no documento original: senha protegida por **scrypt com salt**, token de sessão aleatório com **hash persistido**, cookie de sessão; o UC-18 descreve exclusão com **senha e confirmação literal**, bloqueada quando há dependências.
- **A conferir:** código atual, rota de acesso administrativo, controle de sessões, CSRF, limite de tentativas e inexistência de demonstrações indevidamente expostas.

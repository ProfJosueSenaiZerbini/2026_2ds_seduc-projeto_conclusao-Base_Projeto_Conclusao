# Administração, autorização e moderação

## 1. Identidade administrativa
1.1. Conta administrativa **não é Profissional**, não possui perfil artístico público e não aparece em Busca, recomendações, portfólio ou métricas profissionais.
1.2. Não é criada pelo cadastro comum. Usar rota protegida (ex.: `/admin/login`, sujeita à estrutura efetiva do projeto), sessão/autorização no servidor e **navegação administrativa própria**.
1.3. Provisionar a **primeira conta** por procedimento inicial controlado; novos administradores via convite/criação autorizada e auditada. Não guardar senha em claro nem depender de edição manual cotidiana do SQLite.

## 2. Papéis administrativos previstos
2.1. **Administrador Geral (Super Admin):** gerencia convites/cargos administrativos, aprova nova profissão/gênero/vertente no catálogo global, configura regras globais e audita decisões.
2.2. **Moderador:** denúncias, spam, perfis falsos, triagem de contato e pedidos de alteração antecipada de profissão (60 dias) ou exceção do `@`.
2.3. **Editor (Gestor de Conteúdo):** criar, editar, revisar, publicar e arquivar artigos da Cypher Central, organizar categorias e consultar qualidade educativa.
2.4. Ainda é necessária uma **matriz RBAC detalhada** para remoções, eventos, comentários, mídia, selos, solicitações e delegação. Uma pessoa não deve ganhar poder apenas porque apareceu um item de menu.
2.5. Separar aprovação de opção **global** do catálogo de decisão **individual** (exceção de prazo, recurso/denúncia).

## 3. Solicitações e decisões
3.1. Fila administrativa para propostas de profissões/gêneros/vertentes/tipos, exceções, dúvidas, denúncias e suporte.
3.2. Cada solicitação precisa de **solicitante, objeto, categoria, justificativa, data, estado, revisor, decisão/resposta e histórico**.
3.3. Aprovação não deve aplicar alterações alheias ao objeto da decisão nem executar em duplicidade por clique repetido.
3.4. Notificar o solicitante sem compartilhar evidências privadas de outras pessoas.

## 4. Moderação
4.1. Receber denúncias de **perfis, obras, beats, eventos, comentários, imagens, selos, mensagens/comportamentos**; registrar motivo e evidências de modo adequado.
4.2. Distinguir **ocultar publicação, remover vínculo indevido, advertir, restringir contato, bloquear conta, excluir definitivamente**. Cada ação tem alcance e regras diferentes.
4.3. Não permitir que autor de conteúdo apague comentários de terceiros sem política de moderação; autor do comentário pode editar/excluir os próprios conforme regras.
4.4. **Ainda pendente:** categorias de denúncia, critérios de gravidade, acesso a mensagens privadas, retenção, desbloqueio, prazo de análise, comunicação e recurso da decisão. Nenhuma solução automática deve ser inventada.

## 5. Auditoria e segurança
5.1. Registrar concessões/revogações de papel, mudanças de taxonomia, exceções dos 30/60 dias, decisões de moderação, publicação editorial e ajustes de crédito sensíveis.
5.2. Logs devem conter **quem, quando, o quê, objeto, decisão e justificativa**, sem expor senha, token ou dados pessoais desnecessários.
5.3. Autorização por rota/ação e por recurso, com proteção contra sessões inválidas, requisições falsificadas e tentativas repetidas. A política final de CSRF, limitação de login e recuperação de senha deve ser validada com o código atual.
5.4. Uma conta não deve aprovar sua própria solicitação/autoelevação sem regra expressa de controle; conflitos de revisão não podem sobrescrever silenciosamente decisão anterior.

## 6. Aceite
6.1. Acesso negado a pessoa sem cargo; ações permitidas apenas para papel correto; registro de auditoria e resposta verificáveis.
6.2. Testar dupla aprovação, denúncia de item inexistente, revisão concorrente, exceção individual versus taxonomia global, recurso e proteção de dados.

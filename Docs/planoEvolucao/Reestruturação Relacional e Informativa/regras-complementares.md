# Cypher — Regras Complementares de Funcionamento

## 1. Idade mínima permitida

Estabelecer **16 anos como idade mínima proposta** para criar uma conta Consumidor ou Profissional.

- Menores de 16 anos não poderão concluir o cadastro.
- Usuários de 16 anos deverão possuir vinculação válida com responsável legal, conforme as exigências aplicáveis.
- Usuários de 17 anos poderão se cadastrar, mantendo as proteções destinadas a adolescentes.
- A partir dos 18 anos, aplicam-se as regras gerais para adultos.
- A idade será calculada pela data de nascimento, utilizando a data completa registrada no banco de dados.
- Impedir datas futuras, inválidas e alterações arbitrárias da data de nascimento.

A data de nascimento será privada. Outros usuários não deverão visualizar a idade exata, a menos que futuramente exista uma funcionalidade específica, opcional e compatível com as regras de privacidade.

**Atenção:** o cadastro de menores somente poderá ser disponibilizado quando os mecanismos de aferição de idade, supervisão e demais proteções legais estiverem efetivamente implementados. Caso isso não seja viável inicialmente, restringir provisoriamente o cadastro a maiores de 18 anos.

## 2. Proteção de menores de idade

Contas pertencentes a usuários de 16 e 17 anos terão configurações de segurança mais restritivas.

- Perfil privado por padrão para contas Consumidor.
- Não divulgar data de nascimento, endereço, localização precisa ou informações de contato pessoais.
- Impedir mensagens diretas não solicitadas de adultos desconhecidos, utilizando solicitações de contato e restrições de comunicação.
- Disponibilizar mecanismos acessíveis de denúncia e bloqueio.
- Restringir conteúdos e eventos incompatíveis com a idade.
- Não utilizar publicidade comportamental ou personalização baseada em perfilamento de menores quando vedado pela legislação.
- Aplicar as proteções de privacidade e supervisão parental exigíveis, inclusive os controles apropriados para responsáveis legais.
- Disponibilizar tratamento prioritário para denúncias envolvendo ameaças, assédio, aliciamento ou exploração de menores.

As proteções devem continuar funcionando após uma conversão de Consumidor para Profissional. Tornar-se profissional não elimina as restrições relacionadas à idade.

## 3. Confirmação de e-mail

Toda conta deverá possuir um endereço de e-mail confirmado.

### 3.1. Cadastro

Após o preenchimento do formulário, enviar um e-mail contendo um link de confirmação temporário.

O link deverá:

- Possuir token aleatório e individual, armazenado de forma protegida.
- Expirar após 30 minutos.
- Tornar-se inválido imediatamente após a utilização.
- Permitir solicitar um novo envio, com limite de frequência.

Enquanto o e-mail não for confirmado, a conta permanecerá pendente, sem autorização para interações, publicações ou mensagens.

### 3.2. Alteração de e-mail

Quando o usuário solicitar a alteração do endereço, enviar uma confirmação para o novo e-mail.

O endereço anterior continuará vinculado à conta até que a alteração seja validada.

Enviar também um aviso de segurança ao e-mail antigo, quando possível.

### 3.3. Persistência

Registrar o estado de confirmação e sua data no banco de dados.

Não considerar um e-mail confirmado apenas porque o usuário conseguiu realizar o login.

---

## 4. Sistema de mensagens

### 4.1. Funcionamento

Implementar conversas privadas e persistentes, inicialmente entre dois usuários.

O sistema deverá permitir:

- Iniciar conversa com usuários que aceitem contato.
- Enviar e receber mensagens de texto.
- Visualizar histórico em ordem cronológica.
- Identificar mensagens enviadas e recebidas.
- Marcar mensagens como lidas.
- Exibir quantidade de mensagens não lidas.
- Arquivar ou ocultar conversas da própria caixa de entrada.
- Bloquear contatos indesejados.

As permissões de contato deverão considerar o tipo de conta, a idade, as preferências de privacidade e eventuais bloqueios.

### 4.2. Estrutura técnica

Utilizar o banco SQLite existente, com estruturas equivalentes a:

- `conversas`: identificação e criação da conversa.
- `participantes_conversa`: associação dos usuários, estado de leitura e arquivamento individual.
- `mensagens`: conversa, remetente, conteúdo e datas de envio, edição ou exclusão.

O histórico deverá ser recuperado do banco, com paginação.

Para o estágio atual da Cypher, a atualização periódica enquanto uma conversa estiver aberta é suficiente. Não é necessário introduzir WebSockets inicialmente.

### 4.3. Exclusão

Distinguir duas ações:

- **Ocultar conversa:** remove a conversa somente da caixa do usuário, sem apagar o histórico do outro participante.
- **Excluir mensagem enviada:** torna a mensagem indisponível conforme as regras de exclusão, sem modificar mensagens de terceiros.

Prever limites de tamanho e frequência de envio, validação no servidor e proteção contra conteúdo malicioso.

As conversas privadas não deverão ficar acessíveis aos administradores por navegação comum. O acesso excepcional a evidências denunciadas deve ser restrito, justificado e registrado.

---

## 5. Categorias de denúncia

Disponibilizar denúncias para perfis, obras, beats, eventos, comentários e mensagens.

O formulário deverá oferecer as seguintes categorias:

1. **Assédio ou intimidação:** perseguição, ameaças e comportamento abusivo.
2. **Discriminação ou discurso de ódio:** ataques a pessoas ou grupos protegidos.
3. **Spam ou fraude:** divulgação abusiva, golpes e tentativas de enganar usuários.
4. **Falsidade de identidade:** contas que se passam por outras pessoas ou organizações.
5. **Plágio ou violação de direitos autorais:** utilização não autorizada de obras ou materiais.
6. **Conteúdo inadequado:** material incompatível com as regras da plataforma ou a faixa etária.
7. **Exploração ou risco a menores:** conteúdo ou comportamento que coloque crianças e adolescentes em risco.
8. **Informações falsas sobre eventos ou serviços:** divulgação deliberadamente enganosa.
9. **Outro motivo:** acompanhado de justificativa.

Permitir acrescentar uma descrição e, quando pertinente, anexar evidências.

As denúncias serão privadas e não poderão ser visualizadas pelo usuário denunciado com identificação do denunciante.

---

## 6. Análise das denúncias

Toda denúncia deverá gerar um registro persistente para análise administrativa.

### 6.1. Estados

- `pendente`: recebida e aguardando análise.
- `em_analise`: sendo avaliada pela administração.
- `resolvida`: análise concluída com decisão registrada.
- `arquivada`: denúncia encerrada sem necessidade de intervenção.

### 6.2. Procedimento

O administrador responsável deverá conseguir:

- Consultar o conteúdo denunciado e as evidências pertinentes.
- Identificar o motivo e o histórico relacionado.
- Verificar eventual reincidência.
- Registrar sua decisão e justificativa.
- Aplicar medidas proporcionais à infração.

As medidas poderão incluir advertência, remoção de conteúdo, restrição de funcionalidades e suspensão de conta.

**A quantidade de denúncias, isoladamente, não deverá causar punição automática.**

Denúncias graves, principalmente envolvendo exploração de menores ou ameaças concretas, deverão receber tratamento prioritário e encaminhamento às autoridades competentes quando necessário.

Prever possibilidade de contestação de medidas aplicadas e registro administrativo das decisões.

---

## 7. Bloqueio e desbloqueio de usuários

### 7.1. Bloqueio

Qualquer usuário poderá bloquear outra conta.

O bloqueio deverá:

- Impedir novas mensagens entre as contas.
- Encerrar relações de acompanhamento existentes entre elas.
- Impedir novas solicitações de contato.
- Impedir interações direcionadas ao usuário bloqueador, conforme a funcionalidade.
- Ocultar ou reduzir a exposição recíproca de contas nas áreas autenticadas.
- Não enviar notificação informando explicitamente o bloqueio.

O bloqueio não necessariamente impede a visualização de conteúdos disponíveis publicamente por acesso anônimo. Essa limitação deve ser considerada na implementação.

### 7.2. Desbloqueio

O usuário poderá consultar a lista de contas bloqueadas nas configurações e remover bloqueios.

O desbloqueio não deverá restaurar automaticamente seguidores, conversas arquivadas ou permissões anteriormente removidas.

### 7.3. Persistência

Registrar no banco o usuário responsável pelo bloqueio, a conta bloqueada e a data.

Impedir registros duplicados e bloquear também as interações por acesso direto às rotas do servidor.

---

## 8. Critérios de recomendações

A página de Descoberta deverá recomendar conteúdos de maneira contextualizada, sem exigir a construção imediata de um algoritmo complexo.

### 8.1. Critérios

Considerar:

- **Gêneros de interesse:** preferências informadas pelo usuário.
- **Profissionais seguidos:** obras e eventos relacionados aos perfis acompanhados.
- **Localização aproximada:** eventos e profissionais da região, somente quando a localização for disponibilizada voluntariamente.
- **Atualidade:** publicações e eventos recentes ou próximos de acontecer.
- **Popularidade:** interações legítimas recebidas pelos conteúdos.
- **Diversidade:** inserção de novos artistas e obras que não pertençam exclusivamente aos interesses já registrados.

### 8.2. Comportamento

As recomendações não deverão impedir o acesso a outros gêneros, profissionais ou localidades.

Usuários recém-cadastrados poderão receber conteúdos recentes, destaques da comunidade e sugestões gerais.

Evitar que apenas contas populares recebam visibilidade, reservando espaço para profissionais emergentes.

### 8.3. Implementação

Inicialmente, utilizar consultas e ordenações no SQLite, com critérios simples e verificáveis.

Não implementar inteligência artificial ou mecanismos sofisticados de rastreamento comportamental sem uma necessidade concreta.

Para menores, restringir a personalização aos mecanismos compatíveis com as proteções legais e preferências autorizadas.

---

## 9. Curtidas, comentários e salvamentos

### 9.1. Curtidas

Permitir que usuários curtam perfis profissionais e conteúdos compatíveis com a funcionalidade.

Cada usuário poderá manter apenas uma curtida ativa por item.

Ao clicar novamente, a curtida será removida.

Registrar no banco:

- Usuário responsável.
- Tipo e identificador do item.
- Data da interação.

A combinação de usuário e item deverá ser única.

### 9.2. Comentários

Cada comentário deverá registrar:

- Autor.
- Conteúdo comentado.
- Texto.
- Data de criação.
- Data de edição, quando existente.
- Estado de moderação.

Permitir editar e excluir somente os próprios comentários, salvo ações administrativas autorizadas.

Os comentários deverão ser persistentes, carregados de maneira paginada e protegidos contra inserção de scripts maliciosos e spam.

### 9.3. Salvamentos

Permitir salvar obras, beats, eventos e perfis profissionais em uma área privada.

Cada registro deverá relacionar usuário, item e data de salvamento, impedindo duplicações.

A remoção de um item salvo não deverá excluir o conteúdo original.

### 9.4. Banco de dados

Utilizar estruturas equivalentes a `curtidas`, `comentarios` e `salvos`, preservando a arquitetura existente.

Quando utilizar referências genéricas por tipo e identificador, validar a existência e a permissão sobre o conteúdo no servidor, pois essas referências não possuem automaticamente a proteção de uma chave estrangeira convencional.

Excluir ou invalidar interações órfãs quando seus conteúdos forem definitivamente removidos.

---

## 10. Inscrição em eventos

Distinguir três ações:

- **Salvar:** guardar o evento na coleção pessoal.
- **Tenho interesse:** manifestar interesse e acompanhar o evento.
- **Inscrever-se:** solicitar ou registrar participação, quando permitida.

### 10.1. Modalidades

O organizador poderá definir:

- `aberta`: inscrições elegíveis são aceitas automaticamente.
- `aprovacao`: inscrições dependem de avaliação do organizador.

Também deverá determinar se o evento aceita o público geral, profissionais específicos ou ambos.

### 10.2. Estados

Preservar os estados de participação já previstos na Cypher:

- `interessado`
- `inscrito`
- `confirmado`
- `rejeitado`
- `cancelado`

Esses estados deverão refletir ações reais, sem confundir interesse com confirmação de presença.

### 10.3. Regras

- Não permitir inscrições duplicadas.
- Respeitar limite de vagas quando houver.
- Impedir inscrições encerradas ou incompatíveis com o perfil do usuário.
- Permitir cancelamento pelo participante.
- Permitir análise das solicitações pelo organizador.
- Registrar alterações de estado e notificar os envolvidos.

Um Consumidor poderá participar de eventos abertos ao público, mas não assumir funções profissionais reservadas a categorias específicas.

---

## 11. Lembretes de eventos

Eventos acompanhados poderão gerar lembretes automáticos.

### 11.1. Programação

Adotar inicialmente:

- **24 horas antes:** lembrete de proximidade do evento.
- **No dia:** lembrete de realização, em horário adequado à programação.

A data, o horário e o fuso do evento deverão ser considerados corretamente.

### 11.2. Funcionamento

Os lembretes deverão:

- Ser registrados e agendados de forma persistente.
- Respeitar as preferências do usuário.
- Não ser enviados em duplicidade.
- Ser atualizados quando a programação mudar.
- Ser cancelados quando o evento for cancelado ou quando a condição que justificava o lembrete deixar de existir.

### 11.3. Implementação

Utilizar uma rotina agendada no servidor, consultando os lembretes pendentes no SQLite.

O agendamento não deverá depender de o usuário permanecer com a página aberta.

Para a fase inicial, priorizar notificações internas. O envio por e-mail poderá ser incorporado posteriormente.

---

## 12. Política de retenção das notificações

As notificações deverão ser persistentes e permanecer na conta até uma ação explícita do usuário, respeitadas as necessidades legais de retenção e exclusão.

### 12.1. Comportamento

Permitir:

- Visualizar notificações recebidas.
- Marcar uma notificação como lida.
- Marcar todas como lidas.
- Excluir uma notificação.
- Limpar a caixa de notificações.
- Configurar quais categorias deseja receber.

**Ler uma notificação não deverá apagá-la automaticamente.**

### 12.2. Persistência

Cada notificação deverá registrar:

- Usuário destinatário.
- Tipo.
- Conteúdo ou referência ao fato ocorrido.
- Data de criação.
- Estado de leitura.
- Data de leitura, quando aplicável.
- Estado ou data de exclusão, quando aplicável.

Evitar duplicações para o mesmo acontecimento.

### 12.3. Exclusão

A exclusão da caixa poderá ser inicialmente lógica, seguida de remoção física conforme uma rotina de limpeza definida.

Notificações associadas a conteúdos removidos não deverão expor informações que já não possam ser acessadas.

A exclusão da conta deverá observar as regras de eliminação ou retenção legal dos dados relacionados.

---

## 13. Identificador público `@`

### 13.1. Criação

Cada conta, seja Consumidor ou Profissional, deverá possuir um identificador único.

Adotar:

- Entre 3 e 24 caracteres.
- Letras sem acentos, números, `_` e `.`.
- Comparação sem diferenciação entre maiúsculas e minúsculas.
- Proibição de espaços e caracteres especiais não permitidos.
- Proibição de identificadores reservados para funções administrativas ou institucionais.

O identificador deverá ser diferente do nome público e do vulgo.

### 13.2. Disponibilidade

Ao digitar o identificador, informar visualmente se está disponível.

A verificação em tempo real deverá ser complementada por validação definitiva no servidor e restrição de unicidade no banco de dados.

Não permitir que duas contas obtenham o mesmo identificador por solicitações simultâneas.

### 13.3. Alteração

Permitir alterar o identificador uma vez a cada **30 dias**, conforme a regra anteriormente estabelecida para a Cypher.

Exibir a próxima data em que uma nova alteração será permitida.

A alteração deverá atualizar o identificador principal sem modificar a identidade interna da conta.

### 13.4. Identificadores antigos

Quando houver alteração:

- Reservar o identificador anterior para impedir sua apropriação por outra conta enquanto a reserva permanecer válida.
- Preservar os vínculos internos da conta.
- Redirecionar links antigos para o identificador atual, respeitando as regras de privacidade.
- Não perder obras, comentários, seguidores, mensagens ou demais associações.

### 13.5. Privacidade

O identificador poderá aparecer em comentários e outras interações públicas.

Para contas Consumidor, sua existência não deverá tornar automaticamente o perfil pessoal pesquisável ou público.

O nome verdadeiro continuará privado quando houver preferência por utilizar o vulgo como nome público.
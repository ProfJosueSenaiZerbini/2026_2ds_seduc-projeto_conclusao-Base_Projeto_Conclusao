# PROMPT — Reestruturação das categorias profissionais e vertentes artísticas da Cypher

## 1. Objetivo

Implementar uma nova organização das categorias profissionais da Cypher, tanto na etapa de cadastro quanto na edição de perfil e em qualquer outra área do sistema que utilize, consulte ou apresente essas informações.

A proposta é organizar as profissões por **grupos de atuação**, permitindo que o usuário selecione uma ou várias áreas e, dentro delas, suas respectivas funções.

Além disso, determinadas funções relacionadas à interpretação e execução vocal de rap deverão permitir a seleção de vertentes e estilos musicais nos quais o profissional atua.

O objetivo é tornar a identificação profissional mais intuitiva, organizada e coerente com a proposta da Cypher, evitando listas extensas e excesso de informações na interface.

## 2. Nova organização das categorias

Implementar os seguintes grupos e suas respectivas funções:

### 2.1. Música
- Rapper
- MC
- Compositor(a)
- Letrista
- Beatmaker
- Produtor(a)
- DJ
- Freestyler

### 2.2. Dança
- B-boy / B-girl
- Dançarino(a)
- Coreógrafo(a)

### 2.3. Artes visuais
- Grafiteiro(a)
- Ilustrador(a)
- Designer gráfico
- Muralista
- Artista digital

### 2.4. Audiovisual
- Fotógrafo(a)
- Videomaker
- Diretor(a) audiovisual
- Editor(a) de vídeo

### 2.5. Produção técnica
- Engenheiro(a) de áudio
- Mixador(a)
- Masterizador(a)

### 2.6. Gestão e produção
- Empresário(a)
- Manager
- Produtor(a) cultural
- Produtor(a) executivo(a)
- Organizador(a) de eventos

### 2.7. Comunicação e cultura
- Criador(a) de conteúdo
- Jornalista cultural
- Podcaster
- Crítico(a) musical
- Social media
- Educador(a)
- Pesquisador(a) cultural
- Articulador(a) cultural

**Importante:** preservar exatamente essa estrutura como ponto de partida. Não adicionar novas profissões, grupos ou funcionalidades fora do escopo sem necessidade técnica devidamente justificada.

## 3. Seleção de vertentes e estilos musicais

Nas funções que envolvem diretamente interpretação vocal, rimas e execução de rap, implementar uma seleção complementar de vertentes musicais.

Inicialmente, essa funcionalidade deverá contemplar:

- Rapper
- MC
- Freestyler

A intenção é permitir que o profissional identifique os estilos nos quais atua, sem obrigá-lo a selecionar apenas uma vertente.

Utilizar a seguinte relação de estilos:

1. Boom bap
2. Gangsta rap
3. G-Funk
4. R&B
5. Gospel
6. Jazz rap
7. Trap
8. Grime
9. Drill
10. Plug
11. PluggnB
12. Rage
13. Melodic rap
14. Detroit rap
15. Jersey Club Rap
16. Trap soul

A seleção deverá aceitar múltiplas opções.

**Comportamento esperado:**
- Ao selecionar Rapper, disponibilizar a seleção de vertentes.
- Ao selecionar MC, disponibilizar a mesma possibilidade.
- Ao selecionar Freestyler, disponibilizar a mesma possibilidade.
- Caso o usuário selecione mais de uma dessas funções, evitar duplicar os mesmos campos ou informações desnecessariamente.
- Se uma função que oferece seleção de vertentes for desmarcada, preservar as seleções caso outra função ainda selecionada também utilize esse campo.
- Se nenhuma função compatível permanecer selecionada, tratar adequadamente as informações de vertentes, sem deixar dados inconsistentes.

Não disponibilizar essa seleção indiscriminadamente para todas as profissões. Ela deve estar associada às funções que efetivamente envolvem interpretação e execução de rap.

## 4. Experiência de seleção e organização visual

A organização por grupos deve ser aplicada tanto no cadastro quanto na edição de perfil.

A interface deverá seguir a seguinte lógica:

1. Apresentar os grupos de atuação de maneira organizada.
2. Permitir que o usuário expanda um grupo para visualizar suas funções.
3. Permitir selecionar individualmente as funções desejadas.
4. Permitir selecionar funções de diferentes grupos simultaneamente.
5. Ao selecionar uma função compatível, apresentar a seleção complementar de vertentes musicais.

A intenção é evitar que todas as profissões fiquem expostas simultaneamente na tela.

Priorizar uma interface limpa, intuitiva e consistente com a identidade visual atual da Cypher.

Não transformar a seleção em um formulário excessivamente longo ou visualmente carregado.

## 5. Cadastro e edição de perfil

A nova estrutura deverá funcionar de maneira consistente em:

- Cadastro de novos usuários.
- Edição das categorias profissionais.
- Visualização das informações no perfil público.
- Visualização das informações no perfil do próprio usuário.
- Portfólio e demais áreas que utilizem categorias profissionais.
- Busca e filtros, caso utilizem essas informações.
- Qualquer outro componente, controller ou serviço que dependa da estrutura anterior.

É indispensável garantir que as informações selecionadas no cadastro sejam corretamente persistidas e posteriormente recuperadas na edição e visualização do perfil.

A edição deverá carregar as seleções anteriormente realizadas, incluindo as vertentes musicais.

## 6. Persistência e compatibilidade

Antes de implementar, analisar como as categorias profissionais são atualmente armazenadas, processadas e utilizadas no projeto.

Verificar especialmente:

- Modelagem e estrutura do banco SQLite.
- Controllers responsáveis pelo cadastro e edição.
- Models e serviços relacionados aos perfis.
- Validações existentes.
- Estrutura de dados enviada pelas views.
- JavaScript responsável pela interação dos formulários.
- Componentes que exibem ou consomem as categorias.

A nova estrutura deverá ser compatível com a persistência atual.

Não criar apenas uma alteração visual: todas as seleções precisam funcionar de verdade, ser validadas no servidor, persistidas no banco e recuperadas corretamente.

Caso seja necessária uma migração do banco, implementá-la respeitando o mecanismo de versionamento já existente e preservando os dados dos usuários atuais.

Não descartar categorias ou informações anteriormente cadastradas sem uma estratégia de compatibilidade.

## 7. Regras e cuidados técnicos

- Não confundir categorias profissionais com cargos administrativos ou permissões da plataforma.
- A seleção de uma profissão não deverá conceder automaticamente permissões funcionais que não estejam previstas nas regras atuais da Cypher.
- Manter a possibilidade de selecionar múltiplas profissões.
- Evitar duplicidade de informações.
- Garantir validação no servidor, não apenas na interface.
- Impedir inconsistências entre funções selecionadas e suas respectivas vertentes.
- Manter compatibilidade com os dados já existentes.

## 8. Responsividade e identidade visual

Toda a implementação deverá respeitar a identidade visual atual da Cypher.

Garantir funcionamento adequado em:
- Desktop.
- Tablets.
- Dispositivos móveis.

A interface deverá funcionar corretamente nos temas claro e escuro, respeitando os padrões de estilização já existentes.

Evitar introduzir componentes visuais que destoem do restante da aplicação.

## 9. Diretrizes de implementação

Antes de realizar qualquer alteração:

1. Analisar como o sistema atual implementa categorias profissionais.
2. Identificar todos os locais que dependem dessa estrutura.
3. Verificar possíveis impactos sobre cadastro, edição, visualização, busca e persistência.
4. Planejar a implementação respeitando a arquitetura existente.

Preservar integralmente a stack atual:

- Node.js
- TypeScript
- Express
- EJS
- SQLite
- JavaScript vanilla

Manter o padrão MVC simples já adotado no projeto.

Não reestruturar pastas, substituir tecnologias, introduzir dependências desnecessárias ou implementar complexidades que não sejam pertinentes ao escopo.

Caso alguma alteração estrutural mais complexa seja necessária, justificar antes de executá-la.

## 10. Critérios de conclusão

A implementação somente deverá ser considerada concluída quando:

- Os grupos e respectivas funções estiverem organizados no cadastro.
- O usuário conseguir selecionar funções de diferentes grupos.
- Rapper, MC e Freestyler apresentarem a seleção complementar de vertentes.
- As seleções múltiplas funcionarem corretamente.
- As informações forem persistidas e recuperadas.
- A edição de perfil refletir corretamente as escolhas anteriores.
- As demais áreas dependentes utilizarem a nova estrutura.
- Os dados antigos forem preservados ou adequadamente compatibilizados.
- Não houver regressões nas funcionalidades existentes.
- A interface funcionar nos temas claro e escuro e em diferentes tamanhos de tela.

**Diretriz principal:** implementar uma reorganização consistente das categorias profissionais da Cypher, e não apenas reformular a aparência do formulário. A mudança deve abranger todo o fluxo dos dados, desde a seleção pelo usuário até sua persistência, recuperação e utilização nas demais funcionalidades da plataforma.
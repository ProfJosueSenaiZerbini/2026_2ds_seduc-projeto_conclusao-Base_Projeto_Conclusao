# Cypher — Requisitos Não Funcionais

**Sistema:** Cypher — plataforma de networking e profissionalização da cultura hip-hop e do rap underground.  
**Documento:** `RNF-Cypher.md`  
**Referências internas:** `RN-Cypher.md` (RN-001 a RN-203) e `RF-Cypher.md` (RF-001 a RF-146).  
**Escopo:** requisitos de qualidade e restrições técnicas aplicáveis à versão final completa da Cypher.

## 1. Apresentação do sistema

A **Cypher** é uma plataforma digital brasileira dedicada à **descoberta, divulgação e conexão profissional** de artistas e trabalhadores da cultura hip-hop, especialmente do rap independente. Seu objetivo é reunir trabalhos, competências e oportunidades em um ambiente próprio, em vez de funcionar como uma rede social genérica.

O acesso aos módulos internos da plataforma exige autenticação. O **Consumidor** descobre conteúdos e profissionais, salva trabalhos, acompanha eventos e interage conforme as permissões. O **Profissional** mantém um perfil único, mesmo com várias profissões, e pode registrar obras musicais, beats, projetos, galerias e participações compatíveis com sua atuação. A plataforma contempla **25 profissões em sete áreas**: Música, Dança, Artes Visuais, Audiovisual, Produção Técnica, Gestão e Produção, e Comunicação e Cultura. A administração é separada entre **Administrador Geral, Moderador e Editor**.

Entre os recursos centrais estão **Descoberta e Busca**, **Obras e Lançamentos**, **Banco de Beats**, **Eventos**, **Oportunidades**, **Espaço de Trabalho**, **Portfólios**, **Selos Profissionais**, **Colaborações e Reputação**, **Mensagens**, **Notificações** e **Cypher Central**. No TCC, a compra Premium de beats utiliza **Mercado Pago em ambiente de testes**, sem cobrança real e com licença expressamente demonstrativa.

Este documento descreve **como o sistema deve se comportar em termos de qualidade**, complementando as funcionalidades descritas em `RF-Cypher.md` e as políticas estabelecidas em `RN-Cypher.md`. Requisitos não funcionais devem ser verificáveis, mas não repetem as regras de negócio nem os passos de cada tela.

## 2. Critérios gerais de verificação

- **Abrangência:** os RNF aplicam-se a todos os módulos pertinentes, inclusive às áreas administrativas, às consultas de conteúdo e aos acessos por endereço direto. A visibilidade de um conteúdo para outros usuários não dispensa autenticação nem autorização.
    
- **Ambiente de avaliação de desempenho:** para fins de teste do TCC, considerar uma instalação de homologação documentada, rede estável, **20 sessões simultâneas** e base com pelo menos **1.000 perfis, 500 trabalhos, 200 beats, 100 eventos e 100 oportunidades**. Tempos de serviços externos e transferências de arquivos grandes são medidos separadamente.
    
- **Medição:** quando houver limite de tempo, utilizar o **95º percentil** (95% das operações medidas devem atender ao limite) em uma amostra documentada de execuções. O ambiente, a base utilizada e os resultados devem constar dos testes de validação.
    
- **Escopo técnico:** requisitos de qualidade devem ser atendidos pela aplicação Cypher; a plataforma não pode garantir desempenho, disponibilidade ou acessibilidade de sites e serviços de terceiros.
    

## 3. Requisitos não funcionais

### 3.1. Segurança da aplicação

**RNF-001 — Proteção das senhas.** Senhas devem ser armazenadas por função de derivação criptográfica adequada para senhas, com sal individual, e jamais em texto puro ou reversível. **Verificação:** inspeção do armazenamento e do fluxo de autenticação.

**RNF-002 — Comunicação protegida.** Em ambiente acessível pela internet, autenticação, dados pessoais e operações protegidas devem trafegar por **HTTPS**, sem exposição de credenciais em parâmetros de URL. **Verificação:** acesso às rotas sensíveis e inspeção das requisições de rede.

**RNF-003 — Sessões seguras.** Identificadores de sessão devem ter geração imprevisível, proteção contra acesso por scripts e revogação efetiva após logout, suspensão, encerramento ou alteração de credenciais, respeitando o limite temporal das Regras de Negócio. **Verificação:** tentativas de reutilização de sessão inválida.

**RNF-004 — Autorização no servidor.** Toda consulta ou operação dos módulos internos deve validar autenticação e permissão no servidor, inclusive URLs diretas, arquivos, downloads, formulários, ações administrativas e endpoints utilizados pela interface. Somente procedimentos de cadastro, login, confirmação de e-mail e recuperação de acesso dispensam uma sessão convencional previamente autenticada; integrações externas autorizadas utilizam seus próprios mecanismos de autenticação. **Verificação:** requisições sem autenticação e com conta sem permissão devem ser recusadas, inclusive nas consultas a conteúdos visíveis a outros usuários autenticados.

**RNF-005 — Resistência a entradas maliciosas.** Dados recebidos devem ser validados e tratados de forma a prevenir injeção de consultas, scripts inseridos em conteúdo e alteração indevida de parâmetros. **Verificação:** testes de entradas inválidas em cadastro, busca, comentários, mensagens e formulários administrativos.

**RNF-006 — Proteção contra abuso de requisições.** Operações que modificam dados devem usar proteção adequada contra falsificação de requisições, e acessos sensíveis devem limitar tentativas abusivas, respeitando os limites específicos definidos para e-mail e autenticação. **Verificação:** envio de requisições sem proteção e repetição acima dos limites permitidos.

**RNF-007 — Validação de arquivos enviados.** Uploads de áudio, imagem e outros anexos devem validar tipo, tamanho e conteúdo permitido, impedir execução de código e proteger os arquivos armazenados contra acesso direto não autorizado. **Verificação:** tentativa de enviar arquivo incompatível, executável ou acima do limite configurado, além de tentativas de acesso a arquivos protegidos sem autenticação ou permissão.

**RNF-008 — Segurança da integração de pagamentos.** Credenciais do Mercado Pago e mecanismos de confirmação de transações devem permanecer protegidos no servidor. O retorno do navegador não pode ser utilizado isoladamente como prova de aprovação do pagamento.
### 3.2. Privacidade e proteção de dados

**RNF-009 — Tratamento de dados pessoais.** A coleta, utilização, retenção e descarte de dados devem ser limitados às finalidades legítimas do sistema e compatíveis com a **Lei Geral de Proteção de Dados Pessoais (LGPD)**. **Verificação:** confronto entre campos armazenados, políticas de privacidade e finalidade declarada.

**RNF-010 — Isolamento de conteúdos restritos.** Perfis privados, mensagens, letras inéditas, arquivos de entrega, documentos de licença e registros administrativos não podem ser acessados por pessoas sem autorização, mesmo por links diretos ou alterações de parâmetros. **Verificação:** tentativas de acesso sem sessão autenticada e com contas de outros titulares sem permissão.

**RNF-011 — Privacidade consistente.** Alterações de visibilidade, bloqueio e moderação devem refletir em Busca, Descoberta, perfis, portfólios, miniaturas, notificações e compartilhamentos, sem exposição residual de informações protegidas. **Verificação:** modificar permissões e consultar as diversas superfícies do sistema.

**RNF-012 — Proteção reforçada de menores.** O sistema deve restringir exposição de dados, contatos e conteúdos sensíveis de usuários de **16 e 17 anos**, sem divulgar a outros usuários a data de nascimento completa ou outras informações reservadas. **Verificação:** comparação dos acessos permitidos a contas adultas, contas de menores e tentativas de consulta não autenticadas.

### 3.3. Persistência, integridade e confiabilidade

**RNF-013 — Persistência dos registros.** Contas, trabalhos, créditos, vínculos, pedidos demonstrativos, mensagens, notificações e preferências devem permanecer íntegros após atualizar a página, sair e entrar na conta ou reiniciar a aplicação. **Verificação:** repetir consultas antes e depois desses eventos.

**RNF-014 — Operações consistentes.** Alterações que envolvam múltiplos registros relacionados devem ser confirmadas integralmente ou revertidas em caso de erro, sem deixar relações parcialmente válidas. **Verificação:** provocar falha controlada durante operações com vários registros.

**RNF-015 — Integridade das referências.** Relações entre usuários, trabalhos, fonogramas, beats, eventos, projetos e créditos devem apontar para registros válidos, respeitando exclusões e preservação histórica autorizada. **Verificação:** testar alterações e remoções de registros relacionados.

**RNF-016 — Requisições repetidas sem duplicação indevida.** Repetir confirmações, salvamentos ou callbacks não pode criar licenças demonstrativas, compras, vínculos ou inscrições duplicados referentes à mesma operação. **Verificação:** reproduzir a mesma requisição e a mesma confirmação múltiplas vezes.

**RNF-017 — Falha sem sucesso fictício.** Se houver erro de salvamento, upload, processamento, validação ou integração externa, o sistema deve informar a falha e não apresentar a operação como concluída. **Verificação:** interromper operações e verificar resultado exibido e persistido.

### 3.4. Desempenho e capacidade de consulta

**RNF-018 — Resposta das páginas principais.** Nas condições de avaliação definidas na seção 2, ao menos **95% das respostas iniciais** de páginas internas e catálogos da Cypher devem ocorrer em até **3 segundos**, sem contar mídia carregada posteriormente. **Verificação:** ensaio de carga com relatório de tempos de resposta.

**RNF-019 — Resposta de buscas e filtros.** Nas mesmas condições, ao menos **95% das pesquisas e filtragens** sobre dados locais devem retornar em até **2 segundos**, excluindo chamadas a provedores externos. **Verificação:** ensaios sobre Descoberta, Obras, Banco de Beats, Eventos e Oportunidades.

**RNF-020 — Resposta de operações comuns.** Nas mesmas condições, ao menos **95% das operações de consulta detalhada e gravação de formulários sem mídia pesada** devem receber resposta em até **3 segundos**. **Verificação:** medição de criação, edição e consulta de registros representativos.

**RNF-021 — Listas e mídias eficientes.** Catálogos extensos devem utilizar paginação ou carregamento incremental; miniaturas e prévias devem evitar transferência desnecessária de arquivos originais completos. **Verificação:** consulta de listas extensas e inspeção de tráfego e consumo de memória.

### 3.5. Usabilidade e acessibilidade

**RNF-022 — Responsividade.** As funções essenciais devem permanecer utilizáveis em celulares, tablets e computadores, incluindo telas a partir de **360 pixels de largura**, sem rolagem horizontal obrigatória nos formulários e fluxos principais. **Verificação:** navegação nos tamanhos de tela definidos e em orientação vertical/horizontal.

**RNF-023 — Independência de hover e arraste.** Controles essenciais de criação, navegação, portfólio e organização devem funcionar por toque e teclado, sem depender exclusivamente de passar o mouse ou arrastar itens. **Verificação:** concluir fluxos principais sem mouse.

**RNF-024 — Clareza de navegação.** Títulos, ações e retornos devem ser consistentes entre módulos, mantendo distinções compreensíveis entre publicar, salvar, participar, confirmar, ocultar e excluir. **Verificação:** percorrer os fluxos principais e verificar rótulos e resultados esperados.

**RNF-025 — Validação compreensível de formulários.** Campos obrigatórios e valores inválidos devem apresentar indicação específica do problema; falha de envio não deve apagar injustificadamente informações válidas já preenchidas. **Verificação:** submeter formulários com dados incompletos, inválidos ou erro de conexão.

**RNF-026 — Estados de interface identificáveis.** As páginas e ações relevantes devem distinguir carregamento, ausência de resultados, erro, sucesso e falta de permissão, sem apresentar dados inventados para preencher espaços vazios. **Verificação:** acionar cada estado nos módulos representativos.

**RNF-027 — Acessibilidade da interface.** Os fluxos desenvolvidos pela Cypher devem atender aos **critérios aplicáveis do nível AA das WCAG 2.2**, com nomes acessíveis para controles, foco visível, ordem lógica e operação por teclado. **Verificação:** checklist manual de acessibilidade, navegação por teclado e testes automatizados complementares.

**RNF-028 — Legibilidade e conforto visual.** Temas claro e escuro devem manter contraste adequado, sinalização que não dependa somente de cor e respeito à preferência por redução de movimento, sem comprometer a identidade urbana da Cypher. **Verificação:** conferência de contraste, estados e preferências visuais nas principais telas.

### 3.6. Compatibilidade, idioma e conteúdo digital

**RNF-029 — Compatibilidade com navegadores atuais.** A aplicação web deve preservar os fluxos essenciais nas versões estáveis atuais de **Chrome, Firefox, Edge e Safari**, em dispositivos e sistemas que suportem esses navegadores. **Verificação:** testes de cadastro, busca, publicação e leitura em navegadores representativos.

**RNF-030 — Padrão brasileiro de apresentação.** A interface deve utilizar português brasileiro e representar datas, horários e valores monetários de modo coerente com o contexto brasileiro; eventos e lembretes devem respeitar o fuso de sua realização. **Verificação:** comparar datas e preços em diferentes dispositivos e fusos.

**RNF-031 — Representação acessível da mídia.** Imagens informativas e ações por ícones devem possuir descrição textual pertinente; quando a Cypher produzir conteúdo audiovisual institucional, deve oferecer alternativas de acesso adequadas. **Verificação:** inspeção de descrição acessível, conteúdo visual e materiais da Cypher Central.

**RNF-032 — Compartilhamentos seguros e estáveis.** Links próprios devem identificar os recursos corretamente após mudanças permitidas de apresentação e continuar sujeitos à autenticação e autorização vigentes, sem expor dados protegidos. **Verificação:** abrir links antigos, privados e compartilháveis sem sessão autenticada, com conta autenticada sem permissão e com o titular autorizado, confirmando o bloqueio dos acessos indevidos.

### 3.7. Continuidade, recuperação e dependências externas

**RNF-033 — Falha de serviço externo controlada.** Indisponibilidade do Mercado Pago de testes, player externo ou outro serviço integrado não deve tornar registros internos incoerentes nem gerar confirmação fictícia de pagamento, licença ou publicação. **Verificação:** simular indisponibilidade e retorno do serviço.

**RNF-034 — Cópias de segurança recuperáveis.** Deve existir procedimento documentado de backup e restauração dos dados e arquivos essenciais, com execução antes de atualizações estruturais e ao menos uma restauração validada em ambiente de teste. **Verificação:** recuperar uma cópia e conferir registros e vínculos essenciais.

**RNF-035 — Reinicialização sem perda indevida.** Reiniciar o processo da aplicação não deve eliminar mensagens, notificações, trabalhos, autorizações, inscrições ou preferências regularmente persistidas. **Verificação:** realizar reinício controlado e verificar amostra de registros.

**RNF-036 — Agendamentos independentes do navegador.** Eventos temporizados do sistema, como lembretes de eventos, devem ser executados por mecanismo persistente e não depender de uma aba do usuário permanecer aberta. **Verificação:** fechar a sessão, aguardar o disparo agendado e confirmar o registro do aviso.

### 3.8. Manutenibilidade, auditoria e qualidade dos dados

**RNF-037 — Organização modular do código.** O código deve manter responsabilidades de interface, regras de aplicação, acesso a dados e integrações separadas, de modo que mudanças em um domínio não exijam alterações desnecessárias nos demais. **Verificação:** inspeção da estrutura e alteração controlada de um fluxo.

**RNF-038 — Configuração segura de ambientes.** Segredos, credenciais, endereços de integração e parâmetros de ambiente devem ser configuráveis sem inserção direta no código-fonte público. **Verificação:** inspeção do repositório e inicialização com configuração própria de teste.

**RNF-039 — Evolução controlada dos dados.** Alterações estruturais no banco devem possuir procedimento reproduzível que preserve registros válidos e permita identificar a versão do esquema utilizada. **Verificação:** aplicar a atualização a uma cópia da base e comparar integridade antes e depois.

**RNF-040 — Registro de falhas e ações sensíveis.** Erros operacionais e ações administrativas relevantes devem gerar registros suficientes para diagnóstico e auditoria, sem armazenar senhas, tokens, mensagens privadas desnecessárias ou outros segredos. **Verificação:** consultar registros após erro e decisão administrativa simulados.

**RNF-041 — Indicadores derivados de dados reais.** Contadores e métricas de obras, créditos, eventos, reputação e Cypher Central devem corresponder às suas fontes persistidas e aos critérios de contabilização definidos, sem valores fictícios apresentados como reais. **Verificação:** alterar dados de teste e confrontar indicadores com registros de origem.

**RNF-042 — Testabilidade dos fluxos críticos.** Devem existir procedimentos de validação reproduzíveis para cadastro, autenticação, permissões, obras, ofertas, checkout demonstrativo, eventos, créditos e moderação, cobrindo ao menos um caso válido e um caso de recusa ou falha por fluxo. **Verificação:** executar os roteiros em ambiente isolado e registrar seus resultados.

## 4. Relação com os demais documentos

|Documento|Responsabilidade|
|---|---|
|`**RN-Cypher.md**`|Define condições e restrições do negócio: quem pode atuar, quando e sob quais direitos.|
|`**RF-Cypher.md**`|Define as funcionalidades observáveis: o que o sistema permite, registra e apresenta.|
|`**RNF-Cypher.md**`|Define as condições de qualidade: segurança, privacidade, desempenho, acessibilidade, confiabilidade e manutenção.|

Os requisitos de qualidade aqui descritos **não mudam** as 203 regras de negócio nem criam modalidades de publicação, tipos de contas ou transações financeiras adicionais. A versão final da Cypher mantém as 25 profissões, as duas modalidades de conta convencional e o checkout Premium exclusivamente demonstrativo, conforme os documentos anteriores.

## 5. Referências de qualidade e legislação

- **ISO/IEC 25010:2023** — modelo de qualidade de produto de software. [https://www.iso.org/standard/78176.html](https://www.iso.org/standard/78176.html)
    
- **WCAG 2.2** — diretrizes de acessibilidade para conteúdo web, W3C. [https://www.w3.org/TR/wcag/](https://www.w3.org/TR/wcag/)
    
- **Lei nº 13.709/2018 (LGPD)** — proteção de dados pessoais no Brasil. [https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
    

> As referências orientam os critérios pertinentes; sua inclusão não constitui certificação de conformidade automática nem declaração de auditoria externa.
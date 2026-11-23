## 1. Apresentação

A **Cypher** é uma plataforma digital voltada à conexão e profissionalização de artistas e trabalhadores da cultura hip-hop, com foco especial na cena independente e underground do rap.

O projeto surgiu da necessidade de reunir, em um mesmo ambiente, recursos que facilitem a divulgação de trabalhos, a descoberta de profissionais, a formação de parcerias e o acesso a oportunidades.

A proposta não é substituir serviços de streaming ou funcionar como uma rede social convencional. A Cypher busca oferecer um espaço dedicado à apresentação de trajetórias profissionais, organização de produções artísticas e desenvolvimento de conexões dentro da cultura.

Este levantamento reúne as principais necessidades identificadas para o funcionamento da plataforma. As informações foram organizadas a partir do escopo e das definições consolidadas do projeto, servindo como base para as regras de negócio, os requisitos funcionais e não funcionais e os casos de uso.

## 2. Problemas identificados

A cena independente do hip-hop reúne profissionais de diferentes áreas, mas nem sempre dispõe de espaços digitais próprios para facilitar a descoberta de talentos e a formação de relações profissionais.

Entre os problemas que motivaram o desenvolvimento da Cypher estão:

- **Visibilidade limitada:** artistas e profissionais independentes encontram dificuldades para divulgar seus trabalhos e alcançar pessoas interessadas em suas atividades.
    
- **Conexões dispersas:** contatos, oportunidades e possíveis parcerias costumam ficar espalhados por diferentes redes sociais e canais de comunicação.
    
- **Dificuldade para encontrar profissionais:** localizar beatmakers, produtores, artistas visuais, técnicos de áudio, organizadores e outros colaboradores pode exigir pesquisas em vários ambientes.
    
- **Organização da trajetória profissional:** trabalhos, créditos, participações e experiências nem sempre estão reunidos em um portfólio acessível e organizado.
    
- **Falta de clareza sobre contribuições:** identificar corretamente as funções exercidas por cada participante de uma produção é importante para evitar atribuições equivocadas.
    
- **Acesso limitado a oportunidades:** eventos, chamadas profissionais e projetos podem não alcançar pessoas com o perfil adequado para participar.
    
- **Carência de orientações específicas:** questões relacionadas à publicação musical, registros, direitos, colaboração e profissionalização nem sempre são apresentadas de maneira acessível ao público independente.
    

A Cypher pretende reduzir essas dificuldades por meio de um ambiente que reúna descoberta, divulgação, comunicação e organização profissional.

## 3. Público-alvo

A plataforma contempla diferentes formas de participação, considerando as necessidades de quem consome conteúdos e de quem atua profissionalmente na cultura hip-hop.

### 3.1. Consumidores

Pessoas interessadas em acompanhar artistas, descobrir conteúdos, conhecer profissionais e participar de eventos.

Suas principais necessidades envolvem:

- Encontrar artistas, trabalhos, beats e eventos de interesse.
    
- Acompanhar profissionais e salvar conteúdos para consultas futuras.
    
- Interagir com publicações e estabelecer contatos permitidos.
    
- Participar de eventos e acompanhar suas inscrições.
    
- Consultar oportunidades e solicitar serviços pelos meios autorizados.
    
- Controlar suas informações pessoais e preferências de privacidade.
    

### 3.2. Profissionais

Artistas e trabalhadores que utilizam a plataforma para apresentar suas atividades, organizar trabalhos e estabelecer conexões profissionais.

A Cypher contempla 25 profissões, distribuídas em sete áreas:

|Área|Profissões|
|---|---|
|Música|Rapper, MC, Compositor(a), Letrista, Beatmaker, Produtor(a) Musical, DJ e Freestyleiro|
|Dança|B-boy/B-girl, Dançarino(a) e Coreógrafo(a)|
|Artes Visuais|Grafiteiro(a), Ilustrador(a) e Designer Gráfico|
|Audiovisual|Fotógrafo(a), Videomaker e Editor(a) de Vídeo|
|Produção Técnica|Engenheiro(a) de Áudio, Mixador(a) e Masterizador(a)|
|Gestão e Produção|Empresário(a), Produtor(a) Cultural e Organizador(a) de Eventos|
|Comunicação e Cultura|Criador(a) de Conteúdo e Jornalista Cultural|

Como uma mesma pessoa pode exercer várias funções, o sistema precisa permitir múltiplas profissões dentro de um único perfil.

### 3.3. Equipe administrativa

Responsável pela manutenção dos catálogos, análise de denúncias, atendimento de solicitações e administração dos conteúdos educativos.

A administração é dividida em três papéis:

- **Administrador Geral:** administra acessos, permissões e decisões estruturais.
    
- **Moderador:** analisa denúncias, conflitos e solicitações que dependem de avaliação administrativa.
    
- **Editor:** administra os artigos e materiais educativos da Cypher Central.
    

Cada papel possui competências próprias, sem acesso automático às atribuições dos demais.

## 4. Necessidades levantadas

### 4.1. Cadastro e gerenciamento de contas

É necessário oferecer um processo de entrada seguro e compreensível, respeitando as diferenças entre Consumidores e Profissionais.

As necessidades identificadas são:

- Cadastro nas modalidades Consumidor e Profissional, sem criação de contas administrativas pelo formulário convencional.
    
- Coleta e validação das informações necessárias à identificação e à segurança da conta.
    
- Confirmação do endereço de e-mail antes da liberação do acesso.
    
- Autenticação por credenciais individuais, recuperação de senha e encerramento de sessão.
    
- Proteção adicional para usuários de 16 e 17 anos, considerando a idade mínima de 16 anos da plataforma.
    
- Alteração segura de dados cadastrais, e-mail e identificador público.
    
- Possibilidade de encerrar a conta, respeitando os registros que precisam ser preservados.
    
- Conversão de Consumidor em Profissional sem criação de outra conta ou perda indevida do histórico.
    

**Documentação relacionada:** RN-001 a RN-016; RF-001 a RF-010.

### 4.2. Perfis, identidade e privacidade

Os usuários precisam de espaços adequados à sua modalidade de conta, com controle sobre as informações apresentadas.

Para isso, foram identificadas as seguintes necessidades:

- Perfil profissional único, mesmo quando o titular exerce diferentes profissões.
    
- Apresentação de nome, nome artístico, @username, biografia e informações profissionais pertinentes.
    
- Edição de experiências, especialidades, equipamentos e outros dados complementares.
    
- Organização das informações de atuação por profissão, sem dividir a identidade do usuário.
    
- Separação entre trabalhos próprios e participações em produções de terceiros.
    
- Controle de visibilidade de localização, informações de contato e conteúdos individuais.
    
- Espaço pessoal privado para Consumidores, sem vitrine profissional pesquisável.
    
- Registro de vínculos legítimos de representação profissional, sem compartilhamento de credenciais ou permissões pessoais.
    

**Documentação relacionada:** RN-017 a RN-029; RF-011 a RF-019.

### 4.3. Profissões e permissões

Como a Cypher atende profissionais de diferentes áreas, as funcionalidades de criação e administração precisam corresponder às atividades efetivamente exercidas.

As principais necessidades são:

- Disponibilização de um catálogo oficial de profissões.
    
- Seleção de uma ou mais profissões durante o cadastro ou a conversão da conta.
    
- Registro individual do tempo de atuação em cada profissão.
    
- Possibilidade de informar vertentes pessoais para Rappers e modalidades próprias para Freestyleiros.
    
- Alteração das profissões selecionadas, respeitando os limites de mudança estabelecidos.
    
- Solicitação excepcional quando houver necessidade de alteração antecipada.
    
- Apresentação de opções de criação compatíveis com as profissões ativas.
    
- Verificação de autorização sobre os trabalhos, impedindo que a escolha de uma profissão conceda direitos sobre materiais de terceiros.
    
- Preservação dos trabalhos e créditos anteriores quando uma profissão for removida.
    

**Documentação relacionada:** RN-030 a RN-043; RF-020 a RF-029.

### 4.4. Descoberta e pesquisa

Uma das principais finalidades da Cypher é facilitar o encontro entre pessoas, trabalhos e oportunidades.

A plataforma precisa oferecer:

- Página inicial de Descoberta com profissionais, obras, beats, eventos, projetos e oportunidades relevantes.
    
- Pesquisa por nome, @username e informações pertinentes aos diferentes tipos de conteúdo.
    
- Filtros adequados a cada área, evitando critérios que não façam sentido para determinados trabalhos.
    
- Recomendações baseadas em interesses, atuações e localização aproximada autorizada.
    
- Resultados úteis para usuários recém-cadastrados, mesmo sem histórico de interações.
    
- Espaço para profissionais emergentes, sem depender exclusivamente de popularidade.
    
- Links compartilháveis de perfis e registros, sujeitos às respectivas permissões.
    
- Proteção contra a exposição de conteúdos privados, bloqueados ou restritos.
    

A página Descoberta deve favorecer o encontro de talentos e oportunidades, sem transformar a plataforma em um feed genérico de publicações pessoais.

**Documentação relacionada:** RN-176 a RN-181; RF-119 a RF-125.

### 4.5. Obras musicais, lançamentos e créditos

Profissionais ligados à produção musical precisam organizar suas criações e identificar corretamente as pessoas envolvidas.

Foram identificadas as necessidades de:

- Registrar composições musicais e letras independentes.
    
- Cadastrar gravações sonoras como fonogramas próprios.
    
- Relacionar composições a diferentes gravações, preservando a identidade de cada uma.
    
- Organizar singles, EPs, álbuns e mixtapes.
    
- Reutilizar fonogramas em diferentes lançamentos, sem duplicar a gravação original.
    
- Apresentar dados técnicos, gêneros, participantes e identificadores externos disponíveis.
    
- Relacionar obras a beats, videoclipes e outras mídias autorizadas.
    
- Registrar evidências de lançamento público quando necessário.
    
- Identificar colaboradores por suas funções reais, independentemente da profissão declarada no perfil.
    
- Permitir reconhecimento, recusa e contestação de créditos atribuídos por terceiros.
    
- Consultar catálogos e discografias de maneira organizada.
    

A plataforma também precisa diferenciar composição, letra, fonograma e lançamento. O cadastro de um registro não deve comprovar automaticamente sua disponibilização pública.

Os códigos ISRC e ISWC poderão ser informados quando existentes, mas não serão emitidos pela Cypher.

**Documentação relacionada:** RN-047 a RN-067; RF-030 a RF-040.

### 4.6. Banco de Beats e licenciamento

Beatmakers e Produtores(as) Musicais precisam de um espaço específico para divulgar beats próprios e apresentar suas condições de utilização.

As necessidades levantadas incluem:

- Cadastro de beats com identificação, características musicais, autoria e materiais pertinentes.
    
- Disponibilização de prévias sonoras sem liberação automática dos arquivos completos.
    
- Pesquisa por produtor, gênero, BPM, tonalidade, duração e condições comerciais.
    
- Apresentação clara das ofertas disponíveis para cada beat.
    
- Possibilidade de manter ofertas Free Use e Premium não exclusivas com termos diferentes.
    
- Registro das permissões, restrições, valores e arquivos correspondentes a cada modalidade.
    
- Administração da disponibilidade comercial pelo responsável autorizado.
    
- Indicação de possibilidade de negociação exclusiva separadamente do checkout.
    
- Simulação de aquisição Premium com integração ao Mercado Pago em ambiente de testes.
    
- Emissão de licença demonstrativa após confirmação válida da operação.
    
- Área Minhas Compras para consulta do histórico, das licenças e dos arquivos autorizados.
    
- Preservação das condições aceitas em operações anteriores, mesmo após alterações nas ofertas.
    

Para a apresentação do TCC, a aquisição Premium não envolverá cobrança real. A licença emitida será identificada como demonstrativa e não representará transferência jurídica efetiva de direitos.

**Documentação relacionada:** RN-068 a RN-089; RF-041 a RF-055.

### 4.7. Espaço de Trabalho, projetos e galerias

Profissionais de áreas musicais e não musicais precisam reunir seus trabalhos em um ambiente que facilite a organização da trajetória profissional.

As necessidades identificadas são:

- Espaço de Trabalho exclusivo para contas Profissionais.
    
- Separação do acervo entre Meus Trabalhos e Participações.
    
- Organização por profissão efetivamente exercida e natureza do registro.
    
- Cadastro de projetos e experiências com responsabilidades, equipe, período, objetivos e resultados.
    
- Publicação de materiais visuais, audiovisuais, técnicos, culturais e de outras modalidades compatíveis.
    
- Criação de galerias e coleções multimídia.
    
- Associação de trabalhos e mídias existentes a diferentes projetos.
    
- Controle de visibilidade dos registros.
    
- Retirada de materiais de coleções sem excluir seus registros originais.
    
- Identificação clara entre experiências declaradas pelo titular e participações reconhecidas.
    

O Espaço de Trabalho não deve ser restrito à música. Ele precisa contemplar as diferentes formas de produção e atuação presentes na cultura hip-hop.

**Documentação relacionada:** RN-090 a RN-098; RF-056 a RF-062.

### 4.8. Portfólio profissional

O portfólio deve permitir que cada profissional apresente seus trabalhos de maneira organizada, sem precisar repetir cadastros ou criar perfis separados para cada profissão.

Para isso, são necessários:

- Portfólio único que reúna trabalhos de diferentes modalidades.
    
- Distinção visual entre produções próprias e participações reconhecidas.
    
- **Modo Manual**, permitindo escolher, destacar e ordenar os trabalhos exibidos.
    
- **Modo Inteligente**, incorporando automaticamente registros elegíveis e participações confirmadas.
    
- Possibilidade de ocultar trabalhos sem excluir seus registros.
    
- Preservação das ocultações durante atualizações automáticas e trocas de modo.
    
- Moldes de apresentação adequados a diferentes tipos de produção.
    
- Pré-visualização do portfólio antes da confirmação das alterações.
    
- Consulta dos trabalhos apresentados por outros usuários autenticados, respeitando a privacidade dos registros.
    

O portfólio deve funcionar como uma apresentação da trajetória profissional, mantendo seus conteúdos vinculados aos registros originais.

**Documentação relacionada:** RN-099 a RN-107; RF-063 a RF-069.

### 4.9. Selo Profissional

A Cypher também precisa oferecer uma forma de identificação visual das contribuições profissionais, valorizando a identidade de seus usuários.

As necessidades incluem:

- Editor próprio para criação de Selos Profissionais.
    
- Um único selo ativo por conta Profissional.
    
- Possibilidade de visualizar, editar e substituir a composição visual.
    
- Registro de versões anteriores para preservar o histórico.
    
- Aplicação contextual do selo em trabalhos próprios e participações reconhecidas.
    
- Indicação da função exercida pelo profissional junto à identificação visual.
    
- Solicitação excepcional de uso de identidade externa, sujeita à aprovação administrativa.
    
- Proteção contra falsificação de identidade, imitação da marca Cypher e alegações indevidas de verificação.
    

O Selo Profissional não representa certificação de competência nem substitui os créditos textuais do trabalho.

**Documentação relacionada:** RN-025, RN-026 e RN-113 a RN-117; RF-070 a RF-074.

### 4.10. Eventos e participação

Eventos são parte importante da cultura hip-hop e precisam de recursos que facilitem sua divulgação e organização.

Foram identificadas as seguintes necessidades:

- Cadastro e administração de eventos por profissionais habilitados.
    
- Divulgação de informações como categoria, data, horário, local ou formato de realização.
    
- Possibilidade de organizar diferentes edições de um mesmo evento.
    
- Configuração de participação aberta ou sujeita à aprovação.
    
- Definição de requisitos e limites de vagas.
    
- Pesquisa de eventos por filtros, lista e mapa quando houver localização confiável.
    
- Salvamento de eventos e registro de interesse.
    
- Inscrição e acompanhamento de sua situação.
    
- Análise de solicitações pelo organizador.
    
- Registro de presenças efetivamente reconhecidas.
    
- Comunicação de alterações e cancelamentos.
    
- Indicadores distintos de interessados, inscritos, confirmados e presentes.
    

Também foi identificada a necessidade de permitir avaliações da experiência de participantes elegíveis.

As reclamações sobre organização deverão ser encaminhadas inicialmente ao organizador, com possibilidade de reconhecimento, esclarecimento ou contestação. Divergências pertinentes poderão ser analisadas pela moderação, sem punições automáticas.

**Documentação relacionada:** RN-118 a RN-135; RF-075 a RF-087.

### 4.11. Oportunidades e serviços

A plataforma precisa aproximar profissionais que oferecem serviços daqueles que buscam colaboração ou contratação.

As principais necessidades são:

- Publicação de oportunidades por Profissionais habilitados.
    
- Descrição de objetivos, responsabilidades, requisitos e condições de participação.
    
- Pesquisa e consulta de oportunidades disponíveis.
    
- Envio de candidaturas por profissionais elegíveis.
    
- Acompanhamento da situação das candidaturas.
    
- Análise e resposta dos responsáveis pelas chamadas.
    
- Encerramento de oportunidades sem apagar compromissos anteriores legítimos.
    
- Registro do aceite expresso das mesmas condições pelas partes quando houver acordo.
    
- Possibilidade de Consumidores solicitarem orientação de profissionais mediadores.
    
- Envio excepcional de pedidos de serviços por Consumidores, sujeito à análise administrativa antes da publicação.
    

Oportunidades devem permanecer separadas dos eventos. Uma chamada profissional não constitui automaticamente contratação, colaboração concluída ou crédito reconhecido.

**Documentação relacionada:** RN-044 a RN-046 e RN-136 a RN-141; RF-088 a RF-093.

### 4.12. Colaborações e reputação profissional

A Cypher precisa oferecer um meio de registrar relações profissionais efetivas e avaliar experiências de colaboração com critérios mais confiáveis do que simples indicadores de popularidade.

As necessidades levantadas são:

- Propostas formais de colaboração entre duas contas Profissionais distintas.
    
- Registro do objeto, das funções e das condições da colaboração.
    
- Aceite ou recusa expressa do profissional convidado.
    
- Acompanhamento da situação do vínculo.
    
- Reconhecimento da conclusão pelas duas partes.
    
- Possibilidade de contestar entregas ou solicitações de encerramento.
    
- Intervenção fundamentada da moderação quando necessária.
    
- Avaliação facultativa após conclusão válida.
    
- Utilização de critérios definidos de comunicação, cumprimento de combinados e trabalho em equipe.
    
- Proteção das avaliações pelo mecanismo duplo-cego.
    
- Exibição de reputação pública apenas após três avaliadores profissionais distintos.
    
- Controle de privacidade dos vínculos de colaboração.
    
- Revisão de avaliações suspeitas de fraude ou abuso.
    

A reputação profissional deve refletir experiências de trabalho reconhecidas, não quantidades de seguidores, curtidas ou publicações.

**Documentação relacionada:** RN-142 a RN-159; RF-094 a RF-104.

### 4.13. Interações e comunicação

Além da divulgação de trabalhos, os usuários precisam de recursos para acompanhar profissionais, demonstrar interesse e estabelecer contato.

As necessidades incluem:

- Seguir e deixar de seguir profissionais.
    
- Curtir e descurtir conteúdos e perfis permitidos.
    
- Salvar trabalhos para consulta posterior.
    
- Consultar profissionais seguidos e itens salvos.
    
- Publicar, editar e excluir comentários próprios.
    
- Enviar e consultar mensagens privadas.
    
- Manter histórico de conversas entre sessões.
    
- Configurar preferências de recebimento de mensagens.
    
- Bloquear e desbloquear outros usuários.
    
- Ocultar conversas da própria caixa sem apagar indevidamente o histórico de outros participantes.
    

As interações devem respeitar bloqueios, privacidade e permissões. Mensagens e contatos não representam, por si, acordos profissionais.

**Documentação relacionada:** RN-160 a RN-169; RF-105 a RF-112.

### 4.14. Notificações e lembretes

Os usuários precisam acompanhar acontecimentos relacionados às suas atividades, sem depender de consultas manuais constantes.

Foram identificadas as necessidades de:

- Receber notificações relacionadas a interações, mensagens, créditos, eventos e solicitações.
    
- Manter os avisos registrados entre sessões.
    
- Consultar notificações lidas e não lidas.
    
- Alterar o estado de leitura.
    
- Remover notificações individualmente ou limpar a caixa.
    
- Configurar categorias opcionais de recebimento.
    
- Receber lembretes de eventos acompanhados.
    
- Acessar conteúdos relacionados às notificações quando a permissão continuar válida.
    
- Atualizar lembretes após alterações ou cancelamentos de eventos.
    

As notificações não devem expirar automaticamente com o tempo. A exclusão ocorre por ação do usuário ou medida excepcional justificada.

**Documentação relacionada:** RN-170 a RN-175; RF-113 a RF-118.

### 4.15. Cypher Central

Além das ferramentas de divulgação e networking, a Cypher precisa oferecer conteúdos educativos voltados ao uso da plataforma e à profissionalização de seus usuários.

As necessidades identificadas são:

- Área dedicada a artigos, orientações e guias.
    
- Conteúdos sobre publicação de trabalhos, profissões, segurança e utilização dos recursos da plataforma.
    
- Orientações sobre temas como ISRC, ISWC e produção fonográfica.
    
- Pesquisa por assuntos e categorias.
    
- Apresentação de artigos recentes e conteúdos pertinentes.
    
- Possibilidade de avaliar artigos como Útil ou Não útil.
    
- Registro dos motivos de avaliações negativas.
    
- Ferramentas editoriais para criação, atualização, publicação e arquivamento dos conteúdos.
    
- Indicadores de leitura e avaliação para auxiliar na melhoria dos artigos.
    
- Identificação de assuntos pesquisados que ainda não possuem respostas.
    

A Cypher Central deve funcionar como um espaço de orientação, sem substituir acordos particulares, prestar certificações ou emitir identificadores musicais oficiais.

**Documentação relacionada:** RN-182 a RN-188; RF-126 a RF-131.

### 4.16. Administração, suporte e moderação

A plataforma precisa de mecanismos internos para administrar o sistema, atender solicitações e lidar com situações que comprometam a segurança ou a integridade das informações.

As necessidades levantadas são:

- Acesso administrativo separado das contas convencionais.
    
- Distribuição de competências entre Administrador Geral, Moderador e Editor.
    
- Concessão e revogação controlada de acessos administrativos.
    
- Recebimento de denúncias sobre perfis, conteúdos, eventos, selos e condutas.
    
- Registro de pedidos de suporte, recursos e solicitações excepcionais.
    
- Análise de sugestões para inclusão de profissões, gêneros e outras opções globais.
    
- Acompanhamento das situações das denúncias e solicitações.
    
- Aplicação de medidas proporcionais e fundamentadas.
    
- Priorização de ocorrências graves, especialmente as que envolvam riscos a menores.
    
- Possibilidade de contestação das decisões administrativas.
    
- Registro de ações sensíveis e decisões para auditoria.
    
- Controle de acesso a dados pessoais, conversas privadas e evidências recebidas.
    
- Administração dos conteúdos educativos pela equipe editorial competente.
    

A administração deve preservar a separação de responsabilidades e impedir que denúncias, por si só, resultem em punições automáticas.

**Documentação relacionada:** RN-189 a RN-203; RF-132 a RF-142.

---

## 5. Necessidades gerais de qualidade

Além das funcionalidades, foram identificadas condições necessárias para que a plataforma seja utilizável, segura e confiável.

### Segurança e privacidade

- Proteção de senhas, sessões e credenciais.
    
- Autorização das operações no servidor, não apenas pela interface.
    
- Validação de formulários e arquivos enviados.
    
- Proteção contra acessos indevidos, requisições abusivas e manipulação de dados.
    
- Controle de acesso a mensagens, documentos e arquivos privados.
    
- Tratamento adequado dos dados pessoais, considerando a LGPD.
    
- Proteção reforçada de informações e contatos de menores de idade.
    
- Segurança da integração demonstrativa com o Mercado Pago.
    

### Desempenho e confiabilidade

- Respostas adequadas nas páginas, pesquisas e operações principais.
    
- Carregamento eficiente de listagens e arquivos de mídia.
    
- Persistência dos dados após encerramento de sessão ou reinicialização.
    
- Prevenção de registros duplicados e operações incompletas.
    
- Recuperação de dados por meio de cópias de segurança.
    
- Tratamento de falhas de serviços externos sem comprometer os registros internos.
    
- Execução de lembretes e outras rotinas programadas independentemente de uma aba aberta.
    

### Usabilidade e acessibilidade

- Interface adaptada para computadores, tablets e celulares.
    
- Navegação clara e organização consistente entre os módulos.
    
- Formulários com orientações e mensagens de erro compreensíveis.
    
- Diferenciação entre carregamento, sucesso, falha, ausência de resultados e falta de permissão.
    
- Operação das funções essenciais por toque e teclado.
    
- Temas claro e escuro com contraste e legibilidade adequados.
    
- Acessibilidade conforme os critérios aplicáveis das WCAG 2.2, nível AA.
    
- Linguagem em português brasileiro e apresentação adequada de datas, horários e valores.
    

### Manutenção e integridade

- Organização modular do sistema.
    
- Separação entre interface, regras de aplicação, acesso a dados e integrações.
    
- Controle das alterações estruturais do banco de dados.
    
- Preservação de vínculos entre usuários, trabalhos, créditos e demais registros.
    
- Registro de falhas e ações administrativas relevantes.
    
- Indicadores calculados a partir de dados legítimos.
    
- Procedimentos de teste para funcionalidades essenciais e situações de erro.
    

**Documentação relacionada:** RNF-001 a RNF-042; RN-108 a RN-112; RF-143 a RF-146.

## 6. Limites definidos para o projeto

Para manter o desenvolvimento alinhado à proposta da Cypher, algumas decisões delimitam o funcionamento da plataforma:

- A Cypher é voltada à descoberta e profissionalização, não à substituição de serviços de streaming ou redes sociais tradicionais.
    
- As funcionalidades internas exigem autenticação; não há navegação anônima pela plataforma.
    
- Existem somente duas modalidades convencionais de conta: Consumidor e Profissional.
    
- As permissões de criação dependem das profissões exercidas e dos direitos sobre cada trabalho.
    
- A plataforma não emite ISRC ou ISWC.
    
- Obras musicais não utilizam estados artísticos como Rascunho, Em produção ou Lançado.
    
- O Banco de Beats reúne beats, e não um catálogo genérico de instrumentais de outras naturezas.
    
- A compra Premium de beats é demonstrativa, utilizando o Mercado Pago em ambiente de testes.
    
- A negociação exclusiva de beats não possui checkout automatizado nesta versão.
    
- A confirmação de créditos, colaborações e acordos depende de procedimentos próprios; nenhuma dessas relações é presumida por simples cadastro.
    
- O Selo Profissional é uma identificação visual do usuário, sem equivaler a verificação oficial.
    
- Não será adotado um sistema independente de insígnias colecionáveis para edições de eventos.
    
- Consumidores não possuem publicação profissional comum, mas podem utilizar o procedimento excepcional de solicitação de serviços.
    
- As funcionalidades devem preservar privacidade, autoria, licenças e direitos legítimos, inclusive após alterações e encerramentos de registros.
    

Esses limites orientam o desenvolvimento e evitam a inclusão de funcionalidades que não fazem parte das definições consolidadas.

## 7. Resultado do levantamento

O levantamento permitiu organizar as necessidades da Cypher em áreas que abrangem a experiência dos Consumidores, a atuação dos Profissionais e a administração da plataforma.

As principais demandas identificadas envolvem dar visibilidade a trabalhos independentes, facilitar a descoberta de pessoas e oportunidades, organizar produções e trajetórias profissionais, melhorar a comunicação entre usuários e estabelecer mecanismos confiáveis de reconhecimento das contribuições.

Também foram identificadas necessidades de segurança, privacidade, acessibilidade e integridade dos registros, fundamentais para que as funcionalidades operem de forma consistente.

A partir dessas necessidades, foram definidos os documentos de Regras de Negócio, Requisitos Funcionais, Requisitos Não Funcionais e Casos de Uso, que detalham as condições e os comportamentos esperados do sistema.

O levantamento, portanto, estabelece uma visão das necessidades que fundamentam a Cypher e orienta as etapas de modelagem, desenvolvimento e validação do projeto.
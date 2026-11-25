# Cypher — Requisitos Funcionais

**Documento:** `RF-Cypher.md`  
**Sistema:** Cypher — plataforma de networking e profissionalização do hip-hop e do rap underground.  
**Referência normativa:** `RN-Cypher.md` (RN-001 a RN-203).  
**Escopo:** versão final completa da plataforma, conforme as regras de negócio aprovadas para o TCC.

## 1. Apresentação da Cypher

A **Cypher** é uma plataforma digital voltada à **descoberta, divulgação e conexão profissional na cultura hip-hop**, especialmente no rap e em sua cena independente. Reúne artistas, produtores musicais, profissionais da dança, artes visuais, audiovisual, produção técnica, gestão e comunicação cultural em um mesmo ambiente.

Seu propósito não é funcionar como uma rede social genérica: o foco está em **apresentar trabalhos e competências, encontrar profissionais, divulgar obras, beats, eventos e oportunidades e registrar participações e colaborações reconhecidas**.

Uma pessoa autenticada pode descobrir uma faixa, conhecer seus intérpretes e profissionais creditados, consultar seus portfólios, encontrar um beat oferecido por um produtor, acompanhar um evento ou responder a uma oportunidade. O Profissional gerencia suas publicações em um Espaço de Trabalho próprio; o Consumidor explora a cena e interage com o conteúdo autorizado. A Cypher Central explica o funcionamento dos recursos e orienta o uso profissional da plataforma.

### Perfis de acesso

|Ator|Papel na plataforma|
|---|---|
|**Consumidor**|Explora a cena, pesquisa, salva, acompanha profissionais, interage, conversa e participa de eventos conforme as permissões; não publica trabalhos profissionais.|
|**Profissional**|Possui um perfil público único, acessível a usuários autenticados, seleciona profissões e divulga trabalhos e competências, publica conteúdos elegíveis e participa de oportunidades e colaborações.|
|**Organizador(a) de Eventos**|Profissional que, por sua profissão e autorização, cadastra e administra eventos sob sua responsabilidade.|
|**Administrador Geral**|Gerencia acessos administrativos e decisões estruturais da plataforma.|
|**Moderador**|Analisa denúncias, conflitos, recursos e solicitações excepcionais de sua competência.|
|**Editor**|Administra os artigos e indicadores educativos da Cypher Central.|

**Profissões atendidas:** a Cypher contempla as 25 profissões seguintes, sem exigir que todas publiquem obras musicais:

|Área|Profissões|
|---|---|
|**Música**|Rapper; MC; Compositor(a); Letrista; Beatmaker; Produtor(a) Musical; DJ; Freestyleiro|
|**Dança**|B-boy/B-girl; Dançarino(a); Coreógrafo(a)|
|**Artes Visuais**|Grafiteiro(a); Ilustrador(a); Designer Gráfico|
|**Audiovisual**|Fotógrafo(a); Videomaker; Editor(a) de Vídeo|
|**Produção Técnica**|Engenheiro(a) de Áudio; Mixador(a); Masterizador(a)|
|**Gestão e Produção**|Empresário(a); Produtor(a) Cultural; Organizador(a) de Eventos|
|**Comunicação e Cultura**|Criador(a) de Conteúdo; Jornalista Cultural|

Um usuário pode exercer várias profissões em **um único perfil**, mas publicar cada conteúdo exige a capacidade e a autorização pertinentes.

### Elementos centrais do sistema

|Elemento|Significado|
|---|---|
|**Obra / composição**|Criação musical ou letra, distinta de uma gravação.|
|**Fonograma**|Gravação sonora identificável, que pode aparecer em mais de um lançamento.|
|**Lançamento**|Single, EP, álbum ou mixtape que organiza uma ou mais faixas.|
|**Beat**|Instrumental próprio do Banco de Beats, com ofertas e regras de utilização específicas.|
|**Projeto**|Registro de atuação profissional, atividade, equipe ou entregas; não comprova uma Collab por si só.|
|**Portfólio**|Vitrine pessoal que reúne trabalhos próprios e participações reconhecidas.|
|**Evento**|Atividade com realização identificável, organização responsável e regras de participação.|
|**Oportunidade**|Chamada por serviços, profissionais ou colaboração, independente de evento.|
|**Collab formal**|Vínculo entre profissionais, com aceite e conclusão reconhecidos, que pode permitir avaliação.|
|**Selo Profissional**|Identidade visual pessoal vinculada ao profissional e às suas contribuições reconhecidas; não é verificação oficial.|

## 2. Padrão dos requisitos

Cada requisito é identificado por **RF-###**, possui título e descreve uma função observável do sistema. A expressão **“o sistema deve”** estabelece comportamento obrigatório. Os requisitos são agrupados por domínio para que seja possível relacioná-los às Regras de Negócio (RN) e aos testes do projeto, sem repetir políticas de negócio integralmente neste documento.

A disponibilidade de uma função é sempre condicionada ao ator, às permissões, à autoria ou responsabilidade sobre o registro, à privacidade e às restrições aplicáveis. **Todos os módulos internos da Cypher exigem autenticação, inclusive Descoberta, perfis, catálogos, portfólios, arquivos, links compartilhados e Cypher Central.** Sem autenticação, só podem ser acessados os procedimentos necessários a cadastro, login, confirmação de e-mail e recuperação de acesso. A compra Premium de beat descrita aqui é **uma simulação em ambiente de testes**, não uma operação financeira real.

## 3. Requisitos funcionais do sistema

### 1. Cadastro, acesso e gestão de contas

_Regras relacionadas: RN-001 a RN-016._

**RF-001 — Cadastrar contas convencionais.** O sistema deve permitir o cadastro de contas **Consumidor** e **Profissional**, coletando nome, data de nascimento, e-mail, @username e senha, com vulgo opcional e escolha expressa da modalidade.

**RF-002 — Validar cadastro e consentimento.** O sistema deve verificar a elegibilidade etária a partir de 16 anos, a unicidade do e-mail e do @username, os dados obrigatórios e o aceite dos Termos de Uso antes de criar a conta, indicando os impedimentos ao solicitante.

**RF-003 — Aplicar salvaguardas a menores.** O sistema deve identificar contas de 16 e 17 anos e aplicar as restrições correspondentes de exposição pública, contatos, conteúdo e denúncia.

**RF-004 — Confirmar endereço de e-mail.** O sistema deve enviar confirmação por link ou código de uso único válido por 30 minutos, permitir reenvio após 1 minuto, limitar a cinco emissões por hora e invalidar confirmações anteriores.

**RF-005 — Autenticar usuários convencionais.** O sistema deve permitir entrada por e-mail e senha somente para contas autorizadas e com e-mail confirmado, recusando credenciais inválidas ou acessos suspensos.

**RF-006 — Gerenciar sessões.** O sistema deve manter sessões autenticadas por no máximo 24 horas, permitir encerrá-las voluntariamente e limitar temporariamente tentativas excessivas de acesso ou recuperação.

**RF-007 — Alterar ou recuperar a senha.** O sistema deve permitir alteração autenticada e recuperação por e-mail confirmado com código de uso único válido por 30 minutos, exigir senha entre 8 e 128 caracteres e invalidar sessões anteriores após redefinição.

**RF-008 — Alterar e-mail e identificador público.** O sistema deve confirmar o novo e-mail antes da substituição e permitir a mudança do @username para valor disponível conforme intervalo de 30 dias, preservando nomes anteriores e os redirecionamentos de links permitidos.

**RF-009 — Converter Consumidor em Profissional.** O sistema deve possibilitar a conversão na mesma conta, mediante confirmação do titular, seleção de ao menos uma profissão e registro do respectivo tempo de atuação, preservando a identidade e os dados legítimos preexistentes.

**RF-010 — Gerenciar situação e encerramento de conta.** O sistema deve comunicar ao titular restrições ou suspensão, oferecer os meios aplicáveis de contestação e permitir o encerramento confirmado, desativando acessos sem eliminar indevidamente registros compartilhados.

### 2. Perfis, identidade e privacidade

_Regras relacionadas: RN-017 a RN-029._

**RF-011 — Exibir perfil profissional unificado.** O sistema deve disponibilizar um único perfil profissional visível aos usuários autenticados, com nome de exibição, @username, biografia, profissões ativas, trabalhos e participações acessíveis, independentemente da quantidade de profissões exercidas.

**RF-012 — Manter espaço privado do Consumidor.** O sistema deve fornecer ao Consumidor gerenciamento de seus dados e interações pessoais sem disponibilizar perfil profissional pesquisável ou vitrine de autoria.

**RF-013 — Editar apresentação pessoal e profissional.** O sistema deve permitir ao titular atualizar nome de apresentação, vulgo, informações biográficas, experiências, especialidades, equipamentos e outras declarações pertinentes ao perfil.

**RF-014 — Organizar atuações em um só perfil.** O sistema deve apresentar informações e trabalhos em contextos por profissão exercida, mantendo identidade e biografia compartilhadas e distinguindo a função exercida em cada contribuição.

**RF-015 — Configurar privacidade de dados e conteúdos.** O sistema deve permitir restringir ou divulgar cidade, contato e registros individuais conforme opções autorizadas, sem tornar automaticamente público todo conteúdo de um perfil público.

**RF-016 — Exibir trabalhos e participações separadamente.** O sistema deve distinguir registros administrados pelo titular daqueles em que ele participou, identificando sua função sem presumir propriedade ou poder de edição.

**RF-017 — Exibir créditos de profissionais externos.** O sistema deve permitir apresentar créditos textuais de pessoas sem conta e oferecer vinculação futura somente após confirmação apropriada, sem associação automática por semelhança de nomes.

**RF-018 — Registrar vínculos de representação.** O sistema deve permitir solicitar, reconhecer e encerrar vínculos profissionais de representação, respeitando a manifestação das partes e sem conceder acesso à conta do representado.

**RF-019 — Organizar configurações do titular.** O sistema deve disponibilizar edição de conta e segurança, identidade pública, atuação, portfólio, privacidade, preferências e contatos, mantendo persistentes as alterações autorizadas.

### 3. Profissões, atuações e permissões

_Regras relacionadas: RN-030 a RN-046._

**RF-020 — Disponibilizar catálogo profissional oficial.** O sistema deve apresentar as **25 profissões em sete áreas** previstas pela Cypher e impedir que texto livre ou profissão excluída conceda capacidades profissionais.

**RF-021 — Selecionar e combinar profissões.** O sistema deve permitir ao Profissional adicionar e manter uma ou mais profissões oficiais, exigindo pelo menos uma ativa e organizando suas atuações sem criar contas ou perfis adicionais.

**RF-022 — Acessar criação por modalidade autorizada.** O sistema deve apresentar uma entrada central de publicação com os tipos de conteúdo compatíveis com as profissões ativas do usuário, conduzindo ao cadastro específico de cada modalidade.

**RF-023 — Registrar experiência individual.** O sistema deve exigir tempo de atuação para cada profissão selecionada no cadastro, na conversão e nas inclusões posteriores, deixando complementos de trajetória como opcionais.

**RF-024 — Configurar vertentes e modalidades pertinentes.** O sistema deve disponibilizar as 16 vertentes pessoais apenas a Rappers e as modalidades de sangue, conhecimento e estúdio/cypher a Freestyleiros, sem confundir esses dados com o gênero de uma obra.

**RF-025 — Controlar alterações do conjunto profissional.** O sistema deve permitir a primeira mudança após a seleção inicial sem espera e bloquear mudanças ordinárias subsequentes antes de 30 dias completos da última alteração efetivada.

**RF-026 — Solicitar exceção profissional.** O sistema deve receber justificativa para alteração antecipada, encaminhá-la à autoridade competente e apresentar ao titular a decisão, aplicando apenas autorizações aprovadas.

**RF-027 — Habilitar criação por modalidade.** O sistema deve oferecer o cadastro de música, composição, letra, beat, evento, projeto ou conteúdo visual/audiovisual conforme as profissões ativas e a matriz de capacidades; por exemplo, **Beatmaker** e **Produtor Musical** podem criar beats próprios, e a gestão de eventos compete a **Organizador(a) de Eventos**.

**RF-028 — Validar autorizações do objeto.** O sistema deve conferir, para cada operação protegida, profissão compatível quando necessária, relação legítima com o registro e autorização do titular, impedindo edição ou exclusão de conteúdo alheio apenas por crédito.

**RF-029 — Preservar histórico após troca de profissão.** O sistema deve conservar trabalhos, créditos e vínculos anteriores quando uma profissão for removida, impedindo novos registros incompatíveis, mas permitindo a manutenção dos antigos quando a autorização persistir.

### 4. Obras musicais, lançamentos e créditos

_Regras relacionadas: RN-047 a RN-067._

**RF-030 — Cadastrar composições e letras.** O sistema deve permitir registrar composições musicais, instrumentais ou com letra, bem como letras independentes, com autoria, coautoria, descrição e visibilidade próprias.

**RF-031 — Cadastrar fonogramas.** O sistema deve permitir registrar gravações sonoras identificáveis com título, participantes, créditos, mídia autorizada e ligação a uma ou mais composições pertinentes, sem confundir fonograma e obra intelectual.

**RF-032 — Relacionar composições e gravações.** O sistema deve vincular uma mesma composição a diferentes fonogramas e tratar nova gravação como registro próprio, mantendo a identidade das gravações anteriores.

**RF-033 — Organizar lançamentos musicais.** O sistema deve permitir cadastrar e consultar singles, EPs, álbuns e mixtapes, associando faixas e definindo sua ordem em cada lançamento.

**RF-034 — Reutilizar faixas existentes.** O sistema deve permitir incluir uma gravação já cadastrada em novos EPs, álbuns ou mixtapes, sem duplicar o fonograma, perder o lançamento anterior ou modificar seus créditos e identificadores.

**RF-035 — Gerenciar ficha e informações técnicas.** O sistema deve apresentar a ficha de cada obra com título, responsáveis, papel dos participantes, capa, gênero, descrição e dados técnicos disponíveis, incluindo ISRC e ISWC opcionais em seus objetos corretos.

**RF-036 — Registrar e validar créditos.** O sistema deve permitir indicar colaboradores por função, notificar pessoas vinculadas e possibilitar reconhecimento, rejeição ou contestação de crédito atribuído por terceiro, distinguindo menção de participação confirmada.

**RF-037 — Vincular trabalhos correlatos.** O sistema deve relacionar gravações, beats, videoclipes, imagens e outros registros correspondentes, mantendo a identidade, o acesso e os direitos de cada origem.

**RF-038 — Comprovar lançamento público.** O sistema deve registrar e consultar evidência de lançamento efetivo, por áudio autorizado acessível aos usuários autenticados da Cypher ou publicação externa verificável correspondente ao trabalho, sem usar o mero cadastro como prova de lançamento.

**RF-039 — Editar lançamentos preservando histórico.** O sistema deve permitir correções e alterações autorizadas de metadados e listas de faixas, conservar versões e créditos pertinentes e impedir substituição silenciosa de gravações distintas.

**RF-040 — Consultar catálogo de obras e discografia.** O sistema deve oferecer aos usuários autenticados acesso a obras e lançamentos permitidos, com pesquisa, filtros compatíveis, ficha individual e distinção entre trabalhos próprios e participações.

### 5. Banco de Beats e aquisição demonstrativa

_Regras relacionadas: RN-068 a RN-089._

**RF-041 — Cadastrar e administrar beats.** O sistema deve permitir a Beatmakers e Produtores Musicais habilitados registrar e editar beats próprios, com identificação, capa, descrição, autoria, BPM, tonalidade, gênero e duração quando disponíveis.

**RF-042 — Disponibilizar prévias sonoras.** O sistema deve reproduzir a prévia autorizada do beat sem liberar automaticamente os arquivos completos, stems ou entregáveis exclusivos de uma modalidade.

**RF-043 — Cadastrar ofertas distintas.** O sistema deve permitir associar várias ofertas ao mesmo beat, incluindo **Free Use** e **Premium não exclusiva**, cada uma com condições, limites, entregáveis e preço quando aplicável.

**RF-044 — Exibir e aceitar termos de Free Use.** O sistema deve apresentar as condições concretas do uso gratuito e registrar a ciência ou aceitação necessária antes de disponibilizar materiais abrangidos pela oferta, sem representar Free Use como cessão irrestrita.

**RF-045 — Gerenciar ofertas e disponibilidade.** O sistema deve permitir ao responsável habilitado ativar, alterar ou retirar ofertas, preservando termos de aquisições anteriores e demonstrando corretamente quando Free Use e Premium coexistem.

**RF-046 — Exibir exclusividade como negociação separada.** O sistema deve informar a possibilidade e as condições de contato para propostas exclusivas, sem oferecer checkout automatizado de exclusividade ou tratar aquisição não exclusiva como venda exclusiva.

**RF-047 — Pesquisar e filtrar beats.** O sistema deve permitir a usuários autenticados localizar beats por título, produtor, gênero, BPM, tonalidade, duração, preço, modalidades, disponibilidade e arquivos oferecidos, conforme os dados efetivamente cadastrados.

**RF-048 — Exibir ficha comercial completa.** O sistema deve apresentar prévia, informações musicais, créditos, produtor e ofertas do beat, explicitando o que cada modalidade permite e quais arquivos são disponibilizados.

**RF-049 — Criar pedido de demonstração.** O sistema deve permitir que comprador autenticado selecione **uma oferta Premium não exclusiva por pedido**, registrando beat, comprador, preço e versão dos termos no momento da simulação.

**RF-050 — Processar pagamento pelo Mercado Pago.** O sistema deve encaminhar a aquisição Premium ao checkout do Mercado Pago, vinculando a transação ao pedido e às condições aceitas.

**RF-051 — Verificar resultado do pedido.** O sistema deve consultar ou receber confirmação confiável do resultado de teste, distinguir transações aprovadas, pendentes, recusadas, canceladas ou expiradas e não considerar a simples página de retorno como aprovação.

**RF-052 — Evitar concessões duplicadas.** O sistema deve processar confirmações repetidas ou fora de ordem sem criar licença ou entrega duplicada para a mesma operação validamente aprovada.

**RF-053 — Emitir licença demonstrativa.** O sistema deve gerar, após aprovação de teste válida, documento individualizado com comprador, beat, produtor, modalidade, termos aceitos e indicação inequívoca de que se trata de simulação sem efeito de venda real.

**RF-054 — Entregar arquivos e histórico autorizados.** O sistema deve disponibilizar os arquivos previstos na oferta e a licença demonstrativa em **Minhas Compras**, com histórico persistente e acesso restrito ao adquirente autorizado.

**RF-055 — Tratar restrições comerciais e denúncias.** O sistema deve permitir pausar ofertas ou restringir beat sob análise quando existir conflito de direitos ou denúncia, sem apagar automaticamente licenças, aquisições demonstrativas e históricos anteriores.

### 6. Espaço de Trabalho, projetos e galerias

_Regras relacionadas: RN-090 a RN-098._

**RF-056 — Organizar acervo profissional.** O sistema deve oferecer ao Profissional um Espaço de Trabalho com **Meus Trabalhos** e **Participações**, reunindo registros compatíveis com suas profissões e identificando a relação do titular com cada item.

**RF-057 — Filtrar acervo por atuação e modalidade.** O sistema deve permitir consultar e organizar o acervo por profissão efetivamente exercida, natureza do trabalho e vínculo, sem exigir filtros musicais em atividades não musicais.

**RF-058 — Cadastrar projetos profissionais.** O sistema deve permitir criar e editar projetos e experiências de diferentes áreas, registrando objetivos, período, papel, equipe, entregas, resultados e materiais de apoio pertinentes.

**RF-059 — Distinguir declaração e confirmação.** O sistema deve identificar resultados e participações autodeclarados separadamente dos vínculos confirmados, sem transformar automaticamente projetos cadastrados em Collabs ou créditos validados.

**RF-060 — Publicar conteúdos e coleções multimídia.** O sistema deve permitir a profissões habilitadas registrar e apresentar trabalhos de imagem, fotografia, grafite, ilustração, vídeo, dança, produção técnica e outros formatos pertinentes, incluindo galerias e álbuns.

**RF-061 — Vincular mídias e trabalhos existentes.** O sistema deve permitir incorporar o mesmo trabalho autorizado em diferentes projetos e galerias, sem copiar indevidamente o registro de origem ou atribuir nova autoria.

**RF-062 — Administrar visibilidade e retirada.** O sistema deve permitir manter material reservado, retirar itens de coleções e modificar sua apresentação sem apagar automaticamente mídias originais ou créditos compartilhados.

### 7. Portfólio profissional

_Regras relacionadas: RN-099 a RN-107._

**RF-063 — Apresentar portfólio multimodal único.** O sistema deve exibir uma vitrine profissional que reúna trabalhos próprios e participações confirmadas em formatos musicais, visuais, audiovisuais, técnicos, textuais e culturais, identificando o papel do titular.

**RF-064 — Editar portfólio em modo Manual.** O sistema deve permitir escolher, destacar, ordenar, agrupar e ocultar trabalhos elegíveis, sem editar ou excluir os registros de origem.

**RF-065 — Atualizar portfólio em modo Inteligente.** O sistema deve incorporar automaticamente trabalhos próprios elegíveis e participações confirmadas, respeitando autorizações, papéis profissionais e alterações da origem.

**RF-066 — Respeitar ocultações persistentes.** O sistema deve manter excluídos da vitrine os itens ocultados pelo profissional, inclusive após atualizações automáticas e alternância de modo, até que sejam explicitamente reexibidos.

**RF-067 — Oferecer moldes de apresentação.** O sistema deve disponibilizar moldes pertinentes às áreas e profissões, alterando somente a disposição visual dos trabalhos, independentemente do modo de seleção.

**RF-068 — Salvar escolhas e apresentar prévia.** O sistema deve persistir modo, molde, itens selecionados, ordem, destaques e visibilidade, permitindo conferir o resultado antes de sua apresentação aos demais usuários autenticados.

**RF-069 — Consultar portfólio autorizado.** O sistema deve permitir ao usuário autenticado abrir o catálogo e as fichas visíveis do profissional, preservando a separação entre autoria, participação e privacidade dos registros.

### 8. Selos Profissionais

_Regras relacionadas: RN-025 a RN-026 e RN-113 a RN-117._

**RF-070 — Criar selo no editor nativo.** O sistema deve permitir a cada conta Profissional criar e manter **um Selo Profissional ativo**, associado à identidade do usuário, com edição e prévia visual.

**RF-071 — Solicitar uso excepcional de identidade externa.** O sistema deve receber pedido de marca própria para análise administrativa e impedir sua utilização como selo aprovado antes da autorização competente.

**RF-072 — Exibir selo conforme a contribuição.** O sistema deve associar selo pessoal a trabalhos próprios ou créditos confirmados, indicando a função correspondente, como beat, arte, mixagem ou organização, sem substituir a identificação textual do profissional.

**RF-073 — Gerenciar substituição e versões.** O sistema deve permitir substituir o selo ativo, registrar as versões e preservar o histórico dos vínculos do titular com trabalhos anteriores, sem criar insígnias autônomas por edição de evento.

**RF-074 — Moderar identidade visual indevida.** O sistema deve permitir denunciar e restringir selos que imitem terceiros, a identidade oficial da Cypher ou símbolos que sugiram verificação inexistente.

### 9. Eventos e experiências pós-evento

_Regras relacionadas: RN-118 a RN-135._

**RF-075 — Cadastrar eventos profissionais.** O sistema deve permitir ao Organizador de Eventos autorizado criar e editar eventos com título, categoria, descrição, cartaz, data, horário, formato/local e regras de participação.

**RF-076 — Organizar edições.** O sistema deve permitir relacionar realizações sucessivas de um evento, mantendo datas, participantes, presença e resultados próprios de cada edição.

**RF-077 — Configurar admissões e vagas.** O sistema deve permitir definir eventos de participação aberta ou sujeitos à aprovação, informando critérios e limites de vagas pertinentes.

**RF-078 — Registrar interesse e salvamentos.** O sistema deve permitir a usuários elegíveis salvar eventos e demonstrar interesse, mantendo tais ações independentes de inscrição, confirmação ou presença.

**RF-079 — Solicitar inscrição e acompanhar situação.** O sistema deve permitir a inscrição conforme modalidade do evento e informar ao interessado se seu pedido está aguardando aprovação, foi aceito, recusado ou cancelado.

**RF-080 — Gerenciar participantes.** O sistema deve permitir ao organizador autorizado consultar pedidos, aceitar ou recusar solicitações, aplicar vagas e registrar participações confirmadas.

**RF-081 — Registrar comparecimento efetivo.** O sistema deve permitir ao responsável registrar presença ou participação comprovada e distingui-la de interesse, inscrição e confirmação prévia.

**RF-082 — Atualizar ou cancelar eventos.** O sistema deve permitir alterar condições, data e local ou cancelar evento, preservando as informações históricas pertinentes e comunicando as mudanças aos afetados.

**RF-083 — Consultar eventos por lista e localização.** O sistema deve disponibilizar aos usuários autenticados pesquisa e filtros de eventos e permitir visualização em lista ou mapa quando houver localização confiável, sem inventar pontos para eventos sem endereço adequado.

**RF-084 — Apresentar histórico e indicadores.** O sistema deve exibir organizadores e participantes com vínculos válidos e contabilizar separadamente interessados, inscritos, confirmados e presentes.

**RF-085 — Avaliar experiência pós-evento.** O sistema deve permitir aos participantes elegíveis registrar experiência positiva ou negativa, exigindo justificativa nas avaliações negativas e impedindo feedback de comparecimento sem participação reconhecida.

**RF-086 — Tratar reclamações ao organizador.** O sistema deve encaminhar inicialmente reclamações sobre organização ao responsável pelo evento, registrar seu reconhecimento ou contestação e, havendo contestação, permitir a análise por Moderador com evidências pertinentes.

**RF-087 — Registrar decisão e recurso.** O sistema deve comunicar decisões sobre reclamações, permitir recurso cabível e aplicar eventual medida de forma fundamentada, sem punir automaticamente o organizador por reconhecer uma falha.

### 10. Oportunidades e pedidos de serviço

_Regras relacionadas: RN-044 a RN-046 e RN-136 a RN-141._

**RF-088 — Publicar oportunidades profissionais.** O sistema deve permitir a profissionais habilitados criar chamadas para serviços, vagas ou colaborações, com objetivo, responsabilidades, requisitos e condições relevantes, separadamente dos eventos.

**RF-089 — Buscar e consultar oportunidades.** O sistema deve disponibilizar aos usuários autenticados pesquisa, filtros e ficha de oportunidades acessíveis, identificando responsável, finalidade, condições e possibilidades de contato ou candidatura.

**RF-090 — Candidatar-se a oportunidades.** O sistema deve permitir que profissionais interessados se candidatem conforme os requisitos e acompanhem as decisões do responsável pela chamada.

**RF-091 — Gerenciar candidaturas e encerramento.** O sistema deve permitir ao autor autorizado analisar candidaturas, comunicar seleção ou recusa e encerrar a oportunidade sem apagar indevidamente compromissos preexistentes.

**RF-092 — Receber pedidos excepcionais de Consumidores.** O sistema deve permitir ao Consumidor solicitar orientação por profissional mediador ou submeter pedido de serviço para triagem administrativa, sem publicação automática nem habilitação de poderes profissionais gerais.

**RF-093 — Confirmar acordos de oportunidade.** O sistema deve registrar a aceitação expressa das mesmas condições por todas as partes quando houver formalização de acordo, distinguindo-a de simples contato, interesse ou candidatura.

### 11. Colaborações formais e reputação profissional

_Regras relacionadas: RN-142 a RN-159._

**RF-094 — Propor colaboração entre profissionais.** O sistema deve permitir criar proposta formal entre duas contas Profissionais distintas, indicando objeto, funções e condições relevantes, sem transformar automaticamente outros integrantes de projeto em participantes do vínculo.

**RF-095 — Responder convite de colaboração.** O sistema deve permitir aceitar ou recusar a proposta, registrar a resposta e expirar convites sem aceite após **30 dias corridos**.

**RF-096 — Registrar execução e conclusão.** O sistema deve permitir às partes solicitar e confirmar a conclusão da colaboração separadamente, exigindo confirmação bilateral ou decisão excepcional fundamentada da moderação.

**RF-097 — Contestar conclusão da colaboração.** O sistema deve permitir registrar discordância sobre entrega ou conclusão e impedir a liberação de avaliação enquanto a controvérsia não for resolvida validamente.

**RF-098 — Verificar lançamento quando exigido.** O sistema deve consultar evidência válida de lançamento de obra quando a colaboração depender dessa entrega, sem considerar o simples cadastro de obra como conclusão comprovada.

**RF-099 — Habilitar avaliação entre participantes.** O sistema deve oferecer a cada parte **uma avaliação facultativa** da outra após conclusão válida, dentro do prazo de **14 dias corridos**.

**RF-100 — Registrar critérios de avaliação.** O sistema deve receber notas inteiras de 1 a 5 para comunicação, cumprimento de combinados e trabalho em equipe, com comentário opcional, e calcular a média individual desses critérios.

**RF-101 — Aplicar avaliação duplo-cega.** O sistema deve manter notas ocultas até ambas as avaliações serem enviadas ou terminar o prazo de 14 dias, sem revelar a avaliação do outro antecipadamente.

**RF-102 — Calcular e exibir reputação.** O sistema deve apresentar **Ainda sem avaliações** quando não houver notas válidas, **Reputação em formação** com um ou dois avaliadores distintos e média pública somente com pelo menos três profissionais avaliadores diferentes, ponderados igualmente.

**RF-103 — Recalcular após invalidação.** O sistema deve retirar avaliações anuladas dos cálculos e atualizar a reputação, ocultando a média se o número de avaliadores válidos voltar a menos de três.

**RF-104 — Gerenciar privacidade e moderação.** O sistema deve ocultar publicamente vínculos de colaboração por padrão, divulgar detalhes apenas com consentimento de ambas as partes e permitir revisar denúncias de avaliações e vínculos fraudulentos.

### 12. Interações e comunicação

_Regras relacionadas: RN-160 a RN-169._

**RF-105 — Seguir, curtir e salvar.** O sistema deve disponibilizar relações distintas de acompanhamento, curtida de perfil/conteúdo e salvamento, permitindo desfazê-las e evitando várias relações ativas iguais por usuário e objeto.

**RF-106 — Exibir coleções pessoais de interações.** O sistema deve permitir consultar conteúdos salvos e profissionais seguidos conforme o tipo de conta, mantendo a área do Consumidor privada e sem transformar seus dados em vitrine profissional.

**RF-107 — Publicar e administrar comentários.** O sistema deve permitir comentários nos conteúdos habilitados, edição ou exclusão dos próprios comentários e análise administrativa de manifestações denunciadas.

**RF-108 — Bloquear ou desbloquear contas.** O sistema deve permitir impedir novas mensagens, acompanhamentos e interações incompatíveis entre usuários bloqueados e não restabelecer automaticamente vínculos removidos ao desbloquear.

**RF-109 — Conversar por mensagens privadas.** O sistema deve permitir envio e consulta de mensagens entre participantes autorizados, com histórico persistente e indicação de leitura quando aplicável.

**RF-110 — Aplicar preferências de contato.** O sistema deve verificar bloqueios, restrições do destinatário e permissão para receber mensagens de Consumidores antes de liberar novo contato.

**RF-111 — Ocultar conversa sem apagar a outra parte.** O sistema deve permitir retirar uma conversa da própria visualização sem excluir arbitrariamente o histórico e as mensagens pertencentes aos demais participantes.

**RF-112 — Restringir acesso às conversas.** O sistema deve limitar a consulta de mensagens aos participantes autorizados e, nas situações excepcionais de denúncia, disponibilizar apenas as evidências pertinentes aos administradores competentes.

### 13. Notificações e lembretes

_Regras relacionadas: RN-170 a RN-175._

**RF-113 — Gerar notificações de fatos efetivos.** O sistema deve produzir avisos por mensagens, interações, créditos pendentes, eventos, solicitações e decisões administrativas reais, evitando múltiplos avisos indevidos para o mesmo evento.

**RF-114 — Consultar notificações persistentes.** O sistema deve manter a caixa de notificações da conta entre sessões, permitindo visualizar seu conteúdo e estado de leitura sem expiração automática por tempo.

**RF-115 — Marcar como lida e remover.** O sistema deve permitir marcar avisos como lidos ou não lidos e excluir individualmente ou limpar a caixa por ação expressa, distinguindo leitura de remoção.

**RF-116 — Configurar preferências de recebimento.** O sistema deve permitir escolher categorias opcionais de notificação, preservando avisos essenciais de segurança e decisões administrativas quando necessários.

**RF-117 — Agendar lembretes de eventos.** O sistema deve programar lembretes de eventos acompanhados **24 horas antes e no dia da realização**, respeitando fuso e preferências, e atualizar ou cancelar lembretes após mudanças no evento.

**RF-118 — Abrir contexto de notificação com permissão.** O sistema deve encaminhar o usuário ao registro associado apenas quando sua autorização de acesso permanecer válida.

### 14. Descoberta, pesquisa e compartilhamento

_Regras relacionadas: RN-176 a RN-181._

**RF-119 — Apresentar Descoberta como página inicial.** O sistema deve apresentar aos usuários autenticados seleções relevantes de profissionais, obras, beats, eventos, projetos e oportunidades, com informações suficientes para acessar a ficha ou perfil correspondente.

**RF-120 — Pesquisar conteúdos de diferentes domínios.** O sistema deve permitir ao usuário autenticado localizar pessoas por nome ou @username e encontrar obras, beats, eventos e projetos mediante pesquisa textual apropriada.

**RF-121 — Configurar interesses de descoberta.** O sistema deve permitir ao usuário definir e atualizar interesses culturais e preferências de região aproximada sem tornar pública sua localização ou confundir interesses com profissões ativas.

**RF-122 — Oferecer filtros específicos por conteúdo.** O sistema deve disponibilizar filtros de profissão, gênero musical, características do beat, localização, período e tipo de publicação quando compatíveis com o domínio pesquisado.

**RF-123 — Personalizar recomendações.** O sistema deve utilizar interesses declarados, profissionais seguidos, proximidade aproximada autorizada, atualidade, pertinência e diversidade para organizar recomendações sem equipará-las a avaliações de competência.

**RF-124 — Incluir usuários com pouco histórico.** O sistema deve apresentar conteúdos úteis a recém-chegados e contemplar profissionais emergentes, sem depender exclusivamente de seguidores ou curtidas.

**RF-125 — Compartilhar referências estáveis.** O sistema deve fornecer endereços compartilháveis de perfis e registros permitidos, cuja abertura na Cypher exige autenticação e autorização vigentes, respeitando visibilidade, bloqueio, moderação e redirecionamento válido de @username antigo.

### 15. Cypher Central

_Regras relacionadas: RN-182 a RN-188._

**RF-126 — Consultar orientações e guias.** O sistema deve oferecer aos usuários autenticados a Cypher Central com artigos sobre primeiros passos, profissões, publicações, obras, eventos, segurança, parcerias e uso responsável da plataforma.

**RF-127 — Pesquisar e navegar na Central.** O sistema deve permitir localizar guias por texto, categoria e relevância, distinguindo a busca educativa da busca geral de profissionais e conteúdos.

**RF-128 — Administrar ciclo editorial.** O sistema deve permitir a Editores e responsáveis competentes criar, revisar, atualizar, publicar e arquivar artigos, mantendo autoria e histórico editorial.

**RF-129 — Avaliar utilidade de artigos.** O sistema deve permitir classificar artigo como **Útil** ou **Não útil**, exigindo motivo pertinente para retorno negativo e limitando avaliações duplicadas indevidas.

**RF-130 — Apresentar artigos recentes.** O sistema deve listar artigos efetivamente publicados pela ordem pertinente de publicação ou atualização, abrindo o registro correto e apresentando ausência de conteúdo quando necessário.

**RF-131 — Analisar qualidade do conhecimento.** O sistema deve apresentar ao responsável editorial dados de visualizações, avaliações, motivos de insatisfação e evolução por artigo, além de buscas sem resultado para orientar revisão de conteúdo.

### 16. Administração, moderação e suporte

_Regras relacionadas: RN-189 a RN-203._

**RF-132 — Autenticar contas administrativas separadamente.** O sistema deve disponibilizar autenticação administrativa própria, distinta do cadastro público, sem criar perfil artístico ou capacidades profissionais para administradores.

**RF-133 — Provisionar e gerenciar administradores.** O sistema deve permitir o provisionamento inicial controlado e, pelo Administrador Geral, convidar, atribuir, revisar ou revogar acessos administrativos.

**RF-134 — Aplicar competências por papel.** O sistema deve limitar as operações administrativas a **Administrador Geral**, **Moderador** e **Editor**, conforme suas atribuições, impedindo elevação indevida de privilégio e autoaprovação de solicitações.

**RF-135 — Receber solicitações e suporte.** O sistema deve registrar pedidos de ajuda, sugestões de catálogo, exceções profissionais, denúncias e recursos, mantendo solicitante, assunto, evidências pertinentes e histórico de tramitação.

**RF-136 — Analisar e publicar alterações de catálogo.** O sistema deve encaminhar propostas de novas profissões, vertentes ou gêneros ao responsável competente e disponibilizar a opção global apenas após autorização válida.

**RF-137 — Registrar denúncias categorizadas.** O sistema deve permitir denúncia de perfil, comentário, trabalho, beat, evento, selo ou conduta por motivos como assédio, discriminação, fraude, falsidade de identidade, plágio e risco a menores.

**RF-138 — Tramitar denúncia e comunicar decisão.** O sistema deve diferenciar solicitações **pendentes**, **em análise**, **resolvidas** e **arquivadas**, atribuir responsável e notificar as partes de decisões pertinentes sem revelar dados protegidos.

**RF-139 — Aplicar medidas de moderação proporcionais.** O sistema deve permitir, sob competência adequada, advertir, ocultar, remover, restringir, suspender ou excluir, registrando o fundamento e sem punir automaticamente pela quantidade de denúncias.

**RF-140 — Priorizar situações graves e receber recursos.** O sistema deve permitir destacar ocorrências de risco elevado, especialmente envolvendo menores, e receber esclarecimentos e contestações cabíveis contra decisões administrativas.

**RF-141 — Registrar auditoria de ações sensíveis.** O sistema deve manter histórico de decisões e alterações de privilégio, com autor, objeto, data, justificativa e resultado, disponível somente aos responsáveis autorizados.

**RF-142 — Restringir acesso a informações protegidas.** O sistema deve controlar o acesso de administradores a dados pessoais, evidências denunciadas e mensagens privadas, limitando a consulta à finalidade e competência comprovadas.

### 17. Integridade funcional entre módulos

_Regras relacionadas: RN-108 a RN-112 e RN-203._

**RF-143 — Reutilizar registros sem duplicação.** O sistema deve exibir a mesma obra, beat, projeto, crédito ou interação em fichas, perfis, portfólios e listagens a partir de seu registro original, evitando duplicatas criadas pela apresentação em várias áreas.

**RF-144 — Validar autorização em todas as operações.** O sistema deve exigir autenticação e aplicar as regras de acesso também a consultas, links diretos, downloads, edições e solicitações de exclusão, independentemente de a interface exibir o comando correspondente.

**RF-145 — Propagar mudanças legítimas de visibilidade.** O sistema deve refletir alterações de privacidade, suspensão, moderação e retirada nos lugares onde o conteúdo é referenciado, sem apagar indevidamente direitos ou créditos históricos.

**RF-146 — Distinguir fatos de declarações.** O sistema deve apresentar separadamente interesse, inscrição, presença, crédito mencionado, crédito confirmado, Collab concluída e compra demonstrativa, sem transformar qualquer deles automaticamente em prova de outra situação.

## 4. Critérios de interpretação e consistência

1. **Permissão não se presume:** ver uma publicação, receber crédito ou possuir uma profissão não autoriza modificar ou distribuir o conteúdo de terceiros.
    
2. **Cadastro não comprova fato externo:** registrar obra, projeto, presença, compra demonstrativa ou relação profissional não equivale a confirmar lançamento, comparecimento, pagamento real ou contratação.
    
3. **Objetos distintos permanecem distintos:** composição, gravação, lançamento, beat, evento, oportunidade, projeto, crédito e avaliação não se substituem nem se duplicam por serem relacionados.
    
4. **Conteúdos privados permanecem protegidos:** os requisitos de busca, descoberta, links, portfólio, mensagens e arquivos operam sobre informações que o usuário tem autorização para acessar.
    
5. **Público não significa anônimo:** um registro ou perfil público pode ser consultado apenas por usuários autenticados, sujeitos às permissões vigentes.
    

## 5. Correspondência com as Regras de Negócio

A tabela relaciona cada conjunto funcional à referência de regras de negócio. Os números de RF e RN são independentes, porque um requisito pode atender a mais de uma política.

|Área funcional|RF|Referência RN|
|---|---|---|
|Cadastro, acesso e gestão de contas|RF-001 a RF-010|RN-001 a RN-016|
|Perfis, identidade e privacidade|RF-011 a RF-019|RN-017 a RN-029|
|Profissões, atuações e permissões|RF-020 a RF-029|RN-030 a RN-046|
|Obras musicais, lançamentos e créditos|RF-030 a RF-040|RN-047 a RN-067|
|Banco de Beats e aquisição demonstrativa|RF-041 a RF-055|RN-068 a RN-089|
|Espaço de Trabalho, projetos e galerias|RF-056 a RF-062|RN-090 a RN-098|
|Portfólio profissional|RF-063 a RF-069|RN-099 a RN-107|
|Selos Profissionais|RF-070 a RF-074|RN-025 a RN-026 e RN-113 a RN-117|
|Eventos e experiências pós-evento|RF-075 a RF-087|RN-118 a RN-135|
|Oportunidades e pedidos de serviço|RF-088 a RF-093|RN-044 a RN-046 e RN-136 a RN-141|
|Colaborações formais e reputação profissional|RF-094 a RF-104|RN-142 a RN-159|
|Interações e comunicação|RF-105 a RF-112|RN-160 a RN-169|
|Notificações e lembretes|RF-113 a RF-118|RN-170 a RN-175|
|Descoberta, pesquisa e compartilhamento|RF-119 a RF-125|RN-176 a RN-181|
|Cypher Central|RF-126 a RF-131|RN-182 a RN-188|
|Administração, moderação e suporte|RF-132 a RF-142|RN-189 a RN-203|
|Integridade funcional entre módulos|RF-143 a RF-146|RN-108 a RN-112 e RN-203|

**Total:** 146 requisitos funcionais identificados de RF-001 a RF-146, organizados em 17 áreas.
# Cypher — Regras de Negócio

**Escopo:** regras gerais do sistema final Cypher: contas, perfis, profissões, obras, beats, projetos, portfólios, selos, eventos, oportunidades, colaborações, reputação, comunicação, notificações, descoberta, Cypher Central e administração.  
**Critério:** regras objetivas de negócio, uma condição por assunto e sem reproduzir procedimentos técnicos ou detalhes de interface. O documento representa a **versão final completa** da Cypher.

## 1. Identidade, contas e elegibilidade

**RN-001 — Modalidades de conta.** O cadastro convencional distingue **Consumidor** e **Profissional**. Cargos administrativos são acessos separados e não constituem profissão ou terceira modalidade de cadastro público.

**RN-002 — Idade e salvaguardas.** A idade mínima para utilização da Cypher é de **16 anos**. Usuários de 16 e 17 anos recebem salvaguardas reforçadas de privacidade, exposição, contato, conteúdo e denúncia.

**RN-003 — Consentimento cadastral.** Criar conta depende de aceitação expressa da versão vigente dos Termos de Uso e ciência da Política de Privacidade, com registro da manifestação.

**RN-004 — Identidade cadastral básica.** Conta convencional exige nome, nascimento, e-mail, @username, senha e modalidade. O vulgo é opcional; nascimento não pode ser alterado livremente para burlar as regras etárias.

**RN-005 — Identidade persistente.** Cada conta possui identificador interno único e estável. Nome, vulgo, @username, profissão, e-mail ou configuração de apresentação podem mudar sem apagar vínculos legítimos preexistentes.

**RN-006 — Identificador público.** O **@username** é único, tem de **3 a 24 caracteres** e admite letras sem acento, números, ponto e sublinhado; não diferencia maiúsculas/minúsculas e não pode usar nomes reservados.

**RN-007 — Troca de @username.** A alteração do @username exige novo nome disponível e intervalo mínimo de **30 dias** entre alterações concluídas; nomes anteriores permanecem reservados e links antigos só redirecionam quando o destino continuar acessível.

**RN-008 — E-mail exclusivo e confirmado.** Cada e-mail pertence a no máximo uma conta convencional; a autenticação exige sua confirmação. A alteração do endereço só se conclui após validar o novo e-mail.

**RN-009 — Autenticação e acesso.** A navegação, a pesquisa, a consulta a perfis e conteúdos, a abertura de links compartilhados e a utilização dos módulos internos da Cypher exigem **sessão autenticada válida, conta autorizada e e-mail confirmado**. Sem autenticação, são permitidos exclusivamente os procedimentos necessários ao cadastro, login, confirmação de e-mail e recuperação de acesso, sem acesso à Descoberta, aos catálogos, perfis, arquivos ou à Cypher Central. A autenticação administrativa não concede privilégios convencionais nem vice-versa.

**RN-010 — Confirmação temporária.** O e-mail é confirmado por código ou link de uso único, válido por **30 minutos**; reenvios exigem intervalo mínimo de **1 minuto** e admitem no máximo **5 emissões por hora**, invalidando confirmações anteriores.

**RN-011 — Senha e recuperação.** A senha convencional contém **8 a 128 caracteres**; sua alteração exige verificação de identidade, e a recuperação usa o e-mail confirmado e código de uso único válido por **30 minutos**. Trocar ou redefinir senha invalida as sessões anteriores.

**RN-012 — Sessões e tentativas.** O login convencional utiliza e-mail e senha, com sessões de validade máxima de **24 horas**. Logout revoga a sessão, e tentativas excessivas de acesso ou recuperação são temporariamente limitadas.

**RN-013 — Padrão de visibilidade da conta.** O perfil Consumidor começa privado e não constitui vitrine profissional; o perfil Profissional é visível por padrão **a usuários autenticados**, respeitando a privacidade individual e as proteções reforçadas para menores. Essa visibilidade não autoriza consulta sem autenticação.

**RN-014 — Conversão consciente.** Consumidor pode tornar-se Profissional **na mesma conta**, mediante confirmação expressa, escolha de profissão e preenchimento do tempo de atuação, sem perder identidade ou histórico. Não há reversão automática.

**RN-015 — Estados e restrições da conta.** Contas distinguem confirmação pendente, ativação, suspensão e encerramento. Suspensão e restrição por ação diferem de bloqueios pessoais; decisões administrativas devem oferecer comunicação e contestação pertinentes.

**RN-016 — Encerramento da conta.** O titular pode encerrar sua conta, perdendo o acesso e a apresentação ativa do perfil. Dados próprios devem receber exclusão/anonimização quando cabível, mas créditos compartilhados, compras e direitos de terceiros exigem preservação proporcional e justificada.

## 2. Perfil, privacidade e apresentação

**RN-017 — Perfil profissional único.** Cada profissional mantém um único perfil, ainda que exerça várias profissões. Contextos profissionais organizam a apresentação, sem criar identidades ou contas diferentes.

**RN-018 — Identidade pública do perfil.** Nome, vulgo quando informado e @username são conceitos distintos. A identidade é apresentada coerentemente e dados cadastrais sensíveis não se tornam públicos por causa da profissão.

**RN-019 — Informações profissionais declaradas.** Biografia, experiências, especialidades, equipamentos, disponibilidade para contatos e demais dados complementares são declarações editáveis do titular; não constituem certificação, prova de competência ou contratação.

**RN-020 — Localização e contato.** A divulgação de cidade/localização e de contatos depende de controles explícitos de privacidade. Informações reservadas de clientes e participantes não podem ser expostas por trabalhos do titular.

**RN-021 — Níveis de acesso por conteúdo.** A visibilidade de um perfil profissional para outros usuários autenticados não implica publicação irrestrita de obras, letras, arquivos, galerias ou dados privados: cada informação mantém sua visibilidade, controles de colaboração, bloqueios e moderação. **Nenhum nível de visibilidade dispensa a autenticação exigida pela RN-009.**

**RN-022 — Exibição de trabalho e papel.** Perfil e portfólio distinguem trabalhos próprios de participações legítimas, mostrando a função efetivamente exercida, sem atribuir autoria, titularidade ou controle por simples exibição.

**RN-023 — Profissionais externos à plataforma.** Créditos de pessoas ainda não cadastradas podem constar como referência textual, sem criação de identidade automática ou associação por nomes semelhantes.

**RN-024 — Representação profissional.** Relação de empresário ou representante com outro profissional depende de reconhecimento pertinente e não concede acesso à conta, aos arquivos privados ou às permissões do representado.

**RN-025 — Selo pessoal.** Cada perfil Profissional pode manter **um único Selo Profissional ativo**, criado no editor nativo, admitindo identidade externa somente mediante aprovação administrativa excepcional. Ele não é selo de verificação, direito de propriedade ou certificado de capacidade.

**RN-026 — Selo em contribuições.** O selo de um profissional pode acompanhar sua autoria ou participação própria reconhecida; em trabalho de terceiro, exige crédito ou vínculo confirmado correspondente.

**RN-027 — Reputação distinta de popularidade.** Reputação profissional decorre apenas das avaliações válidas de colaborações concluídas, com publicação de média após **três avaliações de profissionais distintos**; seguidores, curtidas, quantidade de obras e compras não produzem nota profissional.

**RN-028 — Busca sem exposição indevida.** A encontrabilidade de profissionais considera profissões, especialidades, trabalhos e região permitida; os resultados de busca destinam-se a **contas autenticadas** e não podem expor dados privados ou sujeitos a restrições.

**RN-029 — Interações distintas.** Seguir perfil, curtir perfil/conteúdo, salvar, enviar mensagem, denunciar e bloquear são relações independentes e não atestam colaboração, autoria ou reputação.

## 3. Profissões, capacidades e oportunidades

**RN-030 — Catálogo profissional oficial.** A Cypher admite **25 profissões em sete áreas**: Música (Rapper, MC, Compositor(a), Letrista, Beatmaker, Produtor(a) Musical, DJ e Freestyleiro); Dança (B-boy/B-girl, Dançarino(a) e Coreógrafo(a)); Artes Visuais (Grafiteiro(a), Ilustrador(a) e Designer Gráfico); Audiovisual (Fotógrafo(a), Videomaker e Editor(a) de Vídeo); Produção Técnica (Engenheiro(a) de Áudio, Mixador(a) e Masterizador(a)); Gestão e Produção (Empresário(a), Produtor(a) Cultural e Organizador(a) de Eventos); Comunicação e Cultura (Criador(a) de Conteúdo e Jornalista Cultural). **Podcaster** não integra o catálogo.

**RN-031 — Seleção e múltiplas profissões.** A modalidade Profissional exige ao menos **uma profissão válida**; seleções múltiplas são permitidas e cada profissão adiciona apenas as modalidades expressamente previstas para ela.

**RN-032 — Mudança de profissão.** A seleção inicial não consome alteração; a primeira mudança posterior é livre. A partir dela, cada nova mudança ordinária exige **30 dias completos** desde a última alteração efetivada.

**RN-033 — Exceção à mudança de profissão.** Mudança antecipada excepcional depende de solicitação fundamentada, aprovação competente e registro da decisão; não cria profissão ou direito inexistente.

**RN-034 — Permanência dos registros anteriores.** Retirar uma profissão impede **novos** registros dependentes exclusivamente dela, mas não elimina trabalhos, créditos, acordos ou a administração legitimamente autorizada de registros antigos.

**RN-035 — Tempo de atuação.** É obrigatório declarar o tempo de atuação **para cada profissão ativa** na seleção, conversão ou inclusão posterior; demais informações profissionais são opcionais e autodeclaradas.

**RN-036 — Vertentes do Rapper.** Somente **Rapper** pode declarar, de forma opcional e múltipla, as vertentes pessoais: Boom bap, Gangsta rap, G-Funk, R&B, Gospel, Jazz rap, Trap, Grime, Drill, Plug, PluggnB, Rage, Melodic rap, Detroit rap, Jersey Club Rap e Trap soul. A vertente não limita o gênero da obra nem concede outra profissão.

**RN-037 — Modalidades de Freestyleiro.** Freestyleiro pode declarar práticas de **sangue**, **conhecimento** e **estúdio/cypher**, sem herdar a taxonomia de Rapper.

**RN-038 — Tríplice autorização profissional.** Criar novo registro profissional exige cumulativamente **profissão ativa compatível**, **vínculo legítimo com o trabalho** e **titularidade/autorização para a operação**. A gestão de registros anteriores depende dos direitos ainda preservados.

**RN-039 — Limites por profissão.** As profissões habilitam apenas trabalhos coerentes com a atuação: Rapper e MC podem publicar gravações próprias; Compositor(a) registra composições, Letrista registra letras; Beatmaker e Produtor(a) Musical registram beats próprios; Organizador(a) de Eventos administra eventos próprios; profissões visuais, audiovisuais, culturais, técnicas e de dança registram seus trabalhos e projetos pertinentes. Nenhuma dessas permissões concede autoria, propriedade ou edição de conteúdo alheio.

**RN-040 — MC e obras próprias.** MC pode publicar **obras musicais próprias pertinentes**, sem adquirir por isso permissão para cadastrar beats comerciais ou organizar eventos.

**RN-041 — Beats por profissão.** **Beatmaker** e **Produtor(a) Musical** podem cadastrar seus **beats próprios**. Produtor Musical não precisa selecionar Beatmaker; produzir música não significa ser dono do fonograma alheio.

**RN-042 — Produtor cultural e organizador.** Produtor Cultural pode registrar projetos e ações culturais próprios, mas só **Organizador(a) de Eventos** pode criar/administrar eventos por essa profissão; selecionar uma não habilita automaticamente a outra.

**RN-043 — Obras, galerias e atuações não musicais.** Profissões visuais, audiovisuais, técnicas, de dança e gestão apresentam conteúdos, experiências e projetos compatíveis, sem receber automaticamente direitos sobre músicas, beats, eventos ou mídias de terceiros.

**RN-044 — Oportunidades separadas dos eventos.** Oportunidades são distintas de Eventos. Todas as 25 profissões podem publicar chamadas pertinentes e candidatar-se conforme requisitos; administrar chamada própria não dá poderes sobre eventos ou projetos alheios.

**RN-045 — Consumidor e oportunidades excepcionais.** Consumidor não recebe publicação profissional comum. Pode procurar um profissional/mediador ou solicitar publicação excepcional de pedido de serviço, sujeita a triagem administrativa antes de ir ao ar.

**RN-046 — Acordos de oportunidade.** Contato, candidatura, seleção ou negociação não equivalem a contrato, colaboração concluída ou crédito. Acordos dependem de aceitação expressa **da mesma versão dos termos** por todas as partes.

## 4. Obras, fonogramas, lançamentos e créditos

**RN-047 — Objetos musicais distintos.** **Composição**, **letra**, **fonograma**, **faixa no lançamento** e **lançamento** são objetos distintos: um não representa automaticamente propriedade ou publicação dos demais.

**RN-048 — Registro original e vínculos.** Cada trabalho possui registro de origem identificável; perfil, discografia, portfólio, coleção e descoberta reutilizam esse registro sem duplicar autoria, gravação, métricas ou créditos.

**RN-049 — Composições e letras independentes.** Composições instrumentais ou com letra podem existir sem gravação; letras podem existir de forma autônoma e permanecer inéditas/privadas. Vínculos posteriores devem respeitar autoria e consentimentos.

**RN-050 — Gravações distintas da mesma composição.** Uma composição pode originar vários fonogramas. Nova gravação ou versão sonora efetivamente diferente exige identidade própria; correção de metadados não cria novo fonograma.

**RN-051 — Titularidade da criação e da gravação.** Autoria de letra/composição, interpretação, produção, mixagem, masterização e propriedade fonográfica são relações distintas; uma não transmite automaticamente direitos das outras.

**RN-052 — Responsabilidade de produtor fonográfico.** Produtor fonográfico é uma função/direito ligado a determinado fonograma, não profissão adicional do catálogo nem atribuição automática do Produtor Musical.

**RN-053 — Formatos de lançamento.** A discografia admite **single, EP, álbum e mixtape**, além de gravações individuais. A classificação deve refletir a natureza do projeto e não ser inferida somente por quantidade de faixas.

**RN-054 — Reutilização de faixas.** Um fonograma já apresentado como single pode integrar EP, álbum ou mixtape sem perder identidade, ISRC, créditos e lançamento anterior; a ordem da faixa pertence ao lançamento que a inclui.

**RN-055 — Lançamentos com obras de terceiros.** Incluir gravação pertencente a outro titular ou conteúdo musical de terceiros exige direitos e autorizações pertinentes; a inclusão não transfere titularidade.

**RN-056 — Registro não comprova lançamento.** O simples cadastro de gravação, faixa ou álbum na Cypher **não prova lançamento público** nem conclui automaticamente uma colaboração.

**RN-057 — Comprovação factual de lançamento.** Lançamento efetivo exige áudio autorizado disponibilizado aos usuários autenticados da Cypher ou publicação externa verificável correspondente ao trabalho; a data factual não é a data de cadastro. A publicação externa utilizada como evidência não concede acesso sem autenticação aos módulos internos da Cypher.

**RN-058 — Correções de lançamento.** Correções e alterações autorizadas da lista de faixas devem preservar histórico, créditos, identificadores e direitos de terceiros; nova gravação não substitui silenciosamente o fonograma antigo.

**RN-059 — Sem status artístico de obra.** A Cypher **não utiliza** estados artísticos como _Rascunho_, _Em produção_ ou _Lançado_; visibilidade, existência do registro, mídia e comprovação factual são informações independentes.

**RN-060 — ISRC e ISWC externos.** **ISRC** identifica fonograma e **ISWC** identifica composição, quando disponíveis; a Cypher não emite ou reserva esses códigos e não exige ambos para cadastrar obra legítima.

**RN-061 — Créditos por função real.** Um registro pode reconhecer várias pessoas e funções de produção, criação, interpretação ou técnica; a função é a contribuição real, não necessariamente a profissão ativa declarada no perfil.

**RN-062 — Crédito não é edição.** Participar ou receber crédito em trabalho alheio não concede propriedade, edição, exclusão, distribuição ou administração do registro original.

**RN-063 — Reconhecimento do crédito.** Crédito lançado por terceiro só é considerado **confirmado** após reconhecimento válido; o profissional pode reconhecer, rejeitar ou contestar a participação.

**RN-064 — Collab principal e conclusão.** Ser artista principal de Collab exige reconhecimento válido do vínculo; a conclusão ou avaliação depende das condições do fluxo específico e, quando exigido, de lançamento efetivamente comprovado.

**RN-065 — Beat ligado a obra sem fusão.** O beat mantém seus direitos, ofertas e licenças próprios. Vincular beat a fonograma ou videoclipe não prova compra/contrato, nem transfere autoria de um objeto ao outro.

**RN-066 — Mídias e códigos ligados corretamente.** Capas, vídeos, fotos, links e arquivos anexos a obra exigem autorização e devem corresponder à criação/registro indicado, sem atribuir autoria automática ao artista retratado ou ao produtor de outro material.

**RN-067 — Gêneros pertencem ao conteúdo.** Gênero e classificação de composição, fonograma ou faixa devem corresponder ao trabalho específico e ao catálogo aplicável; não se copiam automaticamente da vertente pessoal do artista ou de todas as faixas de um álbum. Sugestões de novos gêneros não alteram a taxonomia sem aprovação.

## 5. Banco de Beats e licenciamento

**RN-068 — Beat como registro próprio.** O Banco de Beats reúne exclusivamente **beats** cadastrados por profissões habilitadas. O beat mantém registro independente do fonograma final que o utiliza.

**RN-069 — Criação autorizada de beat.** Somente responsável habilitado e legitimamente autorizado pode publicar e administrar beat e suas ofertas; uma profissão ou crédito isolado não comprova direitos sobre samples ou material de terceiros.

**RN-070 — Metadados do beat.** Beat identificado pode ter BPM, tonalidade, duração, estilo, capa, descrição e créditos; a ficha deve distinguir metadados conhecidos de campos opcionais.

**RN-071 — Prévia não equivale a licença.** A audição de prévia é distinta da aquisição, do aceite de Free Use e do acesso aos arquivos de entrega; materiais integrais e stems exigem permissão pertinente.

**RN-072 — Ofertas por beat.** Um beat pode manter **múltiplas ofertas** identificáveis, com modalidades e condições independentes; anúncios não transferem, por si, qualquer direito ao interessado.

**RN-073 — Condições claras e preços.** Os termos devem informar usos permitidos, restrições, atribuições, limites pertinentes, entregáveis e, quando houver cobrança demonstrativa, preço em **reais (R$)**; permissões não informadas não são presumidas.

**RN-074 — Free Use condicionado.** **Free Use** significa oferta sem cobrança, não domínio público, titularidade transferida ou autorização automática de uso comercial. Seus limites dependem da condição expressa.

**RN-075 — Coexistência de Free Use e Premium.** Free Use e ofertas **Premium não exclusivas** podem coexistir se forem compatíveis; cada oferta mantém escopo e arquivos próprios.

**RN-076 — Premium não exclusiva.** Aquisição Premium não exclusiva admite múltiplos adquirentes para o mesmo beat e não concede autoria, sublicenciamento, revenda, transferência irrestrita nem exclusividade por padrão.

**RN-077 — Exclusividade não automática.** Exclusividade é negociação distinta, dependente de direitos, anuência, termos próprios e controle de incompatibilidades; não integra o checkout automatizado inicial da demonstração.

**RN-078 — Direitos anteriores preservados.** Alterar/retirar oferta ou negociar exclusividade depois não cancela automaticamente licenças e autorizações já concedidas sob condições anteriores válidas.

**RN-079 — Disponibilidade comercial.** **Free Use** e **Premium** são modalidades de oferta, enquanto disponibilidade e venda são condições comerciais distintas. Licença não exclusiva não torna o beat automaticamente vendido; exclusividade efetiva impede novas ofertas incompatíveis.

**RN-080 — Venda não presumida.** Compra demonstrativa não exclusiva, interesse ou marcação visual **não** comprovam venda exclusiva, pagamento real, transferência de direitos ou situação comercial juridicamente validada.

**RN-081 — Compra demonstrativa restrita.** No TCC, o checkout com Mercado Pago usa **ambiente de testes**, com **uma oferta Premium não exclusiva por pedido**, sem cobrança real nem operação exclusiva automatizada.

**RN-082 — Oferta vinculada ao pedido.** O pedido registra comprador, beat, oferta e versão dos termos/valor aplicáveis no momento da simulação; alterações posteriores não reescrevem essa versão.

**RN-083 — Aprovação por fonte confiável.** O retorno do navegador não prova pagamento aprovado. O backend só considera concluído o pedido cuja aprovação de teste foi verificada e corresponde ao pedido registrado.

**RN-084 — Sem concessão duplicada.** Uma aprovação de teste repetida ou fora de ordem não pode gerar múltiplas licenças, pedidos contraditórios ou entregas incompatíveis para uma mesma operação.

**RN-085 — Licença de utilização não exclusiva.** Após confirmação válida do pagamento, a Cypher registra licença de utilização individualizada por comprador, beat, oferta e versão dos termos aceitos. A licença concede apenas as permissões expressas e não transfere a titularidade do beat.

**RN-086 — Entrega condicionada.** Arquivos correspondentes à modalidade só ficam acessíveis à pessoa autorizada após a concessão demonstrativa; outros compradores não podem consultar seus comprovantes ou downloads privados.

**RN-087 — Histórico de compra de teste.** Minhas Compras conserva histórico dos pedidos demonstrativos e licenças do titular; notificações, mensagens ou e-mails não substituem a entrega central persistida.

**RN-088 — Retirada comercial sem retroatividade.** Pausar beat, retirar oferta ou encerrar conta não apaga automaticamente vínculos de compradores, arquivos autorizados, licenças demonstrativas e histórico pertinente.

**RN-089 — Contestações sobre licenças.** Denúncias, conflito de autoria ou suspeita de fraude podem justificar suspensão proporcional de novas ofertas e revisão administrativa sem que a Cypher declare resolvido um conflito jurídico externo.

## 6. Projetos, galerias e Espaço de Trabalho

**RN-090 — Espaço de Trabalho próprio.** O Espaço de Trabalho organiza o acervo profissional em **Meus Trabalhos** e **Participações**; consumidor não publica trabalhos profissionais por essa área.

**RN-091 — Contexto por profissão.** Profissionais com múltiplas atuações podem organizar trabalhos por **profissão efetivamente exercida**, sem criar novos perfis e sem filtros musicais irrelevantes para conteúdos não musicais.

**RN-092 — Projeto profissional distinto.** Projeto profissional registra atuação, responsabilidades, equipe, período, objetivos, entregas e resultados, sem equivaler automaticamente a obra, evento, contratação, Collab ou publicação de terceiros.

**RN-093 — Experiência autodeclarada.** Resultados, histórico, clientes ou equipes declarados pelo titular permanecem identificáveis como declarações até que exista validação apropriada; não viram créditos profissionais confirmados pelo cadastro do projeto.

**RN-094 — Projetos não musicais.** Atuações técnicas, de dança, visuais, audiovisuais, culturais e de gestão podem ser documentadas como projetos ou experiências próprios compatíveis com a profissão, inclusive sem fonograma ou música lançada.

**RN-095 — Galeria como coleção.** Galerias e álbuns organizam mídias ou registros originais, sem criar novas autorias ou exigir duplicação do mesmo arquivo para diferentes projetos.

**RN-096 — Direito de mídia.** Exibir fotografia, vídeo, arte, texto, áudio ou link exige direitos ou autorização; ser retratado, gravado, citado ou participar do trabalho não transforma o titular em autor daquele arquivo.

**RN-097 — Materiais reservados.** Obras inéditas, fotos privadas, vídeos restritos e materiais de clientes podem permanecer no acervo sem ir à vitrine pública; anexos protegidos não são liberados por endereço direto.

**RN-098 — Trabalhos relacionados.** Um trabalho pode integrar vários projetos, álbuns e vitrines mantendo sua identidade original. A inclusão ou retirada da coleção não altera automaticamente a origem ou direitos de terceiros.

## 7. Portfólio profissional e curadoria

**RN-099 — Portfólio único e multimodal.** Cada perfil Profissional possui uma vitrine única, que pode reunir música, beats, projetos, artes visuais, audiovisual, texto e experiências pertinentes, com trabalhos próprios e participações distinguidos.

**RN-100 — Modo Manual.** No **Manual**, o titular seleciona explicitamente os trabalhos exibidos e pode organizá-los, destacá-los ou ocultá-los sem editar nem excluir suas origens.

**RN-101 — Modo Inteligente.** No **Inteligente**, o portfólio inclui automaticamente trabalhos próprios elegíveis e participações **confirmadas**, respeitando função exercida, visibilidade e alterações da origem.

**RN-102 — Ocultações persistentes.** Item ocultado intencionalmente não volta automaticamente ao portfólio após atualizações, trocas de modo ou inclusão de novos trabalhos; reexibição depende de ação consciente e autorização válida.

**RN-103 — Molde distinto do modo.** O **modo** define como itens entram e são atualizados; o **molde** define sua organização visual. Profissionais com várias atuações podem utilizar apresentações pertinentes sem dividir o perfil.

**RN-104 — Troca de modo não apaga escolhas.** Alternar Manual/Inteligente conserva preferências, seleções válidas, moldes, ocultações e organização pertinente; trocar o molde não exclui trabalhos, arquivos ou créditos.

**RN-105 — Persistência da curadoria.** Seleções, destaques, visibilidade, ordenação, modo e molde são escolhas persistentes do titular e devem produzir apresentação coerente nos espaços que usam a vitrine.

**RN-106 — Participação pendente não vira confirmada.** Adicionar manualmente uma obra de terceiro ou receber menção automática não transforma crédito pendente em confirmação, coautoria, contrato ou reputação.

**RN-107 — Ocultar não é excluir.** Ocultar do portfólio, remover de galeria, retirar mídia, restringir acesso e excluir registro de origem são ações distintas; nenhuma deve apagar indiscriminadamente créditos ou outros trabalhos vinculados.

## 8. Integridade transversal dos registros

**RN-108 — Operações por autorização efetiva.** Toda operação protegida de criação, edição, publicação, administração, exclusão e download deve observar o usuário real, o vínculo com o objeto e a autorização correspondente; permissões não podem ser deduzidas de uma opção visual.

**RN-109 — Preservação de vínculos.** Alterações de identidade, profissão, visibilidade, apresentação ou encerramento não reescrevem indevidamente autoria, licenças, créditos e direitos anteriores.

**RN-110 — Uma fonte de verdade.** Vitrines, fichas, acervo, busca e portfólio devem referenciar registros de origem coerentes, sem duplicar indevidamente obra, fonograma, beat, crédito ou interação.

**RN-111 — Retirada proporcional.** Medidas de moderação e pedidos de retirada devem afetar as exposições e operações cabíveis sem conceder exclusão arbitrária de direitos de terceiros; preservação posterior exige finalidade e controle.

**RN-112 — Sem prova inventada.** Publicação, menção de crédito, inscrição, interesse, pagamento de testes ou montagem de portfólio não constituem por si só certificação civil, contrato, colaboração concluída, compra real ou reputação profissional.

## 9. Selos Profissionais

**RN-113 — Aplicação contextual do selo.** O Selo Profissional identifica a contribuição de seu titular com indicação da função reconhecida, como produção, arte, mixagem ou organização; não substitui o nome e os créditos da pessoa.

**RN-114 — Identidade visual externa.** O uso excepcional de marca visual externa ao editor nativo requer solicitação e aprovação administrativa; enviar uma imagem não a torna automaticamente selo válido.

**RN-115 — Alterações do selo.** A alteração ou substituição do selo mantém as versões e o histórico necessários à rastreabilidade, sem apagar créditos, autorias ou vínculos anteriores.

**RN-116 — Proteção da identidade visual.** É vedado usar selo para se passar por terceiro, imitar a identidade oficial da Cypher ou sugerir verificação ou patrocínio inexistente; uso irregular pode ser moderado.

**RN-117 — Insígnias de eventos não adotadas.** A Cypher não oferece sistema autônomo de insígnias colecionáveis ou selos por edição de evento; os Selos Profissionais continuam vinculados às pessoas e às contribuições reconhecidas.

## 10. Eventos e avaliações pós-evento

**RN-118 — Responsabilidade pelo evento.** A criação e a administração de eventos pertencem ao Organizador de Eventos habilitado e aos responsáveis expressamente autorizados; atuar, produzir conteúdo ou comparecer não concede poder de organização.

**RN-119 — Informações essenciais de evento.** O evento divulga identificação, modalidade, data, horário, localização ou formato de realização e regras de participação suficientes para orientar o público, sem anunciar informações desconhecidas como fatos.

**RN-120 — Admissão aberta ou por aprovação.** Eventos podem adotar participação aberta ou sujeita à aprovação; em modalidade com aprovação, solicitar inscrição não torna o interessado participante confirmado.

**RN-121 — Interesse, salvamento e inscrição.** Salvar, demonstrar interesse e solicitar inscrição são manifestações independentes; nenhuma, isoladamente, comprova presença, participação confirmada ou atuação profissional.

**RN-122 — Vagas e critérios de admissão.** Limites de vagas e requisitos anunciados devem orientar as confirmações de participação; decisões de aceite, recusa ou cancelamento pertencem ao organizador autorizado e respeitam os critérios comunicados.

**RN-123 — Registro de comparecimento.** Participação confirmada e presença efetivamente registrada são fatos distintos; comparecimento não pode ser presumido a partir de inscrição, interesse, curtida ou visualização.

**RN-124 — Métricas independentes de evento.** Quantidades de interessados, inscritos, confirmados e presentes são contabilizadas separadamente, com base em suas relações efetivas, sem duplicação artificial.

**RN-125 — Edições de evento.** Quando um evento possuir edições, cada realização mantém seus próprios dados, participantes, data e resultado, podendo estar vinculada a uma série sem herdar automaticamente presenças de outra edição.

**RN-126 — Créditos do evento.** Organizadores, atrações, equipes e participantes podem receber funções e créditos específicos; indicação unilateral não constitui vínculo confirmado nem transfere poderes de administração.

**RN-127 — Mudança e cancelamento.** Alterações relevantes de data, local, condições de inscrição ou cancelamento do evento exigem atualização das informações e comunicação pertinente aos usuários afetados, preservando o histórico necessário.

**RN-128 — Localização confiável.** Eventos sem localização publicável ou suficientemente precisa permanecem consultáveis nos formatos adequados, sem criação de endereço, coordenadas ou ponto de mapa fictícios.

**RN-129 — Elegibilidade de avaliação pós-evento.** A avaliação da experiência de um evento exige participação ou comparecimento reconhecido pelos critérios aplicáveis; mero interesse, salvamento ou inscrição não comprovada não habilita relato como participante efetivo.

**RN-130 — Avaliação da experiência.** Participantes elegíveis podem registrar experiência positiva ou negativa; avaliações negativas exigem justificativa pertinente, e relatos não comprovam automaticamente infração do organizador.

**RN-131 — Reclamação formal ao organizador.** Reclamações relacionadas à organização são apresentadas inicialmente ao organizador responsável, que poderá reconhecer o problema, prestar esclarecimentos ou contestar a pertinência ou veracidade do relato.

**RN-132 — Contestação encaminhada à moderação.** Quando o organizador contestar uma reclamação, o caso poderá seguir para análise do Moderador com as manifestações e evidências disponíveis; a contestação não encerra unilateralmente o direito do participante.

**RN-133 — Reconhecimento sem punição automática.** Reconhecer uma falha ou acolher uma reclamação não implica punição automática; medidas administrativas dependem da natureza, gravidade e circunstâncias do ocorrido.

**RN-134 — Má-fé e recurso em reclamações.** Alegações comprovadamente falsas ou contestações dolosas podem resultar em medida proporcional após apuração; organizador e participante têm direito ao procedimento de revisão ou recurso aplicável.

**RN-135 — Avaliação de evento distinta de reputação.** Feedback pós-evento orienta a experiência e a moderação de eventos, sem alterar automaticamente a nota de reputação profissional por colaborações concluídas.

## 11. Oportunidades e pedidos profissionais

**RN-136 — Natureza das oportunidades.** Oportunidades representam chamadas por profissionais, serviços e colaborações e não exigem, por si, data ou local de um evento; cada publicação identifica sua finalidade e condições de participação.

**RN-137 — Publicação profissional pertinente.** Profissionais podem divulgar oportunidades compatíveis com suas necessidades e responsabilidades, sem obter por isso permissão para organizar evento ou administrar trabalhos de terceiros.

**RN-138 — Participação em chamada.** Candidatura, interesse ou conversa sobre oportunidade não equivalem a seleção final, contratação ou colaboração confirmada; o responsável pela chamada administra os candidatos conforme os critérios divulgados.

**RN-139 — Pedidos excepcionais de Consumidores.** Consumidor pode recorrer a um profissional mediador ou submeter pedido de serviço à análise prévia da equipe; o pedido excepcional só é publicado após autorização competente e não concede capacidades gerais de conta Profissional.

**RN-140 — Compromissos das partes.** Aceite de oportunidade ou contratação dentro da Cypher exige manifestação expressa das partes sobre as condições correspondentes; créditos e conclusão de colaboração seguem validação própria.

**RN-141 — Encerramento de oportunidade.** Retirar, encerrar ou cancelar uma chamada impede novas candidaturas quando aplicável, sem apagar indevidamente acordos já aceitos, mensagens e referências históricas legítimas.

## 12. Colaborações formais e reputação

**RN-142 — Colaboração avaliável entre profissionais.** A colaboração formal avaliável vincula duas contas Profissionais distintas por relação identificável; projetos com mais envolvidos não os tornam participantes dessa relação automaticamente.

**RN-143 — Proposta e aceite bilateral.** O vínculo formal exige proposta com objeto e funções pertinentes e aceite expresso da outra parte; mensagens, créditos, contatos ou acordos informais não o substituem.

**RN-144 — Prazo de convite.** Convite de colaboração sem resposta expira em **30 dias corridos**; silêncio, recusa e vencimento não constituem aceite nem dão direito de avaliar.

**RN-145 — Créditos antigos sem conversão automática.** Créditos e experiências anteriores não são transformados automaticamente em colaborações concluídas e avaliáveis; é necessária adesão válida de ambos e confirmação própria da conclusão.

**RN-146 — Conclusão bilateral.** Uma colaboração só é concluída mediante confirmação das duas partes ou decisão excepcional fundamentada da moderação; uma parte não pode confirmar sozinha a conclusão em nome da outra.

**RN-147 — Contestação de conclusão.** A contestação da entrega ou do encerramento impede que a colaboração seja tratada como concluída para avaliação enquanto não houver solução válida.

**RN-148 — Elegibilidade para avaliar.** Somente participantes de colaboração formal validamente concluída podem avaliar um ao outro por aquela relação, e a avaliação é facultativa.

**RN-149 — Prazo e unicidade de avaliação.** Cada participante pode enviar **uma avaliação** da outra parte por colaboração concluída no prazo de **14 dias corridos**, sem reenvio ou alteração livre após o registro.

**RN-150 — Critérios da avaliação.** A avaliação usa notas inteiras de **1 a 5** para **comunicação**, **cumprimento de combinados** e **trabalho em equipe**; comentário escrito é opcional, e a nota individual resulta da média dos três critérios.

**RN-151 — Duplo-cego.** As avaliações permanecem ocultas até que ambas as partes enviem suas notas ou até o encerramento dos 14 dias, o que ocorrer primeiro, sem revelar antecipadamente notas ou a participação do outro.

**RN-152 — Validade e moderação de avaliações.** Somente avaliações liberadas e vinculadas a colaborações válidas entram nos cálculos; suspeitas de fraude, abuso ou vínculo irregular podem motivar suspensão de cômputo, revisão e anulação fundamentada.

**RN-153 — Reputação sem avaliações.** Na ausência de avaliações válidas, o perfil apresenta **“Ainda sem avaliações”**, sem nota zero ou classificação “Independente”.

**RN-154 — Reputação em formação.** Com avaliações válidas de apenas um ou dois profissionais diferentes, o perfil apresenta **“Reputação em formação”**, sem média pública.

**RN-155 — Limiar da média pública.** A média de reputação só é exibida quando existirem avaliações válidas de **ao menos três profissionais distintos**.

**RN-156 — Peso por avaliador.** Na reputação pública, cada avaliador distinto possui peso equivalente: apura-se primeiro a média de suas avaliações válidas do avaliado e depois a média entre avaliadores.

**RN-157 — Recalcular após anulação.** Anular ou invalidar avaliação exige recálculo; se restarem menos de três avaliadores distintos, a média deixa de ser pública.

**RN-158 — Privacidade da colaboração.** O vínculo formal é privado por padrão e sua divulgação individual depende de consentimento de ambos; a retirada de consentimento impede essa exibição sem apagar necessariamente dados legítimos da colaboração.

**RN-159 — Privacidade dos dados de reputação.** Avaliações elegíveis de vínculos privados podem compor estatística agregada quando permitido, sem revelar indevidamente detalhes da colaboração ou os dados reservados das partes.

## 13. Interações, comentários e mensagens

**RN-160 — Relacionamentos únicos.** Seguir, curtir e salvar representam ações distintas, com no máximo uma relação ativa de cada tipo por usuário e objeto; a repetição da mesma ação não multiplica contagens.

**RN-161 — Limite da conta Consumidor.** Consumidores podem seguir e salvar conteúdos permitidos, mas não possuem vitrine profissional pública nem recebem seguidores próprios como perfis profissionais.

**RN-162 — Comentários vinculados.** Comentários pertencem ao autor e ao conteúdo comentado; o titular pode gerir os próprios comentários, mas não apagar arbitrariamente manifestações alheias, sem prejuízo de moderação.

**RN-163 — Interação e visibilidade.** Interações dependem de acesso legítimo ao conteúdo e cessam ou se restringem conforme bloqueio, privacidade, retirada da publicação e decisões administrativas.

**RN-164 — Bloqueio entre usuários.** O bloqueio impede novos contatos e acompanhamentos incompatíveis entre as contas envolvidas; desbloquear não restaura automaticamente vínculos anteriormente desfeitos.

**RN-165 — Mensagens privadas persistentes.** Conversas e mensagens são restritas aos participantes autorizados e permanecem registradas entre sessões; fechar a conversa, sair da conta ou ocultá-la para si não apaga o histórico dos demais.

**RN-166 — Preferência para contatos.** O envio de mensagens observa bloqueios e preferências do destinatário, inclusive sua autorização ou restrição ao contato de Consumidores.

**RN-167 — Privacidade administrativa de mensagens.** Administradores não podem consultar conversas privadas por navegação comum; acesso excepcional a evidências denunciadas exige competência, justificativa, restrição de escopo e registro de auditoria.

**RN-168 — Edição e exclusão de mensagens.** Ocultar uma conversa para si, remover mensagem própria quando permitido e excluir dados definitivamente são operações distintas; nenhuma autoriza destruição silenciosa de conteúdo pertencente a outro participante.

**RN-169 — Comunicação não é acordo.** Mensagens, contatos e seguidores não constituem contratação, crédito confirmado, autorização de uso de obra ou colaboração concluída sem o aceite correspondente.

## 14. Notificações e lembretes

**RN-170 — Persistência das notificações.** Notificações pertencem ao destinatário, sobrevivem às sessões e não expiram apenas por passagem do tempo; sua exclusão depende de ação do usuário ou medida excepcional justificada.

**RN-171 — Leitura distinta de exclusão.** Marcar notificação como lida não a exclui; contadores de não lidas e remoções devem refletir o estado persistido sem criar notificações duplicadas para o mesmo fato.

**RN-172 — Origem legítima de notificações.** Notificações decorrem de fatos reais, como mensagens, interações, créditos pendentes, inscrições em eventos e decisões administrativas, e não podem apresentar dados simulados como atividade real.

**RN-173 — Preferências de aviso.** O titular pode definir quais categorias de notificação deseja receber, ressalvadas comunicações essenciais de segurança e decisões que exijam ciência.

**RN-174 — Lembretes de evento.** Eventos acompanhados pelo usuário podem gerar lembretes **24 horas antes e no dia da realização**, respeitando horário local e preferências; alteração ou cancelamento demanda revisão dos avisos.

**RN-175 — Acesso a partir de notificações.** Uma notificação não autoriza visualizar objeto privado, removido, bloqueado ou cuja permissão tenha sido revogada; os links obedecem às regras atuais de acesso.

## 15. Descoberta, busca e recomendação

**RN-176 — Finalidade da Descoberta.** A página inicial **Descoberta** prioriza encontrar profissionais, obras, beats, eventos, projetos e oportunidades relevantes, sem funcionar como uma rede social genérica.

**RN-177 — Critérios de descoberta.** Recomendações podem considerar interesses declarados, profissionais seguidos, região aproximada permitida, atualidade, pertinência, engajamento legítimo e diversidade, sem tratar popularidade como competência certificada.

**RN-178 — Equilíbrio e novos participantes.** A descoberta deve permitir resultados úteis para contas sem histórico e contemplar profissionais emergentes, sem depender exclusivamente de contagens de seguidores ou curtidas.

**RN-179 — Pesquisa coerente por domínio.** A busca pode abranger profissionais, @username, obras, beats, eventos e projetos; filtros e classificações respeitam a natureza de cada registro, sem exigir categorias inadequadas.

**RN-180 — Privacidade nas listagens.** Busca, destaques, sugestões, contadores e links compartilhados são acessíveis somente mediante autenticação e devem revelar apenas conteúdos e dados autorizados para a conta solicitante; bloqueios e medidas de moderação também se aplicam aos resultados. O conhecimento de um endereço compartilhado não concede acesso independente das permissões vigentes.

**RN-181 — Métricas de descoberta.** Visualizações, seguidores, curtidas, trabalhos e participações representam indicadores distintos e só podem ser apresentados com base em registros válidos, sem estatísticas inventadas.

## 16. Cypher Central

**RN-182 — Finalidade educativa.** A **Cypher Central** reúne orientações sobre uso da plataforma, profissões, publicação, segurança e conexões profissionais no hip-hop, sem substituir acordos particulares ou emitir certificados.

**RN-183 — Conteúdo especializado.** Os guias respeitam as profissões e permissões oficiais e podem orientar sobre ISRC, ISWC e produção fonográfica, sem atribuir à Cypher emissão desses identificadores.

**RN-184 — Governança editorial.** Criar, revisar, publicar, atualizar e arquivar artigos da Central exige competência editorial autorizada; somente materiais publicados ficam disponíveis como orientação vigente **para usuários autenticados**, sem acesso de leitura anônima à Cypher Central.

**RN-185 — Feedback de artigo.** O leitor pode classificar um artigo como **Útil** ou **Não útil**; avaliações negativas registram motivo pertinente, como informação incompleta, explicação confusa, instruções difíceis, desatualização ou dúvida não respondida.

**RN-186 — Qualidade e prevenção de duplicidade.** O feedback deve refletir participações legítimas, sem multiplicação indevida de votos nem confusão com reputação de profissionais.

**RN-187 — Indicadores editoriais.** O Centro de Análise de Qualidade diferencia visualizações, usuários, avaliações positivas/negativas, proporções e pesquisas sem resultado, permitindo identificar artigos que precisam de revisão.

**RN-188 — Pesquisa educativa distinta.** Buscas na Cypher Central e temas sem resposta orientam atualização dos materiais, sem se confundir com a busca geral por obras, pessoas, beats ou eventos.

## 17. Administração, solicitações e moderação

**RN-189 — Três papéis administrativos.** A governança possui **Administrador Geral (Super Admin)**, **Moderador** e **Editor**; cada papel exerce apenas suas atribuições e não adquire competências de outro cargo automaticamente.

**RN-190 — Provisionamento administrativo.** A primeira conta administrativa resulta de provisionamento interno controlado; demais acessos dependem de convite ou autorização competente, jamais do cadastro público de usuário.

**RN-191 — Poderes do Super Admin.** O Administrador Geral controla concessão e revogação de acessos administrativos e decisões estruturais sobre catálogo, permissões e configurações, respeitando rastreabilidade e separação de responsabilidades.

**RN-192 — Competências do Moderador e Editor.** O Moderador analisa denúncias, conflitos e solicitações excepcionais em sua competência; o Editor administra conteúdos educativos da Central sem obter poderes gerais de moderação.

**RN-193 — Vedação à autoaprovação.** Nenhum administrador pode elevar seus próprios privilégios ou aprovar solicitação de interesse próprio sem controle competente que evite conflito de interesses.

**RN-194 — Catálogos globais.** Incluir profissão, vertente, gênero ou outra opção global exige análise e aprovação do responsável competente; sugestão de usuário não altera o catálogo automaticamente.

**RN-195 — Solicitações e suporte.** Pedidos de ajuda, exceções, denúncias, recursos e contato **Falar com a Cypher** mantêm solicitante, assunto, histórico, responsável e decisão ou resposta, respeitando os controles de acesso.

**RN-196 — Denúncia identificada.** Denúncias indicam objeto e motivo pertinente, como assédio, discriminação, fraude, falsidade de identidade, plágio, risco a menores ou conteúdo inadequado; seu registro não comprova a acusação.

**RN-197 — Etapas de denúncia.** A tramitação administrativa diferencia **pendente**, **em análise**, **resolvida** e **arquivada**, com comunicação da decisão e possibilidade de contestação quando aplicável.

**RN-198 — Medidas proporcionais.** Moderação pode advertir, ocultar, remover, restringir, suspender ou excluir, de acordo com gravidade, evidências e competências; quantidade de denúncias não produz punição automática.

**RN-199 — Prioridade de risco.** Ameaças concretas e situações que envolvam risco ou exploração de menores recebem prioridade de análise e encaminhamento compatível com a gravidade da ocorrência.

**RN-200 — Direito de contestar.** Pessoas afetadas por decisão administrativa podem apresentar recurso ou esclarecimento segundo o procedimento aplicável; discordar de denúncia não constitui, isoladamente, má-fé.

**RN-201 — Auditoria de decisões.** Criação/revogação de administradores, alterações sensíveis, revisões de crédito e decisões de moderação conservam autoria, data, objeto, justificativa e resultado pertinentes, com acesso restrito.

**RN-202 — Acesso restrito a dados sensíveis.** Dados pessoais, denúncias, materiais privados e evidências recebidas pela administração só podem ser examinados por quem tenha competência específica, sem exposição geral a todos os administradores.

**RN-203 — Integridade de remoções.** Ocultar, retirar da vitrine, invalidar vínculo, suspender acesso e excluir registro são medidas distintas; a providência aplicada não deve apagar arbitrariamente direitos ou participações legítimas de terceiros.
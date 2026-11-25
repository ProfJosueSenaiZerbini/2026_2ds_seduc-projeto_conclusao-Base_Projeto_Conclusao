// Conteúdo educativo inicial. O ciclo editorial e a publicação pertencem ao módulo da Central.
export const guiasIniciais = [
  {
    titulo: "Seu primeiro caminho na Cypher",
    resumo:
      "Conheça a cena, ajuste sua apresentação e escolha um próximo passo que faça sentido para você.",
    categoria: "primeiros-passos",
    intencao: "comecar",
    profissoes: [],
    passos: [
      {
        titulo: "Comece pelo seu perfil",
        conteudo:
          "Confira nome de apresentação, biografia e preferências. A conta Consumidor tem um espaço pessoal; a Profissional reúne suas atuações em um único perfil.",
        dica: "Você não precisa preencher toda a trajetória para começar a explorar.",
      },
      {
        titulo: "Encontre uma referência",
        conteudo:
          "Use a busca para procurar uma pessoa pelo nome ou @, uma obra, um beat ou um evento. Abra a ficha para entender quem fez o quê.",
        dica: "Pesquisar uma função específica costuma ajudar mais do que um termo muito amplo.",
      },
      {
        titulo: "Escolha uma ação pequena",
        conteudo:
          "Você pode conhecer um catálogo, registrar seu primeiro trabalho profissional ou preparar um convite de colaboração. Cada recurso tem suas próprias permissões.",
        dica: "Um guia explica possibilidades; ele não concede acesso nem garante uma parceria.",
      },
    ],
    exemplo:
      "Na prática: Nina quer conhecer a produção local. Ela procura um beatmaker, abre o catálogo e lê sua apresentação antes de decidir como se conectar.",
    acao_url: "/profile",
    acao_label: "Conferir minha apresentação",
  },
  {
    titulo: "Qual é o lugar certo para publicar?",
    resumo:
      "Obra, beat, evento e galeria têm objetivos diferentes. Escolha o formato pelo trabalho que você realizou.",
    categoria: "publicacoes",
    intencao: "publicar",
    profissoes: [],
    passos: [
      {
        titulo: "Identifique sua entrega",
        conteudo:
          "Uma gravação musical, um instrumental, uma organização de evento e um ensaio visual não são o mesmo registro. No Espaço de Trabalho, veja as opções liberadas para suas profissões.",
        dica: "Contas Consumidor não publicam trabalhos profissionais por essa área.",
      },
      {
        titulo: "Explique seu papel",
        conteudo:
          "Dê um título claro, descreva sua contribuição e preencha os dados que pertencem àquele formato. Registrar uma equipe não transforma seus integrantes em autores ou colaboradores confirmados.",
        dica: "Prefira “fotografia da capa” a uma função genérica como “participação”.",
      },
      {
        titulo: "Confira antes de apresentar",
        conteudo:
          "Revise a visibilidade e a autorização dos materiais. Um arquivo privado não fica público apenas por ser incluído em uma galeria ou no portfólio.",
        dica: "Escolha primeiro os materiais que você pode exibir; complete o acervo aos poucos.",
      },
    ],
    exemplo:
      "Na prática: uma capa feita para um single entra como trabalho visual. A faixa musical continua sendo outro registro, com seus próprios responsáveis e créditos.",
    acao_url: "/espaco-de-trabalho",
    acao_label: "Escolher um formato de trabalho",
  },
  {
    titulo: "Monte um portfólio que conte sua trajetória",
    resumo:
      "Escolha trabalhos, destaque contribuições e organize uma vitrine sem duplicar seu acervo.",
    categoria: "publicacoes",
    intencao: "publicar",
    profissoes: [],
    passos: [
      {
        titulo: "Escolha como selecionar",
        conteudo:
          "No modo Manual, você seleciona os itens. No Inteligente, novos trabalhos elegíveis entram automaticamente. Os dois preservam suas escolhas de ocultação.",
        dica: "Trocar de modo não precisa apagar sua curadoria manual.",
      },
      {
        titulo: "Dê uma ordem à história",
        conteudo:
          "Use destaques, seções e ordenação. Grade, Editorial e Lista mudam a apresentação; não alteram a obra, o projeto ou o crédito original.",
        dica: "Uma seção curta, como “Capas” ou “Produção de shows”, já pode orientar a leitura.",
      },
      {
        titulo: "Abra a prévia",
        conteudo:
          "Confira o resultado antes de salvar. A vitrine só apresenta itens permitidos e respeita a privacidade do perfil e das origens.",
        dica: "Remover da vitrine não exclui o trabalho. Para reexibir um item oculto, retire a ocultação expressamente.",
      },
    ],
    exemplo:
      "Na prática: Davi organiza fotografias próprias e uma participação confirmada na capa de outro artista. O portfólio distingue as duas relações e informa sua função.",
    acao_url: "/portfolio/edit",
    acao_label: "Organizar meu portfólio",
  },
  {
    titulo: "Do convite à colaboração concluída",
    resumo:
      "Combine funções com outra pessoa e reconheça a entrega em um fluxo próprio, separado de mensagens e créditos.",
    categoria: "colaboracoes",
    intencao: "conectar",
    profissoes: [],
    passos: [
      {
        titulo: "Envie um convite com contexto",
        conteudo:
          "Uma colaboração formal envolve dois Profissionais. Informe o trabalho, a função de cada pessoa e os combinados; a outra parte precisa aceitar.",
        dica: "Uma mensagem, uma candidatura ou um crédito não cria esse vínculo automaticamente.",
      },
      {
        titulo: "Concluam pelas duas partes",
        conteudo:
          "Quando a entrega terminar, uma pessoa solicita a conclusão e a outra confirma. Também é possível responder “ainda não” ou contestar uma divergência.",
        dica: "O silêncio não confirma o trabalho. Se a entrega exigir lançamento, confira a evidência apresentada.",
      },
      {
        titulo: "Decidam o que divulgar",
        conteudo:
          "A associação começa privada. Sua divulgação depende dos dois consentimentos; qualquer participante pode retirar a publicidade sem apagar o histórico legítimo.",
        dica: "Um vínculo confirmado é uma declaração bilateral, não uma certificação de direitos ou contratação.",
      },
    ],
    exemplo:
      "Na prática: uma rapper e uma profissional de mixagem registram suas funções. Só depois do aceite e da conclusão reconhecida o vínculo abre a possibilidade de avaliação.",
    acao_url: "/colaboracoes",
    acao_label: "Ver minhas colaborações",
  },
  {
    titulo: "O que a reputação realmente mede",
    resumo:
      "Entenda o prazo, o sigilo e a diferença entre experiência de trabalho e popularidade.",
    categoria: "colaboracoes",
    intencao: "resolver",
    profissoes: [],
    passos: [
      {
        titulo: "Avalie uma experiência elegível",
        conteudo:
          "Após a conclusão válida de uma colaboração formal, cada participante tem 14 dias para avaliar comunicação, cumprimento de combinados e trabalho em equipe. A avaliação é facultativa.",
        dica: "Não avaliar não gera nota negativa nem impede uma nova publicação.",
      },
      {
        titulo: "Respeite a fase de sigilo",
        conteudo:
          "As avaliações ficam ocultas até ambos enviarem ou o prazo terminar. O envio é único e definitivo; a interface não revela se a outra pessoa já avaliou.",
        dica: "Você pode consultar avaliações recebidas e liberadas na sua área privada.",
      },
      {
        titulo: "Leia a média com contexto",
        conteudo:
          "Sem notas válidas, aparece “Ainda sem avaliações”. Com um ou dois avaliadores distintos, a reputação está em formação. A média pública exige pelo menos três profissionais diferentes, com peso igual por pessoa.",
        dica: "Seguidores, curtidas, compras e quantidade de trabalhos não são nota profissional.",
      },
    ],
    exemplo:
      "Na prática: três avaliações do mesmo colega ainda representam um único avaliador. Elas não liberam a média pública por si só.",
    acao_url: "/colaboracoes",
    acao_label: "Consultar avaliações liberadas",
  },
  {
    titulo: "Antes de escolher um beat",
    resumo:
      "Compare o instrumental e suas condições de uso. Oferta, autoria e autorização são informações diferentes.",
    categoria: "publicacoes",
    intencao: "resolver",
    profissoes: [
      "rapper",
      "mc",
      "compositor",
      "letrista",
      "beatmaker",
      "produtor",
      "dj",
      "freestyleiro",
    ],
    passos: [
      {
        titulo: "Confira quem publicou",
        conteudo:
          "Abra o Banco de Beats, leia a identificação do produtor e as características disponíveis, como gênero, BPM e tonalidade.",
        dica: "Nem todo registro tem todos os dados técnicos. Ausência de um dado não autoriza presumir seu valor.",
      },
      {
        titulo: "Leia cada oferta",
        conteudo:
          "O mesmo beat pode apresentar condições diferentes. Consulte limites, descrição e modalidade; uso gratuito não significa autorização irrestrita.",
        dica: "Uma oferta não exclusiva não deve ser tratada como compra de exclusividade.",
      },
      {
        titulo: "Aceite os termos e acompanhe a autorização",
        conteudo:
          "O Free Use exige aceite das condições da oferta. A licença Premium não exclusiva reúne os termos e os arquivos escolhidos em um pedido. Consulte sua licença e os materiais autorizados em Minhas Compras.",
        dica: "O pedido e a confirmação da aquisição ficam em Minhas Compras. Confira o estado da sua licença antes de utilizar os arquivos.",
      },
    ],
    exemplo:
      "Na prática: um beat apresenta uma condição de uso gratuito e outra oferta. A pessoa lê cada texto separadamente antes de considerar qualquer utilização.",
    acao_url: "/beats",
    acao_label: "Explorar o Banco de Beats",
  },
  {
    titulo: "Interesse em evento não é presença",
    resumo:
      "Acompanhe a realização e entenda os diferentes vínculos com um evento.",
    categoria: "eventos-oportunidades",
    intencao: "conectar",
    profissoes: [],
    passos: [
      {
        titulo: "Leia a ficha antes de se organizar",
        conteudo:
          "Confira data, horário, local ou formato e informações de participação que o responsável publicou. Procure atualizações antes de sair para o evento.",
        dica: "As condições de cada realização podem ser diferentes.",
      },
      {
        titulo: "Demonstre interesse com clareza",
        conteudo:
          "Registrar interesse sinaliza que você acompanha o evento. Essa ação não comprova inscrição aceita, vaga garantida ou comparecimento.",
        dica: "Use o estado informado no registro, sem transformar um interesse em presença no seu histórico.",
      },
      {
        titulo: "Organize com a atuação adequada",
        conteudo:
          "A criação de eventos depende da profissão e da autorização do responsável. Participar como artista, convidado ou público não concede o controle do evento.",
        dica: "Um trabalho de organização também pode ser descrito como experiência, identificando a função efetiva.",
      },
    ],
    exemplo:
      "Na prática: Joana marca interesse em uma batalha. Isso ajuda a acompanhar a divulgação, mas não significa que ela disputou ou esteve presente.",
    acao_url: "/events",
    acao_label: "Consultar eventos",
  },
  {
    titulo: "Encontre oportunidades com combinados claros",
    resumo:
      "Leia a chamada, escolha a função e acompanhe a negociação sem confundir candidatura com acordo.",
    categoria: "eventos-oportunidades",
    intencao: "conectar",
    profissoes: [],
    passos: [
      {
        titulo: "Procure uma função compatível",
        conteudo:
          "Confira objetivo, responsabilidades, requisitos, modalidade de trabalho e condições de remuneração antes de se candidatar.",
        dica: "Uma chamada para fotografia exige uma entrega diferente de uma chamada para edição ou produção.",
      },
      {
        titulo: "Acompanhe a decisão",
        conteudo:
          "A candidatura expressa interesse profissional. Seleção, proposta de condições e acordo confirmado são etapas próprias, consultáveis no fluxo da oportunidade.",
        dica: "Contato inicial não comprova contratação, pagamento ou execução.",
      },
      {
        titulo: "Formalize o que for pertinente",
        conteudo:
          "Um acordo de oportunidade não cria automaticamente crédito ou colaboração avaliável. Consumidores que precisam de serviço têm fluxos específicos de pedido e mediação.",
        dica: "Registre uma colaboração formal apenas quando a dupla realmente reconhece aquela relação de trabalho.",
      },
    ],
    exemplo:
      "Na prática: uma videomaker se candidata a uma chamada de clipe. Ela lê os prazos e discute a entrega antes de aceitar as mesmas condições da outra parte.",
    acao_url: "/opportunities",
    acao_label: "Explorar oportunidades",
  },
  {
    titulo: "Publique com cuidado, peça ajuda com contexto",
    resumo:
      "Revise o que está visível e leve à equipe informações suficientes para entender um problema.",
    categoria: "seguranca",
    intencao: "resolver",
    profissoes: [],
    passos: [
      {
        titulo: "Confira os controles de privacidade",
        conteudo:
          "Revise os dados do perfil e a visibilidade dos trabalhos. Um perfil profissional visível não transforma seus materiais reservados em conteúdo público.",
        dica: "Exibir cidade e contato deve ser uma escolha consciente, não uma consequência de publicar um trabalho.",
      },
      {
        titulo: "Preserve informações sensíveis",
        conteudo:
          "Não inclua senhas, códigos de acesso, dados privados de clientes ou arquivos sem autorização em trabalhos, comentários ou exemplos de uma solicitação.",
        dica: "Uma referência ao registro e uma descrição objetiva costumam explicar melhor o problema do que expor toda uma conversa.",
      },
      {
        titulo: "Explique o que aconteceu",
        conteudo:
          "Ao buscar suporte ou revisão, informe o recurso, o comportamento observado e as referências pertinentes. Uma denúncia solicita análise; ela não prova a acusação nem produz punição automática.",
        dica: "Casos de colaboração têm revisão própria na ficha do vínculo. Decisões podem ter procedimento de recurso.",
      },
    ],
    exemplo:
      "Na prática: uma pessoa percebe dados privados em uma publicação. Ela identifica o registro e descreve o risco, sem reproduzir esses dados em outros espaços públicos.",
    acao_url: "/settings",
    acao_label: "Revisar minha privacidade",
  },
  {
    titulo: "Música: mostre a criação e a função de cada pessoa",
    resumo:
      "Rap, composição, letra, beat e performance cabem na mesma cena, com registros adequados para cada entrega.",
    categoria: "profissoes",
    intencao: "publicar",
    profissoes: [
      "rapper",
      "mc",
      "compositor",
      "letrista",
      "beatmaker",
      "produtor",
      "dj",
      "freestyleiro",
    ],
    passos: [
      {
        titulo: "Separe a entrega do formato",
        conteudo:
          "Rapper, MC, Compositor, Letrista, Beatmaker, Produtor Musical, DJ e Freestyleiro podem atuar juntos, mas não recebem as mesmas capacidades de publicação.",
        dica: "Use as opções disponíveis para suas profissões no Espaço de Trabalho.",
      },
      {
        titulo: "Escolha a modalidade pertinente",
        conteudo:
          "Obras musicais e beats têm áreas próprias. Letras podem ser apresentadas pelo campo de texto; sets e performances sonoras também têm modalidade no módulo de trabalhos.",
        dica: "O campo textual recebe escrita ou colagem do conteúdo; não é upload de arquivo de texto.",
      },
      {
        titulo: "Identifique as contribuições",
        conteudo:
          "Informe quem compôs, escreveu, interpretou, produziu ou criou o beat conforme o registro permitir. Mencionar alguém não confirma sua participação nem conclui uma Collab.",
        dica: "Uma pessoa creditada na produção não deve ser apresentada automaticamente como intérprete.",
      },
    ],
    exemplo:
      "Na prática: uma rapper grava a letra de uma letrista sobre um beat. São três contribuições diferentes; a ficha deve descrevê-las sem concentrar toda a autoria em quem publicou.",
    acao_url: "/espaco-de-trabalho",
    acao_label: "Ver minhas modalidades musicais",
  },
  {
    titulo: "Dança: apresente o movimento e o processo",
    resumo:
      "Breaking, dança e coreografia podem ser documentados como trabalhos próprios, sem precisar cadastrar uma música.",
    categoria: "profissoes",
    intencao: "publicar",
    profissoes: ["b-boy-b-girl", "dancarino", "coreografo"],
    passos: [
      {
        titulo: "Diga qual foi sua atuação",
        conteudo:
          "Explique se você dançou, criou a coreografia, conduziu um processo ou participou de uma apresentação. Use o formato Dança / coreografia quando compatível com sua profissão.",
        dica: "B-boy/B-girl, Dançarino e Coreógrafo não precisam ter o mesmo papel no trabalho.",
      },
      {
        titulo: "Selecione registros que expliquem a entrega",
        conteudo:
          "Um vídeo, imagens e uma descrição do processo podem mostrar o contexto. Vincule apenas materiais cuja apresentação foi autorizada.",
        dica: "A pessoa filmada não se torna automaticamente autora do vídeo ou da trilha utilizada.",
      },
      {
        titulo: "Organize por experiência",
        conteudo:
          "Registre período, equipe, entregas e resultados como declarações do responsável. Depois, escolha os trabalhos elegíveis para o portfólio.",
        dica: "Um projeto em grupo não cria colaborações avaliáveis entre todas as pessoas da equipe.",
      },
    ],
    exemplo:
      "Na prática: uma coreógrafa apresenta um processo com dançarinos e uma B-girl. Ela descreve sua direção coreográfica e diferencia as participações no texto da experiência.",
    acao_url: "/work-projects/new",
    acao_label: "Registrar um trabalho de dança",
  },
  {
    titulo: "Artes visuais: uma galeria com contexto",
    resumo:
      "Apresente grafite, ilustração e design identificando a peça, sua função e a autorização das imagens.",
    categoria: "profissoes",
    intencao: "publicar",
    profissoes: ["grafiteiro", "ilustrador", "designer-grafico"],
    passos: [
      {
        titulo: "Apresente a peça ou o projeto",
        conteudo:
          "Use o trabalho visual para reunir imagens de um grafite, ilustrações, capas ou peças de uma identidade. Explique objetivo, contexto e sua função.",
        dica: "Um título específico ajuda mais do que uma galeria chamada apenas “Meus trabalhos”.",
      },
      {
        titulo: "Monte uma sequência curta",
        conteudo:
          "Escolha a ordem e escreva legendas úteis. Um arquivo do seu acervo pode ser reutilizado em coleções sem precisar de novo envio.",
        dica: "Retirar uma imagem da coleção remove o vínculo; não apaga automaticamente o arquivo original.",
      },
      {
        titulo: "Diferencie arte e registro fotográfico",
        conteudo:
          "Se outra pessoa fotografou a peça, preserve essa contribuição na apresentação. Autoria da arte e autoria da imagem não são a mesma função.",
        dica: "Uma capa ligada a uma faixa continua sendo um trabalho visual com identidade própria.",
      },
    ],
    exemplo:
      "Na prática: um grafiteiro reúne detalhes de um mural, uma ilustradora mostra uma série e um designer apresenta uma identidade. Cada trabalho explica uma entrega diferente.",
    acao_url: "/work-projects/new",
    acao_label: "Montar um trabalho visual",
  },
  {
    titulo: "Audiovisual: deixe visível o que você realizou",
    resumo:
      "Fotografia, filmagem e edição ganham clareza quando a ficha explica a contribuição de cada profissional.",
    categoria: "profissoes",
    intencao: "publicar",
    profissoes: ["fotografo", "videomaker", "editor-video"],
    passos: [
      {
        titulo: "Escolha imagem ou audiovisual",
        conteudo:
          "Fotografias podem compor trabalhos visuais. Vídeos e suas edições têm modalidade audiovisual, conforme a profissão ativa da conta.",
        dica: "Uma profissão habilitada não concede controle sobre arquivos de terceiros.",
      },
      {
        titulo: "Explique o recorte da sua atuação",
        conteudo:
          "Descreva fotografia, captação, direção, montagem ou outra função que você realmente exerceu. Anexe materiais autorizados ou referências externas permitidas.",
        dica: "Uma ficha pode explicar a edição de um vídeo sem atribuir ao editor toda a filmagem.",
      },
      {
        titulo: "Preserve a origem dos materiais",
        conteudo:
          "Vincule trabalhos e arquivos existentes quando fizer sentido. A coleção não modifica a titularidade nem libera materiais reservados do cliente.",
        dica: "Confira a prévia e a visibilidade antes de divulgar a ficha.",
      },
    ],
    exemplo:
      "Na prática: uma fotógrafa faz a capa, um videomaker registra o show e uma editora monta o clipe. Cada pessoa descreve sua entrega e apresenta somente os materiais autorizados.",
    acao_url: "/work-projects/new",
    acao_label: "Apresentar uma produção audiovisual",
  },
  {
    titulo: "Áudio técnico: explique o serviço, não só o resultado",
    resumo:
      "Captação, mixagem e masterização são contribuições próprias e podem ter uma apresentação profissional clara.",
    categoria: "profissoes",
    intencao: "publicar",
    profissoes: ["engenheiro-audio", "mixador", "masterizador"],
    passos: [
      {
        titulo: "Nomeie a função técnica",
        conteudo:
          "Engenheiro de Áudio, Mixador e Masterizador podem registrar experiências técnicas. Diga qual etapa foi sua responsabilidade e qual era a necessidade do trabalho.",
        dica: "A atuação técnica não transforma o profissional em compositor ou intérprete.",
      },
      {
        titulo: "Descreva a entrega com contexto",
        conteudo:
          "Informe o serviço, o período e as entregas pertinentes. Acrescente áudio autorizado ou uma referência, preservando informações e materiais de clientes.",
        dica: "Um comparativo de processo só deve ser apresentado quando houver autorização para os dois materiais.",
      },
      {
        titulo: "Conecte a experiência ao acervo",
        conteudo:
          "Organize o trabalho técnico no portfólio. Se houver crédito em uma obra, respeite o estado daquele vínculo; uma descrição de projeto não o confirma automaticamente.",
        dica: "Uma colaboração formal exige o próprio convite, aceite e conclusão bilateral.",
      },
    ],
    exemplo:
      "Na prática: um engenheiro registra a captação, uma mixadora apresenta sua etapa e um masterizador descreve a finalização. As três fichas podem tratar da mesma produção sem confundir as funções.",
    acao_url: "/work-projects/new",
    acao_label: "Registrar uma experiência técnica",
  },
  {
    titulo: "Gestão e produção: torne o trabalho de bastidor compreensível",
    resumo:
      "Apresente objetivos, responsabilidades e entregas de carreira, projetos culturais e eventos.",
    categoria: "profissoes",
    intencao: "publicar",
    profissoes: ["empresario", "produtor-cultural", "organizador-eventos"],
    passos: [
      {
        titulo: "Explique o que você organizou",
        conteudo:
          "Empresário, Produtor Cultural e Organizador de Eventos podem documentar projetos e experiências. Descreva seu papel e os objetivos, sem presumir autoria dos trabalhos de toda a equipe.",
        dica: "Gerir uma carreira não concede acesso à conta do artista.",
      },
      {
        titulo: "Separe experiência de evento",
        conteudo:
          "O projeto descreve sua atuação. O cadastro do evento divulga uma realização e sua gestão depende da profissão de Organizador de Eventos e da autorização sobre o registro.",
        dica: "Participar de um show ou trabalhar em sua produção não torna todas as pessoas organizadoras do evento.",
      },
      {
        titulo: "Mostre entregas e contexto",
        conteudo:
          "Registre período, equipe, entregas e resultados como informações declaradas. Selecione para o portfólio somente referências e materiais que possam ser apresentados.",
        dica: "Resultados declarados não são certificações ou garantias de desempenho futuro.",
      },
    ],
    exemplo:
      "Na prática: uma empresária descreve um projeto de carreira, um produtor cultural registra uma mostra e uma organizadora administra a divulgação do evento correspondente.",
    acao_url: "/work-projects/new",
    acao_label: "Documentar um projeto de produção",
  },
  {
    titulo: "Comunicação e cultura: apresente a pauta e sua contribuição",
    resumo:
      "Conteúdos, matérias e coberturas podem mostrar processo, formato e função sem virar uma página enciclopédica.",
    categoria: "profissoes",
    intencao: "publicar",
    profissoes: ["criador-conteudo", "jornalista-cultural"],
    passos: [
      {
        titulo: "Comece pela pauta",
        conteudo:
          "Criador de Conteúdo e Jornalista Cultural podem registrar textos, materiais audiovisuais e experiências compatíveis. Explique o assunto, o público e sua contribuição.",
        dica: "Ser jornalista na plataforma não concede o papel administrativo de Editor da Central.",
      },
      {
        titulo: "Escolha um recorte curto",
        conteudo:
          "Use o campo textual para escrever ou colar o conteúdo; acrescente arquivos autorizados ou links quando necessários. Não há upload de documentos de texto nesta modalidade.",
        dica: "Uma introdução curta e uma entrega bem identificada ajudam a pessoa a decidir o que abrir.",
      },
      {
        titulo: "Cuide das referências e da equipe",
        conteudo:
          "Diferencie texto, fotografia, captação e edição. Apresente apenas materiais autorizados e preserve dados pessoais das pessoas retratadas ou citadas.",
        dica: "Uma referência externa mantém as regras de acesso do serviço de origem.",
      },
    ],
    exemplo:
      "Na prática: uma jornalista apresenta uma cobertura cultural e uma criadora registra uma série de vídeos. Cada ficha informa a pauta e separa suas funções das contribuições de outras pessoas.",
    acao_url: "/work-projects/new",
    acao_label: "Apresentar um conteúdo cultural",
  },
];

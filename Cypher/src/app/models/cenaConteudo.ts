// Curadoria do catálogo local. Contextos de referência e enredos inventados são
// identificados internamente; não são prova de vínculo, declaração ou venda real.
export type PessoaCena = {
  slug: string;
  nome: string;
  profissoes: string[];
  nucleo: string;
  cidade: string;
  bio: string;
  tratamento?: string;
  imagem?: string;
};
export const pessoasCena: PessoaCena[] = [
  {
    slug: "nog",
    nome: "NOG",
    profissoes: ["rapper", "compositor", "letrista", "freestyleiro"],
    nucleo: "Yalla / Circuito das rimas",
    cidade: "São Paulo, SP",
    bio: "Entre a roda e o estúdio. Rap de escrita direta, encontros com Levinsk e instrumentais de Teo Guedx.",
    imagem: "Rappers/NOG.jpg",
  },
  {
    slug: "eureka",
    nome: "Eureka Beats",
    profissoes: ["beatmaker", "produtor"],
    nucleo: "Instrumentais independentes",
    cidade: "São Paulo, SP",
    bio: "Texturas de R&B, melodias noturnas e instrumentais para quem escreve com espaço e intenção.",
    imagem: "Beatmaker/EUREKA BEATS-PROFILE.jpg",
  },
  {
    slug: "jotape",
    nome: "Jotapê",
    profissoes: ["rapper", "mc", "compositor", "freestyleiro"],
    nucleo: "Papatunes / Original Quality",
    cidade: "Guarulhos, SP",
    bio: "Da batalha à construção de um disco. Palavra, personagens e a ponte entre Guarulhos e os encontros de estúdio com Papatinho e Lezin.",
    imagem: "Rappers/JOTAPE.jpg",
  },
  {
    slug: "levinsk",
    nome: "Levinsk",
    profissoes: ["rapper", "mc", "letrista", "freestyleiro"],
    nucleo: "Original Quality / Circuito das rimas",
    cidade: "São Paulo, SP",
    bio: "Identidade que vem do improviso e ganha outra forma nas faixas. Twolala, presença e escrita em diálogo com NOG e a cena das batalhas.",
    tratamento: "feminino",
    imagem: "Rappers/LEVINSK.jpg",
  },
  {
    slug: "lezin",
    nome: "Lezin",
    profissoes: ["rapper", "compositor", "letrista"],
    nucleo: "Papatunes",
    cidade: "Bahia",
    bio: "Do trap baiano às sessões da Papatunes. Caneta e interpretação dividem espaço com os encontros de Jotapê, Papatinho e Thiago Sub.",
    imagem: "Rappers/LEZIN.jpg",
  },
  {
    slug: "wkilla",
    nome: "DJ Wkilla",
    profissoes: ["dj", "beatmaker", "produtor"],
    nucleo: "Norte / Instrumentais independentes",
    cidade: "Manaus, AM",
    bio: "Detroit, hoodtrap e recortes eletrônicos. Discotecagem e produção conectando o Norte às vozes do restante da cena.",
    imagem: "Beatmaker/WKILLA.jpg",
  },
  {
    slug: "hxtel",
    nome: "HXTEL Beats",
    profissoes: ["beatmaker", "produtor"],
    nucleo: "Boom bap / Rua em Frequência",
    cidade: "São Paulo, SP",
    bio: "Bateria seca, textura de vinil e espaço para o verso. Instrumentais que conversam com a escola de Cassol, Drizzy e Pecaos.",
    imagem: "Beatmaker/HXTEL.webp",
  },
  {
    slug: "papatinho",
    nome: "Papatinho",
    profissoes: ["dj", "produtor", "beatmaker", "compositor", "mixador"],
    nucleo: "Papatunes",
    cidade: "Rio de Janeiro, RJ",
    bio: "Produtor e DJ à frente da Papatunes. O estúdio como ponto de encontro entre a escrita de Lezin, Jotapê e diferentes gerações do rap.",
  },
  {
    slug: "duzz",
    nome: "Duzz",
    profissoes: ["rapper", "compositor", "letrista"],
    nucleo: "UCLÃ",
    cidade: "São Paulo, SP",
    bio: "Caneta inquieta, faixas de rua e melodias de madrugada. Um núcleo criativo que aproxima Sobs, Drizzy, Pecaos e Ecologyk.",
  },
  {
    slug: "drizzy",
    nome: "Drizzy",
    profissoes: ["rapper", "compositor", "letrista"],
    nucleo: "Rua em Frequência / UCLÃ",
    cidade: "São Paulo, SP",
    bio: "Flow de boom bap e encontro de canetas com Pecaos. Na ponte com Duzz e Ecologyk, a rua encontra novos arranjos.",
  },
  {
    slug: "pecaos",
    nome: "Pecaos",
    profissoes: ["rapper", "compositor", "letrista"],
    nucleo: "Rua em Frequência",
    cidade: "São Paulo, SP",
    bio: "Rima de conversa, peso no verso e sessões que aproximam Drizzy, Cassol e o circuito independente.",
  },
  {
    slug: "cassol",
    nome: "Cassol",
    profissoes: ["rapper", "compositor", "letrista"],
    nucleo: "Rua em Frequência",
    cidade: "Curitiba, PR",
    bio: "Versos de cotidiano sobre bateria de boom bap. Encontros de escrita com Pecaos e Drizzy são o ponto de partida para novos sons.",
  },
  {
    slug: "sobs",
    nome: "Sobs",
    profissoes: ["rapper", "compositor", "letrista"],
    nucleo: "UCLÃ",
    cidade: "São Paulo, SP",
    bio: "Uma das vozes do núcleo UCLÃ. Escrita, melodias e trabalhos que atravessam o universo de Duzz, Peunubeat e China.",
  },
  {
    slug: "gnao",
    nome: "GNÃO",
    profissoes: ["rapper", "compositor"],
    nucleo: "Guarulhos / Original Quality",
    cidade: "Guarulhos, SP",
    bio: "A caminhada de Guarulhos atravessa suas faixas e os encontros com Jotapê. Novas ideias nascem da troca entre amigos e estúdios.",
  },
  {
    slug: "emicida",
    nome: "Emicida",
    profissoes: ["rapper", "mc", "compositor", "freestyleiro"],
    nucleo: "Laboratório Fantasma",
    cidade: "São Paulo, SP",
    bio: "Palavra, memória e criação coletiva. O rap como ponte para artes visuais, produção cultural e encontros entre gerações.",
  },
  {
    slug: "rincon",
    nome: "Rincon Sapiência",
    profissoes: ["rapper", "mc", "compositor", "produtor"],
    nucleo: "MGoma / Corpo e Palavra",
    cidade: "São Paulo, SP",
    bio: "Ritmo, dança e palavra no mesmo movimento. Produção musical e universo visual em diálogo com a equipe da MGoma.",
  },
  {
    slug: "ecologyk",
    nome: "Ecologyk",
    profissoes: [
      "beatmaker",
      "produtor",
      "engenheiro-audio",
      "mixador",
      "masterizador",
    ],
    nucleo: "UCLÃ",
    cidade: "São Paulo, SP",
    bio: "Do instrumental à finalização. Texturas e engenharia de som que conectam Duzz, Drizzy e Pecaos.",
  },
  {
    slug: "teoguedx",
    nome: "Teo Guedx",
    profissoes: [
      "beatmaker",
      "produtor",
      "engenheiro-audio",
      "mixador",
      "masterizador",
    ],
    nucleo: "Yalla / Circuito das rimas",
    cidade: "São Paulo, SP",
    bio: "Produção, mixagem e masterização com atenção ao lugar da voz. Parceiro do universo musical de NOG e Levinsk.",
  },
  {
    slug: "peunubeat",
    nome: "Peunubeat",
    profissoes: ["beatmaker", "produtor"],
    nucleo: "UCLÃ",
    cidade: "São Paulo, SP",
    bio: "Instrumentais para encontros de várias vozes. O beat abre espaço para os versos de Duzz, Sobs, NOG e Jotapê.",
  },
  {
    slug: "thiagosub",
    nome: "Thiago Sub",
    profissoes: ["beatmaker", "produtor", "compositor"],
    nucleo: "Papatunes / Sessões de estúdio",
    cidade: "Rio de Janeiro, RJ",
    bio: "Produção musical e desenho de timbres na construção das faixas. Um dos encontros de estúdio do repertório de Lezin.",
  },
  {
    slug: "lwally",
    nome: "lWally",
    profissoes: ["engenheiro-audio", "mixador", "masterizador"],
    nucleo: "Original Quality",
    cidade: "São Paulo, SP",
    bio: "Captação e finalização que deixam a interpretação respirar. Trabalho de estúdio conectado ao universo de Jotapê e Papatinho.",
  },
  {
    slug: "2funflow",
    nome: "2F",
    profissoes: ["engenheiro-audio", "mixador", "masterizador"],
    nucleo: "Original Quality",
    cidade: "São Paulo, SP",
    bio: "Equilíbrio, dinâmica e tradução do som para diferentes sistemas. Mixagem e masterização na equipe de Até A Última Rima.",
  },
  {
    slug: "thiagoveiga",
    nome: "Thiago Veiga",
    profissoes: ["videomaker", "editor-video"],
    nucleo: "Veiga Lab / Yalla / UCLÃ",
    cidade: "São Paulo, SP",
    bio: "Direção e montagem com linguagem de videoclipe. Imagem em movimento para encontros de NOG, Levinsk, Duzz e Sobs.",
  },
  {
    slug: "tpires",
    nome: "TPires",
    profissoes: ["videomaker", "editor-video", "criador-conteudo"],
    nucleo: "UCLÃ",
    cidade: "São Paulo, SP",
    bio: "Direção, edição e construção de identidade audiovisual no circuito UCLÃ. A imagem como extensão do universo de cada faixa.",
  },
  {
    slug: "torvic",
    nome: "Torvic Vision",
    profissoes: ["fotografo", "editor-video", "videomaker"],
    nucleo: "Veiga Lab / Yalla / UCLÃ",
    cidade: "São Paulo, SP",
    bio: "Still, câmera e pós-produção. Do set ao material de divulgação, acompanha a energia dos encontros da cena.",
  },
  {
    slug: "yanbello",
    nome: "Yan Bello",
    profissoes: ["fotografo", "criador-conteudo"],
    nucleo: "Yalla / Circuito das rimas",
    cidade: "São Paulo, SP",
    bio: "Retratos e bastidores com olhar para a presença de cada artista. Fotografia de cena ligada ao universo de NOG e Levinsk.",
  },
  {
    slug: "jay",
    nome: "Jay · Original Quality",
    profissoes: ["empresario", "produtor-cultural", "organizador-eventos"],
    nucleo: "Original Quality / Papatunes",
    cidade: "São Paulo, SP",
    bio: "Direção executiva e produção de encontros. Conecta criação, equipe e circulação no universo da Original Quality.",
  },
  {
    slug: "fioti",
    nome: "Evandro Fióti",
    profissoes: ["empresario", "produtor-cultural", "organizador-eventos"],
    nucleo: "Laboratório Fantasma",
    cidade: "São Paulo, SP",
    bio: "Criação, gestão e circulação cultural. Uma ponte entre música, imagem e as equipes que constroem os projetos do Laboratório Fantasma.",
  },
  {
    slug: "caroljafet",
    nome: "Carol Jafet",
    profissoes: ["empresario", "produtor-cultural", "organizador-eventos"],
    nucleo: "MGoma / Corpo e Palavra",
    cidade: "São Paulo, SP",
    bio: "Produção artística e executiva conectada ao universo de Rincon Sapiência. Equipes, bastidores e encontros que chegam ao público.",
    tratamento: "feminino",
  },
  {
    slug: "fernandaferreira",
    nome: "Fernanda Ferreira",
    profissoes: ["produtor-cultural", "organizador-eventos"],
    nucleo: "Veiga Lab / Yalla / UCLÃ",
    cidade: "São Paulo, SP",
    bio: "Produção audiovisual e coordenação de equipe. Da preparação de uma diária à circulação do trabalho, acompanha cada etapa do encontro.",
    tratamento: "feminino",
  },
  {
    slug: "neguin",
    nome: "B-Boy Neguin",
    profissoes: ["b-boy-b-girl", "dancarino", "coreografo", "dj"],
    nucleo: "Breaking / Corpo e Palavra",
    cidade: "Paraná",
    bio: "Breaking em diálogo com musicalidade, capoeira e discotecagem. Corpo, ritmo e pesquisa de movimento como linguagem.",
  },
  {
    slug: "pelezinho",
    nome: "B-Boy Pelezinho",
    profissoes: ["b-boy-b-girl", "dancarino", "coreografo"],
    nucleo: "Breaking / Corpo e Palavra",
    cidade: "São Paulo, SP",
    bio: "A escola do breaking brasileiro encontra dinâmica, personalidade e pesquisa corporal. Um ponto de conexão entre a roda e o palco.",
  },
  {
    slug: "gabb",
    nome: "Gabb Cabo Verde",
    profissoes: ["dancarino", "coreografo"],
    nucleo: "MGoma / Corpo e Palavra",
    cidade: "São Paulo, SP",
    bio: "Danças afro-urbanas, criação de movimento e presença. A coreografia amplia o universo de Rincon Sapiência.",
    tratamento: "feminino",
  },
  {
    slug: "maricarvalho",
    nome: "Mari Carvalho",
    profissoes: ["dancarino", "coreografo"],
    nucleo: "MGoma / Corpo e Palavra",
    cidade: "São Paulo, SP",
    bio: "Ritmos afro-urbanos e caribenhos na pesquisa de corpo e cena. Movimento em diálogo com música e criação coletiva.",
    tratamento: "feminino",
  },
  {
    slug: "speto",
    nome: "Speto",
    profissoes: ["grafiteiro", "ilustrador", "designer-grafico"],
    nucleo: "Artes da Rua",
    cidade: "São Paulo, SP",
    bio: "Arte urbana, desenho e referências da cultura popular brasileira. Imagens que ligam o muro, o papel e a identidade de um projeto.",
  },
  {
    slug: "binho",
    nome: "Binho Ribeiro",
    profissoes: ["grafiteiro", "ilustrador", "produtor-cultural"],
    nucleo: "Artes da Rua",
    cidade: "São Paulo, SP",
    bio: "Grafite e articulação cultural com raízes no hip-hop. A cidade como espaço de criação, encontro e circulação de artistas.",
  },
  {
    slug: "jessoalves",
    nome: "Jesso Alves",
    profissoes: ["ilustrador", "designer-grafico"],
    nucleo: "MGoma / Corpo e Palavra",
    cidade: "Brasília, DF",
    bio: "Ilustração de capa e universo visual. Desenho que encontra a musicalidade e as cores do repertório de Rincon Sapiência.",
  },
  {
    slug: "millacarol",
    nome: "Milla Carol",
    profissoes: ["designer-grafico", "ilustrador"],
    nucleo: "MGoma / Corpo e Palavra",
    cidade: "São Paulo, SP",
    bio: "Design e direção visual para música. Identidades que acompanham uma faixa da capa ao material de circulação.",
    tratamento: "feminino",
  },
  {
    slug: "aquiles",
    nome: "Aquiles Marchel",
    profissoes: ["jornalista-cultural", "criador-conteudo"],
    nucleo: "Imprensa / Vozes da Cena",
    cidade: "São Paulo, SP",
    bio: "Jornalismo cultural para acompanhar trajetórias, lançamentos e o contexto de cada projeto. Música, cinema e cultura em conversa.",
  },
  {
    slug: "andrefelipe",
    nome: "André Felipe de Medeiros",
    profissoes: ["jornalista-cultural", "criador-conteudo"],
    nucleo: "Imprensa / Vozes da Cena",
    cidade: "São Paulo, SP",
    bio: "Cobertura musical, entrevistas e pesquisa de repertório. Histórias que aproximam quem cria e quem acompanha a cena.",
  },
];

export const encontrosCena = [
  {
    id: "cena-obra-sem-atalho",
    titulo: "Sem Atalho",
    autor: "lezin",
    genero: "Trap",
    equipe: [
      ["jotape", "Participação como feat"],
      ["papatinho", "Produção musical"],
      ["lwally", "Mixagem"],
      ["2funflow", "Masterização"],
    ],
    descricao:
      "Lezin e Jotapê cruzam duas formas de escrever sobre a caminhada. A produção de Papatinho costura o encontro entre Bahia, Guarulhos e Rio.",
    capa: "papatunes",
  },
  {
    id: "cena-obra-asfalto-em-orbita",
    titulo: "Asfalto em Órbita",
    autor: "duzz",
    genero: "Boom Bap",
    equipe: [
      ["drizzy", "Participação como feat"],
      ["pecaos", "Participação como feat"],
      ["ecologyk", "Produção musical"],
      ["tpires", "Direção audiovisual"],
    ],
    descricao:
      "Três canetas, uma madrugada de estúdio. Duzz, Drizzy e Pecaos transformam os intervalos da cidade em versos sobre tempo, trabalho e amizade.",
    capa: "ucla",
  },
  {
    id: "cena-obra-lado-b-da-vila",
    titulo: "Lado B da Vila",
    autor: "nog",
    genero: "Rap",
    equipe: [
      ["levinsk", "Participação como feat"],
      ["gnao", "Participação como feat"],
      ["teoguedx", "Produção musical"],
      ["thiagoveiga", "Direção audiovisual"],
      ["yanbello", "Fotografia"],
    ],
    descricao:
      "A conversa de NOG e Levinsk ganha a perspectiva de GNÃO. Bateria crua, refrão de roda e imagens pensadas a partir de retratos do bairro.",
    capa: "yalla",
  },
  {
    id: "cena-obra-entre-linhas",
    titulo: "Entre Linhas e Becos",
    autor: "cassol",
    genero: "Boom Bap",
    equipe: [
      ["pecaos", "Participação como feat"],
      ["drizzy", "Participação como feat"],
      ["hxtel", "Beat"],
    ],
    descricao:
      "Cassol, Pecaos e Drizzy dividem o mesmo compasso. Um encontro sem pressa sobre as pequenas escolhas que desenham uma trajetória.",
    capa: "rua",
  },
  {
    id: "cena-obra-corpo-palavra",
    titulo: "Corpo e Palavra",
    autor: "rincon",
    genero: "Rap",
    equipe: [
      ["emicida", "Participação como feat"],
      ["gabb", "Coreografia"],
      ["maricarvalho", "Coreografia"],
      ["jessoalves", "Ilustração"],
      ["millacarol", "Design gráfico"],
    ],
    descricao:
      "A palavra encontra o corpo: rap, dança e identidade visual construídos como uma só apresentação. A equipe trabalha o mesmo pulso em cada linguagem.",
    capa: "corpo",
  },
  {
    id: "cena-obra-antes-do-primeiro-trem",
    titulo: "Antes do Primeiro Trem",
    autor: "levinsk",
    genero: "R&B",
    equipe: [
      ["lezin", "Participação como feat"],
      ["eureka", "Beat"],
      ["torvic", "Fotografia"],
    ],
    descricao:
      "Levinsk e Lezin dividem uma composição de madrugada sobre partir, ficar e encontrar o próprio ritmo. O instrumental de Eureka deixa os silêncios aparecerem.",
    capa: "noite",
  },
  {
    id: "cena-obra-norte-em-cena",
    titulo: "Norte em Cena",
    autor: "duzz",
    genero: "Detroit",
    equipe: [
      ["sobs", "Participação como feat"],
      ["wkilla", "Beat"],
      ["ecologyk", "Mixagem"],
    ],
    descricao:
      "Um instrumental de Manaus recebe os versos de Duzz e Sobs. Recortes digitais, bateria deslocada e uma conversa entre diferentes pontos do mapa.",
    capa: "norte",
  },
  {
    id: "cena-obra-mesmo-quarteirao",
    titulo: "Mesmo Quarteirão",
    autor: "jotape",
    genero: "Rap",
    equipe: [
      ["nog", "Participação como feat"],
      ["gnao", "Participação como feat"],
      ["peunubeat", "Beat"],
    ],
    descricao:
      "Jotapê, NOG e GNÃO fazem uma roda de histórias: as referências mudam, mas o encontro continua sendo a matéria-prima do rap.",
    capa: "yalla",
  },
];

export const projetosCena = [
  {
    id: "cena-projeto-sessao-papatunes",
    titulo: "Sessões da Papatunes · Verso em Construção",
    autor: "papatinho",
    modalidade: "projeto",
    profissoes: ["produtor", "beatmaker"],
    equipe: ["lezin", "jotape", "lwally", "2funflow", "jay"],
    descricao:
      "Encontros de escrita, produção e finalização. Da primeira ideia ao arranjo, cada sessão aproxima vozes e profissionais do mesmo núcleo.",
    papel: "Direção musical e produção",
    entregas: "Duas faixas, retratos de estúdio e caderno de processo.",
    capa: "papatunes",
  },
  {
    id: "cena-projeto-asfalto",
    titulo: "Asfalto em Órbita · Filme de uma Sessão",
    autor: "thiagoveiga",
    modalidade: "audiovisual",
    profissoes: ["videomaker", "editor-video"],
    equipe: [
      "duzz",
      "drizzy",
      "pecaos",
      "ecologyk",
      "torvic",
      "fernandaferreira",
    ],
    descricao:
      "Um filme curto acompanha a construção de Asfalto em Órbita. Câmera próxima, luz do estúdio e montagem guiada pelo ritmo dos versos.",
    papel: "Direção e montagem",
    entregas: "Filme de sessão, teaser vertical e seleção de stills.",
    capa: "ucla",
  },
  {
    id: "cena-projeto-corpo",
    titulo: "Corpo e Palavra · Laboratório de Movimento",
    autor: "gabb",
    modalidade: "danca",
    profissoes: ["dancarino", "coreografo"],
    equipe: [
      "rincon",
      "emicida",
      "maricarvalho",
      "neguin",
      "pelezinho",
      "caroljafet",
    ],
    descricao:
      "Rap e dança desenvolvidos em conjunto. A pesquisa parte do pulso da faixa e encontra momentos de improviso, chão e presença coletiva.",
    papel: "Criação coreográfica",
    entregas: "Apresentação de palco e registro da pesquisa corporal.",
    capa: "corpo",
  },
  {
    id: "cena-projeto-retratos",
    titulo: "Entre um Verso e Outro · Retratos de Set",
    autor: "yanbello",
    modalidade: "fotografia",
    profissoes: ["fotografo"],
    equipe: ["nog", "levinsk", "jotape", "torvic"],
    descricao:
      "Fotografias dos encontros entre preparação, gravação e intervalo. A série procura as pessoas antes da pose e depois do último take.",
    papel: "Fotografia e edição de imagem",
    entregas: "Série de retratos e seleção para materiais de circulação.",
    capa: "yalla",
  },
  {
    id: "cena-projeto-muros",
    titulo: "Muros que Rimam · Cidade em Camadas",
    autor: "binho",
    modalidade: "galeria",
    profissoes: ["grafiteiro", "ilustrador"],
    equipe: ["speto", "jessoalves", "millacarol", "rincon", "fioti"],
    descricao:
      "Uma conversa entre mural, capa e cenário de palco. Grafite, ilustração e design partem das mesmas palavras para construir imagens diferentes.",
    papel: "Criação visual e articulação cultural",
    entregas: "Painéis, estudos de capa e identidade do encontro.",
    capa: "artes",
  },
  {
    id: "cena-projeto-vozes",
    titulo: "Vozes da Cena · Quem Faz o Som Acontecer",
    autor: "aquiles",
    modalidade: "texto",
    profissoes: ["jornalista-cultural", "criador-conteudo"],
    equipe: ["andrefelipe", "lezin", "papatinho", "duzz", "caroljafet"],
    descricao:
      "Conversas sobre a cadeia criativa: quem escreve, produz, registra e faz circular. A série aproxima os artistas das equipes por trás das obras.",
    papel: "Pesquisa e entrevistas",
    entregas: "Série editorial, entrevistas e recortes para leitura rápida.",
    capa: "noite",
  },
];

export const oportunidadesCena = [
  {
    id: "cena-op-capa",
    autor: "jay",
    titulo: "Identidade visual para a próxima sessão da Papatunes",
    profissao: "designer-grafico",
    valor: 180000,
    descricao:
      "Buscamos uma identidade que una capa, peças verticais e material de lançamento para o encontro de Lezin e Jotapê. O projeto já tem direção musical e precisa de uma leitura visual própria.",
    vagas: 1,
    projeto: "cena-projeto-sessao-papatunes",
  },
  {
    id: "cena-op-stills",
    autor: "fernandaferreira",
    titulo: "Fotografia de bastidores · Asfalto em Órbita",
    profissao: "fotografo",
    valor: 95000,
    descricao:
      "Uma diária para acompanhar a gravação de Duzz, Drizzy e Pecaos. Precisamos de retratos, atmosfera do estúdio e material de divulgação em formatos horizontal e vertical.",
    vagas: 2,
    projeto: "cena-projeto-asfalto",
  },
  {
    id: "cena-op-movimento",
    autor: "caroljafet",
    titulo: "Corpo e Palavra procura intérpretes de dança",
    profissao: "dancarino",
    valor: 140000,
    descricao:
      "A equipe de Gabb Cabo Verde e Mari Carvalho prepara uma criação com Rincon e Emicida. A seleção procura intérpretes com pesquisa própria e disponibilidade para ensaios presenciais.",
    vagas: 3,
    projeto: "cena-projeto-corpo",
  },
  {
    id: "cena-op-master",
    autor: "papatinho",
    titulo: "Finalização de áudio para uma sessão de duas vozes",
    profissao: "masterizador",
    valor: 80000,
    descricao:
      "Duas faixas do núcleo de estúdio precisam de masterização com foco em dinâmica, inteligibilidade e tradução para streaming. Envio de referência e conversa técnica antes do fechamento.",
    vagas: 1,
    projeto: "cena-projeto-sessao-papatunes",
  },
  {
    id: "cena-op-texto",
    autor: "aquiles",
    titulo: "Reportagem visual · os bastidores que não aparecem no refrão",
    profissao: "jornalista-cultural",
    valor: 120000,
    descricao:
      "Vozes da Cena abre uma pauta sobre profissionais técnicos, equipes visuais e circulação cultural. Procuramos uma abordagem de entrevista que una contexto e escuta.",
    vagas: 1,
    projeto: "cena-projeto-vozes",
  },
  {
    id: "cena-op-mural",
    autor: "fioti",
    titulo: "Mural coletivo para o encontro Muros que Rimam",
    profissao: "grafiteiro",
    valor: 240000,
    descricao:
      "O encontro aproxima arte urbana e música. Precisamos de propostas autorais para um painel coletivo, em diálogo com a identidade desenvolvida por Binho, Speto e a equipe visual.",
    vagas: 2,
    projeto: "cena-projeto-muros",
  },
];

export const ofertasCena: Record<
  string,
  {
    preco: number;
    free?: boolean;
    vendidoPara?: string;
    tom: string;
    duracao: string;
    classificacao: string;
  }
> = {
  "demo-beat-vice-city": {
    preco: 14990,
    free: true,
    tom: "",
    duracao: "1:54",
    classificacao: "R&B / Melódico",
  },
  "demo-beat-visao-de-rua": {
    preco: 89990,
    vendidoPara: "drizzy",
    tom: "",
    duracao: "3:37",
    classificacao: "Boom bap / Sujo",
  },
  "demo-beat-parece-sorte": {
    preco: 7990,
    tom: "",
    duracao: "3:35",
    classificacao: "Boom bap / Jazz",
  },
  "demo-beat-desde-ontem": {
    preco: 19990,
    tom: "",
    duracao: "3:48",
    classificacao: "Boom bap / Noturno",
  },
  "demo-beat-spider-man": {
    preco: 64990,
    vendidoPara: "duzz",
    tom: "",
    duracao: "3:08",
    classificacao: "Detroit / Agressivo",
  },
  "demo-beat-caos": {
    preco: 6990,
    free: true,
    tom: "",
    duracao: "2:59",
    classificacao: "Hoodtrap / Trap",
  },
};

export const conversasCena: Record<string, { autor: string; texto: string }[]> =
  {
    "cena-obra-sem-atalho": [
      {
        autor: "lezin",
        texto:
          "Essa começou com uma guia de voz e terminou com cada um encontrando seu espaço. O encontro com Jotapê mudou o refrão.",
      },
      {
        autor: "papatinho",
        texto:
          "Deixei a bateria respirar para a troca de versos aparecer. Agora quero ouvir essa no palco.",
      },
    ],
    "cena-obra-asfalto-em-orbita": [
      {
        autor: "drizzy",
        texto:
          "Três canetas, três caminhos para o mesmo instrumental. A virada depois do segundo verso foi a chave.",
      },
      {
        autor: "ecologyk",
        texto:
          "A textura veio antes da bateria. Duzz e Pecaos trouxeram outra intenção para o arranjo.",
      },
    ],
    "cena-obra-lado-b-da-vila": [
      {
        autor: "levinsk",
        texto:
          "Queria manter a energia da roda sem perder os detalhes da escrita. Essa troca com NOG e GNÃO encaixou demais.",
      },
      {
        autor: "yanbello",
        texto:
          "Na imagem, fui atrás da mesma luz de fim de tarde que atravessa os versos. O ensaio faz parte do projeto Retratos da Cena.",
      },
    ],
    "cena-obra-entre-linhas": [
      {
        autor: "pecaos",
        texto:
          "Cada verso deixou uma deixa para o próximo. Cassol puxou a primeira ideia e o resto virou conversa.",
      },
      {
        autor: "hxtel",
        texto:
          "Caixa seca e espaço para a voz. Fiz o instrumental pensando justamente nessa troca entre as três escritas.",
      },
    ],
    "cena-obra-corpo-palavra": [
      {
        autor: "gabb",
        texto:
          "O movimento nasceu junto com a música. Mari e eu estamos levando essa pesquisa para o laboratório aberto.",
      },
      {
        autor: "rincon",
        texto:
          "Quando a dança entra desde o começo, a interpretação muda. O projeto reúne essa construção inteira, da palavra ao corpo.",
      },
    ],
    "cena-obra-antes-do-primeiro-trem": [
      {
        autor: "eureka",
        texto:
          "Esse piano ficou guardado até encontrar essas vozes. A levada pede escuta de madrugada.",
      },
      {
        autor: "lezin",
        texto:
          "A escrita da Levinsk trouxe um contraste bonito para a minha parte. Tem silêncio que também conta a história.",
      },
    ],
    "cena-obra-norte-em-cena": [
      {
        autor: "wkilla",
        texto:
          "A ideia era deixar o grave conversar com o recorte eletrônico sem cobrir as vozes. Norte presente na troca.",
      },
      {
        autor: "sobs",
        texto:
          "O refrão ganhou outro caminho depois da sessão com Duzz. Estamos organizando as referências visuais para o próximo passo.",
      },
    ],
    "cena-obra-mesmo-quarteirao": [
      {
        autor: "jotape",
        texto:
          "Encontro de quem já se cruzou em tanta roda. Aqui a gente teve tempo de construir cada entrada junto.",
      },
      {
        autor: "peunubeat",
        texto:
          "O instrumental acompanha a passagem de um verso para o outro. Tem detalhe de percussão que só aparece na segunda escuta.",
      },
    ],
  };

export const fontesCena = [
  {
    nucleo: "Papatunes / Original Quality",
    url: "https://www.youtube.com/watch?v=I2TXDkpP0rA",
    contexto:
      "Créditos oficiais de Jay Jay: intérpretes, produção musical, finalização e equipe audiovisual.",
  },
  {
    nucleo: "Yalla / Circuito das rimas",
    url: "https://www.youtube.com/watch?v=aB1jzbXJGiM",
    contexto:
      "Créditos oficiais de HORIZONTAL!: NOG, Levinsk, Teo Guedx, Thiago Veiga, equipe de produção e fotografia.",
  },
  {
    nucleo: "UCLÃ",
    url: "https://www.youtube.com/watch?v=TtaokHGzNIU",
    contexto:
      "Registro fonográfico de Inteligência Marginal #2: Duzz, Drizzy, Pecaos e Ecologyk.",
  },
  {
    nucleo: "UCLÃ",
    url: "https://www.youtube.com/watch?v=Dzgsfvam1oY",
    contexto:
      "Créditos oficiais de Inteligência Marginal #3: encontro de Sobs, Duzz, NOG e Jotapê.",
  },
  {
    nucleo: "MGoma / Corpo e Palavra",
    url: "https://vimeo.com/441655769",
    contexto:
      "Ficha de Malícia publicada pelo realizador: Rincon, Carol Jafet, Gabb Cabo Verde e equipe.",
  },
  {
    nucleo: "MGoma / Corpo e Palavra",
    url: "https://www.youtube.com/watch?v=dTo_czVQWEo",
    contexto:
      "Créditos de Xona: design de Milla Carol e ilustração de Jesso Alves.",
  },
  {
    nucleo: "Laboratório Fantasma",
    url: "https://blackmadre.com/projects/lingua-franca",
    contexto:
      "Produção executiva de Evandro Fióti e encontro de música, design e ilustração.",
  },
  {
    nucleo: "Breaking",
    url: "https://www.redbull.com/br-pt/danca-mestres-breaking-neguin",
    contexto:
      "Trajetória de Neguin, conexão com Pelezinho e suas linguagens de movimento e música.",
  },
  {
    nucleo: "Artes da Rua",
    url: "https://www.binhoribeiro.com.br/",
    contexto: "Portfólio e trajetória de Binho Ribeiro.",
  },
  {
    nucleo: "Artes da Rua",
    url: "https://www.under-dogs.net/pages/artist/speto",
    contexto:
      "Perfil artístico de Speto e diálogo com a cultura visual brasileira.",
  },
  {
    nucleo: "Imprensa",
    url: "https://www.pretessencias.com.br/musica/abrindo-caminhos-para-novo-album-lezin-lanca-profetiza/",
    contexto:
      "Contexto de Lezin, Papatunes e Thiago Sub; autoria de Aquiles Marchel.",
  },
  {
    nucleo: "Imprensa",
    url: "https://monkeybuzz.com.br/novidades/rubel-lanca-video-de-chiste-com-rincon-sapiencia/",
    contexto:
      "Cobertura cultural de André Felipe de Medeiros sobre Rincon Sapiência.",
  },
];

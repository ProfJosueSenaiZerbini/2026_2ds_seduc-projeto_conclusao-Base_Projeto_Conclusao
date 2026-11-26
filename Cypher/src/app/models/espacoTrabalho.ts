import { objetoDisponivel } from "./politicasModeracao.js";
import { listarProjetos, formatosTrabalho } from "./projetosTrabalho.js";
import { profissoesAtivas } from "./oportunidades.js";
import { conexaoInternaCypher, type UsuarioDaSessao } from "./bancoDados.js";
import { profissoesCatalogo } from "./modeloPerfil.js";
import { podePublicar } from "./permissoes.js";
import { rotuloProfissional } from "./tratamentoProfissional.js";

export const rotaEspaco = "/espaco-de-trabalho";
export const modalidades = [
  {modalidade:"projeto",nome:"Criar trabalho / galeria",base:"/work-projects",icone:"brush"},
  { modalidade: "obra", nome: "Criar obra", base: "/works", icone: "music" },
  {
    modalidade: "beat",
    nome: "Cadastrar beat",
    base: "/beats",
    icone: "audioLines",
  },
  {
    modalidade: "evento",
    nome: "Criar evento",
    base: "/events",
    icone: "calendarDays",
  },
] as const;
export type Modalidade = (typeof modalidades)[number]["modalidade"];

export function acoesCriacao(usuario: UsuarioDaSessao) {
  const acoes: {modalidade:string;nome:string;base:string;icone:string}[] = modalidades.filter(
    acao => !usuario.demonstracao && (acao.modalidade === "projeto" ? usuario.tipoConta === "profissional" && profissoesAtivas(usuario.id).length > 0 : podePublicar(usuario, acao.modalidade))
  );
  if (!usuario.demonstracao && usuario.tipoConta === "profissional" && profissoesAtivas(usuario.id).length) acoes.push({modalidade:"oportunidade",nome:"Criar oportunidade",base:"/opportunities",icone:"briefcase"});
  return acoes;
}

export function normalizarBusca(texto: string) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

const iconesProfissao: Record<string, string> = {
  rapper: "mic",
  mc: "mic",
  compositor: "fileMusic",
  letrista: "pen",
  beatmaker: "audioLines",
  produtor: "sliders",
  dj: "disc",
  freestyleiro: "mic",
  "b-boy-b-girl": "footprints",
  dancarino: "footprints",
  coreografo: "users",
  grafiteiro: "spray",
  ilustrador: "brush",
  "designer-grafico": "design",
  fotografo: "camera",
  videomaker: "clapperboard",
  "editor-video": "scissors",
  "engenheiro-audio": "headphones",
  mixador: "sliders",
  masterizador: "audioLines",
  empresario: "briefcase",
  "produtor-cultural": "users",
  "organizador-eventos": "calendarDays",
  "criador-conteudo": "video",
  "jornalista-cultural": "newspaper",
  podcaster: "podcast",
};

export function profissoesDaConta(usuario: UsuarioDaSessao) {
  return profissoesCatalogo
    .filter(p => usuario.categories.includes(p.rotulo))
    .map(p => ({
      ...p,
      icone: iconesProfissao[p.id],
      nome: rotuloProfissional(p.rotulo, usuario.tratamento),
    }));
}

type Linha = {
  id: string;
  modalidade: Modalidade;
  titulo: string;
  autor: string;
  tipo: string;
  metadados: string;
  descricao: string;
  link: string;
  proprio: number;
  papeis: string;
  atuacoes: string;
  ficha: string;
};

// O vínculo com o usuário entra na consulta antes de qualquer busca ou filtro visual.
const registros = `
  WITH meus_creditos AS (
    SELECT obra_id, json_group_array(json_object('papel',funcao,'detalhe',participacao)) AS papeis
    FROM creditos WHERE usuario_creditado_id=@usuario AND verificado=1 AND demonstracao=0 GROUP BY obra_id
  ), trabalhos AS (
    SELECT o.id, 'obra' AS modalidade, o.titulo, p.nome AS autor, o.tipo,
      trim(coalesce(nullif(o.tipo_detalhe,'') || ' · ', '') || coalesce(nullif(o.genero_detalhe,''),o.genero), ' ·') AS metadados,
      o.descricao, o.link_escuta AS link, o.proprietario_id=@usuario AS proprio,
      CASE WHEN o.proprietario_id=@usuario THEN json_array(json_object('papel',o.funcao_principal,'detalhe',o.funcao_detalhe)) ELSE c.papeis END AS papeis,
      CASE WHEN o.proprietario_id=@usuario THEN (SELECT json_group_array(profissao_id) FROM atuacoes_obra WHERE obra_id=o.id) ELSE '[]' END AS atuacoes,
      json_object('Data informada no acervo anterior',o.data_lancamento,'BPM',o.bpm,'Letra',CASE WHEN o.proprietario_id=@usuario THEN o.letra END) AS ficha, o.criado_em
    FROM obras o JOIN perfis p ON p.usuario_id=o.proprietario_id LEFT JOIN meus_creditos c ON c.obra_id=o.id
    WHERE o.demonstracao=0 AND p.demonstracao=0 AND (o.proprietario_id=@usuario OR c.obra_id IS NOT NULL)
    UNION ALL
    SELECT b.id,'beat',b.titulo,p.nome,'Beat',b.genero,b.descricao,'',1,'[]','["beatmaker"]',
      json_object('BPM',b.bpm,'Tonalidade',b.tom_musical,'Duração',b.duracao,'Licença',b.licenca,'Condições de uso',b.condicoes_uso),b.criado_em
    FROM beats b JOIN perfis p ON p.usuario_id=b.produtor_id
    WHERE b.demonstracao=0 AND p.demonstracao=0 AND b.produtor_id=@usuario
    UNION ALL
    SELECT e.id,'evento',e.titulo,coalesce(nullif(e.organizador,''),p.nome),'Evento',
      coalesce(nullif(e.categoria_detalhe,''),e.categoria),e.descricao,'',e.proprietario_id=@usuario,
      CASE WHEN e.proprietario_id=@usuario THEN '[]' WHEN pr.usuario_id IS NOT NULL THEN '[{"papel":"Comparecimento registrado","detalhe":"Não comprova contribuição profissional"}]' ELSE '[{"papel":"Participação confirmada","detalhe":"Registro anterior à separação de inscrições e presença"}]' END,
      CASE WHEN e.proprietario_id=@usuario THEN '["organizador-eventos"]' ELSE '[]' END,
      json_object('Data',e.data_texto,'Horário',e.horario,'Local',e.local,'Formato',e.formato,'Inscrição',e.inscricao,'Premiação',e.premio),e.criado_em
    FROM eventos e JOIN perfis p ON p.usuario_id=e.proprietario_id
    LEFT JOIN eventos_presencas pr ON pr.evento_id=e.id AND pr.usuario_id=@usuario AND pr.revogada_em IS NULL
    LEFT JOIN interesses_eventos i ON i.evento_id=e.id AND i.usuario_id=@usuario AND i.status='confirmado' AND NOT EXISTS(SELECT 1 FROM eventos_inscricoes ni WHERE ni.evento_id=e.id AND ni.usuario_id=@usuario)
    WHERE e.demonstracao=0 AND p.demonstracao=0 AND (e.proprietario_id=@usuario OR pr.usuario_id IS NOT NULL OR i.id IS NOT NULL)
  )`;

// Créditos legados têm função em texto livre. Usamos correspondências de funções inteiras.
// Papéis ambíguos continuam na visão unificada até que o titular indique as atuações.
const funcoes: Record<string, string[]> = {
  rapper: ["rap", "voz", "vocal", "feat", "participação como feat"],
  compositor: ["composição"],
  letrista: ["letra"],
  produtor: ["produção musical"],
  beatmaker: ["beat", "beatmaking"],
  freestyleiro: ["freestyle"],
  videomaker: ["filmagem", "videoclipe"],
  "editor-video": ["edição de vídeo"],
  fotografo: ["fotografia"],
  mixador: ["mixagem"],
  masterizador: ["masterização"],
  "designer-grafico": ["design gráfico", "design de capa"],
  ilustrador: ["ilustração"],
};

function apresentar(linha: Linha, usuario: UsuarioDaSessao) {
  const papeis = JSON.parse(linha.papeis) as {
    papel: string;
    detalhe: string;
  }[];
  const papel = papeis
    .flatMap(p => [p.papel, p.detalhe])
    .filter(Boolean)
    .join(" · ");
  let atuacoes = JSON.parse(linha.atuacoes) as string[];
  if (!atuacoes.length && linha.modalidade === "obra") {
    const termos = papeis
      .flatMap(p => [p.papel, p.detalhe])
      .flatMap(t => normalizarBusca(t).split(/\s*(?:[·,;/&+]|\be\b)\s*/));
    const profissoes = profissoesDaConta(usuario);
    atuacoes = profissoes
      .filter(p =>
        [
          p.rotulo,
          p.nome,
          rotuloProfissional(p.rotulo, "masculino"),
          rotuloProfissional(p.rotulo, "feminino"),
          ...(funcoes[p.id] ?? []),
        ].some(f => termos.includes(normalizarBusca(f)))
      )
      .map(p => p.id);
    if (
      !atuacoes.length &&
      linha.proprio &&
      papeis[0]?.papel === "Artista principal"
    ) {
      const elegiveis = profissoes.filter(p =>
        podePublicar(
          { tipoConta: "profissional", categories: [p.rotulo] },
          "obra",
          linha.tipo
        )
      );
      if (elegiveis.length === 1) atuacoes = [elegiveis[0].id];
    }
  }
  const modalidade = modalidades.find(m => m.modalidade === linha.modalidade)!;
  const id = encodeURIComponent(linha.id);
  return {
    ...linha,
    proprio: Boolean(linha.proprio),
    papel,
    atuacoes,
    icone: modalidade.icone,
    fatos: Object.entries(
      JSON.parse(linha.ficha) as Record<string, string | number | null>
    ).filter(([, v]) => v !== null && v !== ""),
    link: /^https?:\/\//i.test(linha.link) ? linha.link : "",
    detalhes: rotaEspaco + "/" + linha.modalidade + "/" + id,
    base: modalidade.base + "/" + id,
  };
}

export function trabalhosDaConta(usuario: UsuarioDaSessao) {
  const linhas = conexaoInternaCypher()
    .prepare(
      registros +
        ` SELECT id,modalidade,titulo,autor,tipo,metadados,descricao,proprio,papeis,atuacoes,
      '' AS link, '{}' AS ficha FROM trabalhos ORDER BY criado_em DESC, modalidade, id DESC`
    )
    .all({ usuario: usuario.id }) as Linha[];
  return [...linhas.filter(l=>objetoDisponivel(conexaoInternaCypher(),l.modalidade,l.id,usuario.id)).map(linha => apresentar(linha, usuario)),...listarProjetos(usuario.id,true).map(p=>({
    id:p.id as string,modalidade:'projeto' as const,titulo:p.titulo as string,autor:p.autor as string,
    tipo:formatosTrabalho.find(f=>f.id===p.modalidade)?.nome??'Projeto',metadados:p.publico?'Visível na Cypher':'Privado',
    descricao:p.descricao as string,link:'',proprio:true,papeis:'[]',papel:p.papel||'Atuação declarada',atuacoes:p.profissoes,
    ficha:'{}',fatos:[] as [string,string|number][],icone:'briefcase',detalhes:'/work-projects/'+p.id,base:'/work-projects/'+p.id
  }))];
}

export function trabalhoDaConta(
  usuario: UsuarioDaSessao,
  modalidade: string,
  id: string
) {
  const linha = conexaoInternaCypher()
    .prepare(
      registros +
        " SELECT * FROM trabalhos WHERE modalidade=@modalidade AND id=@id"
    )
    .get({ usuario: usuario.id, modalidade, id }) as Linha | undefined;
  return linha && objetoDisponivel(conexaoInternaCypher(),modalidade,id,usuario.id) && apresentar(linha, usuario);
}

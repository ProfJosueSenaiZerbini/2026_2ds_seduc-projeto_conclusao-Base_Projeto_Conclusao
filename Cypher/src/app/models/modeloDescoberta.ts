import { imagemCena } from "./imagensCena.js";
import { objetoDisponivel } from "./politicasModeracao.js";
import { conexaoInternaCypher } from "./bancoDados.js";

const fotosEventosDestacados = new Map([
  ["demo-destaque-mulheres-no-mic", "rapper-3.jpeg"],
  ["demo-destaque-roda-da-madrugada", "eventos.jpg"],
  ["demo-destaque-voz-da-praca", "voz-da-rua.png"],
  ["demo-evento-show", "subsolo-em-frequencia.png"],
  ["demo-workshop-dj-producao", "workshop-dj.jpg"],
  ["demo-workshop-slam-poesia", "workshop-slam.jpg"],
  ["demo-workshop-beatbox", "workshop-beatbox.png"],
]);

export function fotoEventoDemonstrativo(id: string) {
  return imagemCena(id) || fotosEventosDestacados.get(id);
}

export type PublicacaoDescoberta = {
  grupo: "obras" | "beats" | "eventos";
  id: string;
  autorId: string;
  titulo: string;
  autor: string;
  handle: string;
  tipo: string;
  categoria: string;
  genero: string;
  local: string;
  data: string;
  hora: string;
  descricao: string;
  criado: string;
  demonstracao: 0 | 1;
  temaCartao: string;
  cor: string;
  bpm: string;
  duracao: string;
  tom: string;
  temPrevia: 0 | 1;
};

// Projeção pública da vitrine. Letras, contatos e inscrições ficam nas fichas.
export function publicacoesDescoberta(
  grupo: PublicacaoDescoberta["grupo"] | "" = "",
  faixaDemonstrativa = "",
  incluirFaixas = false,
  visitante = ""
): PublicacaoDescoberta[] {
  const db = conexaoInternaCypher();
  return db.transaction(() => {
  const linhas = db
    .prepare(
      `
    WITH autores AS (
      SELECT p.usuario_id, p.nome, p.identificador, u.demonstracao,
             CASE WHEN p.localizacao_publica = 1 THEN p.cidade ELSE '' END AS cidade
      FROM perfis p JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.perfil_publico = 1 AND p.demonstracao = u.demonstracao
        AND u.tipo_conta = 'profissional'
        AND (u.demonstracao = 1 OR u.email_confirmado_em IS NOT NULL)
    ), publicacoes AS (
    SELECT 'obras' AS grupo, o.id, o.proprietario_id AS autorId, o.titulo, a.nome AS autor, a.identificador AS handle,
           coalesce(nullif(o.tipo_detalhe, ''), o.tipo) AS tipo,
           coalesce(nullif(o.genero_detalhe, ''), o.genero) AS genero, a.cidade AS local,
           o.data_lancamento AS data, '' AS hora, '' AS descricao, o.criado_em AS criado,
           '' AS categoria, o.demonstracao, '' AS temaCartao, '' AS cor,
           '' AS bpm, '' AS duracao, '' AS tom, 0 AS temPrevia
    FROM obras o JOIN autores a ON a.usuario_id = o.proprietario_id
    WHERE o.publicada = 1 AND o.situacao IN ('', 'Lançado') AND o.demonstracao = a.demonstracao
      AND (@incluirFaixas = 1 OR o.id NOT LIKE '%-faixa-%' OR o.id = @faixaDemonstrativa)
    UNION ALL
    SELECT 'beats', b.id, b.produtor_id, b.titulo, a.nome, a.identificador, 'Beat', b.genero, a.cidade,
           '', '', '', b.criado_em, '', b.demonstracao, '', '',
           b.bpm, b.duracao, b.tom_musical, arq.id IS NOT NULL
    FROM beats b JOIN autores a ON a.usuario_id = b.produtor_id
    LEFT JOIN beat_catalogo c ON c.beat_id = b.id
    LEFT JOIN beat_arquivos arq ON arq.id = c.previa_id AND arq.beat_id = b.id AND arq.finalidade = 'previa'
    WHERE b.demonstracao = a.demonstracao
    UNION ALL
    SELECT 'eventos', e.id, e.proprietario_id, e.titulo, e.organizador, coalesce(a.identificador, ''),
           CASE WHEN e.categoria='Workshop' AND json_array_length(e.tipos_workshop_json)>0
             THEN 'Workshop · ' || (SELECT group_concat(value, ' · ') FROM json_each(e.tipos_workshop_json))
             ELSE coalesce(nullif(e.categoria_detalhe, ''), e.categoria) END, '', e.local,
           e.data_texto, e.horario, e.descricao, e.criado_em, e.categoria, e.demonstracao, e.tema_cartao, e.cor,
           '', '', '', 0
    FROM eventos e
    JOIN usuarios u ON u.id = e.proprietario_id AND u.demonstracao = e.demonstracao
    LEFT JOIN autores a ON a.usuario_id = e.proprietario_id
    WHERE e.demonstracao = 1 OR a.usuario_id IS NOT NULL
    ) SELECT * FROM publicacoes WHERE @grupo = '' OR grupo = @grupo
    ORDER BY criado DESC, id DESC
  `
    )
    .all({ grupo, faixaDemonstrativa, incluirFaixas: incluirFaixas ? 1 : 0 }) as PublicacaoDescoberta[];
  return linhas.filter(i=>objetoDisponivel(db,({obras:"obra",beats:"beat",eventos:"evento"})[i.grupo],i.id,visitante));
  })();
}

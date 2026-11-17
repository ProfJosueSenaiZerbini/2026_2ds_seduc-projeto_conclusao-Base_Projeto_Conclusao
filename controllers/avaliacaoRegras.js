// Regras compartilhadas da avaliação bidirecional (contratante <-> trabalhador).

// Prazo para avaliar (e editar a avaliação), contado a partir da finalização do bico.
export const PRAZO_AVALIACAO_DIAS = 7;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Data de finalização do bico (alias `b` obrigatório na consulta que usar este trecho):
// 1) evento de mudança para 'Finalizado' em historico_eventos_bicos (o mais recente);
// 2) sem evento: a data do CREDITO que paga o trabalhador na finalização;
// 3) sem nenhum dos dois: a data de publicação do bico.
export const SQL_FINALIZADO_EM = `COALESCE(
    (SELECT MAX(ev.data_evento) FROM historico_eventos_bicos ev
      WHERE ev.bico_id = b.id AND ev.status_novo = 'Finalizado'),
    (SELECT MAX(mv.criado_em) FROM movimentacoes_carteira mv
      WHERE mv.bico_id = b.id AND mv.tipo_movimentacao = 'CREDITO'),
    b.criado_em
)`;

// Média (1 casa) e quantidade das avaliações RECEBIDAS por um usuário; `coluna` é a coluna com o id dele.
export const sqlMediaAvaliacoes = (coluna, alias = 'media_avaliacoes') =>
    `(SELECT ROUND(AVG(av.nota), 1) FROM avaliacoes av WHERE av.avaliado_id = ${coluna}) AS ${alias}`;
export const sqlTotalAvaliacoes = (coluna, alias = 'total_avaliacoes') =>
    `(SELECT COUNT(*) FROM avaliacoes av WHERE av.avaliado_id = ${coluna}) AS ${alias}`;

export const calcularPrazoAvaliacao = (finalizadoEm, agora = new Date()) => {
    const finalizacao = new Date(finalizadoEm);
    const limite = new Date(finalizacao.getTime() + PRAZO_AVALIACAO_DIAS * MS_POR_DIA);
    return {
        limite,
        encerrado: Number.isNaN(limite.getTime()) || agora.getTime() > limite.getTime(),
        limiteFormatado: Number.isNaN(limite.getTime()) ? '' : formatarData(limite)
    };
};

export const formatarData = (data) => {
    const d = new Date(data);
    const dois = (n) => String(n).padStart(2, '0');
    return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Comentário vazio ou só com espaços vira NULL.
export const normalizarComentario = (comentario) => {
    if (comentario === undefined || comentario === null) return null;
    const limpo = comentario.trim();
    return limpo === '' ? null : limpo;
};

// Dados da tela do bico finalizado: avaliação já feita por este usuário e situação do prazo.
export const carregarContextoAvaliacao = async (banco, bicoId, usuarioId, agora = new Date()) => {
    const bicos = await banco.query(
        `SELECT ${SQL_FINALIZADO_EM} AS finalizado_em FROM bicos b WHERE b.id = ?`,
        [bicoId]
    );
    const avaliacoes = await banco.query(
        'SELECT nota, comentario FROM avaliacoes WHERE bico_id = ? AND avaliador_id = ?',
        [bicoId, usuarioId]
    );
    const prazo = calcularPrazoAvaliacao(bicos[0]?.finalizado_em, agora);
    const feita = avaliacoes[0] ? { nota: Number(avaliacoes[0].nota), comentario: avaliacoes[0].comentario } : null;
    return {
        avaliacaoFeita: feita,
        prazoEncerrado: prazo.encerrado,
        prazoAte: prazo.limiteFormatado
    };
};

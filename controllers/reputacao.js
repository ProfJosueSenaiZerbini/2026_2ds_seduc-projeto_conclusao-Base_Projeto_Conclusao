// Reputação pública de trabalhadores e contratantes, calculada só com dados que já existem
// (avaliacoes, bicos, movimentacoes_carteira, historico_eventos_bicos). Nada é verificado nem inventado.
import { SQL_FINALIZADO_EM, formatarData } from './avaliacaoRegras.js';

// Bico cancelado DEPOIS de aceitar um trabalhador = cancelamento que gerou ESTORNO da reserva.
// (alias `b` obrigatório na consulta que usar este trecho)
export const SQL_TEM_ESTORNO = `EXISTS (
    SELECT 1 FROM movimentacoes_carteira mv
     WHERE mv.bico_id = b.id AND mv.tipo_movimentacao = 'ESTORNO'
)`;

// Quantidade de bicos finalizados de um usuário e de cancelados depois do aceite (subconsultas escalares,
// para usar na MESMA consulta de listas: candidatos, detalhes do bico...). `colunaUsuario`: ex. 'u.id'.
export const sqlBicosConcluidosDoTrabalhador = (colunaUsuario, alias = 'bicos_concluidos') =>
    `(SELECT COUNT(*) FROM bicos bt WHERE bt.trabalhador_id = ${colunaUsuario} AND bt.status = 'Finalizado') AS ${alias}`;
export const sqlBicosConcluidosDoContratante = (colunaUsuario, alias = 'bicos_concluidos') =>
    `(SELECT COUNT(*) FROM bicos bc WHERE bc.contratante_id = ${colunaUsuario} AND bc.status = 'Finalizado') AS ${alias}`;
export const sqlCanceladosAposAceiteDoContratante = (colunaUsuario, alias = 'cancelados_apos_aceite') =>
    `(SELECT COUNT(*) FROM bicos bx WHERE bx.contratante_id = ${colunaUsuario} AND bx.status = 'Cancelado'
        AND EXISTS (SELECT 1 FROM movimentacoes_carteira mx WHERE mx.bico_id = bx.id AND mx.tipo_movimentacao = 'ESTORNO')) AS ${alias}`;

const numero = (valor) => Number(valor ?? 0) || 0;

// Taxa de conclusão (%): concluídos ÷ (concluídos + cancelados depois do aceite).
// Sem nenhum bico nessas situações não há histórico suficiente: devolve null.
export const calcularTaxaConclusao = (concluidos, canceladosAposAceite) => {
    const c = numero(concluidos);
    const x = numero(canceladosAposAceite);
    if (c + x === 0) return null;
    return Math.round((c / (c + x)) * 100);
};

// Distribuição das notas de 5★ a 1★ e média (1 casa) a partir de linhas { nota, total }.
export const montarDistribuicao = (linhas = []) => {
    const porNota = new Map(linhas.map((l) => [Number(l.nota), numero(l.total)]));
    const total = [1, 2, 3, 4, 5].reduce((soma, n) => soma + (porNota.get(n) || 0), 0);
    const somaNotas = [1, 2, 3, 4, 5].reduce((soma, n) => soma + n * (porNota.get(n) || 0), 0);
    return {
        total,
        media: total > 0 ? Math.round((somaNotas / total) * 10) / 10 : null,
        barras: [5, 4, 3, 2, 1].map((estrelas) => {
            const quantidade = porNota.get(estrelas) || 0;
            return { estrelas, quantidade, percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0 };
        })
    };
};

// Junta tudo num objeto pronto para a view. `contadores` vem da consulta de bicos (ver buscarReputacao).
export const montarReputacao = (tipo, linhasNotas, contadores = {}) => {
    const dist = montarDistribuicao(linhasNotas);
    const concluidos = numero(contadores.concluidos);
    const ultimo = contadores.ultimo_servico ? new Date(contadores.ultimo_servico) : null;
    const base = {
        media: dist.media,
        totalAvaliacoes: dist.total,
        barras: dist.barras,
        concluidos,
        ultimoServico: ultimo && !Number.isNaN(ultimo.getTime()) ? formatarData(ultimo) : null
    };

    if (tipo === 'contratante') {
        const apos = numero(contadores.cancelados_apos_aceite);
        return {
            ...base,
            publicados: numero(contadores.publicados),
            canceladosAposAceite: apos,
            canceladosAntesDoAceite: numero(contadores.cancelados_antes),
            taxaConclusao: calcularTaxaConclusao(concluidos, apos)
        };
    }

    // Trabalhador: só o contratante cancela um bico, então cancelamentos não entram na reputação dele.
    return { ...base, emAndamento: numero(contadores.em_andamento), taxaConclusao: null };
};

// Reputação de um usuário com poucas consultas (sem N+1): distribuição das notas e contadores de bicos.
export const buscarReputacao = async (banco, usuarioId, tipo) => {
    const linhasNotas = await banco.query(
        'SELECT nota, COUNT(*) AS total FROM avaliacoes WHERE avaliado_id = ? GROUP BY nota',
        [usuarioId]
    );

    const [contadores] =
        tipo === 'contratante'
            ? await banco.query(
                  `SELECT COUNT(*) AS publicados,
                    SUM(b.status = 'Finalizado') AS concluidos,
                    SUM(b.status = 'Cancelado' AND ${SQL_TEM_ESTORNO}) AS cancelados_apos_aceite,
                    SUM(b.status = 'Cancelado' AND NOT ${SQL_TEM_ESTORNO}) AS cancelados_antes,
                    MAX(CASE WHEN b.status = 'Finalizado' THEN ${SQL_FINALIZADO_EM} END) AS ultimo_servico
             FROM bicos b
             WHERE b.contratante_id = ?`,
                  [usuarioId]
              )
            : await banco.query(
                  `SELECT SUM(b.status = 'Finalizado') AS concluidos,
                    SUM(b.status = 'Em andamento') AS em_andamento,
                    MAX(CASE WHEN b.status = 'Finalizado' THEN ${SQL_FINALIZADO_EM} END) AS ultimo_servico
             FROM bicos b
             WHERE b.trabalhador_id = ?`,
                  [usuarioId]
              );

    return montarReputacao(tipo, linhasNotas, contadores || {});
};

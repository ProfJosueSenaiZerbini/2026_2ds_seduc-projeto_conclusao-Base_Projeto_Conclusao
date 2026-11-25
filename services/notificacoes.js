// Notificações do trabalhador, montadas a partir de historico_candidaturas.
// Cada registro do histórico feito por outra pessoa (o contratante) sobre uma candidatura do trabalhador vira
// um aviso: candidatura aceita, recusada, recusada porque outro foi escolhido ou bico cancelado.

export const LIMITE_NOTIFICACOES = 20;

// Os tipos que entram como notificação (status_novo do histórico).
export const STATUS_NOTIFICADOS = Object.freeze(['Aceito', 'Recusado']);

// `observacoes`: { recusaAutomatica, cancelamentoBico }, os textos que o bicoController grava no histórico
// nesses dois casos.
export const classificarNotificacao = (linha, observacoes) => {
    const cancelamento = linha.observacao === observacoes.cancelamentoBico;

    if (linha.status_novo === 'Aceito') {
        // Aceito -> Aceito com a observação de cancelamento: o bico que estava com ele foi cancelado.
        return linha.status_anterior === 'Aceito' && cancelamento ? 'bico-cancelado' : 'aceita';
    }
    if (linha.status_novo === 'Recusado') {
        if (cancelamento) return 'bico-cancelado';
        if (linha.observacao === observacoes.recusaAutomatica) return 'outro-escolhido';
        return 'recusada';
    }
    return null;
};

const TEXTOS = {
    aceita: (titulo) => ({ titulo: 'Candidatura aceita', mensagem: `Você foi escolhido para "${titulo}".` }),
    recusada: (titulo) => ({
        titulo: 'Candidatura recusada',
        mensagem: `Sua candidatura para "${titulo}" não foi aceita.`
    }),
    'outro-escolhido': (titulo) => ({
        titulo: 'Vaga preenchida',
        mensagem: `Outro profissional foi escolhido para "${titulo}".`
    }),
    'bico-cancelado': (titulo) => ({ titulo: 'Bico cancelado', mensagem: `O contratante cancelou "${titulo}".` })
};

// Linha do banco -> objeto enviado ao navegador (o texto é inserido com textContent, nunca como HTML).
export const montarNotificacao = (linha, observacoes, ultimoLidoId = 0) => {
    const tipo = classificarNotificacao(linha, observacoes);
    if (!tipo) return null;

    const data = linha.data_alteracao ? new Date(linha.data_alteracao) : null;

    return {
        id: Number(linha.id),
        tipo,
        ...TEXTOS[tipo](linha.titulo),
        // Só a recusa feita pelo contratante pode trazer uma observação escrita por ele.
        motivo: tipo === 'recusada' && linha.observacao ? linha.observacao : null,
        href: `/bicos/${Number(linha.bico_id)}`,
        quando: data && !Number.isNaN(data.getTime()) ? data.toISOString() : null,
        lida: Number(linha.id) <= Number(ultimoLidoId)
    };
};

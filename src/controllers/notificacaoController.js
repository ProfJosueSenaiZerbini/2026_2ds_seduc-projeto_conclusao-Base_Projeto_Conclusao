const prisma = require('../prisma');
const { hojeSemHorario, calcularAjustes, comSaldos } = require('../saldo');
const { limitesComSituacao } = require('./limiteController');
const { DIAS_AVISO_CONTA, DIAS_AVISO_META, diasDepois, montarNotificacoes } = require('../notificacoes');

// GET /api/usuario/:id/notificacao
//
// Busca só o que pode virar aviso. A regra de cada aviso, e por que nada é
// gravado no banco, está em src/notificacoes.js.
async function listarNotificacoes(req, res) {
  try {
    const id_usuario = req.usuario.id_usuario;
    const hoje = hojeSemHorario();

    const [contasAPagar, metas, contasDoUsuario, limites] = await Promise.all([
      // Transacao não tem id_usuario (3FN): o dono é achado pela conta.
      // Gasto sem data_pagamento = não pago. Inclui os já atrasados.
      prisma.transacao.findMany({
        where: {
          conta: { id_usuario },
          categoria: { tipo: 'despesa' },
          data_pagamento: null,
          data_transacao: { lte: diasDepois(hoje, DIAS_AVISO_CONTA) },
        },
        include: { categoria: true },
        orderBy: { data_transacao: 'asc' },
      }),
      // O status "em_progresso" já deixa de fora as metas alcançadas e canceladas.
      prisma.meta.findMany({
        where: {
          id_usuario,
          status: 'em_progresso',
          data_limite: { lte: diasDepois(hoje, DIAS_AVISO_META) },
        },
        orderBy: { data_limite: 'asc' },
      }),
      prisma.conta.findMany({ where: { id_usuario } }),
      limitesComSituacao(id_usuario),
    ]);

    const ajustes = await calcularAjustes(prisma, contasDoUsuario.map((c) => c.id_conta));
    const contas = contasDoUsuario.map((c) => comSaldos(c, ajustes));

    res.json(montarNotificacoes({ hoje, contasAPagar, metas, contas, limites }));
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao listar notificações' });
  }
}

module.exports = { listarNotificacoes };

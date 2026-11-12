
import db from '../config/database.js';

export const exibirCarteiraContratante = async (req, res) => {
  if (!req.session?.usuario) {
    return res.redirect('/login');
  }

  try {
    const usuarioId = req.session.usuario.id;

    const usuarios = await db.query(
      'SELECT saldo_simulado FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    const estatisticas = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'Finalizado' THEN valor ELSE 0 END), 0) AS totalInvestido,
        COUNT(CASE WHEN status = 'Finalizado' THEN 1 END) AS bicosFinalizados,
        COALESCE(SUM(CASE WHEN status = 'Em andamento' THEN valor ELSE 0 END), 0) AS totalPendente,
        COUNT(CASE WHEN status = 'Em andamento' THEN 1 END) AS bicosPendentes
       FROM bicos
       WHERE contratante_id = ?`,
      [usuarioId]
    );

    const transacoes = await db.query(
      `SELECT
        m.descricao,
        m.valor,
        DATE_FORMAT(m.criado_em, '%d/%m/%Y %H:%i') AS dataHora,
        m.tipo_movimentacao AS status,
        CASE
          WHEN m.tipo_movimentacao = 'ADICAO' THEN 'Entrada'
          WHEN m.tipo_movimentacao = 'RESERVA' THEN 'Saída'
        END AS tipo
       FROM movimentacoes_carteira m
       WHERE m.usuario_id = ?
       ORDER BY m.criado_em DESC, m.id DESC`,
      [usuarioId]
    );

    const carteira = {
      saldo: Number(usuarios[0]?.saldo_simulado || 0),
      totalInvestido: Number(estatisticas[0]?.totalInvestido || 0),
      bicosFinalizados: Number(estatisticas[0]?.bicosFinalizados || 0),
      totalPendente: Number(estatisticas[0]?.totalPendente || 0),
      bicosPendentes: Number(estatisticas[0]?.bicosPendentes || 0)
    };

    return res.render('contratante/carteiraContratante', {
      carteira,
      transacoes
    });
  } catch (error) {
    console.error('Erro ao carregar carteira do contratante:', error);
    return res.status(500).send('Erro ao carregar dados da carteira.');
  }
};

export const exibirCarteiraTrabalhador = async (req, res) => {
  if (!req.session?.usuario) {
    return res.redirect('/login');
  }

  try {
    const usuarioId = req.session.usuario.id;

    const usuarios = await db.query(
      'SELECT saldo_simulado FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    const retido = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS saldoRetido
       FROM bicos
       WHERE trabalhador_id = ?
         AND status = 'Em andamento'`,
      [usuarioId]
    );

    const transacoes = await db.query(
      `SELECT
        m.descricao,
        m.valor,
        DATE_FORMAT(m.criado_em, '%d/%m/%Y %H:%i') AS dataHora,
        m.tipo_movimentacao AS status,
        'Entrada' AS tipo
       FROM movimentacoes_carteira m
       WHERE m.usuario_id = ?
         AND m.tipo_movimentacao = 'CREDITO'
       ORDER BY m.criado_em DESC, m.id DESC`,
      [usuarioId]
    );

    const carteira = {
      saldoDisponivel: Number(usuarios[0]?.saldo_simulado || 0),
      saldoRetido: Number(retido[0]?.saldoRetido || 0),
      delta: 'Ganhos acumulados',
      infoRetido: 'Aguardando conclusão do serviço'
    };

    return res.render('trabalhador/carteiraTrabalhador', {
      carteira,
      transacoes
    });
  } catch (error) {
    console.error('Erro ao carregar carteira do trabalhador:', error);
    return res.status(500).send('Erro ao carregar dados da carteira.');
  }
};

// Adiciona saldo fictício à carteira do contratante.
export const adicionarSaldoSimulado = async (req, res) => {
  const usuarioId = Number(req.session?.usuario?.id);
  const valorRecebido = req.body?.valor;

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.redirect('/login');
  }

  if (
    typeof valorRecebido !== 'string' ||
    !/^\d{1,8}(?:\.\d{1,2})?$/.test(valorRecebido)
  ) {
    return res.status(400).send('Informe um valor válido para adicionar.');
  }

  const valor = Number(valorRecebido);

  if (!Number.isFinite(valor) || valor <= 0) {
    return res.status(400).send('O valor deve ser maior que zero.');
  }

  let connection;
  let transacaoAtiva = false;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transacaoAtiva = true;

    const usuarios = await connection.query(
      'SELECT id, saldo_simulado FROM usuarios WHERE id = ? FOR UPDATE',
      [usuarioId]
    );

    if (!usuarios.length) {
      await connection.rollback();
      transacaoAtiva = false;
      return res.status(404).send('Usuário não encontrado.');
    }

    if (usuarios[0].saldo_simulado === null) {
      throw new Error('Saldo simulado do usuário está nulo.');
    }

    const resultadoAtualizacao = await connection.query(
      'UPDATE usuarios SET saldo_simulado = saldo_simulado + ? WHERE id = ?',
      [valor, usuarioId]
    );

    if (resultadoAtualizacao.affectedRows !== 1) {
      throw new Error('Não foi possível atualizar o saldo simulado.');
    }

    await connection.query(
      `INSERT INTO movimentacoes_carteira
        (usuario_id, bico_id, tipo_movimentacao, valor, descricao)
       VALUES (?, NULL, 'ADICAO', ?, ?)`,
      [usuarioId, valor, 'Adição de saldo simulado']
    );

    await connection.commit();
    transacaoAtiva = false;

    return res.redirect('/carteira/contratante');
  } catch (error) {
    if (connection && transacaoAtiva) {
      try {
        await connection.rollback();
      } catch (erroRollback) {
        console.error('Erro ao reverter adição de saldo:', erroRollback);
      }
    }

    console.error('Erro ao adicionar saldo simulado:', error);
    return res.status(500).send('Não foi possível adicionar o saldo simulado.');
  } finally {
    connection?.release();
  }
};

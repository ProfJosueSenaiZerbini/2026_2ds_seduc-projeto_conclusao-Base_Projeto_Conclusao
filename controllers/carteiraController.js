
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
          WHEN m.tipo_movimentacao IN ('ADICAO', 'ESTORNO') THEN 'Entrada'
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

const ROTULOS_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const arredondar2 = (valor) => Math.round(valor * 100) / 100;

// Monta os últimos 12 meses (do mais antigo ao mês atual) a partir dos créditos já somados por mês.
// Meses sem crédito valem 0. `p6` e `p12` são a proporção de cada mês em relação ao maior valor
// da janela de 6 e de 12 meses (usadas só para a altura das barras).
export const montarGraficoMensal = (linhas, mesAtual) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(mesAtual))) {
    throw new Error('Mês atual inválido para o gráfico da carteira.');
  }

  const [anoAtual, numeroMesAtual] = String(mesAtual).split('-').map(Number);
  const totais = new Map((linhas || []).map((linha) => [String(linha.mes), Number(linha.total) || 0]));
  const meses = [];

  for (let atras = 11; atras >= 0; atras -= 1) {
    const indice = anoAtual * 12 + (numeroMesAtual - 1) - atras;
    const ano = Math.floor(indice / 12);
    const numeroMes = (indice % 12) + 1;
    const chave = `${ano}-${String(numeroMes).padStart(2, '0')}`;

    meses.push({
      chave,
      ano,
      rotulo: ROTULOS_MES[numeroMes - 1],
      total: arredondar2(totais.get(chave) || 0)
    });
  }

  const proporcao = (valor, maior) => (maior > 0 ? Math.round((valor / maior) * 10000) / 10000 : 0);
  const maior12 = Math.max(...meses.map((mes) => mes.total));
  const maior6 = Math.max(...meses.slice(-6).map((mes) => mes.total));

  return {
    meses: meses.map((mes, indice) => ({
      ...mes,
      p12: proporcao(mes.total, maior12),
      p6: indice >= 6 ? proporcao(mes.total, maior6) : 0
    })),
    total6: arredondar2(meses.slice(-6).reduce((soma, mes) => soma + mes.total, 0)),
    total12: arredondar2(meses.reduce((soma, mes) => soma + mes.total, 0))
  };
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

    // Gráfico "Crescimento Mensal": soma só os CREDITO (nunca ADICAO ou RESERVA) dos últimos 12 meses.
    const creditosPorMes = await db.query(
      `SELECT DATE_FORMAT(criado_em, '%Y-%m') AS mes, SUM(valor) AS total
       FROM movimentacoes_carteira
       WHERE usuario_id = ?
         AND tipo_movimentacao = 'CREDITO'
         AND criado_em >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 11 MONTH)
       GROUP BY mes
       ORDER BY mes`,
      [usuarioId]
    );

    // O mês atual vem do banco para o gráfico usar o mesmo calendário dos registros.
    const mesAtual = await db.query(`SELECT DATE_FORMAT(CURDATE(), '%Y-%m') AS mes`);

    const carteira = {
      saldoDisponivel: Number(usuarios[0]?.saldo_simulado || 0),
      saldoRetido: Number(retido[0]?.saldoRetido || 0),
      delta: 'Ganhos acumulados',
      infoRetido: 'Aguardando conclusão do serviço'
    };

    return res.render('trabalhador/carteiraTrabalhador', {
      carteira,
      transacoes,
      grafico: montarGraficoMensal(creditosPorMes, mesAtual[0]?.mes)
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

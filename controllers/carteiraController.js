import db from '../config/database.js'; // Ajuste o caminho se o seu arquivo de banco tiver outro nome

export const exibirCarteiraContratante = async (req, res) => {
  try {
    // Pegando o ID do usuário logado (Ajuste conforme a sua sessão)
    const usuarioId = req.session.usuario ? req.session.usuario.id : 1; 

    const [usuarios] = await db.query(
      'SELECT saldo_simulado FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    const [estatisticas] = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'Finalizado' THEN valor ELSE 0 END), 0) AS totalInvestido,
        COALESCE(COUNT(CASE WHEN status = 'Finalizado' THEN 1 END), 0) AS bicosFinalizados,
        COALESCE(SUM(CASE WHEN status IN ('Aberto', 'Em andamento') THEN valor ELSE 0 END), 0) AS totalPendente,
        COALESCE(COUNT(CASE WHEN status IN ('Aberto', 'Em andamento') THEN 1 END), 0) AS bicosPendentes
       FROM bicos 
       WHERE contratante_id = ?`,
      [usuarioId]
    );

    const [transacoes] = await db.query(
      `SELECT 
        titulo AS descricao,
        valor,
        DATE_FORMAT(data_servico, '%d/%m/%Y') AS dataHora,
        status,
        'Saída' AS tipo
       FROM bicos 
       WHERE contratante_id = ? 
       ORDER BY data_servico DESC`,
      [usuarioId]
    );

    const carteira = {
      saldo: Number(usuarios[0]?.saldo_simulado || 0),
      totalInvestido: Number(estatisticas[0]?.totalInvestido || 0),
      bicosFinalizados: estatisticas[0]?.bicosFinalizados || 0,
      totalPendente: Number(estatisticas[0]?.totalPendente || 0),
      bicosPendentes: estatisticas[0]?.bicosPendentes || 0
    };

    res.render('carteiraContratante', { carteira, transacoes });
  } catch (error) {
    console.error('Erro ao carregar carteira do contratante:', error);
    res.status(500).send('Erro ao carregar dados da carteira');
  }
};

export const exibirCarteiraTrabalhador = async (req, res) => {
  try {
    const usuarioId = req.session.usuario ? req.session.usuario.id : 1;

    const [usuarios] = await db.query(
      'SELECT saldo_simulado FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    const [retido] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS saldoRetido 
       FROM bicos 
       WHERE trabalhador_id = ? AND status = 'Em andamento'`,
      [usuarioId]
    );

    const [transacoes] = await db.query(
      `SELECT 
        titulo AS descricao,
        valor,
        DATE_FORMAT(data_servico, '%d/%m/%Y') AS dataHora,
        CASE WHEN status = 'Finalizado' THEN 'CONCLUIDO' ELSE 'PENDENTE' END AS status,
        'Entrada' AS tipo
       FROM bicos 
       WHERE trabalhador_id = ? 
       ORDER BY data_servico DESC`,
      [usuarioId]
    );

    const carteira = {
      saldoDisponivel: Number(usuarios[0]?.saldo_simulado || 0),
      saldoRetido: Number(retido[0]?.saldoRetido || 0),
      delta: 'Ganhos acumulados',
      infoRetido: 'Aguardando conclusão do serviço'
    };

    res.render('carteiraTrabalhador', { carteira, transacoes });
  } catch (error) {
    console.error('Erro ao carregar carteira do trabalhador:', error);
    res.status(500).send('Erro ao carregar dados da carteira');
  }
};
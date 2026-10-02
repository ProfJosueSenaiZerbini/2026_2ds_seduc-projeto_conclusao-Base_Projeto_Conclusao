import db from '../config/database.js';

export const exibirFormularioPublicar = (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    return res.render('publicarBico', {
        usuario: req.session.usuario
    });
};

export const cadastrarBico = async (req, res) => {
    const { titulo, descricao, valor, bairro, data_servico, horario } = req.body;
    const contratante_id = req.session?.usuario?.id;

    if (!contratante_id) {
        return res.redirect('/login');
    }

    const valorNumerico = Number(valor);
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
        return res.status(400).send('O valor do bico deve ser maior que zero.');
    }

    try {
        // Busca o bico e o nome do contratante para preencher a tela com dados reais.
        const query = `
            INSERT INTO bicos (contratante_id, titulo, descricao, valor, bairro, data_servico, horario, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Aberto')
        `;

        await db.query(query, [
            contratante_id,
            titulo,
            descricao,
            valorNumerico,
            bairro,
            data_servico,
            horario
        ]);

        console.log(`✅ Novo bico publicado com sucesso por contratante ID ${contratante_id}!`);
        return res.redirect('/homeContratante');
    } catch (erro) {
        console.error('❌ Erro ao cadastrar bico no banco:', erro);
        return res.status(500).send('Erro ao publicar o bico. Tente novamente.');
    }
};

export const exibirDetalhesBico = async (req, res) => {
    const { id } = req.params;

    // Mantem o controller protegido mesmo quando for chamado fora das rotas atuais.
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    try {
        const query = `
            SELECT b.*, u.nome AS contratante_nome,
                   DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada
            FROM bicos b
            JOIN usuarios u ON b.contratante_id = u.id
            WHERE b.id = ?
        `;

        const resultado = await db.query(query, [id]);
        const bicos = Array.isArray(resultado?.[0]) ? resultado[0] : resultado;
        const bicoEncontrado = bicos[0];

        if (!bicoEncontrado) {
            console.log(`⚠️ Nenhum bico encontrado com o ID: ${id}`);
            return res.status(404).send('Bico não encontrado');
        }

        return res.render('detalhesBico', {
            bico: bicoEncontrado,
            usuario: req.session?.usuario || {}
        });
    } catch (erro) {
        console.error('❌ Erro ao buscar detalhes do bico:', erro);
        return res.status(500).send('Erro interno do servidor ao carregar o bico.');
    }
};

export const exibirBicosAtivosContratante = async (req, res) => {
    // Os bicos ativos devem pertencer ao contratante que esta logado.
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

  try {
        const usuarioId = req.session.usuario.id;

    // Busca somente bicos do contratante logado que ainda estao ativos.
    const bicosAtivos = await db.query(
      `SELECT 
        b.id,
        b.titulo,
        b.descricao,
        b.valor,
        DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
        b.horario,
        b.bairro,
        b.status,
        u.nome AS nome_trabalhador
       FROM bicos b
       LEFT JOIN usuarios u ON b.trabalhador_id = u.id
       WHERE b.contratante_id = ? 
         AND b.status IN ('Aberto', 'Em andamento')
       ORDER BY b.data_servico ASC`,
      [usuarioId]
    );

    res.render('bicosAtivos', { bicos: bicosAtivos });
  } catch (error) {
    console.error('🚫 Erro ao buscar bicos ativos:', error);
    res.status(500).send('Erro ao carregar os bicos ativos.');
  }
};
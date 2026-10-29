export const exibirCarteira = async (req, res) => {
  // Exemplo de dados buscados do banco de dados (Prisma, Sequelize ou MySQL direto)
  const carteira = await buscarCarteiraDoUsuario(req.user.id);
  const transacoes = await buscarTransacoesDoUsuario(req.user.id);

  res.render('carteiraContratante', {
    carteira,
    transacoes
  });
};
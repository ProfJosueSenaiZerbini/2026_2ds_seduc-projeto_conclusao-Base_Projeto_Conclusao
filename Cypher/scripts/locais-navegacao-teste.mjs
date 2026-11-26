// Testes que montam o router sem src/aplicacao.ts devem usar a mesma
// política de ações da sidebar que a aplicação completa.
export async function configurarNavegacaoTeste(app) {
  const { acoesCriacao } = await import("../dist/src/app/models/espacoTrabalho.js");
  app.locals.acoesCriacaoSidebar = acoesCriacao;
  app.use((req, res, next) => {
    res.locals.caminhoNavegacao = req.path;
    next();
  });
}

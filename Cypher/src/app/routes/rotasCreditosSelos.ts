import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import * as c from "../models/creditosPublicacoes.js";
import * as s from "../models/seloPerfil.js";
import {
  exigirContaInteracao,
  ErroInteracao,
} from "../models/interacoesConteudo.js";

const rotas = Router();
const ator = (res: Response) => res.locals.usuario.id as string;
rotas.use((_req, res, next) => {
  res.locals.creditosFicha = (tipo: c.TipoCredito, id: string) =>
    c.creditosFicha(ator(res), tipo, id);
  res.locals.categoriasCreditoEvento = c.categoriasEvento;
  next();
});
function proteger(acao: (req: Request, res: Response) => unknown) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set("Cache-Control", "private, no-store");
    try {
      return acao(req, res);
    } catch (e) {
      if (!(e instanceof ErroInteracao)) return next(e);
      res.status(e.status);
      if (req.get("accept") === "application/json")
        return res.json({ erro: e.message });
      return pagina(req, res, "erro", { erro: e.message });
    }
  };
}
function tipo(req: Request) {
  const tipo = req.params.tipo;
  if (tipo === "obra" || tipo === "beat" || tipo === "evento") return tipo;
  throw new ErroInteracao("Tipo de registro indisponível.", 404);
}
function pagina(req: Request, res: Response, tela: string, dados = {}) {
  const admin = req.path.startsWith("/admin/");
  return res.render("pages/creditos-selos", {
    title: tela === "selos" ? "Selo profissional" : "Créditos profissionais",
    stylesheet: "suporte",
    path: req.path,
    admin,
    tela,
    estados: c.estadosCredito,
    categorias: c.categoriasEvento,
    ...dados,
  });
}
rotas.get(
  "/creditos/gerir/:tipo/:id",
  proteger((req, res) => {
    const t = tipo(req);
    return pagina(req, res, "gestao", {
      tipo: t,
      ...c.painelCreditos(ator(res), t, req.params.id),
    });
  })
);
rotas.post(
  "/creditos/gerir/:tipo/:id",
  proteger((req, res) => {
    const t = tipo(req);
    if (t === "obra")
      throw new ErroInteracao(
        "Use a edição da obra para acrescentar créditos.",
        400
      );
    c.convidarCredito(ator(res), t, req.params.id, req.body);
    return res.redirect(303, req.path);
  })
);
rotas.get(
  "/admin/creditos",
  proteger((req, res) =>
    pagina(req, res, "fila", { itens: c.filaCreditos(ator(res)) })
  )
);
for (const base of ["/creditos", "/admin/creditos"]) {
  const admin = base.startsWith("/admin/");
  rotas.get(
    base + "/:tipo/:id",
    proteger((req, res) => {
      const t = tipo(req);
      return pagina(req, res, "credito", {
        tipo: t,
        ...c.consultarCredito(ator(res), t, req.params.id, admin),
      });
    })
  );
  rotas.post(
    base + "/:tipo/:id",
    proteger((req, res) => {
      c.responderCredito(ator(res), tipo(req), req.params.id, req.body, admin);
      return res.redirect(303, req.path);
    })
  );
}
rotas.get(
  "/selos/solicitacoes",
  proteger((req, res) => {
    exigirContaInteracao(ator(res));
    if (res.locals.usuario.tipoConta !== "profissional")
      throw new ErroInteracao(
        "A área de selos é destinada a profissionais.",
        403
      );
    return pagina(req, res, "selos", { itens: s.pedidosSelo(ator(res)) });
  })
);
rotas.post(
  "/selos/solicitacoes",
  proteger((req, res) => {
    s.pedirSelo(ator(res), req.body);
    return res.status(201).json({ url: "/selos/solicitacoes" });
  })
);
rotas.get(
  "/admin/selos",
  proteger((req, res) => {
    c.acessoRevisao(ator(res));
    return pagina(req, res, "selos", { itens: s.pedidosSelo() });
  })
);
rotas.post(
  "/admin/selos/:id",
  proteger((req, res) => {
    c.acessoRevisao(ator(res));
    s.decidirSelo(ator(res), req.params.id, req.body);
    return res.redirect(303, "/admin/selos");
  })
);
for (const base of ["/selos/imagem", "/admin/selos/imagem"]) {
  const admin = base.startsWith("/admin/");
  rotas.get(
    base + "/:id",
    proteger((req, res) => {
      if (admin) c.acessoRevisao(ator(res));
      const { imagem, mime } = s.imagemSelo(ator(res), req.params.id, admin);
      return res
        .set("X-Content-Type-Options", "nosniff")
        .type(mime)
        .send(imagem);
    })
  );
}
export default rotas;

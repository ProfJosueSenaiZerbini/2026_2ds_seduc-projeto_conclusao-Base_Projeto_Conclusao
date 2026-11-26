import type { Request, Response, NextFunction } from "express";
import * as m from "../models/central.js";
import { profissoesCatalogo } from "../models/modeloPerfil.js";
import { ErroOportunidade } from "../validators/validarOportunidade.js";
const uid = (res: Response) => res.locals.usuario.id as string;
type Acao = (req: Request, res: Response) => unknown;
export const seguro =
  (fn: Acao) => (req: Request, res: Response, next: NextFunction) => {
    try {
      res.set("Cache-Control", "private, no-store");
      return fn(req, res);
    } catch (e) {
      if (e instanceof m.ErroCentral || e instanceof ErroOportunidade) {
        if (req.path.startsWith("/admin/"))
          return res.status(e.status).render("pages/central-editorial", {
            title: "Cypher Central",
            stylesheet: "central-nova",
            path: "/admin/central",
            tela: "erro",
            erro: e.message,
            categorias: m.categoriasCentral,
            profissoes: profissoesCatalogo,
            motivos: m.motivosCentral,
          });
        return res.status(e.status).render("pages/portfolio-erro", {
          title: "Guia indisponível",
          stylesheet: "central-nova",
          path: "/central",
          erro: e.message,
        });
      }
      next(e);
    }
  };
const comuns = {
  categorias: m.categoriasCentral,
  profissoes: profissoesCatalogo.filter(p => p.id !== "podcaster"),
  motivos: m.motivosCentral,
};
export const central: Acao = (req, res) =>
  res.render("pages/central-nova", {
    title: "Cypher Central",
    stylesheet: "central-nova",
    path: "/central",
    ...comuns,
    ...m.pesquisarCentral(uid(res), req.query),
  });
export const artigo: Acao = (req, res) => {
  const artigo = m.lerArtigo(uid(res), req.params.slug!);
  return res.render("pages/central-artigo", {
    title: artigo.titulo,
    stylesheet: "central-nova",
    path: "/central",
    ...comuns,
    artigo,
    relacionados: m
      .artigosPublicados()
      .filter(a => a.id !== artigo.id && a.categoria === artigo.categoria)
      .slice(0, 3),
    feedback: m.feedbackDoLeitor(uid(res), artigo.id),
    salvo: req.query.salvo === "1",
    preview: false,
  });
};
export const feedback: Acao = (req, res) => {
  m.feedbackArtigo(uid(res), req.params.slug!, req.body);
  res.redirect(
    303,
    "/central/" + encodeURIComponent(req.params.slug!) + "?salvo=1#feedback"
  );
};
export const privacidade: Acao = (req, res) => {
  m.preferenciaCentral(uid(res), req.body.registrar === "sim");
  res.redirect(303, "/central");
};
function editorial(
  req: Request,
  res: Response,
  tela: string,
  dados: Record<string, unknown> = {}
) {
  m.acessoEditorial(uid(res));
  return res.render("pages/central-editorial", {
    title: "Central / Editorial",
    stylesheet: "central-nova",
    path: req.method === "GET" ? req.path : "/admin/central",
    tela,
    ...comuns,
    erro: "",
    artigos: m.artigosEditoriais(uid(res)),
    filtros: {
      dias: ["7", "30", "90"].includes(String(req.query.dias))
        ? String(req.query.dias)
        : "30",
      artigo: String(req.query.artigo ?? ""),
      categoria: String(req.query.categoria ?? ""),
    },
    ...dados,
  });
}
export const conteudos: Acao = (req, res) => editorial(req, res, "lista");
export const novo: Acao = (req, res) =>
  editorial(req, res, "editar", { artigo: null });
export const editar: Acao = (req, res) =>
  editorial(req, res, "editar", {
    artigo: m.artigoEditorial(uid(res), req.params.id!),
  });
export const salvar: Acao = (req, res) => {
  try {
    const id = m.salvarArtigo(uid(res), req.body, req.params.id);
    return res.redirect(303, "/admin/central/" + id + "/edit");
  } catch (e) {
    if (e instanceof m.ErroCentral && e.status === 400) {
      const artigo = req.params.id
        ? m.artigoEditorial(uid(res), req.params.id)
        : null;
      const valores: Record<string, unknown> = {};
      for (const k of [
        "titulo",
        "resumo",
        "categoria",
        "intencao",
        "exemplo",
        "acao_url",
        "acao_label",
      ])
        valores[k] = typeof req.body[k] === "string" ? req.body[k] : "";
      valores.profissoes = Array.isArray(req.body.profissoes)
        ? req.body.profissoes
        : typeof req.body.profissoes === "string"
          ? [req.body.profissoes]
          : [];
      try {
        const passos: unknown = JSON.parse(String(req.body.passos ?? "[]"));
        valores.passos = Array.isArray(passos)
          ? passos
              .filter(p => p && typeof p === "object")
              .slice(0, 12)
              .map(p => ({
                titulo: String(p.titulo ?? ""),
                conteudo: String(p.conteudo ?? ""),
                dica: String(p.dica ?? ""),
              }))
          : [];
      } catch {
        valores.passos = [];
      }
      res.status(400);
      return editorial(req, res, "editar", {
        artigo,
        valores,
        erro: e.message,
      });
    }
    throw e;
  }
};
export const preview: Acao = (req, res) => {
  const a = m.artigoEditorial(uid(res), req.params.id!);
  return res.render("pages/central-artigo", {
    title: a.rascunho.titulo,
    stylesheet: "central-nova",
    path: "/admin/central",
    ...comuns,
    artigo: a.rascunho,
    relacionados: [],
    feedback: null,
    salvo: false,
    preview: true,
  });
};
export const transicionar: Acao = (req, res) => {
  m.transicionarArtigo(uid(res), req.params.id!, req.body);
  res.redirect(
    303,
    "/admin/central/" + encodeURIComponent(req.params.id!) + "/edit"
  );
};
export const qualidade: Acao = (req, res) =>
  editorial(req, res, "qualidade", {
    qualidade: m.qualidadeCentral(uid(res), req.query),
  });
export const pesquisas: Acao = (req, res) =>
  editorial(req, res, "pesquisas", {
    qualidade: m.qualidadeCentral(uid(res), req.query),
  });
export const revisoes: Acao = (req, res) =>
  editorial(req, res, "revisoes", {
    qualidade: m.qualidadeCentral(uid(res), req.query),
  });

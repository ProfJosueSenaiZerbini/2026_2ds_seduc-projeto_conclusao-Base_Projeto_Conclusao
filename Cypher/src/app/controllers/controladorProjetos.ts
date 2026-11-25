import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import * as m from "../models/projetosTrabalho.js";
import { profissoesCatalogo } from "../models/modeloPerfil.js";
import { profissoesAtivas, conta } from "../models/oportunidades.js";
import { trabalhosDaConta } from "../models/espacoTrabalho.js";
const ator = (res: Response) => res.locals.usuario.id as string;
type Acao = (req: Request, res: Response) => unknown;
export const seguro =
  (fn: Acao) => (req: Request, res: Response, next: NextFunction) => {
    try {
      return fn(req, res);
    } catch (e) {
      if (e instanceof m.ErroTrabalho)
        return res
          .status(e.status)
          .render("pages/erro-trabalho", {
            title: "Trabalho indisponível",
            stylesheet: "projetos",
            path: "/espaco-de-trabalho",
            erro: e.message,
          });
      next(e);
    }
  };
const render = (res: Response, dados: Record<string, unknown>) =>
  res.render("pages/projetos", {
    title: "Trabalhos e galerias",
    stylesheet: "projetos",
    path: "/espaco-de-trabalho",
    formatos: m.formatosTrabalho,
    profissoes: profissoesCatalogo,
    ...dados,
  });
export const lista: Acao = (req, res) => {
  const id = ator(res);
  conta(id);
  const q = typeof req.query.q === "string" ? req.query.q.slice(0, 120) : "";
  const modalidade = String(req.query.modalidade ?? "");
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const itens = m
    .listarProjetos(id, req.query.meus === "sim")
    .filter(
      p =>
        (!modalidade || p.modalidade === modalidade) &&
        normalize(p.titulo + " " + p.descricao + " " + p.autor).includes(
          normalize(q)
        )
    );
  return render(res, {
    tela: "lista",
    itens,
    q,
    modalidade,
    meus: req.query.meus === "sim",
    podeCriar:
      res.locals.usuario.tipoConta === "profissional" &&
      m.formatosPermitidos(id).length > 0,
  });
};
function formulario(
  req: Request,
  res: Response,
  valores?: Record<string, unknown>,
  erro = "",
  status = 200
) {
  const id = ator(res);
  const usuario = res.locals.usuario;
  if (usuario.tipoConta !== "profissional")
    throw new m.ErroTrabalho("É necessário um perfil profissional.", 403);
  const projeto = req.params.id ? m.projetoTrabalho(id, req.params.id) : null;
  if (projeto && projeto.autor_id !== id)
    throw new m.ErroTrabalho("Trabalho indisponível.", 404);
  const atuais = profissoesAtivas(id);
  const disponiveis = m.formatosPermitidos(id);
  if (!projeto && !disponiveis.length) throw new m.ErroTrabalho("Selecione uma profissão ativa antes de criar um trabalho.",403);
  if (projeto && !disponiveis.some(f => f.id === projeto.modalidade))
    disponiveis.push(
      m.formatosTrabalho.find(f => f.id === projeto.modalidade)!
    );
  return res.status(status).render("pages/projeto-formulario", {
    title: projeto ? "Editar trabalho" : "Criar trabalho",
    stylesheet: "projetos",
    path: "/espaco-de-trabalho",
    projeto,
    valores:
      valores ??
      (projeto
        ? {
            ...projeto,
            itens: JSON.stringify(
              projeto.itens.map(i => ({
                tipo: i.tipo,
                origem_id: i.origem_id,
                legenda: i.legenda,
              }))
            ),
            publico: projeto.publico ? "sim" : "",
          }
        : {
            modalidade: String(req.query.modalidade ?? "projeto"),
            itens: "[]",
            publico: "",
          }),
    erro,
    formatos: disponiveis,
    profissoes: profissoesCatalogo.filter(
      p => atuais.includes(p.id) || projeto?.profissoes.includes(p.id)
    ),
    midias: m.midiasDoAutor(id),
    referencias: [
      ...m
        .listarProjetos(id)
        .filter(p => p.id !== projeto?.id)
        .map(p => ({ tipo: "projeto", id: p.id, titulo: p.titulo })),
      ...trabalhosDaConta(usuario)
        .filter(p => p.proprio && p.modalidade !== "projeto")
        .map(p => ({ tipo: p.modalidade, id: p.id, titulo: p.titulo })),
    ],
  });
}
export const novo: Acao = (req, res) => formulario(req, res);
export const editar: Acao = (req, res) => formulario(req, res);
export const salvar: Acao = (req, res) => {
  try {
    const id = m.salvarProjetoTrabalho(ator(res), req.body, req.params.id);
    return res.redirect(303, "/work-projects/" + id + "?salvo=1");
  } catch (e) {
    if (e instanceof m.ErroTrabalho && e.status === 400)
      return formulario(req, res, req.body, e.message, 400);
    throw e;
  }
};
export const detalhe: Acao = (req, res) =>
  render(res, {
    tela: "ficha",
    projeto: m.projetoTrabalho(ator(res), req.params.id!),
    salvo: req.query.salvo === "1",
  });
export const retirar: Acao = (req, res) => {
  m.retirarProjeto(ator(res), req.params.id!);
  res.redirect(303, "/work-projects?meus=sim");
};
export const upload: Acao = (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body))
      throw new m.ErroTrabalho("Envie um arquivo binário.");
    const nome = decodeURIComponent(req.get("x-file-name") ?? "");
    res.status(201).json(m.salvarMidia(ator(res), nome, req.body));
  } catch (e) {
    if (e instanceof m.ErroTrabalho)
      return res.status(e.status).json({ erro: e.message });
    throw e;
  }
};
export const arquivo: Acao = (req, res) => {
  const midia = m.midiaAutorizada(ator(res), req.params.id!);
  res.set({
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy":
      "default-src 'none'; media-src 'self'; img-src 'self'; sandbox",
    "Content-Type": midia.mime,
  });
  return res.sendFile(path.join(m.pastaMidias(), midia.id), {
    dotfiles: "deny",
  });
};
export const visibilidadeMidia: Acao = (req, res) => {
  m.alterarVisibilidadeMidia(
    ator(res),
    req.params.id!,
    req.body.publico === "sim"
  );
  res.redirect(303, "/work-projects/new#acervo");
};
export const removerMidia: Acao = (req, res) => {
  m.excluirMidia(ator(res), req.params.id!);
  res.redirect(303, "/work-projects/new#acervo");
};

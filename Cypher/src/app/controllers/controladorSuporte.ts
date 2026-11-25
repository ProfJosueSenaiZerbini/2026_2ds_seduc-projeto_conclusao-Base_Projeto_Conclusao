import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import * as m from "../models/suporte.js";
import { situacaoContaModeracao } from "../models/politicasModeracao.js";
import { conexaoInternaCypher } from "../models/bancoDados.js";
type Acao = (req: Request, res: Response) => unknown;
const uid = (r: Response) => r.locals.usuario.id as string;
function render(
  req: Request,
  res: Response,
  tela: string,
  dados: Record<string, unknown> = {}
) {
  return res.render("pages/suporte", {
    title: "Suporte e segurança",
    stylesheet: "suporte",
    path: req.path.startsWith("/admin/") ? "/admin/moderacao" : "/suporte",
    tela,
    erro: "",
    tipos: m.tiposSuporte,
    motivos: m.motivosSuporte,
    acoes: m.acoesModeracao,
    data: (n: number) =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(n),
    ...dados,
  });
}
export const seguro =
  (fn: Acao) => (req: Request, res: Response, next: NextFunction) => {
    try {
      res.set("Cache-Control", "private, no-store");
      return fn(req, res);
    } catch (e) {
      if (e instanceof m.ErroSuporte) {
        res.status(e.status);
        return render(req, res, "erro", { erro: e.message });
      }
      next(e);
    }
  };
export const lista: Acao = (req, res) =>
  render(req, res, "lista", {
    itens: m.listarSolicitacoes(uid(res)),
    restricao: situacaoContaModeracao(conexaoInternaCypher(), uid(res)),
  });
export const novo: Acao = (req, res) =>
  render(req, res, "novo", {
    chave: randomUUID(),
    prefill: {
      objeto_tipo:
        typeof req.query.objeto_tipo === "string" ? req.query.objeto_tipo : "",
      objeto_id:
        typeof req.query.objeto_id === "string" ? req.query.objeto_id : "",
    },
  });
export const criar: Acao = (req, res) =>
  res.redirect(303, "/suporte/" + m.criarSolicitacao(uid(res), req.body));
export const detalhe: Acao = (req, res) =>
  render(req, res, "detalhe", {
    c: m.solicitacaoDoUsuario(uid(res), req.params.id!),
    chave: randomUUID(),
  });
export const responder: Acao = (req, res) => {
  m.responderSolicitacao(uid(res), req.params.id!, req.body);
  res.redirect(303, "/suporte/" + encodeURIComponent(req.params.id!));
};
export const recorrer: Acao = (req, res) =>
  res.redirect(
    303,
    "/suporte/" + m.recorrerSolicitacao(uid(res), req.params.id!, req.body)
  );
export const fila: Acao = (req, res) =>
  render(req, res, "fila", { itens: m.filaModeracao(uid(res), req.query) });
export const caso: Acao = (req, res) =>
  render(req, res, "caso", {
    c: m.casoModeracao(uid(res), req.params.id!),
    evidencia: null,
  });
export const assumir: Acao = (req, res) => {
  m.assumirSolicitacao(uid(res), req.params.id!, req.body);
  res.redirect(303, "/admin/moderacao/" + encodeURIComponent(req.params.id!));
};
export const decidir: Acao = (req, res) => {
  m.decidirSolicitacao(uid(res), req.params.id!, req.body);
  res.redirect(303, "/admin/moderacao/" + encodeURIComponent(req.params.id!));
};
export const evidencia: Acao = (req, res) =>
  render(req, res, "caso", {
    c: m.casoModeracao(uid(res), req.params.id!),
    evidencia: m.consultarEvidencia(uid(res), req.params.id!, req.body),
  });

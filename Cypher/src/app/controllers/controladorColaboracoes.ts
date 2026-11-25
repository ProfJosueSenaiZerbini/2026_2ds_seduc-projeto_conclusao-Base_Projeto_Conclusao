import { resolverPerfilPublico } from "../models/identidadeUsuario.js";
import type { Request, Response, NextFunction } from "express";
import * as m from "../models/colaboracoes.js";
import { conta, um, todos } from "../models/oportunidades.js";
import { ErroOportunidade } from "../validators/validarOportunidade.js";
import { trabalhosDaConta } from "../models/espacoTrabalho.js";
const uid = (res: Response) => res.locals.usuario.id as string;
const data = (n: unknown) =>
  typeof n === "number"
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(n)
    : "—";
type Acao = (req: Request, res: Response) => unknown;
export const seguro =
  (fn: Acao) => (req: Request, res: Response, next: NextFunction) => {
    try {
      res.set("Cache-Control", "private, no-store");
      return fn(req, res);
    } catch (e) {
      if (e instanceof m.ErroColaboracao || e instanceof ErroOportunidade)
        return res.status(e.status).render("pages/colaboracoes", {
          title: "Colaborações",
          stylesheet: "colaboracoes",
          path: req.path.startsWith("/admin/") ? req.path : "/colaboracoes",
          tela: "erro",
          erro: e.status === 404 ? "Registro indisponível." : e.message,
          data,
        });
      next(e);
    }
  };
function render(
  req: Request,
  res: Response,
  tela: string,
  dados: Record<string, unknown> = {}
) {
  return res.render("pages/colaboracoes", {
    title: "Colaborações e reputação",
    stylesheet: "colaboracoes",
    path: req.path.startsWith("/admin/") ? req.path : "/colaboracoes",
    tela,
    data,
    erro: "",
    estadosColaboracao: m.estadosColaboracao,
    ...dados,
  });
}
export const lista: Acao = (req, res) =>
  render(req, res, "lista", {
    itens: m.listarColaboracoes(uid(res)),
    recebidas: m.avaliacoesRecebidas(uid(res)),
    resumo: m.resumoReputacao(uid(res)),
    filtro: String(req.query.estado ?? ""),
  });
export const novo: Acao = (req, res) => {
  const u = conta(uid(res));
  if (u.tipo_conta !== "profissional")
    throw new m.ErroColaboracao(
      "Somente profissionais podem propor colaboração.",
      403
    );
  return render(req, res, "novo", {
    destinatario:
      typeof req.query.destinatario === "string"
        ? req.query.destinatario.slice(0, 25)
        : "",
    referencias: trabalhosDaConta(res.locals.usuario).filter(i => i.proprio),
  });
};
export const criar: Acao = (req, res) =>
  res.redirect(303, "/colaboracoes/" + m.criarColaboracao(uid(res), req.body));
export const detalhe: Acao = (req, res) =>
  render(req, res, "detalhe", {
    c: m.colaboracaoPrivada(uid(res), req.params.id!),
    motivos: m.motivosDenuncia,
  });
export const agir: Acao = (req, res) => {
  m.agirColaboracao(uid(res), req.params.id!, req.params.acao!, req.body);
  res.redirect(303, "/colaboracoes/" + encodeURIComponent(req.params.id!));
};
export const avaliar: Acao = (req, res) => {
  m.avaliarColaboracao(uid(res), req.params.id!, req.body);
  res.redirect(303, "/colaboracoes/" + encodeURIComponent(req.params.id!));
};
export const contestar: Acao = (req, res) => {
  m.abrirCaso(uid(res), req.params.id!, req.body);
  res.redirect(303, "/colaboracoes/" + encodeURIComponent(req.params.id!));
};
export const manifestar: Acao = (req, res) => {
  m.manifestarCaso(uid(res), req.params.caso!, req.body.texto);
  res.redirect(303, "/colaboracoes");
};
export const fila: Acao = (req, res) =>
  render(req, res, "fila", { itens: m.filaModeracao(uid(res)) });
export const caso: Acao = (req, res) =>
  render(req, res, "caso", {
    ...m.detalheModeracao(uid(res), req.params.id!),
    inspecao: null,
  });
export const decidir: Acao = (req, res) => {
  m.decidirCaso(uid(res), req.params.id!, req.body);
  res.redirect(303, "/admin/reputacao/" + encodeURIComponent(req.params.id!));
};
export const inspecionar: Acao = (req, res) => {
  const inspecao = m.inspecionarAvaliacao(uid(res), req.params.id!, req.body);
  return render(req, res, "caso", {
    ...m.detalheModeracao(uid(res), req.params.id!),
    inspecao,
  });
};
export const reputacao: Acao = (req, res) => {
  const handle = String(req.params.identificador ?? "").replace(/^@/, "");
  if (!/^[a-z0-9_.]{3,24}$/i.test(handle))
    throw new m.ErroColaboracao("Profissional indisponível.", 404);
  const atual = resolverPerfilPublico(handle) ?? "@" + handle;
  const p = um(
    "SELECT usuario_id id,nome,identificador FROM perfis WHERE identificador=? COLLATE NOCASE",
    atual
  );
  if (!p) throw new m.ErroColaboracao("Profissional indisponível.", 404);
  const resumo = m.reputacaoPublica(p.id, uid(res));
  if (atual.toLowerCase() !== ("@" + handle).toLowerCase())
    return res.redirect(
      308,
      "/reputacao/" + encodeURIComponent(p.identificador.replace(/^@/, ""))
    );
  return render(req, res, "reputacao", {
    perfil: p,
    resumo,
  });
};

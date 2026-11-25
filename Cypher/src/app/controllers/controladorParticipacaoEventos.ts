import type { Request, Response, NextFunction } from "express";
import * as m from "../models/eventos.js";
type Acao = (req: Request, res: Response) => unknown;
const uid = (res: Response) => res.locals.usuario.id as string;
const data = (n: number | null, fuso = "America/Sao_Paulo") =>
  n
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: fuso,
      }).format(n)
    : "Horário a confirmar";
function render(
  req: Request,
  res: Response,
  tela: string,
  dados: Record<string, unknown> = {}
) {
  return res.render("pages/evento", {
    title: "Evento",
    stylesheet: "evento",
    path: "/events",
    tela,
    erro: "",
    formulario: {},
    estados: m.estadosInscricao,
    data,
    ...dados,
  });
}
export const seguro =
  (fn: Acao) => (req: Request, res: Response, next: NextFunction) => {
    try {
      res.set("Cache-Control", "private, no-store");
      return fn(req, res);
    } catch (e) {
      if (e instanceof m.ErroEvento) {
        res.status(e.status);
        if (req.params.id && e.status !== 403 && e.status !== 404) {
          try {
            return render(req, res, "ficha", {
              f: m.fichaEvento(uid(res), req.params.id),
              erro: e.message,
              formulario: req.body,
            });
          } catch {}
        }
        return render(req, res, "erro", { erro: e.message });
      }
      next(e);
    }
  };
export const detalhe: Acao = (req, res) =>
  render(req, res, "ficha", { f: m.fichaEvento(uid(res), req.params.id!) });
export const mapa: Acao = (req, res) => {
  const pontos = m.pontosMapaEventos(uid(res));
  const escolhido = pontos.find(p => p.id === req.query.evento) ?? pontos[0];
  let mapaUrl = "";
  if (escolhido) {
    const lat = escolhido.latitude,
      lon = escolhido.longitude;
    mapaUrl =
      "https://www.openstreetmap.org/export/embed.html?bbox=" +
      [
        Math.max(-180, lon - 0.02),
        Math.max(-90, lat - 0.01),
        Math.min(180, lon + 0.02),
        Math.min(90, lat + 0.01),
      ].join("%2C") +
      "&layer=mapnik&marker=" +
      lat +
      "%2C" +
      lon;
  }
  return render(req, res, "mapa", { pontos, escolhido, mapaUrl });
};
function agir(
  fn: (ator: string, id: string, b: Record<string, unknown>) => unknown
): Acao {
  return (req, res) => {
    fn(uid(res), req.params.id!, req.body);
    return res.redirect(303, "/events/" + encodeURIComponent(req.params.id!));
  };
}
export const seguir = agir(m.seguirEvento);
export const inscrever = agir(m.inscreverEvento);
export const cancelarInscricao: Acao = (req, res) => {
  m.cancelarInscricaoEvento(uid(res), req.params.id!);
  return res.redirect(303, "/events/" + encodeURIComponent(req.params.id!));
};
export const decidir: Acao = (req, res) => {
  m.decidirInscricaoEvento(
    uid(res),
    req.params.id!,
    req.params.usuarioId!,
    req.body
  );
  return res.redirect(
    303,
    "/events/" + encodeURIComponent(req.params.id!) + "#gestao"
  );
};
export const presenca: Acao = (req, res) => {
  m.registrarPresencaEvento(
    uid(res),
    req.params.id!,
    req.params.usuarioId!,
    req.body
  );
  return res.redirect(
    303,
    "/events/" + encodeURIComponent(req.params.id!) + "#gestao"
  );
};
export const cancelar = agir(m.cancelarEvento);
export const avaliar = agir(m.avaliarEvento);
export const reclamar = agir(m.reclamarEvento);
export const responder: Acao = (req, res) => {
  m.responderReclamacaoEvento(
    uid(res),
    req.params.id!,
    req.params.reclamacao!,
    req.body
  );
  return res.redirect(
    303,
    "/events/" + encodeURIComponent(req.params.id!) + "#reclamacoes"
  );
};
export const encaminhar: Acao = (req, res) =>
  res.redirect(
    303,
    "/suporte/" +
      m.encaminharReclamacaoEvento(
        uid(res),
        req.params.id!,
        req.params.reclamacao!
      )
  );

import path from "node:path";
import type { Request, Response, NextFunction } from "express";
import * as m from "../models/midiasPublicacoes.js";
import * as r from "../models/representacoes.js";
import { ErroInteracao } from "../models/interacoesConteudo.js";
import { salvarSeloPerfil } from "../models/seloPerfil.js";
const ator = (res: Response) => res.locals.usuario.id as string;
const render = (res: Response, dados: object) =>
  res.render("pages/midias-representacao", {
    title: "Mídias e representação",
    path: "/profile",
    stylesheet: "midias-representacao",
    erro: "",
    ...dados,
  });
export const seguro =
  (fn: (req: Request, res: Response) => unknown) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      return fn(req, res);
    } catch (e) {
      if (e instanceof ErroInteracao) {
        res.status(e.status);
        if (req.is("application/octet-stream"))
          return res.json({ erro: e.message });
        return render(res, { tela: "erro", erro: e.message });
      }
      next(e);
    }
  };
export function preparar(req: Request, res: Response, next: NextFunction) {
  if (res.locals.usuario && res.locals.usuario.tipoConta !== "administrativo") {
    res.locals.capaUsuario = (tipo: string, id: string) => {
      try {
        const mid = m.capaPublicacao(ator(res), tipo, id);
        return mid ? "/publication-media/" + mid : "";
      } catch {
        return "";
      }
    };
    res.locals.midiasUsuario = (tipo: string, id: string) => {
      try {
        return m.listarMidiasPublicacoes(ator(res), tipo, id);
      } catch {
        return [];
      }
    };
  }
  next();
}
export function midias(req: Request, res: Response) {
  m.gerirMidias(ator(res), req.params.tipo, req.params.id);
  return render(res, {
    tela: "midias",
    tipo: req.params.tipo,
    id: req.params.id,
    arquivos: m.listarMidiasPublicacoes(
      ator(res),
      req.params.tipo,
      req.params.id
    ),
  });
}
export function salvarSelo(req: Request, res: Response) {
  salvarSeloPerfil(ator(res), req.body);
  return res.redirect(303, "/profile?salvo=1");
}
export function upload(req: Request, res: Response) {
  if (req.get("X-Midia-Autorizada") !== "sim")
    throw new ErroInteracao(
      "Confirme que você tem autorização para compartilhar este arquivo."
    );
  let nome = "";
  try {
    nome = decodeURIComponent(req.get("x-file-name") || "");
  } catch {
    throw new ErroInteracao("Nome de arquivo inválido.");
  }
  const id = m.salvarMidiaPublicacao(
    ator(res),
    req.params.tipo,
    req.params.id,
    String(req.query.finalidade),
    nome,
    req.body
  );
  return res.status(201).json({ id });
}
export function arquivo(req: Request, res: Response) {
  const mid = m.arquivoPublicacao(ator(res), req.params.id);
  res.set({
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (mid.finalidade === "texto") res.attachment(mid.nome);
  res.type(mid.mime);
  return res.sendFile(path.resolve(m.pastaMidiasPublicacoes(), mid.id));
}
export function retirar(req: Request, res: Response) {
  const mid = m.arquivoPublicacao(ator(res), req.params.id);
  m.retirarMidiaPublicacao(ator(res), req.params.id);
  return res.redirect(
    303,
    "/publicacoes/" +
      mid.objeto_tipo +
      "/" +
      encodeURIComponent(mid.objeto_id) +
      "/midias"
  );
}
export function representacoes(req: Request, res: Response) {
  return render(res, {
    title: "Representação profissional",
    path: "/representacoes",
    tela: "representacoes",
    itens: r.listarRepresentacoes(ator(res)),
    destinatario:
      typeof req.query.destinatario === "string" ? req.query.destinatario : "",
  });
}
export function convidar(req: Request, res: Response) {
  r.convidarRepresentacao(ator(res), req.body);
  return res.redirect(303, "/representacoes");
}
export function responder(req: Request, res: Response) {
  r.responderRepresentacao(ator(res), req.params.id, req.body);
  return res.redirect(303, "/representacoes");
}

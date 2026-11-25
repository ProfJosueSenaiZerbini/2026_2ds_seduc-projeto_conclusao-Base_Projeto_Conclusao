import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import type { UsuarioDaSessao } from "../models/bancoDados.js";
import {
  ErroInteracao,
  alterarComentario,
  alterarInteracao,
  colecoesPessoais,
  estadoInteracao,
  exigirAlvoInteracao,
  listarComentarios,
  publicarComentario,
  urlInteracao,
} from "../models/interacoesConteudo.js";
import { conexaoInternaCypher } from "../models/bancoDados.js";
import { alvoInteracao } from "../models/politicasInteracoes.js";

const usuario = (res: Response) => res.locals.usuario as UsuarioDaSessao;
const querJson = (req: Request) =>
  req.is("application/json") || req.get("Accept")?.includes("application/json");
const dataComentario = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function prepararInteracoes(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  const conta = res.locals.usuario as UsuarioDaSessao | undefined;
  if (conta && !conta.demonstracao && conta.tipoConta !== "administrativo") {
    const estados = new Map<string, ReturnType<typeof estadoInteracao>>();
    res.locals.interacao = (tipo: string, id: string) => {
      const chave = tipo + ":" + id;
      if (!estados.has(chave))
        estados.set(chave, estadoInteracao(conta.id, tipo, id));
      return estados.get(chave);
    };
  }
  next();
}

function render(res: Response, dados: object) {
  res.set("Cache-Control", "private, no-store");
  return res.render("pages/interacoes-conteudo", {
    title: "Minha coleção",
    path: "/colecoes",
    stylesheet: "descoberta",
    authenticated: true,
    erro: "",
    ...dados,
  });
}

export function seguro(fn: (req: Request, res: Response) => unknown) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      return fn(req, res);
    } catch (e) {
      if (!(e instanceof ErroInteracao)) return next(e);
      res.status(e.status);
      if (querJson(req)) return res.json({ erro: e.message });
      return render(res, { tela: "erro", erro: e.message });
    }
  };
}

export function colecoes(req: Request, res: Response) {
  const aba = req.query.aba === "seguindo" ? "seguindo" : "salvos";
  return render(res, {
    tela: "colecao",
    aba,
    itens: colecoesPessoais(usuario(res).id, aba),
  });
}

export function importarBeats(req: Request, res: Response) {
  const ator = usuario(res).id;
  const ids = req.body.ids;
  if (
    !Array.isArray(ids) ||
    ids.length > 100 ||
    ids.some(id => typeof id !== "string" || id.length > 120)
  )
    throw new ErroInteracao(
      "Não foi possível importar esta lista de favoritos."
    );
  const db = conexaoInternaCypher();
  const total = db
    .transaction(() => {
      let importados = 0;
      for (const id of new Set<string>(ids)) {
        if (!alvoInteracao(db, ator, "beat", id)) continue;
        alterarInteracao(ator, "beat", id, "salvar", true);
        importados++;
      }
      return importados;
    })
    .immediate();
  return res.json({ total });
}

export function ficha(req: Request, res: Response, erro = "", texto = "") {
  const conta = usuario(res);
  const alvo = exigirAlvoInteracao(conta.id, req.params.tipo, req.params.id);
  const dados = {
    tela: "ficha",
    title: alvo.tipo === "perfil" ? alvo.titulo : "Comentários",
    alvo,
    comentarios:
      alvo.tipo === "perfil" ? [] : listarComentarios(conta.id, alvo),
    data: (v: number) => dataComentario.format(v),
    base: urlInteracao(alvo.tipo, alvo.id),
    envio: randomUUID(),
    texto,
    erro,
  };
  if (querJson(req)) {
    res.set("Cache-Control", "private, no-store");
    return res.render(
      "partials/componentes/conversa-conteudo",
      dados,
      (e, html) => {
        if (e)
          return res
            .status(500)
            .json({
              erro: "Não foi possível abrir a conversa. Tente novamente.",
            });
        return res.json({
          html,
          titulo: alvo.titulo,
          total: dados.comentarios.length,
        });
      }
    );
  }
  return render(res, dados);
}

export function acao(req: Request, res: Response) {
  const { tipo, id, acao } = req.params;
  if (!["sim", "nao"].includes(req.body.ativo))
    throw new ErroInteracao("Escolha uma ação válida.");
  const resultado = alterarInteracao(
    usuario(res).id,
    tipo,
    id,
    acao,
    req.body.ativo === "sim"
  );
  if (req.is("application/json"))
    return res.json(
      resultado && {
        salvo: resultado.salvo,
        segue: resultado.segue,
        curtido: resultado.curtido,
        curtidas: resultado.curtidas,
      }
    );
  const retorno =
    req.body.colecao === "seguindo" ? "/colecoes?aba=seguindo" : "/colecoes";
  return res.redirect(
    303,
    req.body.colecao ? retorno : (resultado?.alvo.url ?? retorno)
  );
}

export function publicar(req: Request, res: Response) {
  const { tipo, id } = req.params;
  try {
    const cid = publicarComentario(
      usuario(res).id,
      tipo,
      id,
      req.body.texto,
      req.body.envio
    );
    if (querJson(req)) return ficha(req, res);
    return res.redirect(303, urlInteracao(tipo, id) + "#comentario-" + cid);
  } catch (e) {
    if (!(e instanceof ErroInteracao) || e.status === 404) throw e;
    if (querJson(req)) return res.status(e.status).json({ erro: e.message });
    res.status(e.status);
    return ficha(
      req,
      res,
      e.message,
      typeof req.body.texto === "string" ? req.body.texto.slice(0, 1500) : ""
    );
  }
}

export function salvarComentario(excluir: boolean) {
  return (req: Request, res: Response) => {
    const { tipo, id, cid } = req.params;
    alterarComentario(
      usuario(res).id,
      tipo,
      id,
      cid,
      req.body.versao,
      excluir,
      req.body.texto
    );
    if (querJson(req)) return ficha(req, res);
    return res.redirect(
      303,
      urlInteracao(tipo, id) + (excluir ? "#comentarios" : "#comentario-" + cid)
    );
  };
}

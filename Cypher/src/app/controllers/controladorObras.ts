export { catalogoObras as obras } from "./controladorEspacoTrabalho.js";
/** Entry points do domínio de obras e seus créditos. */
export {
  novaObra,
  editarObra,
  criarObra,
  atualizarObra,
  excluirObra,
} from "./controladorCompatibilidade.js";

import type { Request, Response } from "express";
import path from "node:path";
import { definirCurtidaObra } from "../models/catalogoObras.js";
import { caminhoBancoCypher, conexaoInternaCypher } from "../models/bancoDados.js";
import { ErroAcervo, enviarEvidencia, filaEvidencias, revisarEvidencia } from "../models/acervoMusical.js";
import { podeAdministrar } from "../models/permissoes.js";

export function curtirObra(req: Request, res: Response) {
  if (!res.locals.usuario?.id) return res.status(401).json({ erro: "Entre para curtir." });
  if (typeof req.body?.curtida !== "boolean") return res.status(400).json({ erro: "Curtida inválida." });
  const resultado = definirCurtidaObra(String(req.params.id), res.locals.usuario.id, req.body.curtida);
  if (!resultado) return res.status(404).json({ erro: "Obra indisponível." });
  return res.json(resultado);
}

export function comprovarLancamento(req: Request, res: Response) {
  const ator = res.locals.usuario;
  if (ator?.tipoConta !== "profissional" || ator.demonstracao) return res.sendStatus(403);
  const id = String(req.params.id);
  const ficha = "/espaco-de-trabalho/obra/" + encodeURIComponent(id);
  const valores = {
    tipo: String(req.body.tipo ?? ""),
    data: String(req.body.data ?? ""),
    url: String(req.body.url ?? ""),
    autorizado: req.body.autorizado === "sim",
  };
  try {
    enviarEvidencia(conexaoInternaCypher(), path.dirname(caminhoBancoCypher()), id, ator.id,
      valores.tipo, valores.data, valores.url, valores.autorizado);
    return res.redirect(303, ficha);
  } catch (erro) {
    if (!(erro instanceof ErroAcervo)) throw erro;
    return res.status(400).render("pages/comprovar-lancamento", {
      title: "Comprovar lançamento", path: "/espaco-de-trabalho", stylesheet: "cadastro-obra",
      ficha, valores, erro: erro.message, somenteFormulario: true,
    });
  }
}

export function evidenciasLancamentos(_req: Request, res: Response) {
  if (!res.locals.usuario || !podeAdministrar(res.locals.usuario, "moderacao")) return res.sendStatus(403);
  res.set("Cache-Control", "private, no-store");
  return res.render("pages/evidencias-lancamentos", {
    title: "Evidências de lançamento", path: "/admin/lancamentos", stylesheet: "suporte",
    itens: filaEvidencias(conexaoInternaCypher()),
  });
}

export function decidirEvidencia(req: Request, res: Response) {
  const ator = res.locals.usuario;
  if (!ator || !podeAdministrar(ator, "moderacao")) return res.sendStatus(403);
  if (!revisarEvidencia(conexaoInternaCypher(), String(req.params.id), ator.id, String(req.body.decisao)))
    return res.sendStatus(409);
  return res.redirect(303, "/admin/lancamentos");
}

import type { Request, Response } from "express";
import {
  conexaoInternaCypher,
  contarNotificacoesNaoLidasCypher,
  listarNotificacoesCypher,
  marcarNotificacaoLidaCypher,
  marcarTodasNotificacoesLidasCypher,
  type UsuarioDaSessao,
} from "../models/bancoDados.js";
import { categoriasNotificacoes } from "../models/preferenciasNotificacoes.js";

const porPagina = 20;
const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function apresentarData(valor: string) {
  const data = new Date(valor.replace(" ", "T") + "Z");
  return Number.isNaN(data.getTime()) ? valor : formatoData.format(data);
}

function usuarioAtual(res: Response): UsuarioDaSessao | undefined {
  return res.locals.usuario as UsuarioDaSessao | undefined;
}

function urlCaixa(pagina: number, naoLidas: boolean) {
  const query = new URLSearchParams();
  if (naoLidas) query.set("filtro", "nao-lidas");
  if (pagina > 1) query.set("pagina", String(pagina));
  return "/notificacoes" + (query.size ? "?" + query.toString() : "");
}

function paginaValida(valor: unknown) {
  if (typeof valor !== "string" || !/^\d{1,9}$/.test(valor)) return 1;
  return Math.max(1, Number(valor));
}

export function notificacoes(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  if (!usuario) return res.redirect("/login");
  res.set("Cache-Control", "private, no-store");

  const naoLidas = req.query.filtro === "nao-lidas";
  const pagina = paginaValida(req.query.pagina);
  const avisos = listarNotificacoesCypher(
    usuario.id,
    porPagina + 1,
    naoLidas,
    (pagina - 1) * porPagina
  );
  if (pagina > 1 && !avisos.length) return res.redirect(urlCaixa(1, naoLidas));
  const preferencias = conexaoInternaCypher()
    .prepare(
      "SELECT avisos_desativados_json FROM preferencias_usuario WHERE usuario_id = ?"
    )
    .get(usuario.id) as { avisos_desativados_json: string } | undefined;

  return res.render("pages/notificacoes", {
    title: "Notificações",
    path: "/notificacoes",
    stylesheet: "notificacoes",
    authenticated: true,
    usuario,
    notificacoes: avisos.slice(0, porPagina),
    quantidadeNaoLidas: contarNotificacoesNaoLidasCypher(usuario.id),
    pagina,
    naoLidas,
    urlCaixa,
    apresentarData,
    temProxima: avisos.length > porPagina,
    categorias: categoriasNotificacoes,
    desativadas: new Set<string>(
      JSON.parse(preferencias?.avisos_desativados_json ?? "[]")
    ),
    preferenciasSalvas: req.query.preferencias === "salvas",
  });
}

function atualizarLeitura(lida: boolean) {
  return (req: Request, res: Response) => {
    const usuario = usuarioAtual(res);
    if (!usuario) return res.redirect("/login");
    marcarNotificacaoLidaCypher(req.params.id, usuario.id, lida);
    return res.redirect(
      303,
      urlCaixa(paginaValida(req.body.pagina), req.body.filtro === "nao-lidas")
    );
  };
}

export const marcarLida = atualizarLeitura(true);
export const marcarNaoLida = atualizarLeitura(false);

export function marcarTodasLidas(_req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  if (!usuario) return res.redirect("/login");
  marcarTodasNotificacoesLidasCypher(usuario.id);
  return res.redirect(303, "/notificacoes");
}

function removerAvisos(usuarioId: string, id?: string) {
  // Mantém a chave de origem para um reenvio não recriar o aviso descartado.
  conexaoInternaCypher()
    .prepare(
      `
    UPDATE notificacoes SET removida_em = CURRENT_TIMESTAMP,
      titulo = '', mensagem = '', url = '', entidade_tipo = '', entidade_id = '', lida_em = NULL
    WHERE usuario_destino_id = ? AND removida_em IS NULL ${id === undefined ? "" : "AND id = ?"}
  `
    )
    .run(usuarioId, ...(id === undefined ? [] : [id]));
}

export function excluir(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  if (!usuario) return res.redirect("/login");
  removerAvisos(usuario.id, req.params.id);
  return res.redirect(
    303,
    urlCaixa(paginaValida(req.body.pagina), req.body.filtro === "nao-lidas")
  );
}

export function limpar(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  if (!usuario) return res.redirect("/login");
  if (req.body.confirmar !== "sim") return res.sendStatus(400);
  removerAvisos(usuario.id);
  return res.redirect(303, "/notificacoes");
}

export function salvarPreferencias(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  if (!usuario) return res.redirect("/login");
  if (req.body.salvar !== "sim") return res.sendStatus(400);
  const recebidas: unknown[] = Array.isArray(req.body.ativadas)
    ? req.body.ativadas
    : [req.body.ativadas];
  const desativadas = categoriasNotificacoes
    .filter(c => !recebidas.includes(c.id))
    .map(c => c.id);
  conexaoInternaCypher()
    .prepare(
      `
    INSERT INTO preferencias_usuario (usuario_id, avisos_desativados_json) VALUES (?, ?)
    ON CONFLICT(usuario_id) DO UPDATE SET avisos_desativados_json = excluded.avisos_desativados_json
  `
    )
    .run(usuario.id, JSON.stringify(desativadas));
  return res.redirect(303, "/notificacoes?preferencias=salvas#preferencias");
}

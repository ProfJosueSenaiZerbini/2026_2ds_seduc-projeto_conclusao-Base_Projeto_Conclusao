// @ts-nocheck
import { obterPreferenciasUsuario } from "../models/identidadeUsuario.js";
import { podePublicar } from "../models/permissoes.js";
import { normalizarBusca } from "../models/espacoTrabalho.js";
import { fotoEventoDemonstrativo } from "../models/modeloDescoberta.js";
import { resolverTemaEvento, temaEventoPadrao, temasEvento } from "../models/temasEvento.js";

import type { Request, Response } from "express";
import {
  CypherModel,
  type DadosEventoCypher,
  type EventoContaPersistido,
  type FiltrosEventos,
} from "../models/modeloCypher.js";
import {
  podeCriarEvento,
  rotuloStatusProfissional,
} from "../models/modeloPerfil.js";
import type { UsuarioDaSessao } from "../models/bancoDados.js";
import {
  categoriasEvento,
  coresEvento,
  etiquetasDoFormulario,
  situacoesEvento,
  tiposWorkshop,
  tiposParticipacaoEvento,
  validarFormularioEvento,
  type ValoresFormularioEvento,
} from "../validators/validarEvento.js";
import type { StatusInteresseEvento } from "../models/bancoDados.js";

const valoresVazios: ValoresFormularioEvento = {
  titulo: "",
  categoria: "",
  categoriaDetalhe: "",
  tiposWorkshop: [],
  data: "",
  horario: "",
  local: "",
  organizador: "",
  situacao: "Inscrições abertas",
  cor: "yellow",
  temaCartao: temaEventoPadrao,
  descricao: "",
  formato: "",
  inscricao: "",
  premio: "",
  etiquetas: "",
  tipoParticipacao: "aberta",
};

function usuarioAtual(res: Response): UsuarioDaSessao {
  return res.locals.usuario as UsuarioDaSessao;
}

function usuarioParaView(usuario: UsuarioDaSessao) {
  return {
    ...usuario,
    availabilityLabel: rotuloStatusProfissional(
      usuario.availability,
      usuario.categories
    ),
  };
}

function textoQuery(req: Request, chave: string): string {
  const valor = req.query[chave];
  return typeof valor === "string" ? valor.trim() : "";
}

function normalizarFiltros(req: Request, localizacao: string): FiltrosEventos {
  const periodo = textoQuery(req, "periodo");
  const ordem = textoQuery(req, "ordem");
  return {
    categoria: textoQuery(req, "categoria"),
    localizacao: localizacao.slice(0, 100),
    formato: textoQuery(req, "formato"),
    periodo:
      periodo === "passados" || periodo === "proximos" ? periodo : "todos",
    ordem: ordem === "titulo" || ordem === "data" ? ordem : "recentes",
  };
}

const dataDoEvento = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function prepararEventoParaView(evento: EventoContaPersistido) {
  const data = new Date(`${evento.date}T00:00:00Z`);
  const partes =
    /^\d{4}-\d{2}-\d{2}$/.test(evento.date) && Number.isFinite(data.getTime())
      ? dataDoEvento.formatToParts(data)
      : [];
  const dia = partes.find(parte => parte.type === "day")?.value;
  const mes = partes
    .find(parte => parte.type === "month")
    ?.value.replace(/\.$/, "")
    .toUpperCase();

  return {
    evento: { ...evento, date: dia && mes ? `${dia} ${mes}` : evento.date || "A confirmar" },
    item: {
      titulo: evento.title,
      tipo: [evento.category, evento.categoryDetail, ...evento.workshopTypes].filter(Boolean).join(" · "),
      workshopTypes: evento.workshopTypes,
      categoria: evento.category,
      temaCartao: resolverTemaEvento(evento.temaCartao),
      data: evento.date,
      dataCurta: partes.map(parte => parte.value).join(""),
      dia,
      mes,
      autor: evento.org,
      local: evento.location,
      hora: evento.time,
      status: evento.status,
      descricao: evento.description,
      demonstracao: evento.demonstracao,
      fotoDestaque: evento.demonstracao ? fotoEventoDemonstrativo(evento.id) : undefined,
    },
  };
}

function formularioDoEvento(
  evento: EventoContaPersistido
): ValoresFormularioEvento {
  return {
    titulo: evento.title,
    categoria: evento.category,
    categoriaDetalhe: evento.categoryDetail,
    tiposWorkshop: evento.workshopTypes ?? [],
    data: evento.date,
    horario: evento.time,
    local: evento.location,
    organizador: evento.org,
    situacao: evento.status,
    cor: evento.color,
    temaCartao: resolverTemaEvento(evento.temaCartao),
    descricao: evento.description,
    formato: evento.format,
    inscricao: evento.registration,
    premio: evento.prize,
    etiquetas: evento.tags.join(", "),
    tipoParticipacao: evento.participationType,
  };
}

function dadosDoFormulario(req: Request, temaAtual = temaEventoPadrao): ValoresFormularioEvento {
  const valor = (chave: string) => String(req.body[chave] ?? "").trim();
  return {
    titulo: valor("titulo"),
    categoria: valor("categoria"),
    categoriaDetalhe:
      valor("categoria") === "Outro" ? valor("categoriaDetalhe") : "",
    tiposWorkshop:
      valor("categoria") === "Workshop"
        ? (Array.isArray(req.body.tiposWorkshop)
            ? req.body.tiposWorkshop
            : req.body.tiposWorkshop === undefined
              ? []
              : [req.body.tiposWorkshop]
          )
            .map((tipo: unknown) => String(tipo).trim())
            .filter(Boolean)
        : [],
    data: valor("data"),
    horario: valor("horario"),
    local: valor("local"),
    organizador: valor("organizador"),
    situacao: valor("situacao"),
    cor: valor("cor") || "yellow",
    temaCartao: req.body.temaCartao === undefined ? temaAtual : valor("temaCartao"),
    descricao: valor("descricao"),
    formato: valor("formato"),
    inscricao: valor("inscricao"),
    premio: valor("premio"),
    etiquetas: valor("etiquetas"),
    tipoParticipacao: tiposParticipacaoEvento.includes(
      valor("tipoParticipacao") as (typeof tiposParticipacaoEvento)[number]
    )
      ? (valor("tipoParticipacao") as (typeof tiposParticipacaoEvento)[number])
      : "aberta",
  };
}

function dadosPersistidos(valores: ValoresFormularioEvento): DadosEventoCypher {
  return {
    title: valores.titulo,
    category: valores.categoria,
    categoryDetail:
      valores.categoria === "Outro" ? valores.categoriaDetalhe : "",
    workshopTypes: valores.tiposWorkshop,
    date: valores.data,
    time: valores.horario,
    location: valores.local,
    org: valores.organizador,
    status: valores.situacao,
    color: valores.cor,
    temaCartao: valores.temaCartao,
    description: valores.descricao,
    format: valores.formato,
    registration: valores.inscricao,
    prize: valores.premio,
    tags: etiquetasDoFormulario(valores.etiquetas),
    participationType: valores.tipoParticipacao,
  };
}

function renderizarFormulario(
  req: Request,
  res: Response,
  valores: ValoresFormularioEvento,
  erro: string | null,
  editando: boolean,
  eventoId = "",
  categoriaOutroLegadaVazia = false
) {
  const usuario = usuarioAtual(res);
  return res.status(erro ? 400 : 200).render("pages/cadastro-evento", {
    title: editando ? "Editar evento" : "Cadastrar evento",
    path: res.locals.origemEspaco ? "/espaco-de-trabalho" : req.path,
    stylesheet: "cadastro-obra",
    authenticated: true,
    usuario: usuarioParaView(usuario),
    valores,
    erro,
    mensagem: null,
    editando,
    eventoId,
    categoriaOutroLegadaVazia,
    categoriasEvento,
    situacoesEvento,
    coresEvento,
    tiposWorkshop,
    temasEvento,
    temaSelecionado: resolverTemaEvento(valores.temaCartao),
    tiposParticipacaoEvento,
  });
}

function exigirOrganizador(
  req: Request,
  res: Response
): UsuarioDaSessao | undefined {
  const usuario = usuarioAtual(res);
  if (!podePublicar(usuario,"evento")) {
    res.redirect("/events?erro=permissao");
    return undefined;
  }
  return usuario;
}

function exigirResponsavelEvento(
  req: Request,
  res: Response
): { usuario: UsuarioDaSessao; evento: EventoContaPersistido } | undefined {
  const usuario = usuarioAtual(res);
  if (usuario.demonstracao || usuario.tipoConta !== "profissional") {
    res.redirect("/events?erro=permissao");
    return undefined;
  }
  const evento = CypherModel.evento(String(req.params.id), usuario.id);
  if (!evento || !evento.owned || evento.demonstracao) {
    res.redirect("/events?erro=evento");
    return undefined;
  }
  return { usuario, evento };
}

export function oportunidades(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  const preferencias = obterPreferenciasUsuario(usuario.id);
  const localizacao =
    req.query.localizacao === undefined
      ? undefined
      : textoQuery(req, "localizacao").slice(0, 100);
  const filtros = normalizarFiltros(req, localizacao ?? preferencias.regiao);
  const q = textoQuery(req, "q").slice(0, 120);
  const termos = normalizarBusca(q).split(/\s+/).filter(Boolean);
  const todos = CypherModel.eventosDisponiveis(
    {
      categoria: "",
      localizacao: "",
      formato: "",
      periodo: "todos",
      ordem: "recentes",
    },
    usuario.id
  );
  const termosLocal = normalizarBusca(filtros.localizacao)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const refinoAtivo = Boolean(
    filtros.formato ||
    filtros.periodo !== "todos" || filtros.ordem !== "recentes"
  );
  const fonte = refinoAtivo || filtros.categoria
    ? CypherModel.eventosDisponiveis({ ...filtros, localizacao: "" }, usuario.id)
    : todos;
  const eventos = fonte.filter(evento => {
    if (termosLocal.length) {
      const local = normalizarBusca(evento.location);
      if (!termosLocal.every(termo => local.includes(termo))) return false;
    }
    if (!termos.length) return true;
    const campos = [
      evento.title,
      evento.org,
      evento.category,
      evento.categoryDetail,
      evento.location,
      evento.format,
      evento.description,
      ...evento.tags,
    ];
    const texto = normalizarBusca(campos.join(" "));
    return termos.every(termo => texto.includes(termo));
  });
  const opcoesCategorias = [...new Set([
    "Batalha", "Show", "Cypher", "Workshop",
    ...todos.map(evento => evento.category), filtros.categoria,
  ].filter(Boolean))];
  const opcoesFormatos = [...new Set([
    ...todos.map(evento => evento.format), filtros.formato,
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return res.render("pages/oportunidades", {
    title: "Eventos",
    path: req.path,
    stylesheet: "oportunidades",
    temaPreferido: preferencias.tema,
    authenticated: true,
    usuario: usuarioParaView(usuario),
    eventos: eventos.map(prepararEventoParaView),
    q,
    filtros,
    refinoAtivo,
    filtrado: Boolean(q || filtros.categoria || filtros.localizacao || refinoAtivo),
    localizacaoSelecionada: localizacao,
    opcoesCategorias,
    opcoesFormatos,
    podeGerenciar: podePublicar(usuario, "evento"),
    erro: textoQuery(req, "erro"),
    mensagem: textoQuery(req, "mensagem"),
  });
}

function redirecionarEventos(
  res: Response,
  sucesso: boolean,
  mensagem: string,
  erro: string
) {
  return res.redirect(
    sucesso
      ? `/events?mensagem=${encodeURIComponent(mensagem)}`
      : `/events?erro=${encodeURIComponent(erro)}`
  );
}

export function demonstrarInteresse(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  const status = CypherModel.demonstrarInteresseEvento(
    String(req.params.id),
    usuario.id
  );
  return redirecionarEventos(
    res,
    status !== null,
    status === "inscrito"
      ? "Solicitação de participação enviada."
      : "Participação registrada com sucesso.",
    "Não foi possível registrar sua participação neste evento."
  );
}

export function cancelarInteresse(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  const cancelado = CypherModel.cancelarInteresseEvento(
    String(req.params.id),
    usuario.id
  );
  return redirecionarEventos(
    res,
    cancelado,
    "Participação cancelada.",
    "Não havia uma participação ativa para cancelar."
  );
}

export function atualizarInteresse(req: Request, res: Response) {
  const responsavel = exigirResponsavelEvento(req, res);
  if (!responsavel) return;
  const { usuario } = responsavel;
  const statusRecebido = String(req.body.status ?? "");
  const statusPermitidos = new Set<StatusInteresseEvento>([
    "interessado",
    "inscrito",
    "confirmado",
    "rejeitado",
  ]);
  if (!statusPermitidos.has(statusRecebido as StatusInteresseEvento)) {
    return redirecionarEventos(
      res,
      false,
      "",
      "Status de participação inválido."
    );
  }
  const atualizado = CypherModel.atualizarStatusInteresseEvento(
    String(req.params.id),
    usuario.id,
    String(req.params.usuarioId),
    statusRecebido as Extract<
      StatusInteresseEvento,
      "interessado" | "inscrito" | "confirmado" | "rejeitado"
    >
  );
  return redirecionarEventos(
    res,
    atualizado,
    "Status de participação atualizado.",
    "Não foi possível atualizar esta participação."
  );
}

export function novoEvento(req: Request, res: Response) {
  const usuario = exigirOrganizador(req, res);
  if (!usuario) return;
  return renderizarFormulario(
    req,
    res,
    {
      ...valoresVazios,
      organizador: usuario.name,
    },
    null,
    false
  );
}

export function criarEvento(req: Request, res: Response) {
  const usuario = exigirOrganizador(req, res);
  if (!usuario) return;
  const valores = dadosDoFormulario(req);
  const erro = validarFormularioEvento(valores);
  if (erro) return renderizarFormulario(req, res, valores, erro, false);
  const eventoId = CypherModel.criarEvento(
    usuario.id,
    dadosPersistidos(valores)
  );
  CypherModel.criarNotificacao({
    usuarioDestinoId: usuario.id,
    tipo: "evento_criado",
    titulo: "Novo evento criado",
    mensagem: `“${valores.titulo}” foi adicionado às suas oportunidades.`,
    url: "/events",
    entidadeTipo: "evento",
    entidadeId: eventoId,
    chaveOrigem: `evento-criado:${eventoId}`,
  });
  return res.redirect(res.locals.origemEspaco ? "/espaco-de-trabalho?resultado=eventoCriado" : "/events?mensagem=Evento criado com sucesso.");
}

export function editarEvento(req: Request, res: Response) {
  const responsavel = exigirResponsavelEvento(req, res);
  if (!responsavel) return;
  const { usuario, evento } = responsavel;
  return renderizarFormulario(
    req,
    res,
    formularioDoEvento(evento),
    null,
    true,
    evento.id,
    evento.category === "Outro" && !evento.categoryDetail
  );
}

export function atualizarEvento(req: Request, res: Response) {
  const responsavel = exigirResponsavelEvento(req, res);
  if (!responsavel) return;
  const { usuario, evento } = responsavel;
  const valores = dadosDoFormulario(req, resolverTemaEvento(evento.temaCartao));
  const categoriaOutroLegadaVazia =
    evento.category === "Outro" && !evento.categoryDetail;
  const erro = validarFormularioEvento(valores, categoriaOutroLegadaVazia);
  if (erro)
    return renderizarFormulario(
      req,
      res,
      valores,
      erro,
      true,
      String(req.params.id),
      categoriaOutroLegadaVazia
    );
  const atualizado = CypherModel.atualizarEvento(
    String(req.params.id),
    usuario.id,
    dadosPersistidos(valores)
  );
  if (atualizado) {
    CypherModel.criarNotificacao({
      usuarioDestinoId: usuario.id,
      tipo: "evento_atualizado",
      titulo: "Evento atualizado",
      mensagem: `As informações de “${valores.titulo}” foram salvas.`,
      url: "/events",
      entidadeTipo: "evento",
      entidadeId: String(req.params.id),
      chaveOrigem: `evento-atualizado:${req.params.id}:${valores.titulo}:${valores.situacao}`,
    });
  }
  return res.redirect(
    atualizado
      ? (res.locals.origemEspaco ? "/espaco-de-trabalho?resultado=eventoAtualizado" : "/events?mensagem=Evento atualizado com sucesso.")
      : "/events?erro=evento"
  );
}

export function excluirEvento(req: Request, res: Response) {
  const responsavel = exigirResponsavelEvento(req, res);
  if (!responsavel) return;
  const { usuario } = responsavel;
  const excluido = CypherModel.excluirEvento(String(req.params.id), usuario.id);
  return res.redirect(
    excluido ? (res.locals.origemEspaco ? "/espaco-de-trabalho?resultado=eventoExcluido" : "/events?mensagem=Evento excluído.") : "/events?erro=evento"
  );
}


// @ts-nocheck
import { audioCatalogoLocal } from "../models/audioCatalogoLocal.js";
import { conexaoInternaCypher } from "../models/bancoDados.js";
import { podePublicar } from "../models/permissoes.js";

import type { Request, Response } from "express";
import { CypherModel, type DadosBeatCypher } from "../models/modeloCypher.js";
import type { UsuarioDaSessao } from "../models/bancoDados.js";
import { imagemPublicacaoDemo } from "../models/catalogoDemonstrativo.js";
import {
  lerFiltrosBeats, filtrarCatalogoBeats, modalidadesCatalogoBeat,
  disponibilidadesCatalogoBeat, formatosCatalogoBeat,
} from "../models/filtrosBancoBeats.js";
import {
  licencasBeat,
  validarBpm,
  validarDuracaoBeat,
  validarLicencaBeat,
  validarTextoLimitado,
} from "../validators/validarObra.js";

const valoresVazios: DadosBeatCypher = {
  title: "",
  bpm: "",
  key: "",
  genre: "",
  license: licencasBeat[0],
  duration: "",
  description: "",
  usage: "",
  vendaExclusiva: false,
  ofertas: [{ tipo: "Não informado", preco: "", descricao: "" }],
};

const tiposOfertaPermitidos = new Set([
  "Não informado",
  "Licença básica",
  "Licença premium",
  "Exclusiva",
]);

function usuarioAtual(res: Response): UsuarioDaSessao | undefined {
  return res.locals.usuario as UsuarioDaSessao | undefined;
}

function exigirCapacidadeBeat(
  res: Response,
  usuario: UsuarioDaSessao | undefined
): usuario is UsuarioDaSessao {
  if (!usuario || usuario.demonstracao || !podePublicar(usuario,"beat")) {
    res.redirect("/beats?erro=permissao");
    return false;
  }
  return true;
}

function dadosBeat(body: Request["body"]): DadosBeatCypher {
  const tipos = Array.isArray(body.ofertaTipo)
    ? body.ofertaTipo
    : body.ofertaTipo !== undefined
      ? [body.ofertaTipo]
      : [];
  const precos = Array.isArray(body.ofertaPreco)
    ? body.ofertaPreco
    : body.ofertaPreco !== undefined
      ? [body.ofertaPreco]
      : [];
  const descricoes = Array.isArray(body.ofertaDescricao)
    ? body.ofertaDescricao
    : body.ofertaDescricao !== undefined
      ? [body.ofertaDescricao]
      : [];

  return {
    title: String(body.title ?? "").trim(),
    bpm: String(body.bpm ?? "").trim(),
    key: String(body.key ?? "").trim(),
    genre: String(body.genre ?? "").trim(),
    license: String(body.license ?? "").trim(),
    duration: String(body.duration ?? "").trim(),
    description: String(body.description ?? "").trim(),
    usage: String(body.usage ?? "").trim(),
    vendaExclusiva:
      body.vendaExclusiva === "on" ||
      body.vendaExclusiva === "true" ||
      body.vendaExclusiva === true,
    ofertas: tipos
      .map((tipo: unknown, indice: number) => ({
        tipo: String(tipo ?? "Não informado").trim(),
        preco: String(precos[indice] ?? "").trim(),
        descricao: String(descricoes[indice] ?? "").trim(),
      }))
      .filter(
        (oferta: DadosBeatCypher["ofertas"][number]) =>
          oferta.tipo || oferta.preco || oferta.descricao
      ),
  };
}

function validarBeat(dados: DadosBeatCypher): string | null {
  if (dados.title.length < 2 || dados.title.length > 120)
    return "O título do beat deve ter entre 2 e 120 caracteres.";
  return (
    validarBpm(dados.bpm) ??
    validarLicencaBeat(dados.license) ??
    validarDuracaoBeat(dados.duration) ??
    validarTextoLimitado(
      dados.key,
      30,
      "A tonalidade deve ter no máximo 30 caracteres."
    ) ??
    validarTextoLimitado(
      dados.genre,
      60,
      "O gênero deve ter no máximo 60 caracteres."
    ) ??
    validarTextoLimitado(
      dados.description,
      500,
      "A descrição deve ter no máximo 500 caracteres."
    ) ??
    validarTextoLimitado(
      dados.usage,
      500,
      "As condições de uso devem ter no máximo 500 caracteres."
    ) ??
    validarOfertas(dados)
  );
}

function validarOfertas(dados: DadosBeatCypher): string | null {
  if (dados.vendaExclusiva) {
    if (dados.ofertas.length !== 1 || dados.ofertas[0]?.tipo !== "Exclusiva") {
      return "Um beat exclusivo deve ter somente uma oferta do tipo Exclusiva.";
    }
  }
  for (const oferta of dados.ofertas) {
    if (!tiposOfertaPermitidos.has(oferta.tipo)) {
      return "Selecione um tipo de licença válido para cada oferta.";
    }
    if (oferta.preco && !/^\d+(?:[,.]\d{1,2})?$/.test(oferta.preco)) {
      return "Informe preços válidos para as ofertas de licença.";
    }
    if (oferta.tipo.length > 60 || oferta.descricao.length > 300) {
      return "Os dados da oferta de licença excedem o limite permitido.";
    }
  }
  return null;
}

function renderizarFormularioBeat(
  res: Response,
  dados: DadosBeatCypher,
  opcoes: { erro?: string; editando?: boolean; beatId?: string } = {}
) {
  return res.status(opcoes.erro ? 422 : 200).render("pages/cadastro-beat", {
    title: opcoes.editando ? "Editar beat" : "Cadastrar beat",
    path: res.locals.origemEspaco ? "/espaco-de-trabalho" : "/beats",
    stylesheet: "beats-licencas",
    authenticated: true,
    valores: dados,
    erro: opcoes.erro ?? "",
    editando: Boolean(opcoes.editando),
    beatId: opcoes.beatId ?? "",
    licencasBeat,
  });
}

export function bancoBeats(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  const db = conexaoInternaCypher();
  const dadosCena = db.prepare("SELECT dados_json FROM catalogo_cena WHERE tipo='beat' AND id=?");
  const catalogo = db.transaction(() => CypherModel.beats(usuario?.id).map(beat => {
    const r=dadosCena.get(beat.id);
    const cena=r?JSON.parse(r.dados_json):null;
    return {
    ...beat,
    vendido: Boolean(cena?.vendidoPara),
    compradorExclusivo: cena?.comprador||'',
    valorExclusivo: cena?.preco||null,
    disponibilidade: cena?.vendidoPara ? "vendido" : !beat.disponivel ? "pausado" : beat.ofertas.some(o => o.modalidade === "free" || o.modalidade === "premium") ? "disponivel" : "sem_oferta",
    previewUrl: beat.demonstracao ? audioCatalogoLocal[beat.id] || "" : beat.previaId ? `/beats/${beat.id}/preview` : "",
  };}))();
  const opcoes = (campo: "genre" | "license" | "key") =>
    [...new Set(catalogo.map(beat => beat[campo]).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  const filtros = lerFiltrosBeats(req.query);
  const filtrado = Object.values(filtros).some(Boolean);
  const selecionados = filtrarCatalogoBeats(catalogo, filtros);
  const ordem = ["price", "bpm", "title"].includes(req.query.ordem) ? req.query.ordem : "original";
  const precoMinimo = beat => Math.min(...beat.ofertas.filter(o => o.ativa !== false && Number.isFinite(o.precoCentavos) && o.precoCentavos >= 0).map(o => o.precoCentavos));
  if (ordem === "title") selecionados.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  if (ordem === "price") selecionados.sort((a, b) => precoMinimo(a) - precoMinimo(b));
  if (ordem === "bpm") selecionados.sort((a, b) => (Number(a.bpm) || Infinity) - (Number(b.bpm) || Infinity));
  const porPagina = 24;
  const paginas = Math.max(1, Math.ceil(selecionados.length / porPagina));
  const indiceBeat = selecionados.findIndex(beat => beat.id === req.query.beat);
  const pedida = typeof req.query.pagina === "string" ? Number.parseInt(req.query.pagina, 10) || 1 : 1;
  const pagina = indiceBeat >= 0 ? Math.floor(indiceBeat / porPagina) + 1 : Math.min(paginas, Math.max(1, pedida));
  const inicioPagina = (pagina - 1) * porPagina;
  const destaque = filtrado
    ? undefined
    : catalogo.find(beat => beat.id === "demo-beat-visao-de-rua") ??
      catalogo.find(beat => imagemPublicacaoDemo(beat.id));

  return res.render("pages/banco-beats", {
    title: "Banco de Beats",
    path: "/beats",
    stylesheet: "banco-beats",
    authenticated: Boolean(usuario),
    beats: selecionados.slice(inicioPagina, inicioPagina + porPagina),
    total: selecionados.length,
    pagina,
    paginas,
    inicioPagina,
    ordem,
    destaque,
    filtrado,
    q: filtros.q,
    genero: filtros.genero,
    filtros,
    disponibilidades: disponibilidadesCatalogoBeat,
    camposSelecao: [
      ["licenca", "Tipo de licença", opcoes("license").map(v => [v, v])],
      ["tonalidade", "Tonalidade", opcoes("key").map(v => [v.trim(), v.trim()])],
      ["modalidade", "Modalidade da oferta", Object.entries(modalidadesCatalogoBeat)],
      ["disponibilidade", "Disponibilidade", Object.entries(disponibilidadesCatalogoBeat)],
      ["arquivo", "Formato de entrega", Object.entries(formatosCatalogoBeat)],
    ],
    generos: opcoes("genre"),
    podeCadastrarBeat: Boolean(
      usuario && !usuario.demonstracao && podePublicar(usuario,"beat")
    ),
    resultado:
      typeof req.query.resultado === "string"
        ? req.query.resultado
        : typeof req.query.erro === "string"
          ? req.query.erro
          : "",
  });
}

export function novoBeat(_req: Request, res: Response) {
  if (!exigirCapacidadeBeat(res, usuarioAtual(res))) return;
  return renderizarFormularioBeat(res, valoresVazios);
}

export function criarBeat(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  if (!exigirCapacidadeBeat(res, usuario)) return;
  const dados = dadosBeat(req.body);
  const erro = validarBeat(dados);
  if (erro) return renderizarFormularioBeat(res, dados, { erro });
  const beatId = CypherModel.criarBeat(usuario.id, dados);
  CypherModel.criarNotificacao({
    usuarioDestinoId: usuario.id,
    tipo: "beat_criado",
    titulo: "Novo Beat cadastrado",
    mensagem: `“${dados.title}” foi adicionado ao Banco de Beats.`,
    url: "/beats",
    entidadeTipo: "beat",
    entidadeId: beatId,
    chaveOrigem: `beat-criado:${beatId}`,
  });
  return res.redirect(303, `/beats/${beatId}/manage`);
}

export function editarBeat(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  if (!usuario || usuario.demonstracao || usuario.tipoConta !== "profissional") return res.sendStatus(403);
  const beat = CypherModel.obterBeat(req.params.id ?? "", usuario.id);
  if (!beat) return res.sendStatus(404);
  return renderizarFormularioBeat(
    res,
    {
      title: beat.title,
      bpm: beat.bpm,
      key: beat.key,
      genre: beat.genre,
      license: beat.license,
      duration: beat.duration,
      description: beat.description,
      usage: beat.usage,
      vendaExclusiva: beat.vendaExclusiva,
      ofertas: beat.ofertas.map(oferta => ({
        tipo: oferta.tipo,
        preco:
          oferta.precoCentavos === null
            ? ""
            : (oferta.precoCentavos / 100).toFixed(2),
        descricao: oferta.descricao,
      })),
    },
    { editando: true, beatId: beat.id }
  );
}

export function atualizarBeat(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  if (!usuario || usuario.demonstracao || usuario.tipoConta !== "profissional") return res.sendStatus(403);
  if (!CypherModel.obterBeat(req.params.id ?? "", usuario.id)) return res.sendStatus(404);
  const dados = dadosBeat(req.body);
  const erro = validarBeat(dados);
  if (erro)
    return renderizarFormularioBeat(res, dados, {
      erro,
      editando: true,
      beatId: req.params.id,
    });
  const atualizado = CypherModel.atualizarBeat(
    req.params.id ?? "",
    usuario.id,
    dados
  );
  if (!atualizado) return res.sendStatus(404);
  CypherModel.criarNotificacao({
    usuarioDestinoId: usuario.id,
    tipo: "beat_atualizado",
    titulo: "Beat atualizado",
    mensagem: `As informações de “${dados.title}” foram salvas.`,
    url: "/beats",
    entidadeTipo: "beat",
    entidadeId: req.params.id ?? "",
    chaveOrigem: `beat-atualizado:${req.params.id}:${dados.title}:${dados.license}`,
  });
  return res.redirect(303, res.locals.origemEspaco ? "/espaco-de-trabalho?resultado=beatAtualizado" : "/beats?resultado=atualizado");
}

export function excluirBeat(req: Request, res: Response) {
  const usuario = usuarioAtual(res);
  if (!usuario || usuario.demonstracao || usuario.tipoConta !== "profissional") return res.sendStatus(403);
  const excluido = CypherModel.excluirBeat(req.params.id ?? "", usuario.id);
  if (!excluido) return res.sendStatus(404);
  return res.redirect(303, res.locals.origemEspaco ? "/espaco-de-trabalho?resultado=beatExcluido" : "/beats?resultado=excluido");
}

export { licencasBeat };



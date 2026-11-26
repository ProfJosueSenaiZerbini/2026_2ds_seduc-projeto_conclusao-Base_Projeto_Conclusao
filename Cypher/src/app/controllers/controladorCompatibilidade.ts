// @ts-nocheck
import { conexaoInternaCypher } from "../models/bancoDados.js";
import { montarApresentacao, type NavegacaoPerfil } from "../models/apresentacaoPerfil.js";
import { coresSelo, formasSelo, seloPerfil } from "../models/seloPerfil.js";
import { situacaoContaModeracao, objetoDisponivel } from "../models/politicasModeracao.js";
import { rotuloProfissional } from "../models/tratamentoProfissional.js";
import { resolverPerfilPublico, obterPreferenciasUsuario } from "../models/identidadeUsuario.js";
import { normalizarIdentificador, validarIdentificador } from "../validators/validarIdentidade.js";
import { listaTextual } from "../validators/validarAtuacao.js";
import { atuacoesDaObra, salvarVertentesProfissionaisUsuarioCypher } from "../models/bancoDados.js";
import { vertentesProfissionais } from "../models/modeloProfissionalPersistido.js";
import { podeAdministrar, podePublicar, tiposObraPermitidos } from "../models/permissoes.js";

import type { NextFunction, Request, Response } from "express";
import {
  CypherModel,
  generosObra,
  papeisObra,
  statusObra,
  tiposObra,
  type CreditoObraEntrada,
  type DadosObraCypher,
} from "../models/modeloCypher.js";
import {
  autenticarUsuario,
  encerrarSessao,
  iniciarSessao,
  usuarioDaSessao,
  duracaoSessaoMs,
} from "../models/autenticacaoCypher.js";
import {
  atualizarPerfilCypher,
  atualizarApresentacaoCypher,
  atualizarContatoProfissionalCypher,
  atualizarPrivacidadeCypher,
  estadoAlteracaoCategoriasCypher,
  listarCategoriasProfissionaisCypher,
  solicitarCategoriaProfissionalCypher,
  listarPropostasCategoriasPendentesCypher,
  listarPropostasGenerosPendentesCypher,
  listarPerfisParaExcecaoCategoriaCypher,
  contarPerfisParaExcecaoCategoriaCypher,
  obterEstadoSolicitacaoExcecaoCategoriaCypher,
  listarSolicitacoesExcecaoCategoriaPendentesCypher,
  listarSolicitacoesExcecaoCategoriaDecididasCypher,
  solicitarExcecaoCategoriaCypher,
  revisarSolicitacaoExcecaoCategoriaCypher,
  solicitarInformacaoSolicitacaoCategoriaCypher,
  responderSolicitacaoCategoriaCypher,
  concederExcecaoCategoriaCypher,
  revisarPropostaCategoriaCypher,
  revisarPropostaGeneroCypher,
  excluirContaCypher,
  listarAtuacoesUsuarioCypher,
  listarProfissoesUsuarioCypher,
  listarVertentesProfissionaisUsuarioCypher,
  buscarCredenciaisCypher,
  buscarEmailPorIdentificadorCypher,
  obterPerfilPublicoCypher,
  type AtuacaoProfissionalPersistida,
  type RespostasAtuacao,
  type VisibilidadesAtuacao,
  type UsuarioDaSessao,
} from "../models/bancoDados.js";
import {
  listarGruposProfissionais,
  listarProfissoesCatalogo,
  podeCriarBeat,
  podeCriarObra,
  rotuloStatusProfissional,
  opcoesDisponibilidadeProfissional,
  profissoesComEstilosMusicais,
} from "../models/modeloPerfil.js";
import {
  catalogoPerguntasPorCategoria,
  formatarRespostaAtuacao,
  validarRespostasAtuacao,
} from "../models/questionarioAtuacao.js";
import { mensagemErroCredito } from "../validators/validarCredito.js";
import {
  validarConfirmacaoExclusao,
  validarSenhaExclusao,
} from "../validators/validarConta.js";
import { validarBpm, validarLinkEscuta } from "../validators/validarObra.js";
import { ErroAcervo, impedirExclusaoVinculada, opcoesAcervo, tipoAcervo, valoresAcervo } from "../models/acervoMusical.js";
import { listaDeLinhas, validarApresentacaoPerfil, validarPerfil } from "../validators/validarPerfil.js";

const nomeCookieSessao = "cypher_session";
const caminhosProtegidos = new Set([
  "/",
  "/dashboard",
  "/espaco-de-trabalho",
  "/search",
  "/search/suggestions",
  "/events",
  "/events/new",
  "/works",
  "/works/new",
  "/beats",
  "/beats/new",
  "/central",
  "/profile",
  "/profile/categorias/sugerir",
  "/profile/categorias/solicitar-excecao",
  "/settings",
  "/settings/privacy",
  "/settings/delete-account",
  "/notificacoes",
  "/notificacoes/marcar-todas-lidas",
  "/admin/revisao",
  "/admin/revisao/excecoes",
  "/admin/revisao/excecoes/busca",
]);

function caminhoProtegido(caminho: string): boolean {
  caminho = caminho.toLowerCase().replace(/\/+$/, "") || "/";
  return (
    /^\/(interacoes|colecoes|publicacoes|publication-media|representacoes|creditos|selos)(\/|$)/.test(caminho) ||
    /^\/(opportunities|my-opportunities|my-applications|service-requests|service-mediation|messages|work-projects|work-media|portfolio|colaboracoes|reputacao|central|suporte|p|beats|purchases|events)(\/|$)/.test(caminho) ||
    caminhosProtegidos.has(caminho) || caminho.startsWith("/espaco-de-trabalho/") || caminho.startsWith("/profile/") || caminho.startsWith("/settings/") || caminho.startsWith("/admin/") || caminho === "/admin" ||
    /^\/(?:works|events|beats)\/[^/]+\/(?:edit|delete)$/.test(caminho) ||
    /^\/events\/[^/]+\/(?:interest|interest\/cancel|interests\/[^/]+\/status)$/.test(
      caminho
    ) ||
    /^\/works\/[^/]+\/(?:like|evidencia)$/.test(caminho) ||
    caminho.startsWith("/notificacoes/") ||
    /^\/admin\/revisao\/(?:generos|categorias-profissionais|excecoes-categorias|solicitacoes-excecao)\/[^/]+$/.test(
      caminho
    )
  );
}

function tokenDaRequisicao(req: Request): string | undefined {
  const nomeCookie = req.path.toLowerCase().startsWith("/admin") ? "cypher_admin_session" : nomeCookieSessao;
  const cookie = req.headers.cookie
    ?.split(";")
    .map(valor => valor.trim())
    .find(valor => valor.startsWith(`${nomeCookie}=`));
  return cookie?.slice(nomeCookie.length + 1);
}

function usuarioDaRequisicao(req: Request): UsuarioDaSessao | undefined {
  const token = tokenDaRequisicao(req);
  return token ? usuarioDaSessao(token) : undefined;
}

function exigeAcesso(req: Request, res: Response): UsuarioDaSessao | undefined {
  const usuario =
    (res.locals.usuario as UsuarioDaSessao | undefined) ??
    usuarioDaRequisicao(req);
  if (caminhoProtegido(req.path) && !usuario) {
    res.redirect("/login");
    return undefined;
  }
  return usuario;
}

function ehAdministrador(usuario: UsuarioDaSessao): boolean {
  return usuario.tipoConta === "administrativo" && Boolean(usuario.papelAdministrativo);
}

function usuarioParaView(usuario: UsuarioDaSessao) {
  return {
    ...usuario,
    ehAdministrador: ehAdministrador(usuario),
    role: usuario.tipoConta === "consumidor" ? "Público" : usuario.categories.map(categoria=>rotuloProfissional(categoria,usuario.tratamento)).join(" · ") || usuario.role,
    availabilityLabel: rotuloStatusProfissional(usuario.availability),
  };
}

function chaveCatalogo(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function valorCatalogo(opcoes: readonly string[], recebido: string): string {
  return opcoes.find(opcao => chaveCatalogo(opcao) === recebido) ?? "";
}

export function middlewareAutorizacao(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const caminho = req.path.toLowerCase().replace(/\/+$/, "") || "/";
  if (caminho === "/admin/login") return next();
  if (!caminhoProtegido(caminho)) return next();
  const interno = caminho === "/admin" || caminho.startsWith("/admin/");
  const usuario = usuarioDaRequisicao(req);
  if (!usuario) {
    if (interno && req.headers.cookie?.split(";").some(item => item.trim().startsWith("cypher_session="))) return res.sendStatus(403);
    return res.redirect(interno ? "/admin/login" : "/login");
  }
  if (!interno && usuario.tipoConta!=='administrativo' && situacaoContaModeracao(conexaoInternaCypher(),usuario.id).restrita && !/^\/suporte(?:\/|$)/.test(caminho) && caminho!=='/logout' && caminho!=='/settings/encerramento' && caminho!=='/settings/delete-account') {
    if(req.method==='GET'||req.method==='HEAD')return res.redirect(303,'/suporte?restricao=1');
    return res.status(403).send('Sua conta está restrita. Acesse o suporte para consultar a decisão e recorrer.');
  }
  if (interno && !ehAdministrador(usuario)) return res.sendStatus(403);
  if (!interno && usuario.tipoConta === "administrativo") return res.sendStatus(403);
  if (interno && caminho.startsWith("/admin/revisao")) {
    const acao = caminho.includes("excecoes") || caminho.includes("solicitacoes-excecao") ? "excecoes" : "taxonomia";
    if (!podeAdministrar(usuario,acao)) return res.sendStatus(403);
  }
  const alvo=/^\/(works|beats|events)\/([^/]+)\/(edit|delete|like|interest|interests)/.exec(caminho);
  if(alvo && alvo[2]!=='new' && !objetoDisponivel(conexaoInternaCypher(),({works:'obra',beats:'beat',events:'evento'})[alvo[1]],alvo[2],usuario.id))return res.sendStatus(404);
  res.locals.origemEspaco = req.query.origem === "espaco" || req.body?.origem === "espaco";
  res.locals.usuario = usuarioParaView(usuario);
  res.locals.temaPreferido = interno ? "light" : obterPreferenciasUsuario(usuario.id).tema;
  res.locals.notificacoesRecentes = interno ? [] : CypherModel.notificacoes(usuario.id, 5);
  res.locals.quantidadeNaoLidas = interno ? 0 : CypherModel.notificacoesNaoLidas(usuario.id);
  return next();
}

function definirCookieSessao(req: Request, res: Response, token: string): void {
  const seguro = req.secure;
  res.cookie(nomeCookieSessao, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: seguro,
    path: "/",
    maxAge: duracaoSessaoMs,
  });
}

function substituirSessao(
  req: Request,
  res: Response,
  usuarioId: string
): void {
  const tokenAnterior = tokenDaRequisicao(req);
  if (tokenAnterior) encerrarSessao(tokenAnterior);
  definirCookieSessao(req, res, iniciarSessao(usuarioId));
}

function categoriasRecebidas(valor: unknown): string[] {
  const valores = Array.isArray(valor) ? valor : [valor];
  return [
    ...new Set(
      valores
        .filter((item): item is string => typeof item === "string")
        .map(item => item.trim())
        .filter(Boolean)
    ),
  ];
}

function objetoJsonRecebido(valor: unknown): Record<string, unknown> | null {
  if (typeof valor !== "string" || valor.length > 100_000) return null;
  try {
    const parsed: unknown = JSON.parse(valor || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function atuacoesRecebidas(
  categorias: readonly string[],
  respostasJson: unknown,
  visibilidadesJson: unknown,
  categoriasObrigatorias: readonly string[]
): AtuacaoProfissionalPersistida[] | null {
  const respostasPorCategoria = objetoJsonRecebido(respostasJson);
  const visibilidadesPorCategoria = objetoJsonRecebido(visibilidadesJson);
  if (!respostasPorCategoria || !visibilidadesPorCategoria) return null;
  const visibilidadesAceitas = new Set(["publico", "colaboradores", "privado"]);
  const resultado: AtuacaoProfissionalPersistida[] = [];
  const categoriasPermitidas = new Set(categorias);
  if (
    Object.keys(respostasPorCategoria).some(
      categoria => !categoriasPermitidas.has(categoria)
    ) ||
    Object.keys(visibilidadesPorCategoria).some(
      categoria => !categoriasPermitidas.has(categoria)
    )
  ) {
    return null;
  }

  for (const categoria of categorias) {
    const bruto = respostasPorCategoria[categoria];
    const resposta =
      bruto && typeof bruto === "object" && !Array.isArray(bruto)
        ? (bruto as Record<string, unknown>)
        : {};
    const obrigatoria = categoriasObrigatorias.includes(categoria);
    const foiEnviada = Object.prototype.hasOwnProperty.call(
      respostasPorCategoria,
      categoria
    );
    if (!obrigatoria && !foiEnviada) continue;
    const validacao = validarRespostasAtuacao(categoria, resposta, obrigatoria);
    if (!validacao.valido) return null;

    const visibilidadeBruta = visibilidadesPorCategoria[categoria];
    const visibilidade =
      visibilidadeBruta &&
      typeof visibilidadeBruta === "object" &&
      !Array.isArray(visibilidadeBruta)
        ? (visibilidadeBruta as Record<string, unknown>)
        : {};
    const camposPermitidos = new Set([
      "__categoria__",
      ...catalogoPerguntasPorCategoria(categoria).map(
        pergunta => pergunta.campo
      ),
    ]);
    if (
      Object.entries(visibilidade).some(
        ([campo, valor]) =>
          !camposPermitidos.has(campo) ||
          typeof valor !== "string" ||
          !visibilidadesAceitas.has(valor)
      )
    ) {
      return null;
    }
    const visibilidades: VisibilidadesAtuacao = {
      __categoria__:
        (visibilidade.__categoria__ as VisibilidadesAtuacao[string]) ??
        "publico",
    };
    for (const campo of Object.keys(resposta)) {
      const valor = visibilidade[campo];
      visibilidades[campo] =
        typeof valor === "string" && visibilidadesAceitas.has(valor)
          ? (valor as VisibilidadesAtuacao[string])
          : "privado";
    }
    resultado.push({
      categoria,
      respostas: resposta as RespostasAtuacao,
      visibilidades,
    });
  }

  return resultado;
}

function atuacoesParaRenderizar(
  categorias: readonly string[],
  respostasJson: unknown,
  visibilidadesJson: unknown
): AtuacaoProfissionalPersistida[] {
  const respostas = objetoJsonRecebido(respostasJson) ?? {};
  const visibilidades = objetoJsonRecebido(visibilidadesJson) ?? {};
  return categorias.map(categoria => {
    const resposta = respostas[categoria];
    const visibilidade = visibilidades[categoria];
    return {
      categoria,
      respostas:
        resposta && typeof resposta === "object" && !Array.isArray(resposta)
          ? (resposta as RespostasAtuacao)
          : {},
      visibilidades:
        visibilidade &&
        typeof visibilidade === "object" &&
        !Array.isArray(visibilidade)
          ? (visibilidade as VisibilidadesAtuacao)
          : {},
    };
  });
}

function normalizarCategoriaFormulario(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function paginaAutenticacao(req: Request, res: Response) {
  return res.render("pages/entrar", {
    title: "Entrar",
    path: req.path,
    stylesheet: "autenticacao",
    authenticated: false,
    erro: null,
    mensagem: req.query.conta === "excluida" ? "A conta e o perfil foram excluídos." : null,
    email: "",
  });
}

export function renderizarPagina(
  view: string,
  title: string,
  data: Record<string, unknown> | (() => Record<string, unknown>) = {}
) {
  return (req: Request, res: Response) => {
    const usuarioSessao = exigeAcesso(req, res);
    if (caminhosProtegidos.has(req.path) && !usuarioSessao) return;

    const stylesheet = view.split("/").pop();
    const dadosDaPagina = typeof data === "function" ? data() : data;
    return res.render(view, {
      title,
      path: req.path,
      stylesheet,
      authenticated: Boolean(usuarioSessao),
      usuario: usuarioSessao
        ? usuarioParaView(usuarioSessao)
        : CypherModel.usuario(),
      ...dadosDaPagina,
    });
  };
}

function parametroTexto(req: Request, chave: string): string {
  const valor = req.query[chave];
  return typeof valor === "string" ? valor : "";
}

function classeStatusBusca(status: string): string {
  if (status === "indisponivel") return "unavailable";
  if (status.startsWith("disponivel") || status === "recebendo-inscricoes")
    return "available";
  if (status.startsWith("buscando")) return "searching";
  return "unknown";
}

export async function login(req: Request, res: Response) {
  const identificador = String(req.body.identificador ?? req.body.email ?? "")
    .trim()
    .toLowerCase();
  const senha = String(req.body.password ?? "");
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identificador);
  const acessoInvalido = () => res.status(401).render("pages/entrar", {
    title: "Entrar",
    path: "/login",
    stylesheet: "autenticacao",
    authenticated: false,
    erro: "E-mail, usuário ou senha inválidos. Confira os dados e tente novamente.",
    mensagem: null,
    email: identificador,
  });
  if (
    !senha || senha.length > 128 || identificador.length > 254 ||
    (!emailValido && validarIdentificador(identificador))
  ) return acessoInvalido();

  try {
    const email = emailValido ? identificador : buscarEmailPorIdentificadorCypher(identificador);
    if (!email) return acessoInvalido();
    const usuarioId = await autenticarUsuario(email, senha);
    if (!usuarioId) return acessoInvalido();

    const tokenVerificacao = iniciarSessao(usuarioId);
    const contaVerificacao = usuarioDaSessao(tokenVerificacao);
    encerrarSessao(tokenVerificacao);
    if (contaVerificacao?.tipoConta === "administrativo") return acessoInvalido();
    substituirSessao(req, res, usuarioId);
    return res.redirect("/dashboard");
  } catch (erro) {
    console.error("Falha ao autenticar usuário Cypher:", erro);
    return res.status(500).render("pages/entrar", {
      title: "Entrar",
      path: "/login",
      stylesheet: "autenticacao",
      authenticated: false,
      erro: "Não foi possível concluir o acesso agora. Tente novamente.",
      mensagem: null,
      email: identificador,
    });
  }
}

export function logout(req: Request, res: Response) {
  const token = tokenDaRequisicao(req);
  if (token) encerrarSessao(token);
  res.clearCookie(nomeCookieSessao, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
  });
  return res.redirect("/login");
}

export const analisarCategoria = (req: Request, res: Response) => {
  const usuario = exigeAcesso(req, res);
  if (!usuario) {
    return res.status(401).json({
      status: "nao_autenticada",
      mensagem: "Entre na sua conta para enviar uma sugestão de categoria.",
    });
  }
  if (usuario.demonstracao) return res.sendStatus(403);
  const categoria = String(req.body.categoria ?? "").trim();
  if (categoria.length < 2 || categoria.length > 60) {
    return res.status(400).json({
      status: "invalida",
      mensagem: "Informe uma categoria entre 2 e 60 caracteres.",
    });
  }
  const status = solicitarCategoriaProfissionalCypher(usuario.id, categoria);
  const mensagens: Record<typeof status, string> = {
    criada: "Sugestão enviada à equipe; só ficará disponível após aprovação.",
    ja_pendente: "Essa categoria já está aguardando análise.",
    ja_aprovada:
      "Essa categoria já foi aprovada e está disponível para seleção.",
    categoria_base: "Essa categoria já está disponível no Cypher.",
    invalida: "Informe uma categoria entre 2 e 60 caracteres.",
    nao_encontrada: "Não foi possível localizar sua conta.",
  };
  return res.status(status === "nao_encontrada" ? 404 : 200).json({
    status,
    mensagem: mensagens[status],
  });
};

export { buscaGlobal as buscarPessoas } from "./controladorBusca.js";
export const oportunidades = renderizarPagina(
  "pages/oportunidades",
  "Oportunidades",
  () => ({ eventos: CypherModel.eventos() })
);
type ValoresFormularioObra = {
  composicoes?: string[];
  faixas?: string[];
  visibilidade?: string;
  atuacoes?: string[];
  titulo: string;
  tipo: string;
  tipoOutro: string;
  genero: string;
  generoOutro: string;
  status: string;
  descricao: string;
  letra: string;
  bpm: string;
  papel: string;
  papelOutro: string;
  isrc: string;
  iswc: string;
  dataLancamento: string;
  link: string;
};

type LinhaCreditoPerfilFormulario = {
  handle: string;
  papel: string;
  participacao: string;
};

type LinhaMencaoFormulario = {
  nome: string;
  papel: string;
  participacao: string;
};

const formularioObraVazio: ValoresFormularioObra = {
  titulo: "",
  tipo: "",
  tipoOutro: "",
  genero: "",
  generoOutro: "",
  status: "",
  visibilidade: "privada",
  descricao: "",
  letra: "",
  bpm: "",
  papel: "Artista principal",
  papelOutro: "",
  isrc: "",
  iswc: "",
  dataLancamento: "",
  link: "",
};

function formularioObraRecebido(req: Request): ValoresFormularioObra {
  return {
    composicoes: camposRepetidos(req, "composicaoId").filter(Boolean),
    faixas: camposRepetidos(req, "fonogramaId").filter(Boolean),
    atuacoes: req.body.selecionarAtuacoes === "1" || req.body.atuacao !== undefined ? camposRepetidos(req, "atuacao").filter(Boolean) : undefined,
    titulo: String(req.body.titulo ?? "").trim(),
    tipo: String(req.body.tipo ?? "").trim(),
    tipoOutro: String(req.body.tipoOutro ?? "").trim(),
    genero: String(req.body.genero ?? "").trim(),
    generoOutro: String(req.body.generoOutro ?? "").trim(),
    status: String(req.body.status ?? "").trim(),
    visibilidade: req.body.visibilidade === undefined ? undefined : String(req.body.visibilidade),
    descricao: String(req.body.descricao ?? "").trim(),
    letra: String(req.body.letra ?? "").trim(),
    bpm: String(req.body.bpm ?? "").trim(),
    papel: String(req.body.papel ?? "").trim(),
    papelOutro: String(req.body.papelOutro ?? "").trim(),
    isrc: String(req.body.isrc ?? "").trim(),
    iswc: String(req.body.iswc ?? "").trim(),
    dataLancamento: String(req.body.dataLancamento ?? "").trim(),
    link: String(req.body.link ?? "").trim(),
  };
}

function camposRepetidos(req: Request, nome: string): string[] {
  const valor = (req.body as Record<string, unknown>)[nome];
  const valores = Array.isArray(valor)
    ? valor
    : valor === undefined
      ? []
      : [valor];
  return valores.map(item => (typeof item === "string" ? item.trim() : ""));
}

function linhasRepetidas<T extends Record<string, string>>(
  req: Request,
  campos: Record<keyof T, string>
): { linhas: T[]; alinhadas: boolean } {
  const valores = Object.fromEntries(
    Object.entries(campos).map(([chave, nome]) => [
      chave,
      camposRepetidos(req, nome),
    ])
  ) as Record<keyof T, string[]>;
  const comprimentos = Object.values(valores).map(lista => lista.length);
  const tamanho = Math.max(0, ...comprimentos);
  const alinhadas = comprimentos.every(comprimento => comprimento === tamanho);
  const linhas = Array.from({ length: tamanho }, (_, indice) =>
    Object.fromEntries(
      Object.entries(valores).map(([chave, lista]) => [
        chave,
        lista[indice] ?? "",
      ])
    )
  ) as T[];
  return { linhas, alinhadas };
}

function preencherFormularioObra(
  obra: NonNullable<ReturnType<typeof CypherModel.obraDoUsuario>>
): ValoresFormularioObra {
  const generoConhecido = generosObra.includes(obra.genre);
  return {
    titulo: obra.title,
    tipo: obra.type,
    tipoOutro: obra.typeDetail,
    genero: generoConhecido ? obra.genre : "Outro",
    generoOutro: generoConhecido
      ? obra.genreDetail
      : obra.genreDetail || obra.genre,
    status: obra.status,
    visibilidade: obra.published && ["", "Lançado"].includes(obra.status) ? "publica" : "privada",
    descricao: obra.description,
    letra: obra.lyrics,
    bpm: obra.bpm,
    papel: obra.role,
    papelOutro: obra.roleDetail ?? "",
    isrc: obra.isrc,
    iswc: obra.iswc,
    dataLancamento: obra.releaseDate,
    link: obra.listenLink,
  };
}

function creditosDoFormulario(
  obra?: NonNullable<ReturnType<typeof CypherModel.obraDoUsuario>> | undefined
) {
  if (!obra) return { perfis: [], mencoes: [] };
  return {
    perfis: obra.creditDetails
      .filter(credito => credito.handle)
      .map(credito => ({
        handle: credito.handle ?? "",
        papel: credito.role,
        participacao: credito.participation,
      })),
    mencoes: obra.creditDetails
      .filter(credito => !credito.handle)
      .map(credito => ({
        nome: credito.name,
        papel: credito.role,
        participacao: credito.participation,
      })),
  };
}

function renderizarFormularioObra(
  res: Response,
  usuario: UsuarioDaSessao,
  opcoes: {
    status?: number;
    editando?: boolean;
    obraId?: string;
    erro?: string | null;
    valores?: ValoresFormularioObra;
    tipoOutroLegadoVazio?: boolean;
    generoOutroLegadoVazio?: boolean;
    papelOutroLegadoVazio?: boolean;
    creditosPerfil?: LinhaCreditoPerfilFormulario[];
    mencoesFantasma?: LinhaMencaoFormulario[];
  } = {}
) {
  const editando = opcoes.editando ?? false;
  const valores = opcoes.valores ?? formularioObraVazio;
  return res.status(opcoes.status ?? 200).render("pages/cadastro-obra", {
    title: editando ? "Editar obra" : "Cadastrar obra",
    path: "/espaco-de-trabalho",
    stylesheet: "cadastro-obra",
    authenticated: true,
    usuario: usuarioParaView(usuario),
    mensagem: null,
    erro: opcoes.erro ?? null,
    editando,
    obraId: opcoes.obraId ?? "",
    valores,
    classeAcervo: tipoAcervo(valores.tipo),
    opcoesMusicais: opcoesAcervo(conexaoInternaCypher(), usuario.id),
    tipoOutroLegadoVazio: opcoes.tipoOutroLegadoVazio ?? false,
    generoOutroLegadoVazio: opcoes.generoOutroLegadoVazio ?? false,
    papelOutroLegadoVazio: opcoes.papelOutroLegadoVazio ?? false,
    profissoes: listarProfissoesCatalogo().filter(p => usuario.categories.includes(p.rotulo)),
    atuacoes: opcoes.valores?.atuacoes ?? (opcoes.obraId ? atuacoesDaObra(opcoes.obraId) : []),
    tiposObra: editando ? [...new Set([...tiposObraPermitidos(usuario.categories), opcoes.valores?.tipo].filter(Boolean))] : tiposObraPermitidos(usuario.categories),
    generosObra,
    papeisObra,
    podeCadastrarBeat: podePublicar(usuario, "beat"),
    perfisParaCredito: CypherModel.perfisParaCredito(usuario.id),
    creditosPerfil: opcoes.creditosPerfil ?? [],
    mencoesFantasma: opcoes.mencoesFantasma ?? [],
  });
}

function validarFormularioObra(
  valores: ValoresFormularioObra,
  opcoes: {
    tipoOutroLegadoVazio?: boolean;
    generoOutroLegadoVazio?: boolean;
    papelOutroLegadoVazio?: boolean;
  } = {}
): string | null {
  if (valores.titulo.length < 2 || valores.titulo.length > 120)
    return "Informe um título entre 2 e 120 caracteres.";
  if (!tiposObra.includes(valores.tipo))
    return "Selecione um tipo de lançamento válido.";
  if (
    valores.tipo === "Outro" &&
    (valores.tipoOutro.length > 80 ||
      (valores.tipoOutro.length > 0 && valores.tipoOutro.length < 2) ||
      (!opcoes.tipoOutroLegadoVazio && valores.tipoOutro.length < 2))
  )
    return "Especifique o tipo de projeto em 2 a 80 caracteres.";
  if (valores.tipo !== "Outro" && !generosObra.includes(valores.genero))
    return "Selecione um gênero válido.";
  if (
    valores.tipo === "Outro" &&
    valores.genero &&
    !generosObra.includes(valores.genero)
  )
    return "Selecione uma categoria válida para o projeto.";
  if (
    valores.genero === "Outro" &&
    (valores.generoOutro.length > 40 ||
      (valores.generoOutro.length > 0 && valores.generoOutro.length < 2) ||
      (!opcoes.generoOutroLegadoVazio && valores.generoOutro.length < 2))
  )
    return "Especifique o gênero em 2 a 40 caracteres.";
  if (valores.visibilidade !== undefined ? !["privada", "publica"].includes(valores.visibilidade) : !statusObra.includes(valores.status))
    return "Selecione a visibilidade da obra.";
  if (!papeisObra.includes(valores.papel))
    return "Selecione seu papel principal na obra.";
  if (
    valores.papel === "Outro crédito" &&
    (valores.papelOutro.length > 80 ||
      (valores.papelOutro.length > 0 && valores.papelOutro.length < 2) ||
      (!opcoes.papelOutroLegadoVazio && valores.papelOutro.length < 2))
  )
    return "Especifique seu crédito em 2 a 80 caracteres.";
  if (valores.descricao.length > 500)
    return "A descrição deve ter até 500 caracteres.";
  if (valores.letra.length > 5000)
    return "As letras e observações devem ter até 5.000 caracteres.";
  const erroBpm = validarBpm(valores.bpm);
  if (erroBpm) return erroBpm;
  if (valores.isrc.length > 20 || valores.iswc.length > 20)
    return "ISRC e ISWC devem ter no máximo 20 caracteres cada.";
  if (
    valores.dataLancamento &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(valores.dataLancamento) ||
      Number.isNaN(Date.parse(`${valores.dataLancamento}T00:00:00Z`)) ||
      new Date(`${valores.dataLancamento}T00:00:00Z`)
        .toISOString()
        .slice(0, 10) !== valores.dataLancamento)
  ) {
    return "Informe uma data de lançamento válida.";
  }
  const erroLink = validarLinkEscuta(valores.link);
  if (erroLink) return erroLink;
  return null;
}

function validarCreditosObra(
  creditosPerfil: LinhaCreditoPerfilFormulario[],
  mencoesFantasma: LinhaMencaoFormulario[],
  perfisAlinhados: boolean,
  mencoesAlinhadas: boolean
): string | null {
  if (!perfisAlinhados || !mencoesAlinhadas)
    return "Revise os dados de cada crédito e tente novamente.";
  if (creditosPerfil.length + mencoesFantasma.length > 20)
    return "Cada obra pode ter até 20 créditos associados.";
  if (
    creditosPerfil.some(
      credito =>
        (!/^@[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(credito.handle) &&
          (!credito.handle.startsWith("@") || validarIdentificador(credito.handle))) ||
        credito.papel.length < 2 ||
        credito.papel.length > 80 ||
        credito.participacao.length > 30
    )
  ) {
    return "Informe para cada perfil Cypher um identificador, uma função e uma participação de até 30 caracteres.";
  }
  if (
    mencoesFantasma.some(
      credito =>
        credito.nome.length < 2 ||
        credito.nome.length > 100 ||
        credito.papel.length < 2 ||
        credito.papel.length > 80 ||
        credito.participacao.length > 30
    )
  ) {
    return "Cada menção precisa de nome e crédito; a participação pode ter até 30 caracteres.";
  }
  const handles = creditosPerfil.map(credito =>
    credito.handle.toLocaleLowerCase("pt-BR")
  );
  if (new Set(handles).size !== handles.length)
    return "O mesmo perfil Cypher não pode ser adicionado duas vezes.";
  const nomes = mencoesFantasma.map(credito =>
    credito.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
  );
  if (new Set(nomes).size !== nomes.length)
    return "Remova menções repetidas da lista de créditos.";
  return null;
}

function dadosPersistidosObra(valores: ValoresFormularioObra): DadosObraCypher {
  return {
    title: valores.titulo,
    type: valores.tipo,
    typeDetail: valores.tipo === "Outro" ? valores.tipoOutro : "",
    genre: valores.genero,
    genreDetail: valores.genero === "Outro" ? valores.generoOutro : "",
    status: valores.visibilidade === undefined ? valores.status : "",
    published: valores.visibilidade === undefined ? valores.status === "Lançado" : valores.visibilidade === "publica",
    role: valores.papel,
    roleDetail: valores.papel === "Outro crédito" ? valores.papelOutro : "",
    description: valores.descricao,
    lyrics: valores.letra,
    bpm: valores.bpm,
    isrc: valores.isrc.toLocaleUpperCase("pt-BR"),
    iswc: valores.iswc.toLocaleUpperCase("pt-BR"),
    releaseDate: valores.dataLancamento,
    listenLink: valores.link,
  };
}

function entradasCreditosObra(
  creditosPerfil: LinhaCreditoPerfilFormulario[],
  mencoesFantasma: LinhaMencaoFormulario[]
): CreditoObraEntrada[] {
  return [
    ...creditosPerfil.map(credito => ({
      handle: credito.handle,
      name: "",
      role: credito.papel,
      participation: credito.participacao,
    })),
    ...mencoesFantasma.map(credito => ({
      handle: null,
      name: credito.nome,
      role: credito.papel,
      participation: credito.participacao,
    })),
  ];
}

function valoresDeCreditosRecebidos(req: Request) {
  const perfis = linhasRepetidas<LinhaCreditoPerfilFormulario>(req, {
    handle: "perfilCreditoHandle",
    papel: "perfilCreditoPapel",
    participacao: "perfilCreditoParticipacao",
  });
  const mencoes = linhasRepetidas<LinhaMencaoFormulario>(req, {
    nome: "mencaoFantasmaNome",
    papel: "mencaoFantasmaPapel",
    participacao: "mencaoFantasmaParticipacao",
  });
  return {
    creditosPerfil: perfis.linhas.filter(linha =>
      Object.values(linha).some(Boolean)
    ),
    mencoesFantasma: mencoes.linhas.filter(linha =>
      Object.values(linha).some(Boolean)
    ),
    perfisAlinhados: perfis.alinhadas,
    mencoesAlinhadas: mencoes.alinhadas,
  };
}

export const novaObra = (req: Request, res: Response) => {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao || !podePublicar(usuario, "obra")) {
    return res.redirect(303, "/works?erro=permissao");
  }
  const tipoRecebido = parametroTexto(req, "tipo");
  const tipo =
    tiposObra.find(opcao => opcao === tipoRecebido) ??
    valorCatalogo(tiposObra, tipoRecebido);
  if (!tipo) {
    return res.render("pages/formato-obra", {title:"Escolher formato", stylesheet:"espaco-trabalho", path:"/espaco-de-trabalho", tipos:tiposObraPermitidos(usuario.categories)});
  }
  if (tipo === "Beat") {
    if (!podePublicar(usuario, "beat")) {
      return res.redirect(303, "/works?erro=permissao");
    }
    return res.redirect(303, "/beats/new");
  }
  if (!podePublicar(usuario,"obra",tipo)) return res.sendStatus(403);
  return renderizarFormularioObra(res, usuario, {
    valores: { ...formularioObraVazio, tipo, papel: tipoAcervo(tipo) === "composicao" ? "Composição" : tipo === "Letra" ? "Letra" : formularioObraVazio.papel },
  });
};

export const editarObra = (req: Request, res: Response) => {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao || usuario.tipoConta !== "profissional") {
    return res.redirect(303, "/works?erro=permissao");
  }
  const obra = CypherModel.obraDoUsuario(req.params.id ?? "", usuario.id);
  if (!obra) return res.sendStatus(404);
  const creditos = creditosDoFormulario(obra);
  return renderizarFormularioObra(res, usuario, {
    editando: true,
    obraId: obra.id,
    valores: { ...preencherFormularioObra(obra), ...valoresAcervo(conexaoInternaCypher(), obra.id) },
    tipoOutroLegadoVazio: obra.type === "Outro" && !obra.typeDetail,
    generoOutroLegadoVazio: obra.genre === "Outro",
    papelOutroLegadoVazio: obra.role === "Outro crédito" && !obra.roleDetail,
    creditosPerfil: creditos.perfis,
    mencoesFantasma: creditos.mencoes,
  });
};

function processarFormularioObra(req: Request, res: Response, editar: boolean) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao || usuario.tipoConta !== "profissional") {
    return res.redirect(303, "/works?erro=permissao");
  }

  const valores = formularioObraRecebido(req);
  const classe = tipoAcervo(valores.tipo);
  const modeloMusical = req.body.acervo === "1" || (classe && valores.visibilidade !== undefined);
  if (valores.atuacoes?.some(id => !listarProfissoesCatalogo().some(p => p.id === id && usuario.categories.includes(p.rotulo)))) return res.sendStatus(400);
  if (!editar && !podePublicar(usuario,"obra",valores.tipo)) return res.sendStatus(403);
  if (valores.tipo === "Beat") {
    if (!podePublicar(usuario, "beat")) {
      return res.redirect(303, "/works?erro=permissao");
    }
    return res.redirect(303, "/beats/new");
  }
  const creditos = valoresDeCreditosRecebidos(req);
  const obraId = editar ? (req.params.id ?? "") : "";
  const obraExistente = editar
    ? CypherModel.obraDoUsuario(obraId, usuario.id)
    : undefined;
  if (editar && !obraExistente) return res.sendStatus(404);
  if (editar && obraExistente.type !== valores.tipo && !podePublicar(usuario,"obra",valores.tipo)) return res.sendStatus(403);
  const tipoOutroLegadoVazio = Boolean(
    obraExistente?.type === "Outro" && !obraExistente.typeDetail
  );
  const generoOutroLegadoVazio = obraExistente?.genre === "Outro";
  const papelOutroLegadoVazio = Boolean(
    obraExistente?.role === "Outro crédito" && !obraExistente.roleDetail
  );
  const erroCodigo = modeloMusical && (
    (valores.isrc && (classe !== "fonograma" || !/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/i.test(valores.isrc.replaceAll("-", "")))) ? "Informe um ISRC válido na ficha do fonograma." :
    (valores.iswc && (classe !== "composicao" || !/^T\d{10}$/i.test(valores.iswc.replace(/[.\-]/g, "")))) ? "Informe um ISWC válido na ficha da composição." : null
  );
  const erro =
    erroCodigo ||
    (
    validarFormularioObra(valores, {
      tipoOutroLegadoVazio,
      generoOutroLegadoVazio,
      papelOutroLegadoVazio,
    }) ??
    validarCreditosObra(
      creditos.creditosPerfil,
      creditos.mencoesFantasma,
      creditos.perfisAlinhados,
      creditos.mencoesAlinhadas
    ));
  if (erro) {
    return renderizarFormularioObra(res, usuario, {
      status: 400,
      editando: editar,
      obraId,
      erro,
      valores,
      tipoOutroLegadoVazio,
      generoOutroLegadoVazio,
      papelOutroLegadoVazio,
      creditosPerfil: creditos.creditosPerfil,
      mencoesFantasma: creditos.mencoesFantasma,
    });
  }

  try {
    const dados = dadosPersistidosObra(valores);
    if (modeloMusical) {
      const enviouVinculos = req.body.acervo === "1" || req.body.composicaoId !== undefined || req.body.fonogramaId !== undefined;
      dados.acervo = editar && !enviouVinculos ? valoresAcervo(conexaoInternaCypher(), obraId) :
        { composicoes: valores.composicoes ?? [], faixas: valores.faixas ?? [] };
      dados.isrc = classe === "fonograma" ? dados.isrc.replaceAll("-", "") : obraExistente?.isrc ?? "";
      dados.iswc = classe === "composicao" ? dados.iswc.replace(/[.\-]/g, "") : obraExistente?.iswc ?? "";
      dados.releaseDate = obraExistente?.releaseDate ?? "";
      if (classe !== "letra" && classe !== "composicao") dados.lyrics = obraExistente?.lyrics ?? "";
    }
    dados.atuacoes = valores.atuacoes;
    if (valores.genero === "Outro" && valores.generoOutro) {
      const detalheNormalizado = valores.generoOutro.toLocaleLowerCase("pt-BR");
      const generoCanonico = generosObra.find(
        genero =>
          genero !== "Outro" &&
          genero.toLocaleLowerCase("pt-BR") === detalheNormalizado
      );
      if (generoCanonico) {
        dados.genre = generoCanonico;
        dados.genreDetail = "";
      } else if (
        !usuario.genres.some(
          genero => genero.toLocaleLowerCase("pt-BR") === detalheNormalizado
        )
      ) {
        dados.propostaGenero = valores.generoOutro;
      }
    }
    const entradas = entradasCreditosObra(
      creditos.creditosPerfil,
      creditos.mencoesFantasma
    );
    if (editar) {
      const atualizado = CypherModel.atualizarObra(
        obraId,
        usuario.id,
        dados,
        entradas
      );
      if (!atualizado) return res.sendStatus(404);
      CypherModel.criarNotificacao({
        usuarioDestinoId: usuario.id,
        tipo: "obra_atualizada",
        titulo: "Obra atualizada",
        mensagem: `As informações de “${valores.titulo}” foram salvas.`,
        url: "/espaco-de-trabalho/obra/" + encodeURIComponent(obraId),
        entidadeTipo: "obra",
        entidadeId: obraId,
        chaveOrigem: `obra-atualizada:${obraId}:${valores.titulo}:${valores.status}`,
      });
      const parametros = new URLSearchParams({ resultado: "atualizada" });
      if (dados.propostaGenero) parametros.set("genero", "analise");
      return res.redirect(303, `/espaco-de-trabalho?${parametros.toString()}`);
    }
    const obraIdCriada = CypherModel.criarObra(usuario.id, dados, entradas);
    CypherModel.criarNotificacao({
      usuarioDestinoId: usuario.id,
      tipo: "obra_criada",
      titulo: "Nova obra cadastrada",
      mensagem: `“${valores.titulo}” foi adicionada ao seu catálogo.`,
      url: "/espaco-de-trabalho/obra/" + encodeURIComponent(obraIdCriada),
      entidadeTipo: "obra",
      entidadeId: obraIdCriada,
      chaveOrigem: `obra-criada:${obraIdCriada}`,
    });
    const parametros = new URLSearchParams({ resultado: "criada" });
    if (dados.propostaGenero) parametros.set("genero", "analise");
    return res.redirect(303, `/espaco-de-trabalho?${parametros.toString()}`);
  } catch (erroGravacao) {
    const mensagemCredito = erroGravacao instanceof ErroAcervo ? erroGravacao.message : mensagemErroCredito(erroGravacao);
    if (!mensagemCredito) {
      console.error("Falha ao salvar obra Cypher:", erroGravacao);
    }
    return renderizarFormularioObra(res, usuario, {
      status: mensagemCredito ? 400 : 500,
      editando: editar,
      obraId,
      erro:
        mensagemCredito ??
        "Não foi possível salvar a obra agora. Confira os dados e tente novamente.",
      valores,
      tipoOutroLegadoVazio,
      generoOutroLegadoVazio,
      papelOutroLegadoVazio,
      creditosPerfil: creditos.creditosPerfil,
      mencoesFantasma: creditos.mencoesFantasma,
    });
  }
}

export const criarObra = (req: Request, res: Response) =>
  processarFormularioObra(req, res, false);

export const atualizarObra = (req: Request, res: Response) =>
  processarFormularioObra(req, res, true);

export const excluirObra = (req: Request, res: Response) => {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao || usuario.tipoConta !== "profissional") {
    return res.redirect(303, "/works?erro=permissao");
  }
  const id = req.params.id ?? "";
  const excluida = CypherModel.excluirObra(id, usuario.id);
  if (!excluida) {
    if (CypherModel.obraDoUsuario(id, usuario.id) && impedirExclusaoVinculada(conexaoInternaCypher(), id))
      return res.status(409).render("pages/erro-trabalho", {
        title: "Obra vinculada", path: "/espaco-de-trabalho", stylesheet: "espaco-trabalho",
        voltar: "/espaco-de-trabalho/obra/" + encodeURIComponent(id),
        erro: "Este registro faz parte de outro trabalho. Retire o vínculo na ficha de edição antes de excluí-lo.",
      });
    return res.sendStatus(404);
  }
  return res.redirect(303, "/espaco-de-trabalho?resultado=excluida");
};
export const bancoBeats = renderizarPagina(
  "pages/banco-beats",
  "Banco de Beats",
  () => ({
    beats: CypherModel.beats(),
  })
);
function valoresPerfil(usuario: UsuarioDaSessao) {
  const generosConhecidos = generosObra.filter(genero => genero !== "Outro");
  return {
    nome: usuario.nomeInformado || usuario.name,
    cidade: usuario.city,
    biografia: usuario.biography,
    contato: usuario.contact,
    categorias: usuario.categories,
    outraCategoria: usuario.otherCategory,
    generos: usuario.genres.filter(genero =>
      generosConhecidos.includes(genero)
    ),
    outroGenero: "",
    equipamentos: usuario.equipment.join("\n"),
    competencias: (usuario.skills ?? []).join("\n"),
    disponibilidade: usuario.availability,
  };
}

const secoesEdicaoPerfil = new Set([
  "pessoal",
  "identidade",
  "profissional",
  "portfolio",
  "privacidade",
  "conta",
]);

function renderizarPerfil(
  res: Response,
  usuario: UsuarioDaSessao,
  opcoes: {
    status?: number;
    editando?: boolean;
    erro?: string | null;
    salvo?: boolean;
    generoPendente?: boolean;
    categoriaPropostaResultado?: string;
    valores?: ReturnType<typeof valoresPerfil>;
    atuacoesExistentes?: AtuacaoProfissionalPersistida[];
    navegacao?: NavegacaoPerfil;
    atuacoesSolicitadas?: AtuacaoProfissionalPersistida[];
    categoriasSolicitadas?: string[];
    secaoEdicao?: string;
    privacidadeSalva?: boolean;
    motivoCodigo?: string;
    motivoOutro?: string;
  } = {}
) {
  const estadoCategorias = usuario.demonstracao
    ? { bloqueada: false, proximaAlteracao: null, excecaoDisponivel: false }
    : estadoAlteracaoCategoriasCypher(usuario.id);
  const proximaAlteracaoFormatada = estadoCategorias.proximaAlteracao
    ? new Date(
        `${estadoCategorias.proximaAlteracao.replace(" ", "T")}Z`
      ).toLocaleDateString("pt-BR")
    : null;
  const solicitacaoExcecao = usuario.demonstracao
    ? null
    : obterEstadoSolicitacaoExcecaoCategoriaCypher(usuario.id);
  const categoriasDisponiveis = listarCategoriasProfissionaisCypher();
  const atuacoesExistentes =
    opcoes.atuacoesExistentes ?? listarAtuacoesUsuarioCypher(usuario.id);
  const profissoesPersistidas = listarProfissoesUsuarioCypher(usuario.id, {
    incluirInativas: true,
  });
  const vertentesProfissionaisPersistidas =
    listarVertentesProfissionaisUsuarioCypher(usuario.id, {
      incluirInativas: true,
    });
  const questionariosAtuacao = listarProfissoesCatalogo().map(profissao => ({
    categoria: profissao.rotulo,
    perguntas: catalogoPerguntasPorCategoria(profissao.rotulo),
    legada: false,
  }));
  return res.status(opcoes.status ?? 200).render("pages/perfil", {
    title: "Meu perfil",
    path: "/profile",
    stylesheet: "cena-perfil",
    authenticated: true,
    usuario: usuarioParaView(usuario),
    notificacoesRecentes: CypherModel.notificacoes(usuario.id, 5),
    quantidadeNaoLidas: CypherModel.notificacoesNaoLidas(usuario.id),
    pessoa: { ...usuarioParaView(usuario), atuacoes: atuacoesExistentes, rotulosCategorias: Object.fromEntries(usuario.categories.map(c => [c, rotuloProfissional(c,usuario.tratamento)])) },
    apresentacao: opcoes.editando && !usuario.demonstracao ? null : montarApresentacao({
      id: usuario.id, handle: usuario.handle, categorias: usuario.categories, demo: usuario.demonstracao,
    }, usuario, true, opcoes.navegacao ?? {}),
    selo: opcoes.editando ? seloPerfil(usuario.id) : null, coresSelo, formasSelo,
    categoriasDisponiveis,
    gruposProfissionais: listarGruposProfissionais(),
    questionariosAtuacao,
    atuacoesExistentes,
    profissoesPersistidas,
    vertentesProfissionaisPersistidas,
    vertentesDisponiveis: vertentesProfissionais,
    vertentesSelecionadas: vertentesProfissionaisPersistidas.filter(v=>v.ativa && v.associacaoAtiva).map(v=>v.vertenteId),
    atuacoesSolicitadas: opcoes.atuacoesSolicitadas ?? atuacoesExistentes,
    categoriasSolicitadas: opcoes.categoriasSolicitadas ?? usuario.categories,
    formatarRespostaAtuacao,
    generosDisponiveis: generosObra.filter(genero => genero !== "Outro"),
    categoriasBloqueadas: estadoCategorias.bloqueada,
    excecaoCategoriaDisponivel: estadoCategorias.excecaoDisponivel,
    solicitacaoExcecao,
    proximaAlteracaoCategorias: proximaAlteracaoFormatada,
    opcoesDisponibilidade: opcoesDisponibilidadeProfissional,
    disponibilidadeAnterior: usuario.availability,
    profissoesComEstilosMusicais,
    rotuloStatusProfissional,
    editando: opcoes.editando ?? false,
    erro: opcoes.erro ?? null,
    salvo: opcoes.salvo ?? false,
    generoPendente: opcoes.generoPendente ?? false,
    categoriaPropostaResultado: opcoes.categoriaPropostaResultado ?? "",
    categoriaPropostaMensagem:
      (
        {
          enviada:
            "Pedido enviado. A categoria só ficará disponível após aprovação da equipe.",
          pendente: "Esse nome já está aguardando análise da equipe.",
          aprovada:
            "Essa categoria já foi aprovada; ela está disponível na lista de categorias.",
          existente: "Escolha uma das categorias que já aparecem na lista.",
          invalida: "Informe um nome de categoria entre 2 e 60 caracteres.",
        } as Record<string, string>
      )[opcoes.categoriaPropostaResultado ?? ""] ?? null,
    categoriaPropostaErro: opcoes.categoriaPropostaResultado === "invalida",
    valores: opcoes.valores ?? valoresPerfil(usuario),
    secaoEdicao: opcoes.secaoEdicao ?? "pessoal",
    privacidadeSalva: opcoes.privacidadeSalva ?? false,
    motivoCodigo: opcoes.motivoCodigo ?? "",
    motivoOutro: opcoes.motivoOutro ?? "",
    publicSlug: usuario.handle.replace(/^@/, ""),
  });
}

export const perfil = (req: Request, res: Response) => {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  const secaoSolicitada = parametroTexto(req, "secao");
  const erroSolicitado = parametroTexto(req, "erro");
  const secaoProfissional = Boolean(
    parametroTexto(req, "categoria") ||
    parametroTexto(req, "solicitacao") ||
    erroSolicitado.startsWith("excecao_")
  );
  const erros: Record<string, string> = {
    catalogo: "O catálogo vigente tem 25 profissões. Uma nova profissão exige integração de atuação, questionário e permissões antes de ser disponibilizada.",
    excecao_justificativa:
      "Informe o motivo da solicitação em 10 a 500 caracteres.",
    excecao_nao_necessaria:
      "O prazo de 30 dias já terminou; você pode alterar suas categorias sem solicitar exceção.",
    excecao_ja_autorizada:
      "Você já tem uma autorização excepcional disponível para uma mudança.",
    excecao_questionario:
      "Revise as categorias e responda aos campos obrigatórios da atuação solicitada.",
    excecao_motivo:
      "Selecione um motivo e, se escolheu Outro, explique sua necessidade.",
    excecao_iguais:
      "Selecione uma alteração real nas categorias profissionais.",
    resposta_esclarecimento:
      "Sua resposta precisa ter entre 5 e 1.000 caracteres.",
  };
  return renderizarPerfil(res, usuario, {
    editando: req.query.editar === "1",
    secaoEdicao: secoesEdicaoPerfil.has(secaoSolicitada)
      ? secaoSolicitada
      : secaoProfissional
        ? "profissional"
        : "pessoal",
    salvo: req.query.salvo === "1",
    privacidadeSalva: parametroTexto(req, "privacidade") === "salva",
    generoPendente: req.query.genero === "analise",
    categoriaPropostaResultado: parametroTexto(req, "categoria"),
    navegacao: navegacaoPerfil(req),
    erro: erros[parametroTexto(req, "erro")] ?? null,
  });
};

export function solicitarExcecaoCategoria(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao) return res.sendStatus(403);
  const categoriasSolicitadas = categoriasRecebidas(req.body.categorias);
  const permitidas = listarCategoriasProfissionaisCypher();
  const reexibir = (
    erro: string,
    atuacoesSolicitadas: AtuacaoProfissionalPersistida[] = []
  ) =>
    renderizarPerfil(res, usuario, {
      status: 400,
      editando: true,
      erro,
      secaoEdicao: "profissional",
      motivoCodigo: String(req.body.motivoCodigo ?? ""),
      motivoOutro: String(req.body.motivoOutro ?? ""),
      categoriasSolicitadas,
      atuacoesSolicitadas,
    });
  if (
    categoriasSolicitadas.length === 0 ||
    categoriasSolicitadas.some(categoria => !permitidas.includes(categoria))
  ) {
    return reexibir("excecao_questionario");
  }
  const motivos: Record<string, string> = {
    recente: "Comecei a atuar nessa área recentemente.",
    novos_trabalhos: "Passei a desenvolver novos tipos de trabalho.",
    atualizar: "Quero corrigir ou atualizar informações do meu perfil.",
    categoria_incorreta: "Selecionei a categoria incorreta anteriormente.",
    ampliar: "Quero ampliar minha atuação e buscar oportunidades nessa área.",
    outro: "Outro motivo.",
  };
  const motivoCodigo = String(req.body.motivoCodigo ?? "");
  const explicacao = String(req.body.motivoOutro ?? "").trim();
  if (
    !Object.hasOwn(motivos, motivoCodigo) ||
    (motivoCodigo === "outro" &&
      (explicacao.length < 10 || explicacao.length > 500))
  ) {
    return reexibir(
      "excecao_motivo",
      atuacoesParaRenderizar(
        categoriasSolicitadas,
        req.body.respostasAtuacoesJson,
        req.body.visibilidadesAtuacoesJson
      )
    );
  }
  const motivo = `${motivos[motivoCodigo]}${motivoCodigo === "outro" ? ` ${explicacao}` : ""}`;
  const novasCategorias = categoriasSolicitadas.filter(
    categoria => !usuario.categories.includes(categoria)
  );
  const atuacoes = atuacoesRecebidas(
    categoriasSolicitadas,
    req.body.respostasAtuacoesJson,
    req.body.visibilidadesAtuacoesJson,
    novasCategorias
  );
  if (!atuacoes) {
    return reexibir(
      "excecao_questionario",
      atuacoesParaRenderizar(
        categoriasSolicitadas,
        req.body.respostasAtuacoesJson,
        req.body.visibilidadesAtuacoesJson
      )
    );
  }
  const respostasSolicitadas = Object.fromEntries(
    atuacoes.map(atuacao => [atuacao.categoria, atuacao.respostas])
  );
  const visibilidadesSolicitadas = Object.fromEntries(
    atuacoes.map(atuacao => [atuacao.categoria, atuacao.visibilidades])
  );
  const resultado = solicitarExcecaoCategoriaCypher(usuario.id, motivo, {
    motivoCodigo,
    categoriasSolicitadas,
    respostasSolicitadas,
    visibilidadesSolicitadas,
  });
  if (resultado === "nao_encontrada") return res.sendStatus(404);
  if (resultado === "nao_bloqueada") {
    return res.redirect(303, "/profile?editar=1&erro=excecao_nao_necessaria");
  }
  if (resultado === "excecao_disponivel") {
    return res.redirect(303, "/profile?editar=1&erro=excecao_ja_autorizada");
  }
  if (resultado === "categorias_iguais") {
    return res.redirect(303, "/profile?editar=1&erro=excecao_iguais");
  }
  if (resultado === "snapshot_invalido") {
    return reexibir(
      "excecao_questionario",
      atuacoesParaRenderizar(
        categoriasSolicitadas,
        req.body.respostasAtuacoesJson,
        req.body.visibilidadesAtuacoesJson
      )
    );
  }
  return res.redirect(303, "/profile?editar=1&solicitacao=pendente");
}

export function solicitarCategoriaProfissional(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao) return res.sendStatus(403);
  const categoria = String(req.body.categoria ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (categoria.length < 2 || categoria.length > 60) {
    return res.redirect(303, "/profile?editar=1&categoria=invalida");
  }
  const resultado = solicitarCategoriaProfissionalCypher(usuario.id, categoria);
  const destino: Record<typeof resultado, string> = {
    criada: "enviada",
    ja_pendente: "pendente",
    ja_aprovada: "aprovada",
    categoria_base: "existente",
    invalida: "invalida",
    nao_encontrada: "invalida",
  };
  return res.redirect(
    303,
    `/profile?editar=1&secao=profissional&categoria=${destino[resultado]}`
  );
}

export const configuracoes = (req: Request, res: Response) => {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;

  const erros: Record<string, string> = {
    senha: "A senha informada não confere. A conta continua ativa.",
    confirmacao: "Digite EXCLUIR para confirmar o encerramento da conta.",
    registros:
      "Antes de encerrar a conta, remova ou transfira suas obras, eventos e beats próprios.",
    indisponivel: "Não foi possível encerrar a conta agora. Tente novamente.",
  };
  return res.render("pages/configuracoes", {
    title: "Configurações",
    path: "/settings",
    stylesheet: "configuracoes",
    authenticated: true,
    usuario: usuarioParaView(usuario),
    mensagem:
      req.query.privacidade === "salva"
        ? "As preferências de visibilidade foram atualizadas."
        : null,
    erro: erros[String(req.query.erro ?? "")] ?? null,
  });
};

function navegacaoPerfil(req: Request): NavegacaoPerfil {
  return { aba: parametroTexto(req, "aba"), atuacao: parametroTexto(req, "atuacao"),
    pagina: parametroTexto(req, "pagina"), obra: parametroTexto(req, "obra") };
}

export const perfilPublico = (req: Request, res: Response) => {
  const visitante = exigeAcesso(req, res);
  if (!visitante) return;
  const slug = String(req.params.identificador ?? "").trim();
  const handle = /^[a-z0-9_.]{3,24}$/i.test(slug) ? resolverPerfilPublico(slug) ?? normalizarIdentificador(slug) : "";
  const pessoa = handle ? obterPerfilPublicoCypher(handle, handle === normalizarIdentificador(visitante.handle) ? undefined : visitante.id) : null;
  const pagina = { stylesheet: "cena-perfil", path: "/search", authenticated: true, editando: false };
  if (!pessoa) return res.status(404).render("pages/perfil", { ...pagina,
    title: "Perfil indisponível", pessoa: null, apresentacao: null });
  if (handle !== normalizarIdentificador(slug)) {
    const parametros = new URLSearchParams();
    for (const [k, v] of Object.entries(navegacaoPerfil(req))) if (v) parametros.set(k, v);
    return res.redirect(308, "/p/" + encodeURIComponent(handle.slice(1)) + (parametros.size ? "?" + parametros : ""));
  }
  return res.render("pages/perfil", {
    ...pagina, title: pessoa.vulgo || pessoa.name,
    pessoa: { ...pessoa, id: pessoa.userId, availabilityLabel: rotuloStatusProfissional(pessoa.availability) },
    apresentacao: montarApresentacao({ id: pessoa.userId, handle: pessoa.handle, categorias: pessoa.categories,
      demo: Boolean(pessoa.contaDemo) }, visitante, false, navegacaoPerfil(req)),
    questionariosAtuacao: pessoa.categories.map(categoria => ({ categoria, perguntas: catalogoPerguntasPorCategoria(categoria) })),
    formatarRespostaAtuacao,
  });
};

export function atualizarPerfil(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao) return res.sendStatus(403);
  const secaoEdicao = secoesEdicaoPerfil.has(String(req.body.secaoEdicao ?? ""))
    ? String(req.body.secaoEdicao)
    : "";

  const nome = String(req.body.nome ?? "").trim();
  const cidade = String(req.body.cidade ?? "").trim();
  const biografia = String(req.body.biografia ?? "").trim();
  const contato = String(req.body.contato ?? "").trim();
  const categorias = categoriasRecebidas(req.body.categorias);
  const outraCategoria = "";
  const disponibilidade = String(req.body.disponibilidade ?? "").trim();
  const generosRecebidos = categoriasRecebidas(req.body.generos);
  const outrosGeneros = generosRecebidos.includes("Outro");
  const outroGenero = String(req.body.outroGenero ?? "").trim();
  const equipamentosTexto = String(req.body.equipamentos ?? "");
  const generosPermitidos = generosObra.filter(genero => genero !== "Outro");
  const generosValidos = generosRecebidos.filter(genero =>
    generosPermitidos.includes(genero)
  );
  const generos = {
    itens: generosValidos,
    valida:
      generosRecebidos.length <= 8 &&
      generosRecebidos.every(genero => generosObra.includes(genero)) &&
      (!outrosGeneros || (outroGenero.length >= 2 && outroGenero.length <= 40)),
  };
  const equipamentos = listaDeLinhas(equipamentosTexto, 12, 80);
  const competenciasTexto = typeof req.body.competencias === "string" ? req.body.competencias : (usuario.skills ?? []).join("\n");
  const competencias = listaDeLinhas(competenciasTexto, 12, 80);
  const valores = {
    nome,
    cidade,
    biografia,
    contato,
    categorias,
    outraCategoria,
    generos: generosRecebidos,
    outroGenero,
    equipamentos: equipamentosTexto,
    competencias: competenciasTexto,
    disponibilidade,
  };
  const categoriasAceitas = listarCategoriasProfissionaisCypher();

  const erro = validarPerfil({
    nome,
    cidade,
    biografia,
    contato,
    categorias,
    outraCategoria,
    disponibilidade,
    generos,
    equipamentos,
    categoriasDisponiveis: categoriasAceitas,
    competencias,
    disponibilidadeAnterior: usuario.availability,
  });

  if (erro) {
    return renderizarPerfil(res, usuario, {
      status: 400,
      editando: true,
      secaoEdicao,
      erro,
      valores,
    });
  }

  const novasCategorias = categorias.filter(
    categoria => !usuario.categories.includes(categoria)
  );
  const atuacoes = atuacoesRecebidas(
    categorias,
    req.body.respostasAtuacoesJson,
    req.body.visibilidadesAtuacoesJson,
    novasCategorias
  );
  if (!atuacoes) {
    return renderizarPerfil(res, usuario, {
      status: 400,
      editando: true,
      secaoEdicao,
      erro: "Preencha as perguntas obrigatórias para cada nova categoria e confira suas respostas.",
      valores,
      atuacoesExistentes: atuacoesParaRenderizar(
        categorias,
        req.body.respostasAtuacoesJson,
        req.body.visibilidadesAtuacoesJson
      ),
    });
  }

  const funcao = categorias.join(" · ");
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte[0]?.toLocaleUpperCase("pt-BR") ?? "")
    .join("");

  try {
    const generosCustomizadosAtuais = usuario.genres.filter(
      genero => !generosPermitidos.includes(genero)
    );
    const propostaGenero =
      outrosGeneros &&
      !generosCustomizadosAtuais.some(
        genero =>
          genero.toLocaleLowerCase("pt-BR") ===
          outroGenero.toLocaleLowerCase("pt-BR")
      )
        ? outroGenero
        : "";
    const atualizado = atualizarPerfilCypher({
      id: usuario.id,
      name: nome,
      role: funcao,
      city: cidade,
      biography: biografia,
      contact: contato,
      availability: disponibilidade,
      genres: [...new Set([...generos.itens, ...generosCustomizadosAtuais])],
      propostaGenero,
      categories: categorias,
      atuacoes,
      vertentes: req.body.vertentesPresentes === "1" ? listaTextual(req.body.vertentes) : undefined,
      otherCategory: "",
      equipment: equipamentos.itens,
      skills: typeof req.body.competencias === "string" ? competencias.itens : undefined,
      somenteAtuacao: req.params.secao === "profissional",
      initials: iniciais,
      tipoConta: usuario.tipoConta,
    });
    if (!atualizado) return res.sendStatus(404);
    const destino = new URLSearchParams();
    if (secaoEdicao) {
      destino.set("editar", "1");
      destino.set("secao", secaoEdicao);
    }
    destino.set("salvo", "1");
    if (propostaGenero) destino.set("genero", "analise");
    return res.redirect(303, `/profile?${destino.toString()}`);
  } catch (erroAtualizacao) {
    const mensagemErro =
      erroAtualizacao instanceof Error ? erroAtualizacao.message : "";
    const bloqueio = mensagemErro.match(/^CATEGORIAS_BLOQUEADAS:(.*)$/);
    if (bloqueio) {
      const dataProxima = bloqueio[1]
        ? new Date(`${bloqueio[1].replace(" ", "T")}Z`).toLocaleDateString(
            "pt-BR"
          )
        : "após o prazo de 30 dias";
      return renderizarPerfil(res, usuario, {
        status: 409,
        editando: true,
        secaoEdicao,
        erro: `As categorias profissionais foram alteradas recentemente. Você poderá alterá-las novamente em ${dataProxima}. As demais informações do perfil permanecem editáveis.`,
        valores,
      });
    }
    console.error("Falha ao atualizar perfil Cypher:", erroAtualizacao);
    return renderizarPerfil(res, usuario, {
      status: 500,
      editando: true,
      secaoEdicao,
      erro: "Não foi possível salvar o perfil agora. Tente novamente.",
      valores,
    });
  }
}

export function atualizarPerfilPorSecao(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao) return res.sendStatus(403);

  const secao = String(req.params.secao ?? "");
  if (!["pessoal", "profissional", "contato"].includes(secao)) {
    return res.sendStatus(404);
  }

  if (usuario.tipoConta !== "profissional") return res.sendStatus(403);
  if (secao === "pessoal") {
    const cidade = String(req.body.cidade ?? "").trim();
    const biografia = String(req.body.biografia ?? "").trim();
    const erro = validarApresentacaoPerfil(cidade, biografia);
    if (erro) return renderizarPerfil(res, usuario, {
      status: 400, editando: true, secaoEdicao: "pessoal", erro,
      valores: { ...valoresPerfil(usuario), cidade, biografia },
    });
    if (!atualizarApresentacaoCypher(usuario.id, "profissional", cidade, biografia)) return res.sendStatus(404);
    return res.redirect(303, "/profile?editar=1&secao=pessoal&salvo=1");
  }
  if (secao === "contato") {
    const contato = String(req.body.contato ?? "").trim();
    if (contato.length > 200) return renderizarPerfil(res, usuario, {
      status: 400, editando: true, secaoEdicao: "privacidade", erro: "O contato deve ter no máximo 200 caracteres.",
      valores: { ...valoresPerfil(usuario), contato },
    });
    if (!atualizarContatoProfissionalCypher(usuario.id, contato)) return res.sendStatus(404);
    return res.redirect(303, "/profile?editar=1&secao=privacidade&salvo=1");
  }

  const valoresAtuais = valoresPerfil(usuario);
  const atuacoesAtuais = listarAtuacoesUsuarioCypher(usuario.id);
  const bodyRecebido = (req.body ?? {}) as Record<string, unknown>;
  const corpoCompleto: Record<string, unknown> = {
    nome: usuario.nomeInformado || usuario.name,
    cidade: usuario.city,
    biografia: usuario.biography,
    contato: usuario.contact,
    categorias: usuario.categories,
    disponibilidade: usuario.availability,
    generos: valoresAtuais.outroGenero
      ? [...valoresAtuais.generos, "Outro"]
      : valoresAtuais.generos,
    outroGenero: valoresAtuais.outroGenero,
    equipamentos: valoresAtuais.equipamentos,
    respostasAtuacoesJson: JSON.stringify(
      Object.fromEntries(
        atuacoesAtuais.map(item => [item.categoria, item.respostas])
      )
    ),
    visibilidadesAtuacoesJson: JSON.stringify(
      Object.fromEntries(
        atuacoesAtuais.map(item => [item.categoria, item.visibilidades])
      )
    ),
  };

  const camposPermitidos = [
    "disponibilidade", "equipamentos", "competencias", "respostasAtuacoesJson",
    "visibilidadesAtuacoesJson", "vertentes", "vertentesPresentes",
  ];
  for (const campo of camposPermitidos) {
    if (Object.hasOwn(bodyRecebido, campo)) corpoCompleto[campo] = bodyRecebido[campo];
  }

  corpoCompleto.categorias = bodyRecebido.categorias ?? [];
  corpoCompleto.generos = bodyRecebido.generos ?? [];
  if (categoriasRecebidas(corpoCompleto.generos).includes("Outro")) {
    corpoCompleto.outroGenero = bodyRecebido.outroGenero ?? "";
  }

  req.body = { ...corpoCompleto, secaoEdicao: "profissional" };
  return atualizarPerfil(req, res);
}

export function revisaoAdministrativa(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (!ehAdministrador(usuario)) return res.sendStatus(403);
  const resultado = String(req.query.resultado ?? "");
  const mensagens: Record<string, string> = {
    genero_aprovado: "Gênero aprovado e adicionado ao perfil.",
    genero_rejeitado: "Proposta de gênero rejeitada; a decisão foi registrada.",
    categoria_aprovada:
      "Decisão registrada para a categoria profissional.",
    categoria_rejeitada:
      "Proposta de categoria rejeitada; a decisão foi registrada.",
    excecao_concedida:
      "Exceção autorizada. A pessoa poderá fazer uma alteração de categoria.",
    excecao_existente: "Já existe uma exceção não utilizada para esta conta.",
    solicitacao_excecao_aprovada:
      "Solicitação aprovada. A autorização de uso único foi liberada.",
    solicitacao_excecao_rejeitada:
      "Solicitação recusada. A decisão e a justificativa foram registradas.",
    esclarecimento_solicitado:
      "Pergunta enviada ao profissional. A solicitação permanecerá pendente até a resposta.",
  };
  const erros: Record<string, string> = {
    justificativa: "Informe uma justificativa entre 10 e 500 caracteres.",
    justificativa_solicitacao:
      "Informe a justificativa da decisão entre 5 e 500 caracteres.",
    solicitacao_pendente:
      "Há uma solicitação de exceção aberta para esta conta. Decida-a na fila antes de conceder outra autorização.",
    prazo:
      "A conta não está dentro do período de bloqueio; não é necessária uma exceção.",
    conta: "A conta informada não foi encontrada.",
    proposta: "A proposta não está mais pendente ou não foi encontrada.",
    solicitacao_revisada:
      "A solicitação já foi analisada ou não está mais pendente.",
    snapshot_alterado:
      "O perfil mudou desde o envio do pedido. Peça ao profissional para enviar uma nova solicitação.",
    mensagem_esclarecimento: "Escreva uma pergunta de 5 a 500 caracteres.",
    esclarecimento_indisponivel:
      "Não foi possível enviar outra pergunta até que o profissional responda.",
    aguarda_resposta:
      "A decisão está pausada até que o profissional responda à pergunta da equipe.",
  };
  const perfis = prepararPerfisExcecao(
    listarPerfisParaExcecaoCategoriaCypher("", 7)
  );
  const solicitacoesExcecao = listarSolicitacoesExcecaoCategoriaPendentesCypher(
    usuario.id
  ).map(solicitacao => ({
    ...solicitacao,
    motivoCodigoRotulo:
      (
        {
          recente: "Início recente de atuação",
          novos_trabalhos: "Novos tipos de trabalho",
          atualizar: "Correção ou atualização de perfil",
          categoria_incorreta: "Categoria anterior incorreta",
          ampliar: "Ampliação de atuação",
          outro: "Outro motivo",
        } as Record<string, string>
      )[solicitacao.motivoCodigo] ?? "Motivo informado",
    questionarios: solicitacao.categoriasSolicitadas.map(categoria => ({
      categoria,
      perguntas: catalogoPerguntasPorCategoria(categoria),
    })),
  }));
  const solicitacoesExcecaoDecididas =
    listarSolicitacoesExcecaoCategoriaDecididasCypher(usuario.id).map(
      solicitacao => ({
        ...solicitacao,
        questionarios: solicitacao.categoriasSolicitadas.map(categoria => ({
          categoria,
          perguntas: catalogoPerguntasPorCategoria(categoria),
        })),
      })
    );
  return res.render("pages/admin-revisao", {
    title: "Administrador",
    path: req.path,
    stylesheet: "configuracoes",
    authenticated: true,
    usuario: usuarioParaView(usuario),
    propostas: listarPropostasGenerosPendentesCypher(),
    propostasCategorias: listarPropostasCategoriasPendentesCypher(),
    solicitacoesExcecao,
    solicitacoesExcecaoDecididas,
    arquivoSolicitacoesExcecao: req.query.solicitacoes === "decididas",
    formatarRespostaAtuacao,
    perfis,
    totalPerfis: contarPerfisParaExcecaoCategoriaCypher(),
    secaoAdmin:
      req.path === "/admin/revisao/excecoes" ? "excecoes" : "analises",
    mensagem: mensagens[resultado] ?? null,
    erro: erros[String(req.query.erro ?? "")] ?? null,
  });
}

function prepararPerfisExcecao(
  perfis: ReturnType<typeof listarPerfisParaExcecaoCategoriaCypher>
) {
  return perfis.map(perfil => ({
    usuarioId: perfil.usuarioId,
    nome: perfil.nome,
    email: perfil.email,
    categorias: JSON.parse(perfil.categoriasJson) as string[],
    alteradaEm: perfil.alteradaEm,
    alteradaEmFormatada: perfil.alteradaEm
      ? new Date(`${perfil.alteradaEm.replace(" ", "T")}Z`).toLocaleString(
          "pt-BR"
        )
      : null,
    bloqueada: Boolean(
      perfil.proximaAlteracao &&
      new Date(`${perfil.proximaAlteracao.replace(" ", "T")}Z`).getTime() >
        Date.now()
    ),
    proximaAlteracaoFormatada: perfil.proximaAlteracao
      ? new Date(
          `${perfil.proximaAlteracao.replace(" ", "T")}Z`
        ).toLocaleDateString("pt-BR")
      : null,
    excecaoPendente: perfil.excecaoPendente,
    solicitacaoPendente: perfil.solicitacaoPendente,
    iniciais: perfil.nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(parte => parte[0]?.toLocaleUpperCase("pt-BR") ?? "")
      .join(""),
  }));
}

export function buscarPerfisExcecaoAdministrativa(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (!ehAdministrador(usuario)) return res.sendStatus(403);
  const consulta = String(req.query.q ?? "")
    .trim()
    .slice(0, 100);
  const todos = req.query.todos === "1";
  const perfis = listarPerfisParaExcecaoCategoriaCypher(
    consulta,
    todos || consulta ? undefined : 7
  );
  return res.json({
    perfis: prepararPerfisExcecao(perfis),
    total: contarPerfisParaExcecaoCategoriaCypher(consulta),
  });
}

export function revisarCategoriaProfissionalAdministrativamente(
  req: Request,
  res: Response
) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (!ehAdministrador(usuario)) return res.sendStatus(403);
  const acao = String(req.body.acao ?? "");
  if (acao === "aprovar") return res.redirect(303,"/admin/revisao?erro=catalogo");
  const motivo = String(req.body.motivo ?? "").trim();
  if (
    !["aprovar", "rejeitar"].includes(acao) ||
    motivo.length < 5 ||
    motivo.length > 500
  ) {
    return res.redirect(303, "/admin/revisao?erro=justificativa");
  }
  const atualizado = revisarPropostaCategoriaCypher(
    String(req.params.id ?? ""),
    usuario.id,
    usuario.email ?? "",
    acao === "aprovar",
    motivo
  );
  if (!atualizado) return res.redirect(303, "/admin/revisao?erro=proposta");
  return res.redirect(
    303,
    `/admin/revisao?resultado=categoria_${acao === "aprovar" ? "aprovada" : "rejeitada"}`
  );
}

export function revisarGeneroAdministrativamente(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (!ehAdministrador(usuario)) return res.sendStatus(403);
  const acao = String(req.body.acao ?? "");
  const motivo = String(req.body.motivo ?? "").trim();
  if (
    !["aprovar", "rejeitar"].includes(acao) ||
    motivo.length < 5 ||
    motivo.length > 500
  ) {
    return res.redirect(303, "/admin/revisao?erro=justificativa");
  }
  const atualizado = revisarPropostaGeneroCypher(
    String(req.params.id ?? ""),
    usuario.id,
    acao === "aprovar",
    motivo
  );
  if (!atualizado) return res.redirect(303, "/admin/revisao?erro=proposta");
  return res.redirect(
    303,
    `/admin/revisao?resultado=genero_${acao === "aprovar" ? "aprovado" : "rejeitado"}`
  );
}

export function autorizarExcecaoCategoria(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (!ehAdministrador(usuario)) return res.sendStatus(403);
  const motivo = String(req.body.motivo ?? "").trim();
  if (motivo.length < 10 || motivo.length > 500) {
    return res.redirect(303, "/admin/revisao/excecoes?erro=justificativa");
  }
  const resultado = concederExcecaoCategoriaCypher(
    String(req.params.id ?? ""),
    usuario.id,
    usuario.email ?? "",
    motivo
  );
  const destinos = {
    concedida: "excecao_concedida",
    ja_pendente: "excecao_existente",
    solicitacao_pendente: "solicitacao_pendente",
    nao_bloqueada: "prazo",
    nao_encontrada: "conta",
  } as const;
  return res.redirect(
    303,
    `/admin/revisao/excecoes?${resultado === "concedida" || resultado === "ja_pendente" ? "resultado" : "erro"}=${destinos[resultado]}`
  );
}

export function revisarSolicitacaoExcecaoCategoria(
  req: Request,
  res: Response
) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (!ehAdministrador(usuario)) return res.sendStatus(403);
  const acao = String(req.body.acao ?? "");
  const motivo = String(req.body.motivo ?? "").trim();
  if (
    !["aprovar", "rejeitar"].includes(acao) ||
    motivo.length < 5 ||
    motivo.length > 500
  ) {
    return res.redirect(
      303,
      "/admin/revisao/excecoes?erro=justificativa_solicitacao"
    );
  }
  const resultado = revisarSolicitacaoExcecaoCategoriaCypher(
    String(req.params.id ?? ""),
    usuario.id,
    usuario.email ?? "",
    acao === "aprovar",
    motivo
  );
  if (resultado === "aprovada" || resultado === "rejeitada") {
    return res.redirect(
      303,
      `/admin/revisao/excecoes?solicitacoes=decididas&resultado=solicitacao_excecao_${resultado}`
    );
  }
  const erros = {
    nao_pendente: "solicitacao_revisada",
    aguarda_resposta: "aguarda_resposta",
    conflito: "snapshot_alterado",
    nao_bloqueada: "prazo",
    nao_encontrada: "conta",
  } as const;
  return res.redirect(303, `/admin/revisao/excecoes?erro=${erros[resultado]}`);
}

export function solicitarInformacaoSolicitacaoCategoria(
  req: Request,
  res: Response
) {
  const administrador = exigeAcesso(req, res);
  if (!administrador) return;
  if (!ehAdministrador(administrador)) return res.sendStatus(403);
  const mensagem = String(req.body.mensagem ?? "").trim();
  if (mensagem.length < 5 || mensagem.length > 500) {
    return res.redirect(
      303,
      "/admin/revisao/excecoes?erro=mensagem_esclarecimento"
    );
  }
  const enviada = solicitarInformacaoSolicitacaoCategoriaCypher(
    String(req.params.id ?? ""),
    administrador.id,
    mensagem
  );
  return res.redirect(
    303,
    `/admin/revisao/excecoes?${enviada ? "resultado=esclarecimento_solicitado" : "erro=esclarecimento_indisponivel"}`
  );
}

export function responderSolicitacaoCategoria(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao) return res.sendStatus(403);
  const mensagem = String(req.body.mensagem ?? "").trim();
  if (mensagem.length < 5 || mensagem.length > 1000) {
    return res.redirect(303, "/profile?editar=1&erro=resposta_esclarecimento");
  }
  const enviada = responderSolicitacaoCategoriaCypher(
    String(req.params.id ?? ""),
    usuario.id,
    mensagem
  );
  if (!enviada) return res.sendStatus(409);
  return res.redirect(303, "/profile?editar=1&solicitacao=pendente");
}

export function atualizarPrivacidade(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao) return res.sendStatus(403);

  const atualizado = atualizarPrivacidadeCypher(usuario.id, {
    profilePublic: req.body.perfilPublico === "on",
    locationPublic: req.body.localizacaoPublica === "on",
    contactPublic: req.body.contatoPublico === "on",
    skillsPublic: req.body.competenciasPublicasPresente === "1" ? req.body.competenciasPublicas === "on" : undefined,
  });
  if (!atualizado) return res.sendStatus(404);
  return res.redirect(
    303,
    req.body.retorno === "perfil"
      ? "/profile?editar=1&secao=privacidade&privacidade=salva"
      : "/settings?privacidade=salva"
  );
}

export async function excluirConta(req: Request, res: Response) {
  const usuario = exigeAcesso(req, res);
  if (!usuario) return;
  if (usuario.demonstracao || !usuario.email) return res.sendStatus(403);
  if (validarConfirmacaoExclusao(req.body.confirmacao)) {
    return res.redirect(303, "/settings?erro=confirmacao");
  }
  const senha = String(req.body.password ?? "");
  if (validarSenhaExclusao(senha)) {
    return res.redirect(303, "/settings?erro=senha");
  }

  try {
    const usuarioAutenticado = await autenticarUsuario(usuario.email, senha);
    if (usuarioAutenticado !== usuario.id) {
      return res.redirect(303, "/settings?erro=senha");
    }

    const resultado = excluirContaCypher(usuario.id);
    if (!resultado.excluida) {
      return res.redirect(
        303,
        resultado.obras || resultado.eventos || resultado.beats
          ? "/settings?erro=registros"
          : "/settings?erro=indisponivel"
      );
    }

    const token = tokenDaRequisicao(req);
    if (token) encerrarSessao(token);
    res.clearCookie(nomeCookieSessao, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: req.secure,
    });
    return res.redirect(303, "/login?conta=excluida");
  } catch (erro) {
    console.error("Falha ao encerrar conta Cypher:", erro);
    return res.redirect(303, "/settings?erro=indisponivel");
  }
}


import { configurarEmail } from "../models/entregaEmail.js";
import type { Request, Response } from "express";
import {
  cadastrarUsuario,
  autenticarUsuario,
  verificarSenha,
} from "../models/autenticacaoCypher.js";
import {
  buscarCredenciaisCypher,
  listarAtuacoesUsuarioCypher,
  listarVertentesProfissionaisUsuarioCypher,
  conexaoInternaCypher,
  type UsuarioDaSessao,
} from "../models/bancoDados.js";
import {
  listarGruposProfissionais,
  listarProfissoesCatalogo,
} from "../models/modeloPerfil.js";
import {
  perguntasCadastroProfissao,
  formatarRespostaAtuacao,
  idProfissaoPorCategoria,
} from "../models/questionarioAtuacao.js";
import { vertentesProfissionais } from "../models/modeloProfissionalPersistido.js";
import {
  validarEmail,
  validarNomeCadastro,
  validarSenha,
} from "../validators/validarAutenticacao.js";
import {
  validarDadosIdentidade,
  validarIdentificador,
  normalizarIdentificador,
  dataAtualCadastro,
} from "../validators/validarIdentidade.js";
import {
  listaTextual,
  validarSelecaoProfissional,
} from "../validators/validarAtuacao.js";
import {
  identificadorDisponivel,
  atualizarIdentidadeUsuario,
  estadoAlteracaoIdentificador,
  alterarIdentificadorUsuario,
  profissionalizarUsuario,
  atualizarApresentacaoConsumidor,
  obterPreferenciasUsuario,
  salvarPreferenciasUsuario,
  generosInteresse,
} from "../models/identidadeUsuario.js";
import {
  emitirConfirmacaoEmail,
  confirmarEmailUsuario,
} from "../models/confirmacaoEmail.js";
import { podeAdministrar } from "../models/permissoes.js";
import { perfil as perfilProfissional } from "./controladorPerfis.js";

const ligado = (valor: unknown) =>
  ["1", "on", "true", true].includes(valor as string | boolean);
const texto = (valor: unknown) =>
  typeof valor === "string" ? valor.trim() : "";
const atual = (res: Response) => res.locals.usuario as UsuarioDaSessao;
const intervaloIdentificador = 30;
const dadosComuns = (body: Request["body"]) => ({
  nomeInformado: texto(body.name),
  email: texto(body.email).toLowerCase(),
  identificador: normalizarIdentificador(texto(body.identificador)),
  vulgo: ligado(body.possuiVulgo) ? texto(body.vulgo) : "",
  usarVulgo: false,
  nascimento: texto(body.nascimento),
  tratamento: texto(body.tratamento),
  generoPersonalizado: body.tratamento === "outro" ? texto(body.generoPersonalizado) : "",
  tipoConta: texto(body.tipoConta) || "profissional",
});

class ErroFormulario extends Error {
  constructor(
    mensagem: string,
    public campo: string,
    public status = 400
  ) {
    super(mensagem);
  }
}
function validarConta(body: Request["body"]) {
  const dados = dadosComuns(body);
  if (!["profissional", "consumidor"].includes(dados.tipoConta))
    throw new ErroFormulario(
      "Escolha Profissional ou Consumidor.",
      "tipoConta"
    );
  const nome = validarNomeCadastro(dados.nomeInformado);
  if (nome) throw new ErroFormulario(nome, "name");
  const email = validarEmail(dados.email);
  if (email) throw new ErroFormulario(email, "email");
  const handle = validarIdentificador(dados.identificador);
  if (handle) throw new ErroFormulario(handle, "identificador");
  const identidade = validarDadosIdentidade(dados);
  if (identidade)
    throw new ErroFormulario(
      identidade,
      identidade.includes("gênero") ? (dados.tratamento === "outro" ? "generoPersonalizado" : "tratamento") : identidade.includes("vulgo") ? "vulgo" : "nascimento"
    );
  const senha = validarSenha(
    typeof body.password === "string" ? body.password : ""
  );
  if (senha) throw new ErroFormulario(senha, "password");
  if (body.password !== body.passwordConfirmation)
    throw new ErroFormulario("As senhas não conferem.", "passwordConfirmation");
  if (buscarCredenciaisCypher(dados.email))
    throw new ErroFormulario("Este e-mail já está cadastrado.", "email", 409);
  if (!identificadorDisponivel(dados.identificador))
    throw new ErroFormulario(
      "Este identificador já está em uso ou reservado.",
      "identificador",
      409
    );
  return dados;
}

function dadosAtuacao(body: Request["body"]) {
  const categorias = listaTextual(body.categorias);
  const fallback =
    body.respostas &&
    typeof body.respostas === "object" &&
    !Array.isArray(body.respostas)
      ? JSON.stringify(
          Object.fromEntries(
            categorias.map(categoria => [
              categoria,
              body.respostas[idProfissaoPorCategoria(categoria)!] ?? {},
            ])
          )
        )
      : "{}";
  return validarSelecaoProfissional(
    categorias,
    !body.respostasAtuacoesJson || body.respostasAtuacoesJson === "{}"
      ? fallback
      : body.respostasAtuacoesJson,
    body.visibilidadesAtuacoesJson ?? "{}",
    listaTextual(body.vertentes)
  );
}
function baseSelecao() {
  return {
    gruposProfissionais: listarGruposProfissionais(),
    questionariosAtuacao: listarProfissoesCatalogo().map(profissao => ({
      categoria: profissao.rotulo,
      perguntas: perguntasCadastroProfissao(profissao.rotulo),
      legada: false,
    })),
    formatarRespostaAtuacao,
    vertentesDisponiveis: vertentesProfissionais,
  };
}
function renderizarCadastro(
  res: Response,
  body: Request["body"] = {},
  erro: string | null = null,
  status = 200,
  etapaInicial = "conta"
) {
  const dados = dadosComuns(body);
  let atuacoesExistentes: unknown[] = [];
  try {
    const respostas = JSON.parse(body.respostasAtuacoesJson ?? "{}");
    const vis = JSON.parse(body.visibilidadesAtuacoesJson ?? "{}");
    atuacoesExistentes = listaTextual(body.categorias).map(categoria => ({
      categoria,
      respostas: respostas[categoria] ?? {},
      visibilidades: vis[categoria] ?? {},
    }));
  } catch {}
  return res
    .status(status)
    .render("pages/cadastro", {
      title: "Criar conta",
      stylesheet: "autenticacao",
      erro,
      ...baseSelecao(),
      dados,
      categoriasSelecionadas: listaTextual(body.categorias),
      vertentesSelecionadas: listaTextual(body.vertentes),
      atuacoesExistentes,
      etapaInicial,
      tipoInicial: body.tipoConta,
      hoje: dataAtualCadastro(),
    });
}

export function paginaCadastro(_req: Request, res: Response) {
  const tipo = _req.query.tipo;
  return renderizarCadastro(res, tipo === "consumidor" || tipo === "profissional" ? { tipoConta: tipo } : {});
}
export function validarCadastro(req: Request, res: Response) {
  try {
    validarConta(req.body);
    return res.json({ valido: true });
  } catch (erro) {
    const e = erro as ErroFormulario;
    return res
      .status(e.status ?? 400)
      .json({ field: e.campo ?? "name", message: e.message });
  }
}
export function disponibilidadeIdentificador(req: Request, res: Response) {
  const handle = texto(req.body.identificador);
  const erro = validarIdentificador(handle);
  const disponivel = !erro && identificadorDisponivel(handle);
  return res.json({
    disponivel,
    message:
      erro ??
      (disponivel
        ? "Identificador disponível."
        : "Este identificador já está em uso ou reservado."),
  });
}

export async function registrarConta(req: Request, res: Response) {
  let etapa = "conta";
  try {
    const dados = validarConta(req.body);
    configurarEmail();
    etapa = "questionarios";
    const selecao =
      dados.tipoConta === "profissional"
        ? dadosAtuacao(req.body)
        : { categorias: [], atuacoes: [], vertentes: [] };
    if (
      dados.tipoConta === "consumidor" &&
      (listaTextual(req.body.categorias).length ||
        listaTextual(req.body.vertentes).length)
    )
      throw new ErroFormulario(
        "O cadastro de consumidor não recebe profissões ou vertentes profissionais.",
        "tipoConta"
      );
    await cadastrarUsuario({
      nome: dados.nomeInformado,
      email: dados.email,
      senha: req.body.password,
      tipoConta: dados.tipoConta as "profissional" | "consumidor",
      identificador: dados.identificador,
      vulgo: dados.vulgo,
      generoPersonalizado: dados.generoPersonalizado,
      nascimento: dados.nascimento,
      tratamento: dados.tratamento,
      categorias: selecao.categorias,
      atuacoes: selecao.atuacoes,
      vertentes: selecao.vertentes,
      outraCategoria: "",
    });
    const conta = buscarCredenciaisCypher(dados.email);
    try {
      await emitirConfirmacaoEmail(conta!.id, dados.email);
    } catch {
      return res.redirect(303, "/email/pendente?reenvio=necessario");
    }
    return res.redirect(303, "/email/pendente");
  } catch (erro) {
    const e = erro as ErroFormulario;
    const conflito =
      e.message.includes("UNIQUE constraint") ||
      e.message === "EMAIL_DUPLICADO";
    return renderizarCadastro(
      res,
      req.body,
      conflito
        ? "O e-mail ou identificador acabou de ser utilizado. Confira seus dados."
        : e.message,
      e.status ?? (conflito ? 409 : 400),
      e.campo ? (["email","identificador"].includes(e.campo) ? "contato" : ["name","vulgo","tipoConta"].includes(e.campo) ? "conta" : "acesso") : etapa === "questionarios" ? "acesso" : etapa
    );
  }
}

export function paginaEmailPendente(req: Request, res: Response) {
  return res.render("pages/confirmar-email", {
    title: "Confirmação de e-mail",
    stylesheet: "autenticacao",
    token: "",
    confirmado: false,
    erro:
      req.query.reenvio === "necessario"
        ? "A conta foi criada, mas o link ainda não pôde ser preparado. Solicite um novo envio."
        : null,
    mensagem: req.query.solicitado
      ? "Se houver uma conta pendente nesse endereço, um novo link será preparado quando o limite de reenvio permitir."
      : null,
  });
}
export function paginaConfirmacao(req: Request, res: Response) {
  return res.render("pages/confirmar-email", {
    title: "Confirme seu e-mail",
    stylesheet: "autenticacao",
    token: texto(req.query.token),
    confirmado: false,
    erro: null,
    mensagem: null,
  });
}
export async function confirmarEmail(req: Request, res: Response) {
  try {
    await confirmarEmailUsuario(texto(req.body.token));
    return res.render("pages/confirmar-email", {
      title: "E-mail confirmado",
      stylesheet: "autenticacao",
      token: "",
      confirmado: true,
      erro: null,
      mensagem: "E-mail confirmado. Você já pode entrar na sua conta.",
    });
  } catch (erro) {
    return res
      .status(400)
      .render("pages/confirmar-email", {
        title: "Confirmação indisponível",
        stylesheet: "autenticacao",
        token: "",
        confirmado: false,
        erro: (erro as Error).message,
        mensagem: null,
      });
  }
}
export async function reenviarConfirmacao(req: Request, res: Response) {
  try {
    const email = texto(req.body.email).toLowerCase();
    const conta = buscarCredenciaisCypher(email);
    if (conta && !conta.emailConfirmado && conta.tipoConta !== "administrativo")
      await emitirConfirmacaoEmail(conta.id, email);
  } catch {}
  return res.redirect(303, "/email/pendente?solicitado=1");
}

export function meuPerfil(req: Request, res: Response) {
  const usuario = atual(res);
  if (usuario.tipoConta === "profissional") return perfilProfissional(req, res);
  return res.render("pages/perfil-consumidor", {
    title: "Meu espaço",
    stylesheet: "perfil",
    path: "/profile",
    usuario,
    erro: req.query.erro ? texto(req.query.erro) : null,
    salvo: req.query.salvo === "1",
  });
}
export function salvarApresentacao(req: Request, res: Response) {
  try {
    atualizarApresentacaoConsumidor(
      atual(res).id,
      texto(req.body.cidade),
      texto(req.body.biografia)
    );
    return res.redirect(303, "/profile?salvo=1");
  } catch (erro) {
    return res.redirect(
      303,
      `/profile?erro=${encodeURIComponent((erro as Error).message)}`
    );
  }
}

export function configuracoesIdentidade(req: Request, res: Response) {
  const usuario = atual(res);
  return res.render("pages/configuracoes", {
    title: "Configurações",
    stylesheet: "configuracoes",
    path: "/settings",
    usuario,
    preferencias: obterPreferenciasUsuario(usuario.id),
    generosInteresse,
    estadoIdentificador: estadoAlteracaoIdentificador(
      usuario.id,
      intervaloIdentificador
    ),
    hoje: dataAtualCadastro(),
    mensagem: req.query.salvo
      ? "Suas alterações foram salvas."
      : req.query.privacidade === "salva"
        ? "Preferências de visibilidade salvas."
        : null,
    erro: texto(req.query.erro) || null,
  });
}
export function salvarIdentidade(req: Request, res: Response) {
  const usuario = atual(res);
  try {
    atualizarIdentidadeUsuario(usuario.id, {
      nomeInformado: texto(req.body.nomeInformado),
      vulgo: texto(req.body.vulgo),
      usarVulgo: ligado(req.body.usarVulgo),
      nascimento: texto(req.body.nascimento) || usuario.nascimento || "",
      tratamento: texto(req.body.tratamento),
      generoPersonalizado: req.body.tratamento === "outro" ? texto(req.body.generoPersonalizado) : "",
    });
    return res.redirect(303, "/settings?salvo=1#identidade");
  } catch (erro) {
    return res
      .status(400)
      .render("pages/configuracoes", {
        title: "Configurações",
        stylesheet: "configuracoes",
        path: "/settings",
        usuario: {
          ...usuario,
          nomeInformado: texto(req.body.nomeInformado),
          vulgo: texto(req.body.vulgo),
          usarVulgo: ligado(req.body.usarVulgo),
          tratamento: texto(req.body.tratamento),
      generoPersonalizado: req.body.tratamento === "outro" ? texto(req.body.generoPersonalizado) : "",
        },
        preferencias: obterPreferenciasUsuario(usuario.id),
        generosInteresse,
        estadoIdentificador: estadoAlteracaoIdentificador(
          usuario.id,
          intervaloIdentificador
        ),
        hoje: dataAtualCadastro(),
        mensagem: null,
        erro: (erro as Error).message,
      });
  }
}
export function salvarIdentificador(req: Request, res: Response) {
  try {
    alterarIdentificadorUsuario(
      atual(res).id,
      texto(req.body.identificador),
      intervaloIdentificador
    );
    return res.redirect(303, "/settings?salvo=1#identidade");
  } catch (erro) {
    return res.redirect(
      303,
      `/settings?erro=${encodeURIComponent((erro as Error).message)}#identidade`
    );
  }
}
export function salvarPreferencias(req: Request, res: Response) {
  try {
    salvarPreferenciasUsuario(
      atual(res).id,
      texto(req.body.regiao),
      listaTextual(req.body.generos),
      texto(req.body.tema)
    );
    return res.redirect(
      303,
      `/settings?salvo=1#${req.body.secao === "aparencia" ? "aparencia" : "descoberta"}`
    );
  } catch (erro) {
    return res.redirect(
      303,
      `/settings?erro=${encodeURIComponent((erro as Error).message)}#descoberta`
    );
  }
}
export async function solicitarTrocaEmail(req: Request, res: Response) {
  const usuario = atual(res);
  try {
    const credenciais = buscarCredenciaisCypher(usuario.email!);
    if (
      !credenciais ||
      !(await verificarSenha(
        String(req.body.senha ?? ""),
        credenciais.senhaHash
      ))
    )
      throw new Error("Confira sua senha atual.");
    const novo = texto(req.body.email).toLowerCase();
    if (novo === usuario.email)
      throw new Error("Informe um novo endereço de e-mail.");
    await emitirConfirmacaoEmail(usuario.id, novo, "alteracao");
    return res.redirect(303, "/email/pendente");
  } catch (erro) {
    return res.redirect(
      303,
      `/settings?erro=${encodeURIComponent((erro as Error).message)}#conta`
    );
  }
}

export function ativarProfissional(req: Request, res: Response) {
  if (atual(res).tipoConta !== "consumidor")
    return res.redirect(303, "/profile");
  return res.render("pages/ativar-profissional", {
    title: "Ativar perfil profissional",
    stylesheet: "perfil",
    path: "/profile",
    usuario: atual(res),
    ...baseSelecao(),
    categoriasSelecionadas: [],
    vertentesSelecionadas: [],
    atuacoesExistentes: [],
    erro: req.query.erro ? texto(req.query.erro) : null,
  });
}
export function confirmarProfissionalizacao(req: Request, res: Response) {
  if (atual(res).tipoConta !== "consumidor")
    return res.redirect(303, "/profile");
  try {
    const selecao = dadosAtuacao(req.body);
    profissionalizarUsuario(
      atual(res).id,
      selecao.categorias,
      JSON.stringify(
        Object.fromEntries(
          selecao.atuacoes.map(a => [a.categoria, a.respostas])
        )
      ),
      JSON.stringify(
        Object.fromEntries(
          selecao.atuacoes.map(a => [a.categoria, a.visibilidades])
        )
      ),
      selecao.vertentes,
      ligado(req.body.confirmar)
    );
    return res.redirect(303, "/profile?profissionalizado=1");
  } catch (erro) {
    let atuacoesExistentes: unknown[] = [];
    try {
      const r = JSON.parse(req.body.respostasAtuacoesJson ?? "{}");
      atuacoesExistentes = listaTextual(req.body.categorias).map(categoria => ({
        categoria,
        respostas: r[categoria] ?? {},
        visibilidades: {},
      }));
    } catch {}
    return res
      .status(400)
      .render("pages/ativar-profissional", {
        title: "Ativar perfil profissional",
        stylesheet: "perfil",
        path: "/profile",
        usuario: atual(res),
        ...baseSelecao(),
        categoriasSelecionadas: listaTextual(req.body.categorias),
        vertentesSelecionadas: listaTextual(req.body.vertentes),
        atuacoesExistentes,
        erro: (erro as Error).message,
      });
  }
}

export function excecaoIdentificador(req: Request, res: Response) {
  if (!podeAdministrar(atual(res), "excecoes")) return res.sendStatus(403);
  try {
    const alvo = conexaoInternaCypher()
      .prepare(
        "SELECT usuario_id AS id FROM perfis WHERE identificador=? COLLATE NOCASE"
      )
      .get(normalizarIdentificador(texto(req.body.atual))) as
      { id: string } | undefined;
    if (!alvo) throw new Error("Conta não encontrada.");
    alterarIdentificadorUsuario(
      alvo.id,
      texto(req.body.novo),
      intervaloIdentificador,
      { autorId: atual(res).id, motivo: texto(req.body.motivo) }
    );
    return res.redirect(303, "/admin?salvo=1");
  } catch {
    return res.redirect(303, "/admin?erro=identificador");
  }
}

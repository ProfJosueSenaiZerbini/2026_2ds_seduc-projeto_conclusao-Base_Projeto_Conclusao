import type { Request, Response } from "express";
import {
  autenticarUsuario,
  iniciarSessao,
  usuarioDaSessao,
  encerrarSessao,
  duracaoSessaoMs,
} from "../models/autenticacaoCypher.js";
import {
  criarAdministrador,
  atualizarAdministrador,
  listarAdministradores,
  listarAuditoria,
} from "../models/administracao.js";
import {
  podeAdministrar,
  type PapelAdministrativo,
} from "../models/permissoes.js";
import { cookieDaRequisicao } from "../middlewares/seguranca.js";

export function paginaLoginAdministrativo(_req: Request, res: Response) {
  return res.render("pages/admin-login", {
    title: "Acesso da equipe",
    stylesheet: "autenticacao",
    erro: null,
    email: "",
  });
}

export async function loginAdministrativo(req: Request, res: Response) {
  const email = String(req.body.email ?? "")
    .trim()
    .toLowerCase();
  const senha = String(req.body.password ?? "");
  if (email.length > 254 || senha.length < 8 || senha.length > 128)
    return res
      .status(401)
      .render("pages/admin-login", {
        title: "Acesso da equipe",
        stylesheet: "autenticacao",
        erro: "Acesso interno inválido.",
        email,
      });
  const id = await autenticarUsuario(email, senha);
  if (id) {
    const token = iniciarSessao(id);
    const conta = usuarioDaSessao(token);
    if (conta?.tipoConta === "administrativo") {
      const anterior = cookieDaRequisicao(req, "cypher_admin_session");
      if (anterior) encerrarSessao(anterior);
      res.cookie("cypher_admin_session", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: req.secure,
        path: "/admin",
        maxAge: duracaoSessaoMs,
      });
      return res.redirect(303, "/admin");
    }
    encerrarSessao(token);
  }
  return res
    .status(401)
    .render("pages/admin-login", {
      title: "Acesso da equipe",
      stylesheet: "autenticacao",
      erro: "Acesso interno inválido.",
      email,
    });
}

export function logoutAdministrativo(req: Request, res: Response) {
  const token = cookieDaRequisicao(req, "cypher_admin_session");
  if (token) encerrarSessao(token);
  res.clearCookie("cypher_admin_session", {
    path: "/admin",
    httpOnly: true,
    sameSite: "strict",
    secure: req.secure,
  });
  return res.redirect(303, "/admin/login");
}

export function painelAdministrativo(req: Request, res: Response) {
  const usuario = res.locals.usuario;
  return res.render("pages/admin-painel", {
    title: "Administração",
    stylesheet: "configuracoes",
    path: "/admin",
    usuario,
    equipe: podeAdministrar(usuario, "equipe")
      ? listarAdministradores(usuario.id)
      : [],
    auditoria: podeAdministrar(usuario, "auditoria")
      ? listarAuditoria(usuario.id)
      : [],
    mensagem:
      req.query.salvo === "1" ? "Alteração administrativa registrada." : null,
    erro: req.query.erro
      ? "Não foi possível aplicar a alteração. Confira os dados, o e-mail e o administrador selecionado."
      : null,
  });
}

export async function adicionarAdministrador(req: Request, res: Response) {
  if (!podeAdministrar(res.locals.usuario, "equipe"))
    return res.sendStatus(403);
  try {
    await criarAdministrador(
      {
        nome: String(req.body.nome ?? ""),
        email: String(req.body.email ?? ""),
        senha: String(req.body.senha ?? ""),
        papel: String(req.body.papel ?? "") as PapelAdministrativo,
      },
      res.locals.usuario.id
    );
    return res.redirect(303, "/admin?salvo=1");
  } catch {
    return res.redirect(303, "/admin?erro=dados");
  }
}

export function editarAdministrador(req: Request, res: Response) {
  if (!podeAdministrar(res.locals.usuario, "equipe"))
    return res.sendStatus(403);
  try {
    atualizarAdministrador(
      res.locals.usuario.id,
      String(req.params.id),
      String(req.body.papel ?? "") as PapelAdministrativo,
      req.body.ativo === "1"
    );
    return res.redirect(303, "/admin?salvo=1");
  } catch {
    return res.redirect(303, "/admin?erro=alteracao");
  }
}

import type { Request, Response } from "express";
import {
  alterarSenhaConta,
  solicitarRecuperacaoSenha,
  recuperacaoDisponivel,
  redefinirSenhaConta,
  encerrarConta,
} from "../models/gestaoConta.js";
import {
  versaoTermos,
  versaoPrivacidade,
} from "../models/consentimentoConta.js";
import type { UsuarioDaSessao } from "../models/bancoDados.js";
const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");
function renderizar(
  res: Response,
  etapa: string,
  dados: Record<string, unknown> = {},
  status = 200
) {
  res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  return res
    .status(status)
    .render("pages/acesso-conta", {
      title: "Cuide do seu acesso",
      stylesheet: "autenticacao",
      etapa,
      token: "",
      erro: null,
      mensagem: "",
      ...dados,
    });
}
function limparSessao(req: Request, res: Response) {
  res.clearCookie("cypher_session", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
  });
}
export function paginaRecuperacao(_req: Request, res: Response) {
  return renderizar(res, "solicitar");
}
export async function solicitarRecuperacao(req: Request, res: Response) {
  const email = texto(req.body.email).trim().toLowerCase();
  try {
    if (email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      await solicitarRecuperacaoSenha(email);
  } catch {
    console.error("Falha ao preparar recuperação de acesso.");
  }
  return renderizar(res, "solicitado");
}
export function paginaRedefinicao(req: Request, res: Response) {
  const token = texto(req.query.token);
  return recuperacaoDisponivel(token)
    ? renderizar(res, "redefinir", { token })
    : renderizar(res, "invalido", {}, 400);
}
export async function redefinirSenha(req: Request, res: Response) {
  const token = texto(req.body.token);
  try {
    if (req.body.password !== req.body.passwordConfirmation)
      throw new Error("As senhas não conferem.");
    await redefinirSenhaConta(token, texto(req.body.password));
    limparSessao(req, res);
    return renderizar(res, "sucesso", {
      mensagem:
        "Sua senha foi redefinida. Todas as sessões anteriores foram encerradas. Entre com a nova senha.",
    });
  } catch (erro) {
    return recuperacaoDisponivel(token)
      ? renderizar(
          res,
          "redefinir",
          { token, erro: (erro as Error).message },
          400
        )
      : renderizar(res, "invalido", {}, 400);
  }
}
export async function alterarSenha(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioDaSessao;
  try {
    if (req.body.password !== req.body.passwordConfirmation)
      throw new Error("As senhas não conferem.");
    await alterarSenhaConta(
      usuario.id,
      texto(req.body.senhaAtual),
      texto(req.body.password)
    );
    limparSessao(req, res);
    return renderizar(res, "sucesso", {
      mensagem:
        "Senha alterada. Todas as sessões anteriores foram encerradas. Entre novamente para continuar.",
    });
  } catch (erro) {
    return res.redirect(
      303,
      `/settings?erro=${encodeURIComponent((erro as Error).message)}#senha`
    );
  }
}
export async function fecharConta(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioDaSessao;
  try {
    if (req.body.confirmacao !== "ENCERRAR")
      throw new Error(
        "Digite ENCERRAR para confirmar o encerramento da conta."
      );
    await encerrarConta(usuario.id, texto(req.body.senha));
    limparSessao(req, res);
    return renderizar(res, "encerrada");
  } catch (erro) {
    return res.redirect(303, `/settings/encerramento?erro=${encodeURIComponent((erro as Error).message)}`);
  }
}
export function paginaEncerramento(req: Request, res: Response) {
  res.set("Cache-Control", "no-store");
  return res.render("pages/encerrar-conta", { title: "Encerrar conta", stylesheet: "configuracoes", path: "/settings", erro: texto(req.query.erro) || null });
}
export function termosConta(req: Request, res: Response) {
  res.set("Cache-Control", "no-store");
  const privacidade = req.path === "/politica-privacidade";
  return res.render("pages/politicas-conta", {
    title: privacidade ? "Política de Privacidade" : "Termos de Uso",
    stylesheet: "autenticacao",
    privacidade,
    versao: privacidade ? versaoPrivacidade : versaoTermos,
  });
}

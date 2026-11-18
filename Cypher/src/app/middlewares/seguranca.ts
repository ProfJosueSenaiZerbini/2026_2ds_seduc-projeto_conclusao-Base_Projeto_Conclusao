import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function cookieDaRequisicao(
  req: Request,
  nome: string
): string | undefined {
  return req.headers.cookie
    ?.split(";")
    .map(item => item.trim())
    .find(item => item.startsWith(`${nome}=`))
    ?.slice(nome.length + 1);
}

export function protegerEscrita(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cookie = cookieDaRequisicao(req, "cypher_csrf");
  const token =
    cookie && /^[a-f0-9]{64}$/.test(cookie)
      ? cookie
      : randomBytes(32).toString("hex");
  if (token !== cookie)
    res.cookie("cypher_csrf", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: req.secure,
      path: "/",
    });
  res.locals.csrfToken = token;
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const recebido = req.get("x-csrf-token") ?? req.body?._csrf;
  const origem = req.get("origin");
  const esperado = `${req.protocol}://${req.get("host")}`;
  if (
    req.get("sec-fetch-site") === "cross-site" ||
    (origem && origem !== esperado) ||
    typeof recebido !== "string" ||
    !/^[a-f0-9]{64}$/.test(recebido) ||
    !timingSafeEqual(Buffer.from(recebido), Buffer.from(token))
  ) {
    return res
      .status(403)
      .send("Requisição inválida. Recarregue a página e tente novamente.");
  }
  return next();
}

const tentativas = new Map<string, { quantidade: number; expira: number }>();
export function limitarAutenticacao(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const agora = Date.now();
  // Limite local de desenvolvimento, independente de e-mail para não permitir contorno por variação de conta.
  const chave = `${req.path}:${req.ip}`;
  for (const [id, item] of tentativas)
    if (item.expira <= agora) tentativas.delete(id);
  const item = tentativas.get(chave) ?? {
    quantidade: 0,
    expira: agora + 15 * 60 * 1000,
  };
  item.quantidade += 1;
  tentativas.set(chave, item);
  if (item.quantidade > 30) {
    res.set("Retry-After", String(Math.ceil((item.expira - agora) / 1000)));
    return res
      .status(429)
      .send("Muitas tentativas. Aguarde para tentar novamente.");
  }
  next();
}

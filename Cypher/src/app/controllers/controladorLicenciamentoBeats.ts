import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import * as m from "../models/licenciamentoBeats.js";
import {
  pagamentoConfigurado,
  validarWebhookMP,
} from "../models/mercadoPagoTeste.js";
import { ErroOportunidade } from "../validators/validarOportunidade.js";
type Acao = (req: Request, res: Response) => unknown | Promise<unknown>;
const uid = (res: Response) => res.locals.usuario.id as string;
const preco = (n: number) =>
  (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (n: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(n);
function render(
  res: Response,
  tela: string,
  dados: Record<string, unknown> = {}
) {
  return res.render("pages/beats-licencas", {
    title: "Beats e licenças",
    stylesheet: "beats-licencas",
    path: ["compras", "pedido", "confirmar"].includes(tela)
      ? "/purchases"
      : "/beats",
    tela,
    preco,
    data,
    erro: "",
    chave: randomUUID(),
    checkoutDisponivel: pagamentoConfigurado(),
    ...dados,
  });
}
export const seguro =
  (fn: Acao) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.set("Cache-Control", "private, no-store");
      return await fn(req, res);
    } catch (e) {
      if (
        e instanceof m.ErroBeat ||
        e instanceof m.ErroPagamento ||
        e instanceof ErroOportunidade
      ) {
        res.status(e.status);
        return render(res, "erro", { erro: e.message });
      }
      next(e);
    }
  };
export const ficha: Acao = (req, res) =>
  render(res, "ficha", { beat: m.fichaBeat(uid(res), req.params.id) });
export const gestao: Acao = (req, res) => {
  const beat = m.gestaoBeat(uid(res), req.params.id);
  return render(res, "gestao", {
    beat,
    oferta: beat.ofertas.find((o: any) => o.id === req.query.oferta) || null,
    valores: null,
  });
};
export const oferta: Acao = (req, res) => {
  try {
    m.salvarOfertaBeat(uid(res), req.params.id, req.body, req.params.ofertaId);
  } catch (e) {
    if (e instanceof m.ErroBeat && [400, 409].includes(e.status)) {
      const beat = m.gestaoBeat(uid(res), req.params.id);
      res.status(e.status);
      return render(res, "gestao", {
        beat,
        oferta:
          beat.ofertas.find((o: any) => o.id === req.params.ofertaId) || null,
        valores: req.body,
        erro: e.message,
      });
    }
    throw e;
  }
  return res.redirect(303, `/beats/${req.params.id}/manage?salvo=sim`);
};
export const retirarOferta: Acao = (req, res) => {
  m.retirarOfertaBeat(
    uid(res),
    req.params.id,
    req.params.ofertaId,
    req.body.versao
  );
  return res.redirect(303, `/beats/${req.params.id}/manage`);
};
export const disponibilidade: Acao = (req, res) => {
  m.disponibilidadeBeat(
    uid(res),
    req.params.id,
    req.body.disponivel === "sim",
    req.body.versao
  );
  return res.redirect(303, `/beats/${req.params.id}/manage`);
};
export const upload: Acao = (req, res) => {
  let nome: string;
  try {
    nome = decodeURIComponent(req.get("x-file-name") || "arquivo");
  } catch {
    throw new m.ErroBeat("Nome do arquivo inválido.");
  }
  const a = m.uploadArquivoBeat(
    uid(res),
    req.params.id,
    nome,
    req.query.finalidade,
    req.body
  );
  return res.status(201).json(a);
};
function enviar(res: Response, a: Record<string, any>, baixar: boolean) {
  res.set({
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (baixar) res.attachment(a.nome);
  res.type(a.mime);
  return res.sendFile(path.resolve(m.pastaArquivosBeat(), a.id));
}
export const previa: Acao = (req, res) =>
  enviar(res, m.previaBeat(uid(res), req.params.id), false);
export const arquivoProdutor: Acao = (req, res) =>
  enviar(
    res,
    m.arquivoDoProdutor(uid(res), req.params.id, req.params.arquivoId),
    true
  );
export const adquirir: Acao = (req, res) => {
  const id = m.criarPedidoBeat(
    uid(res),
    req.params.id,
    req.params.ofertaId,
    req.body
  );
  return res.redirect(303, "/purchases/" + id);
};
export const compras: Acao = (_req, res) =>
  render(res, "compras", { itens: m.comprasBeats(uid(res)) });
export const pedido: Acao = (req, res) =>
  render(res, "pedido", {
    pedido: m.pedidoBeat(uid(res), req.params.id),
    retorno: req.query.retorno === "sim",
  });
export const checkout: Acao = async (req, res) => {
  const p = m.pedidoBeat(uid(res), req.params.id);
  if (p.checkoutCatalogo)
    return res.redirect(303, "/purchases/" + p.id + "/checkout");
  return res.redirect(
    303,
    await m.iniciarCheckoutBeat(uid(res), req.params.id)
  );
};
export const revisarCompra: Acao = (req, res) => {
  const p = m.pedidoBeat(uid(res), req.params.id);
  if (!p.checkoutCatalogo)
    throw new m.ErroBeat(
      "Este pedido utiliza o checkout do provedor de pagamento.",
      403
    );
  return render(res, "confirmar", { pedido: p });
};
export const confirmarCompra: Acao = (req, res) => {
  if (req.body.confirmacao !== "sim")
    throw new m.ErroBeat(
      "Confirme a aquisição e as condições da oferta antes de continuar."
    );
  m.confirmarLicencaCatalogo(uid(res), req.params.id);
  return res.redirect(303, "/purchases/" + req.params.id);
};
export const atualizar: Acao = async (req, res) => {
  await m.atualizarPedidoBeat(uid(res), req.params.id);
  return res.redirect(303, "/purchases/" + req.params.id);
};
export const download: Acao = (req, res) =>
  enviar(
    res,
    m.downloadBeat(uid(res), req.params.id, req.params.arquivoId),
    true
  );
export const licenca: Acao = (req, res) => {
  const p = m.pedidoBeat(uid(res), req.params.id);
  if (!p.licenca_id)
    throw new m.ErroBeat("Este pedido ainda não possui uma licença.", 404);
  const s = p.snapshot;
  res
    .attachment(`licenca-cypher-${p.licenca_id}.txt`)
    .type("text/plain; charset=utf-8");
  return res.send(
    [
      "CYPHER • LICENÇA DE UTILIZAÇÃO",
      "Autorização vinculada exclusivamente às condições expressas desta oferta.",
      `Identificador: ${p.licenca_id}`,
      `Pedido: ${p.id}`,
      `Concedida em: ${data(p.concedida_em)}`,
      `Situação: ${p.suspensa_em ? "suspensa • " + p.motivo : "ativa"}`,
      `Beat: ${s.titulo}`,
      `Produtor: ${s.produtor}`,
      `Titular: ${s.comprador}`,
      `Modalidade: ${s.modalidade === "free" ? "Free Use" : "Premium não exclusiva"}`,
      `Versão dos termos: ${s.numero}`,
      `Aceite: ${data(s.aceite_em)}`,
      p.checkoutCatalogo
        ? "Cobrança: nenhuma."
        : `Valor da oferta: ${preco(s.valor_centavos)}`,
      ...Object.entries(s.oferta).map(([k, v]) => `${k}: ${v}`),
      "Arquivos: " + s.arquivos.map((a: any) => a.nome).join(", "),
      "Esta autorização contempla somente as permissões expressas. Não concede autoria, revenda, sublicenciamento ou exclusividade por presunção.",
    ].join("\n\n")
  );
};
export async function webhook(req: Request, res: Response) {
  const id = req.query["data.id"];
  if (
    typeof id !== "string" ||
    !validarWebhookMP(
      id,
      req.get("x-signature") || "",
      req.get("x-request-id") || ""
    )
  )
    return res.sendStatus(401);
  if (
    req.body?.type !== "payment" ||
    String(req.body?.data?.id) !== id ||
    req.body?.live_mode !== false
  )
    return res.sendStatus(400);
  try {
    await m.conferirPagamentoBeat(id);
    return res.sendStatus(200);
  } catch (e) {
    if (e instanceof m.ErroBeat || e instanceof m.ErroPagamento)
      return res.sendStatus(
        e.status === 503 ? 503 : e.status === 404 ? 200 : 400
      );
    console.error("Falha ao conferir notificação de pagamento de teste.");
    return res.sendStatus(500);
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";

export class ErroPagamento extends Error {
  constructor(
    message: string,
    public status = 503
  ) {
    super(message);
  }
}
export type ConfiguracaoMP = {
  token: string;
  segredo: string;
  base: string;
  ambiente: string;
};
export function configuracaoMP(): ConfiguracaoMP {
  return {
    token: process.env.CYPHER_MP_ACCESS_TOKEN || "",
    segredo: process.env.CYPHER_MP_WEBHOOK_SECRET || "",
    base: process.env.CYPHER_PUBLIC_URL || "",
    ambiente: process.env.CYPHER_MP_ENV || "",
  };
}
export function pagamentoConfigurado() {
  const c = configuracaoMP();
  return Boolean(
    c.ambiente === "test" &&
    c.token.trim() &&
    c.segredo.trim() &&
    basePublica(c.base)
  );
}
function basePublica(valor: string) {
  try {
    const base = new URL(valor);
    return base.protocol === "https:" &&
      !base.username &&
      !base.password &&
      !base.search &&
      !base.hash &&
      base.pathname === "/"
      ? base
      : null;
  } catch {
    return null;
  }
}
export function clienteMercadoPago(
  c = configuracaoMP(),
  transporte: typeof fetch = fetch
) {
  async function api(
    caminho: string,
    metodo = "GET",
    corpo?: unknown,
    chave?: string
  ) {
    if (c.ambiente !== "test" || !c.token || !c.segredo)
      throw new ErroPagamento(
        "O pagamento está temporariamente indisponível."
      );
    if (!basePublica(c.base))
      throw new ErroPagamento(
        "O serviço de pagamento está temporariamente indisponível."
      );
    try {
      const resposta = await transporte(
        "https://api.mercadopago.com" + caminho,
        {
          method: metodo,
          headers: {
            Authorization: `Bearer ${c.token}`,
            "Content-Type": "application/json",
            ...(chave ? { "X-Idempotency-Key": chave } : {}),
          },
          body: corpo === undefined ? undefined : JSON.stringify(corpo),
          signal: AbortSignal.timeout(15000),
          redirect: "error",
        }
      );
      if (!resposta.ok)
        throw new ErroPagamento(
          "Não foi possível consultar o pagamento. Tente novamente."
        );
      return (await resposta.json()) as Record<string, any>;
    } catch (e) {
      if (e instanceof ErroPagamento) throw e;
      throw new ErroPagamento(
        "O Mercado Pago está indisponível. Seu pedido foi preservado."
      );
    }
  }
  async function vendedorTeste() {
    const u = await api("/users/me");
    // Credenciais atuais de contas de teste também começam com APP_USR.
    // A confirmação da conta evita decidir o ambiente pelo prefixo do token.
    if (!Array.isArray(u.tags) || !u.tags.includes("test_user") || !u.id)
      throw new ErroPagamento(
        "O serviço de pagamento está temporariamente indisponível."
      );
    return String(u.id);
  }
  return {
    vendedorTeste,
    criarPreferencia: (corpo: unknown, chave: string) =>
      api("/checkout/preferences", "POST", corpo, chave),
    buscarPreferencias: (referencia: string) =>
      api(
        "/checkout/preferences/search?external_reference=" +
          encodeURIComponent(referencia)
      ),
    preferencia: (id: string) => {
      if (!/^[a-zA-Z0-9-]{1,150}$/.test(id))
        throw new ErroPagamento("Preferência inválida.", 400);
      return api("/checkout/preferences/" + encodeURIComponent(id));
    },
    pagamento: (id: string) => {
      if (!/^\d{1,30}$/.test(id))
        throw new ErroPagamento("Pagamento inválido.", 400);
      return api("/v1/payments/" + id);
    },
    buscarPagamentos: (referencia: string) =>
      api(
        "/v1/payments/search?external_reference=" +
          encodeURIComponent(referencia) +
          "&sort=date_created&criteria=desc&limit=10"
      ),
  };
}
export type ClienteMP = ReturnType<typeof clienteMercadoPago>;
export function validarWebhookMP(
  id: string,
  assinatura: string,
  requisicao: string,
  segredo = configuracaoMP().segredo
) {
  if (!segredo || !/^\d{1,30}$/.test(id) || !/^[\w-]{1,100}$/.test(requisicao))
    return false;
  const partes = assinatura.split(",").map(p => p.trim().split("="));
  if (partes.length !== 2) return false;
  const valores = Object.fromEntries(partes),
    { ts, v1 } = valores;
  if (!/^\d{10,16}$/.test(ts || "") || !/^[a-f0-9]{64}$/.test(v1 || ""))
    return false;
  const esperado = createHmac("sha256", segredo)
    .update(`id:${id};request-id:${requisicao};ts:${ts};`)
    .digest();
  return timingSafeEqual(esperado, Buffer.from(v1, "hex"));
}

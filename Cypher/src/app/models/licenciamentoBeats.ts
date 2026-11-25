import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  conexaoInternaCypher,
  caminhoBancoCypher,
  criarNotificacaoCypher,
} from "./bancoDados.js";
import { conta } from "./oportunidades.js";
import { detectarMidia } from "./projetosTrabalho.js";
import { objetoDisponivel, objetoSobMedida } from "./politicasModeracao.js";
import {
  clienteMercadoPago,
  configuracaoMP,
  type ClienteMP,
  ErroPagamento,
} from "./mercadoPagoTeste.js";

type Linha = Record<string, any>;
const db = conexaoInternaCypher;
const um = (sql: string, ...v: any[]) =>
  db()
    .prepare(sql)
    .get(...v) as Linha | undefined;
const todos = (sql: string, ...v: any[]) =>
  db()
    .prepare(sql)
    .all(...v) as Linha[];
const run = (sql: string, ...v: any[]) =>
  db()
    .prepare(sql)
    .run(...v);
export class ErroBeat extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
const exigir: (
  condicao: unknown,
  mensagem: string,
  status?: number
) => asserts condicao = (c, m, s = 400) => {
  if (!c) throw new ErroBeat(m, s);
};
function texto(v: unknown, nome: string, max: number, min = 0) {
  exigir(
    typeof v === "string" && v.trim().length >= min && v.trim().length <= max,
    `${nome}: use entre ${min} e ${max} caracteres.`
  );
  return v.trim();
}
function usuario(ator: string) {
  const u = conta(ator);
  exigir(
    u.tipo_conta === "profissional" || u.tipo_conta === "consumidor",
    "Use sua conta pessoal para acessar o Banco de Beats.",
    403
  );
  return u;
}
function registro(id: string) {
  return um(
    "SELECT b.*,p.nome produtor,p.identificador FROM beats b JOIN perfis p ON p.usuario_id=b.produtor_id WHERE b.id=?",
    id
  );
}
function config(id: string) {
  return (
    um("SELECT * FROM beat_catalogo WHERE beat_id=?", id) || {
      disponivel: 1,
      retirado: 0,
      versao: 1,
      previa_id: null,
    }
  );
}
function dono(ator: string, id: string) {
  usuario(ator);
  const b = registro(id);
  exigir(
    b &&
      !b.demonstracao &&
      b.produtor_id === ator &&
      objetoDisponivel(db(), "beat", id, ator),
    "Beat indisponível.",
    404
  );
  return b;
}
function acessivel(ator: string, id: string): Linha {
  usuario(ator);
  const b = registro(id),
    c = config(id);
  exigir(
    b &&
      !b.demonstracao &&
      !c.retirado &&
      objetoDisponivel(db(), "beat", id, ator),
    "Beat indisponível.",
    404
  );
  return { ...b, ...c, id };
}
function configurar(id: string) {
  run(
    "INSERT INTO beat_catalogo(beat_id,atualizado_em) VALUES(?,?) ON CONFLICT DO NOTHING",
    id,
    Date.now()
  );
}
export function pastaArquivosBeat() {
  return path.join(path.dirname(caminhoBancoCypher()), "arquivos-beats");
}
export function arquivosBeat(ator: string, id: string) {
  dono(ator, id);
  return todos(
    "SELECT id,nome,mime,bytes,finalidade FROM beat_arquivos WHERE beat_id=? ORDER BY criado_em",
    id
  );
}
export function uploadArquivoBeat(
  ator: string,
  id: string,
  nome: unknown,
  finalidade: unknown,
  buffer: Buffer
) {
  dono(ator, id);
  exigir(
    finalidade === "previa" || finalidade === "entrega",
    "Selecione prévia ou arquivo de entrega."
  );
  exigir(
    Buffer.isBuffer(buffer) &&
      buffer.length > 0 &&
      buffer.length <= (finalidade === "previa" ? 12 : 50) * 1024 * 1024,
    "Use até 12 MB na prévia ou 50 MB por arquivo de entrega."
  );
  let mime: string;
  try {
    mime = detectarMidia(buffer);
  } catch {
    throw new ErroBeat("Use áudio MP3, WAV ou OGG.");
  }
  exigir(
    ["audio/mpeg", "audio/wav", "audio/ogg"].includes(mime),
    "Use áudio MP3, WAV ou OGG."
  );
  const nomeSeguro = texto(nome, "Nome do arquivo", 160, 1).replace(
    /[\x00-\x1f\x7f/\\]/g,
    "_"
  );
  const arquivoId = randomUUID(),
    pasta = pastaArquivosBeat();
  fs.mkdirSync(pasta, { recursive: true });
  db()
    .transaction(() => {
      exigir(
        um(
          "SELECT coalesce(sum(bytes),0) total FROM beat_arquivos WHERE autor_id=?",
          ator
        )!.total +
          buffer.length <=
          500 * 1024 * 1024,
        "Seu acervo de beats atingiu o limite de 500 MB."
      );
      fs.writeFileSync(path.join(pasta, arquivoId), buffer, { flag: "wx" });
      try {
        run(
          "INSERT INTO beat_arquivos(id,beat_id,autor_id,nome,mime,bytes,finalidade,criado_em) VALUES(?,?,?,?,?,?,?,?)",
          arquivoId,
          id,
          ator,
          nomeSeguro,
          mime,
          buffer.length,
          finalidade,
          Date.now()
        );
        configurar(id);
        if (finalidade === "previa")
          run(
            "UPDATE beat_catalogo SET previa_id=?,versao=versao+1,atualizado_em=? WHERE beat_id=?",
            arquivoId,
            Date.now(),
            id
          );
      } catch (e) {
        fs.rmSync(path.join(pasta, arquivoId), { force: true });
        throw e;
      }
    })
    .immediate();
  return { id: arquivoId, nome: nomeSeguro, mime };
}
export function previaBeat(ator: string, id: string) {
  const b = acessivel(ator, id);
  exigir(b.previa_id, "Prévia não disponível.", 404);
  const a = um(
    "SELECT * FROM beat_arquivos WHERE id=? AND beat_id=? AND finalidade='previa'",
    b.previa_id,
    id
  );
  exigir(a, "Prévia não disponível.", 404);
  return a;
}
function ofertas(id: string, todas = false): Linha[] {
  return todos(
    `SELECT o.id,o.ativa,v.* FROM ofertas_beats o JOIN beat_oferta_versoes v ON v.oferta_id=o.id
    WHERE o.beat_id=? ${todas ? "" : "AND o.ativa=1"} AND v.numero=(SELECT max(numero) FROM beat_oferta_versoes WHERE oferta_id=o.id) ORDER BY o.criado_em,o.id`,
    id
  ).map(o => ({
    ...o,
    id: o.oferta_id,
    versao_id: o.id,
    termos: JSON.parse(o.termos_json),
    arquivos: JSON.parse(o.arquivos_json),
  }));
}
export function fichaBeat(ator: string, id: string) {
  const b = acessivel(ator, id);
  const cena = um(
    "SELECT dados_json FROM catalogo_cena WHERE tipo='beat' AND id=?",
    id
  );
  const comercial = cena ? JSON.parse(cena.dados_json) : null;
  return {
    ...b,
    ofertas: ofertas(id),
    proprio: b.produtor_id === ator,
    vendidoExclusivo: Boolean(comercial?.vendidoPara),
    compradorExclusivo: comercial?.comprador || "",
  };
}
export function gestaoBeat(ator: string, id: string) {
  const b = dono(ator, id);
  return {
    ...b,
    ...config(id),
    id,
    ofertas: ofertas(id, true),
    arquivos: arquivosBeat(ator, id),
  };
}
export function salvarOfertaBeat(
  ator: string,
  id: string,
  b: Linha,
  ofertaId?: string
) {
  dono(ator, id);
  exigir(
    ["free", "premium", "exclusiva"].includes(b.modalidade),
    "Modalidade inválida."
  );
  const titulo = texto(b.titulo, "Nome da oferta", 80, 3);
  const termos = {
    titulo,
    usos: texto(b.usos, "Usos permitidos", 2000, 10),
    restricoes: texto(b.restricoes, "Restrições", 2000, 10),
    creditos: texto(b.creditos, "Atribuição e créditos", 600, 3),
    limites: texto(b.limites, "Limites de uso", 1200, 3),
    entregaveis: texto(b.entregaveis, "Entregáveis", 600, 3),
  };
  const precoBruto = typeof b.preco === "string" ? b.preco.trim() : "";
  exigir(
    b.modalidade !== "premium" || /^\d{1,6}([.,]\d{1,2})?$/.test(precoBruto),
    "Informe um preço Premium válido em reais."
  );
  const preco =
    b.modalidade === "premium"
      ? Math.round(Number(precoBruto.replace(",", ".")) * 100)
      : 0;
  exigir(
    b.modalidade !== "premium" || preco >= 100,
    "A oferta Premium deve custar ao menos R$ 1,00."
  );
  const arquivos = [
    ...new Set(
      Array.isArray(b.arquivos)
        ? b.arquivos
        : typeof b.arquivos === "string"
          ? [b.arquivos]
          : []
    ),
  ];
  exigir(
    arquivos.length > 0 && arquivos.length <= 10,
    "Selecione de 1 a 10 arquivos de entrega."
  );
  for (const a of arquivos)
    exigir(
      typeof a === "string" &&
        um(
          "SELECT 1 FROM beat_arquivos WHERE id=? AND beat_id=? AND finalidade='entrega'",
          a,
          id
        ),
      "Arquivo de entrega inválido."
    );
  return db()
    .transaction(() => {
      let anterior: Linha | undefined;
      if (ofertaId) {
        anterior = um(
          "SELECT * FROM ofertas_beats WHERE id=? AND beat_id=?",
          ofertaId,
          id
        );
        exigir(anterior, "Oferta indisponível.", 404);
      }
      const ultima = ofertaId
        ? um(
            "SELECT max(numero) numero FROM beat_oferta_versoes WHERE oferta_id=?",
            ofertaId
          )!.numero || 0
        : 0;
      exigir(
        Number(b.versao || 0) === ultima,
        "A oferta mudou. Atualize a página antes de salvar.",
        409
      );
      const oid = ofertaId || randomUUID(),
        vid = randomUUID();
      if (!anterior)
        run(
          "INSERT INTO ofertas_beats(id,beat_id,tipo,preco_centavos,descricao) VALUES(?,?,?,?,?)",
          oid,
          id,
          b.modalidade === "free"
            ? "Free Use"
            : b.modalidade === "premium"
              ? "Premium não exclusiva"
              : "Exclusiva sob negociação",
          preco,
          titulo
        );
      else
        run(
          "UPDATE ofertas_beats SET tipo=?,preco_centavos=?,descricao=?,ativa=1,atualizado_em=CURRENT_TIMESTAMP WHERE id=?",
          b.modalidade === "free"
            ? "Free Use"
            : b.modalidade === "premium"
              ? "Premium não exclusiva"
              : "Exclusiva sob negociação",
          preco,
          titulo,
          oid
        );
      run(
        "INSERT INTO beat_oferta_versoes(id,oferta_id,numero,modalidade,preco_centavos,termos_json,arquivos_json,criado_em) VALUES(?,?,?,?,?,?,?,?)",
        vid,
        oid,
        ultima + 1,
        b.modalidade,
        preco,
        JSON.stringify(termos),
        JSON.stringify(arquivos),
        Date.now()
      );
      configurar(id);
      return oid;
    })
    .immediate();
}
export function retirarOfertaBeat(
  ator: string,
  id: string,
  ofertaId: string,
  versao: unknown
) {
  dono(ator, id);
  const o = ofertas(id, true).find(o => o.id === ofertaId);
  exigir(o, "Oferta indisponível.", 404);
  exigir(
    Number(versao) === o.numero,
    "A oferta mudou. Atualize a página.",
    409
  );
  run(
    "UPDATE ofertas_beats SET ativa=0,atualizado_em=CURRENT_TIMESTAMP WHERE id=?",
    ofertaId
  );
}
export function disponibilidadeBeat(
  ator: string,
  id: string,
  disponivel: boolean,
  versao: unknown
) {
  dono(ator, id);
  db()
    .transaction(() => {
      configurar(id);
      exigir(
        Number(versao) === config(id).versao,
        "O catálogo mudou. Atualize a página.",
        409
      );
      run(
        "UPDATE beat_catalogo SET disponivel=?,versao=versao+1,atualizado_em=? WHERE beat_id=?",
        Number(disponivel),
        Date.now(),
        id
      );
    })
    .immediate();
}
export function retirarBeatComHistorico(ator: string, id: string) {
  dono(ator, id);
  db()
    .transaction(() => {
      configurar(id);
      run(
        "UPDATE beat_catalogo SET retirado=1,disponivel=0,versao=versao+1,atualizado_em=? WHERE beat_id=?",
        Date.now(),
        id
      );
      run("UPDATE ofertas_beats SET ativa=0 WHERE beat_id=?", id);
    })
    .immediate();
}
function autorizarPedido(p: Linha) {
  run(
    "INSERT INTO beat_licencas(id,pedido_id,concedida_em) VALUES(?,?,?) ON CONFLICT(pedido_id) DO NOTHING",
    randomUUID(),
    p.id,
    Date.now()
  );
  criarNotificacaoCypher({
    usuarioDestinoId: p.comprador_id,
    tipo: "beat_licenciado",
    titulo: "Arquivos do beat disponíveis",
    mensagem: "Consulte os termos aceitos e seus arquivos em Minhas Compras.",
    url: "/purchases/" + p.id,
    entidadeTipo: "pedido_beat",
    entidadeId: p.id,
    chaveOrigem: "beat-licenca:" + p.id,
  });
}
export function criarPedidoBeat(
  ator: string,
  id: string,
  ofertaId: string,
  b: Linha
) {
  const u = usuario(ator),
    beat = acessivel(ator, id);
  exigir(
    beat.produtor_id !== ator,
    "Você pode conferir seus arquivos pela gestão do beat."
  );
  exigir(
    beat.disponivel,
    "As novas aquisições deste beat estão pausadas.",
    409
  );
  const o = ofertas(id).find(o => o.id === ofertaId);
  exigir(
    o && o.modalidade !== "exclusiva",
    "Esta oferta não possui aquisição automática.",
    400
  );
  exigir(b.aceite === "sim", "Leia e aceite os termos da oferta.");
  exigir(
    b.versao === o.versao_id,
    "Os termos mudaram. Confira a oferta atualizada.",
    409
  );
  const chave = texto(b.chave_envio, "Identificador de envio", 100, 16);
  exigir(/^[a-zA-Z0-9-]+$/.test(chave), "Identificador de envio inválido.");
  return db()
    .transaction(() => {
      const existente = um(
        "SELECT * FROM beat_pedidos WHERE comprador_id=? AND chave_envio=?",
        ator,
        chave
      );
      if (existente) {
        exigir(
          existente.versao_oferta_id === o.versao_id,
          "Este identificador já foi usado em outra oferta.",
          409
        );
        return existente.id as string;
      }
      if (o.modalidade === "free") {
        const anterior = um(
          "SELECT p.id FROM beat_pedidos p JOIN beat_licencas l ON l.pedido_id=p.id WHERE p.comprador_id=? AND p.versao_oferta_id=? AND l.suspensa_em IS NULL",
          ator,
          o.versao_id
        );
        if (anterior) return anterior.id as string;
      }
      exigir(
        um(
          "SELECT count(*) n FROM beat_pedidos WHERE comprador_id=? AND criado_em>?",
          ator,
          Date.now() - 86400000
        )!.n < 30,
        "Você atingiu o limite diário de solicitações.",
        429
      );
      const pid = randomUUID(),
        snapshot = {
          titulo: beat.titulo,
          produtor: beat.produtor,
          produtor_id: beat.produtor_id,
          comprador: um("SELECT nome FROM perfis WHERE usuario_id=?", u.id)!
            .nome,
          oferta: o.termos,
          modalidade: o.modalidade,
          numero: o.numero,
          valor_centavos: o.preco_centavos,
          arquivos: o.arquivos.map((a: string) =>
            um("SELECT id,nome,mime,bytes FROM beat_arquivos WHERE id=?", a)
          ),
          aceite_em: Date.now(),
          demonstrativa: true,
          catalogo_cena: Boolean(
            um(
              "SELECT 1 FROM catalogo_cena WHERE tipo='beat' AND id=? AND json_extract(dados_json,'$.licenciamentoLocal')=1",
              id
            )
          ),
        };
      run(
        "INSERT INTO beat_pedidos(id,comprador_id,beat_id,versao_oferta_id,snapshot_json,valor_centavos,estado,chave_envio,criado_em,atualizado_em) VALUES(?,?,?,?,?,?,?,?,?,?)",
        pid,
        ator,
        id,
        o.versao_id,
        JSON.stringify(snapshot),
        o.preco_centavos,
        o.modalidade === "free" ? "aprovado" : "criando",
        chave,
        Date.now(),
        Date.now()
      );
      if (o.modalidade === "free")
        autorizarPedido({ id: pid, comprador_id: ator });
      return pid;
    })
    .immediate();
}
export function pedidoBeat(ator: string, id: string): Linha {
  usuario(ator);
  const p = um(
    "SELECT p.*,l.id licenca_id,l.concedida_em,l.suspensa_em,l.motivo FROM beat_pedidos p LEFT JOIN beat_licencas l ON l.pedido_id=p.id WHERE p.id=? AND p.comprador_id=?",
    id,
    ator
  );
  exigir(p, "Pedido indisponível.", 404);
  const snapshot = JSON.parse(p.snapshot_json);
  return {
    ...p,
    snapshot,
    checkoutCatalogo: Boolean(
      snapshot.catalogo_cena &&
      um(
        "SELECT 1 FROM catalogo_cena WHERE tipo='beat' AND id=? AND json_extract(dados_json,'$.licenciamentoLocal')=1",
        p.beat_id
      )
    ),
  };
}
export function confirmarLicencaCatalogo(ator: string, id: string) {
  return db()
    .transaction(() => {
      const p = pedidoBeat(ator, id);
      exigir(
        p.checkoutCatalogo,
        "Este pedido utiliza o checkout do provedor de pagamento.",
        403
      );
      if (p.estado === "aprovado") return id;
      exigir(
        ["criando", "pendente"].includes(p.estado),
        "Este pedido não pode ser confirmado.",
        409
      );
      const b = acessivel(ator, p.beat_id);
      exigir(
        b.disponivel,
        "As novas aquisições deste beat estão pausadas.",
        409
      );
      exigir(p.snapshot.modalidade === "premium", "Modalidade incompatível.");
      run(
        "UPDATE beat_pedidos SET estado='aprovado',atualizado_em=? WHERE id=?",
        Date.now(),
        id
      );
      autorizarPedido(p);
      run(
        "INSERT INTO catalogo_cena(tipo,id,chave,ficcional,dados_json,atualizado_em) VALUES('aquisicao',?,?,1,?,?) ON CONFLICT(tipo,id) DO NOTHING",
        id,
        "aquisicao:" + id,
        JSON.stringify({
          pedido: id,
          origem: "catalogo-local",
          sem_operacao_financeira: true,
        }),
        Date.now()
      );
      return id;
    })
    .immediate();
}
export function comprasBeats(ator: string) {
  usuario(ator);
  return todos(
    "SELECT id FROM beat_pedidos WHERE comprador_id=? ORDER BY criado_em DESC LIMIT 200",
    ator
  ).map(p => pedidoBeat(ator, p.id));
}
function checkoutPermitido(u: unknown) {
  if (typeof u !== "string") return false;
  try {
    const url = new URL(u);
    return (
      url.protocol === "https:" &&
      [
        "www.mercadopago.com.br",
        "www.mercadopago.com",
        "sandbox.mercadopago.com.br",
        "sandbox.mercadopago.com",
      ].includes(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export async function iniciarCheckoutBeat(
  ator: string,
  id: string,
  mp: ClienteMP = clienteMercadoPago()
) {
  let p = pedidoBeat(ator, id);
  exigir(p.snapshot.modalidade === "premium", "Esta oferta não usa checkout.");
  exigir(
    !["aprovado", "reembolsado", "contestado", "cancelado"].includes(p.estado),
    "Este pedido já foi concluído.",
    409
  );
  const beat = acessivel(ator, p.beat_id);
  exigir(beat.disponivel, "As novas aquisições estão pausadas.", 409);
  const recebedor = await mp.vendedorTeste();
  exigir(
    !p.recebedor_id || p.recebedor_id === recebedor,
    "Não foi possível retomar o pedido nesta configuração. Consulte o suporte.",
    409
  );
  // Persiste a identidade verificada antes da chamada externa; retries recuperam a preferência.
  run(
    "UPDATE beat_pedidos SET recebedor_id=?,atualizado_em=? WHERE id=?",
    recebedor,
    Date.now(),
    id
  );
  if (p.preferencia_id && checkoutPermitido(p.checkout_url))
    return p.checkout_url as string;
  const busca = await mp.buscarPreferencias(id);
  const existentes = Array.isArray(busca.elements)
    ? busca.elements
    : Array.isArray(busca.results)
      ? busca.results
      : [];
  const base = configuracaoMP().base.replace(/\/$/, "");
  let pref = existentes.find(
    (e: Linha) =>
      e.external_reference === id && String(e.collector_id) === recebedor
  );
  // A busca retorna um resumo; a URL do checkout pertence ao detalhe da preferência.
  if (pref) pref = await mp.preferencia(String(pref.id));
  if (!pref)
    pref = await mp.criarPreferencia(
      {
        items: [
          {
            id: p.versao_oferta_id,
            title: p.snapshot.titulo.slice(0, 200),
            description: "Cypher • licença Premium não exclusiva",
            quantity: 1,
            currency_id: "BRL",
            unit_price: p.valor_centavos / 100,
          },
        ],
        external_reference: id,
        metadata: {
          cypher_order_id: id,
          cypher_offer_version: p.versao_oferta_id,
        },
        back_urls: {
          success: base + "/purchases/" + id + "?retorno=sim",
          pending: base + "/purchases/" + id + "?retorno=sim",
          failure: base + "/purchases/" + id + "?retorno=sim",
        },
        notification_url: base + "/payments/mercadopago/webhook",
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 86400000).toISOString(),
      },
      id
    );
  exigir(
    pref &&
      typeof pref.id === "string" &&
      String(pref.collector_id) === recebedor &&
      pref.external_reference === id,
    "A preferência recebida não corresponde ao pedido.",
    502
  );
  // Conta vendedora foi verificada como test_user; a URL produtiva também hospeda seu checkout de teste.
  const url = pref.init_point;
  exigir(
    checkoutPermitido(url),
    "Não foi possível abrir o pagamento. Tente novamente.",
    502
  );
  run(
    "UPDATE beat_pedidos SET preferencia_id=?,checkout_url=?,estado='pendente',atualizado_em=? WHERE id=? AND estado IN('criando','pendente','rejeitado')",
    pref.id,
    url,
    Date.now(),
    id
  );
  p = pedidoBeat(ator, id);
  return p.checkout_url as string;
}
export async function conferirPagamentoBeat(
  pagamentoId: string,
  mp: ClienteMP = clienteMercadoPago()
) {
  const pagamento = await mp.pagamento(pagamentoId);
  const id = pagamento.external_reference;
  exigir(typeof id === "string", "Pagamento sem pedido correspondente.", 400);
  return db()
    .transaction(() => {
      const p = um("SELECT * FROM beat_pedidos WHERE id=?", id);
      exigir(
        p &&
          p.preferencia_id &&
          p.recebedor_id &&
          JSON.parse(p.snapshot_json).modalidade === "premium",
        "Pedido não reconhecido.",
        404
      );
      exigir(
        String(pagamento.id) === pagamentoId &&
          pagamento.live_mode === false &&
          String(pagamento.collector_id) === p.recebedor_id &&
          pagamento.currency_id === "BRL" &&
          Number.isFinite(pagamento.transaction_amount) &&
          Math.round(pagamento.transaction_amount * 100) === p.valor_centavos &&
          pagamento.metadata?.cypher_order_id === id &&
          pagamento.metadata?.cypher_offer_version === p.versao_oferta_id,
        "O pagamento não corresponde ao pedido registrado.",
        409
      );
      const anterior = um(
        "SELECT * FROM beat_pagamentos WHERE id=?",
        pagamentoId
      );
      exigir(
        !anterior || anterior.pedido_id === id,
        "Pagamento já associado a outro pedido.",
        409
      );
      const data = pagamento.date_last_updated;
      exigir(
        typeof data === "string" && Number.isFinite(Date.parse(data)),
        "Atualização do pagamento inválida.",
        409
      );
      if (anterior && Date.parse(data) < Date.parse(anterior.atualizado_origem))
        return id;
      const estados: Record<string, string> = {
        approved: "aprovado",
        pending: "pendente",
        in_process: "pendente",
        rejected: "rejeitado",
        cancelled: "cancelado",
        refunded: "reembolsado",
        charged_back: "contestado",
      };
      exigir(
        Object.hasOwn(estados, pagamento.status),
        "Situação de pagamento desconhecida.",
        409
      );
      const estado = estados[pagamento.status];
      // Um checkout pode ter várias tentativas: a primeira recusa não impede um pagamento posterior.
      // Um evento de outra tentativa nunca suspende ou reescreve a licença concedida pela tentativa válida.
      if (p.pagamento_id && p.pagamento_id !== pagamentoId) {
        run(
          "INSERT INTO beat_pagamentos(id,pedido_id,estado,atualizado_origem,verificado_em) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET estado=excluded.estado,atualizado_origem=excluded.atualizado_origem,verificado_em=excluded.verificado_em",
          pagamentoId,
          id,
          estado,
          data,
          Date.now()
        );
        if (["aprovado", "reembolsado", "contestado"].includes(p.estado))
          return id;
        const selecionado = um(
          "SELECT atualizado_origem FROM beat_pagamentos WHERE id=?",
          p.pagamento_id
        );
        if (
          estado !== "aprovado" &&
          selecionado &&
          Date.parse(data) <= Date.parse(selecionado.atualizado_origem)
        )
          return id;
      }
      // Atualizações atrasadas nunca revertem concessão válida a pendente/rejeitada.
      if (
        ["aprovado", "reembolsado", "contestado"].includes(p.estado) &&
        ["pendente", "rejeitado", "cancelado"].includes(estado)
      )
        return id;
      if (
        ["reembolsado", "contestado"].includes(p.estado) &&
        estado === "aprovado"
      )
        return id;
      run(
        "INSERT INTO beat_pagamentos(id,pedido_id,estado,atualizado_origem,verificado_em) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET estado=excluded.estado,atualizado_origem=excluded.atualizado_origem,verificado_em=excluded.verificado_em",
        pagamentoId,
        id,
        estado,
        data,
        Date.now()
      );
      run(
        "UPDATE beat_pedidos SET estado=?,pagamento_id=?,atualizado_em=? WHERE id=?",
        estado,
        pagamentoId,
        Date.now(),
        id
      );
      if (estado === "aprovado") autorizarPedido(p);
      if (["reembolsado", "contestado"].includes(estado))
        run(
          "UPDATE beat_licencas SET suspensa_em=coalesce(suspensa_em,?),motivo=? WHERE pedido_id=?",
          Date.now(),
          "Pagamento " + estado,
          id
        );
      return id;
    })
    .immediate();
}
export async function atualizarPedidoBeat(
  ator: string,
  id: string,
  mp: ClienteMP = clienteMercadoPago()
) {
  const p = pedidoBeat(ator, id);
  exigir(p.preferencia_id, "Continue a compra antes de consultar o pagamento.");
  const resultado = await mp.buscarPagamentos(id);
  for (const pg of Array.isArray(resultado.results) ? resultado.results : []) {
    if (String(pg.external_reference) === id)
      await conferirPagamentoBeat(String(pg.id), mp);
  }
  return pedidoBeat(ator, id);
}
export function downloadBeat(
  ator: string,
  pedidoId: string,
  arquivoId: string
) {
  const p = pedidoBeat(ator, pedidoId);
  exigir(
    p.estado === "aprovado" && p.licenca_id && !p.suspensa_em,
    "Arquivo não autorizado para este pedido.",
    403
  );
  const a = p.snapshot.arquivos.find((a: Linha) => a.id === arquivoId);
  exigir(
    a &&
      um(
        "SELECT 1 FROM beat_arquivos WHERE id=? AND beat_id=? AND finalidade='entrega'",
        arquivoId,
        p.beat_id
      ),
    "Arquivo indisponível.",
    404
  );
  exigir(
    !objetoSobMedida(db(), "beat", p.beat_id),
    "A entrega deste beat está em análise. Consulte o suporte.",
    403
  );
  return a;
}
export function arquivoDoProdutor(ator: string, id: string, arquivoId: string) {
  dono(ator, id);
  const a = um(
    "SELECT * FROM beat_arquivos WHERE id=? AND beat_id=?",
    arquivoId,
    id
  );
  exigir(a, "Arquivo indisponível.", 404);
  return a;
}
export { ErroPagamento };

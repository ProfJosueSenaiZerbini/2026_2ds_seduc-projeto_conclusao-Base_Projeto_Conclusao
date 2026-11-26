import { randomUUID } from "node:crypto";
import { conexaoInternaCypher, criarNotificacaoCypher } from "./bancoDados.js";
import { exigirContaInteracao, ErroInteracao } from "./interacoesConteudo.js";
import { objetoDisponivel, objetoSobMedida } from "./politicasModeracao.js";
import { detectarMidia } from "./projetosTrabalho.js";

type Selo = {
  id: string;
  letras: string;
  forma: string;
  cor: string;
  imagem: string | null;
};
export const formasSelo = { disco: "Disco", placa: "Placa", quadro: "Quadro" };
export const coresSelo = {
  oliva: "Oliva",
  areia: "Areia",
  lilas: "Lilás",
  cobre: "Cobre",
};

export function seloPerfil(titular: string) {
  const db = conexaoInternaCypher();
  const selo = db
    .prepare(
      `SELECT s.id,s.letras,s.forma,s.cor,
        CASE WHEN p.id IS NOT NULL THEN '/selos/imagem/' || p.id END imagem
        FROM selos_perfil s LEFT JOIN pedidos_selo_externo p ON p.selo_id=s.id
        WHERE s.autor_id=? AND s.retirado_em IS NULL`
    )
    .get(titular) as Selo | undefined;
  return selo && !objetoSobMedida(db, "selo", selo.id) ? selo : null;
}

export function salvarSeloPerfil(ator: string, dados: Record<string, unknown>) {
  exigirContaInteracao(ator);
  const db = conexaoInternaCypher();
  if (
    !db
      .prepare(
        "SELECT 1 FROM usuarios WHERE id=? AND tipo_conta='profissional'"
      )
      .get(ator)
  )
    throw new ErroInteracao("O selo pertence a uma conta profissional.", 403);
  const retirar = dados.acao === "retirar";
  const letras = String(dados.letras ?? "")
    .trim()
    .toLocaleUpperCase("pt-BR")
    .normalize("NFC");
  const forma = String(dados.forma),
    cor = String(dados.cor);
  if (
    !retirar &&
    (!/^[\p{L}0-9]{1,3}$/u.test(letras) ||
      !Object.hasOwn(formasSelo, forma) ||
      !Object.hasOwn(coresSelo, cor))
  )
    throw new ErroInteracao(
      "Escolha uma forma, uma cor e até três letras ou números para sua assinatura."
    );
  db.transaction(() => {
    const ativo = seloPerfil(ator);
    if (
      !retirar &&
      ativo?.letras === letras &&
      ativo.forma === forma &&
      ativo.cor === cor
    )
      return;
    const agora = Date.now();
    db.prepare(
      "UPDATE selos_perfil SET retirado_em=? WHERE autor_id=? AND retirado_em IS NULL"
    ).run(agora, ator);
    if (!retirar)
      db.prepare(
        "INSERT INTO selos_perfil(id,autor_id,letras,forma,cor,criado_em) VALUES(?,?,?,?,?,?)"
      ).run(randomUUID(), ator, letras, forma, cor, agora);
  }).immediate();
}

export function pedidosSelo(ator?: string) {
  return conexaoInternaCypher()
    .prepare(
      `
    SELECT s.id,s.estado,s.justificativa,s.criado_em,s.motivo,p.nome AS titular
    FROM pedidos_selo_externo s LEFT JOIN perfis p ON p.usuario_id=s.autor_id
    WHERE ${ator === undefined ? "s.estado='pendente'" : "s.autor_id=?"}
    ORDER BY s.criado_em DESC,s.id LIMIT 100
  `
    )
    .all(...(ator === undefined ? [] : [ator])) as {
    id: string;
    estado: string;
    justificativa: string;
    criado_em: number;
    motivo: string | null;
    titular: string;
  }[];
}
export function pedirSelo(ator: string, dados: Record<string, unknown>) {
  exigirContaInteracao(ator);
  const db = conexaoInternaCypher();
  if (
    !db
      .prepare(
        "SELECT 1 FROM usuarios WHERE id=? AND tipo_conta='profissional'"
      )
      .get(ator)
  )
    throw new ErroInteracao("O selo pertence a uma conta profissional.", 403);
  const justificativa =
    typeof dados.justificativa === "string" ? dados.justificativa.trim() : "";
  if (
    dados.direitos !== "sim" ||
    justificativa.length < 10 ||
    justificativa.length > 1500
  )
    throw new ErroInteracao(
      "Descreva a marca e confirme que você tem autorização para utilizá-la."
    );
  const valor =
    typeof dados.imagem === "string" && dados.imagem.length <= 90000
      ? dados.imagem
      : "";
  const formato = /^data:image\/(png|jpeg);base64,([a-zA-Z0-9+/]+={0,2})$/.exec(
    valor
  );
  if (!formato)
    throw new ErroInteracao("Envie uma imagem PNG ou JPEG de até 64 KB.");
  const imagem = Buffer.from(formato[2], "base64");
  let mime: string | undefined;
  try {
    mime = detectarMidia(imagem);
  } catch {
    throw new ErroInteracao("A imagem é inválida.");
  }
  if (imagem.length > 65536 || mime !== "image/" + formato[1])
    throw new ErroInteracao("Envie uma imagem PNG ou JPEG de até 64 KB.");
  if (
    (mime === "image/png" &&
      (imagem.toString("ascii", 12, 16) !== "IHDR" ||
        imagem.toString("ascii", imagem.length - 8, imagem.length - 4) !==
          "IEND" ||
        imagem.readUInt32BE(16) > 2048 ||
        imagem.readUInt32BE(20) > 2048)) ||
    (mime === "image/jpeg" && imagem.readUInt16BE(imagem.length - 2) !== 0xffd9)
  )
    throw new ErroInteracao("A imagem é inválida ou excede o tamanho aceito.");
  const r = db
    .prepare(
      `
    INSERT INTO pedidos_selo_externo(id,autor_id,imagem,mime,justificativa,estado,criado_em)
    VALUES(?,?,?,?,?,'pendente',?) ON CONFLICT DO NOTHING
  `
    )
    .run(randomUUID(), ator, imagem, mime, justificativa, Date.now());
  if (!r.changes)
    throw new ErroInteracao("Já existe uma solicitação em análise.", 409);
}
export function decidirSelo(
  ator: string,
  id: string,
  dados: Record<string, unknown>
) {
  const acao = dados.acao;
  const motivo = typeof dados.motivo === "string" ? dados.motivo.trim() : "";
  if (
    (acao !== "aprovado" && acao !== "recusado") ||
    motivo.length < 10 ||
    motivo.length > 1500
  )
    throw new ErroInteracao("Informe a decisão e sua justificativa.");
  const db = conexaoInternaCypher();
  db.transaction(() => {
    const pedido = db
      .prepare(
        "SELECT autor_id FROM pedidos_selo_externo WHERE id=? AND estado='pendente'"
      )
      .get(id) as { autor_id: string } | undefined;
    if (!pedido) throw new ErroInteracao("Solicitação indisponível.", 404);
    const agora = Date.now();
    const selo = acao === "aprovado" ? randomUUID() : null;
    if (selo) {
      if (!objetoDisponivel(db, "perfil", pedido.autor_id, pedido.autor_id))
        throw new ErroInteracao(
          "O perfil está indisponível para ativar o selo.",
          409
        );
      db.prepare(
        "UPDATE selos_perfil SET retirado_em=? WHERE autor_id=? AND retirado_em IS NULL"
      ).run(agora, pedido.autor_id);
      db.prepare(
        "INSERT INTO selos_perfil(id,autor_id,letras,forma,cor,criado_em) VALUES(?,?,'','disco','oliva',?)"
      ).run(selo, pedido.autor_id, agora);
    }
    db.prepare(
      "UPDATE pedidos_selo_externo SET estado=?,motivo=?,decidido_em=?,revisor_id=?,selo_id=? WHERE id=?"
    ).run(acao, motivo, agora, ator, selo, id);
    criarNotificacaoCypher({
      usuarioDestinoId: pedido.autor_id,
      tipo: "selo_decisao",
      titulo: "Decisão sobre seu selo profissional",
      mensagem: "Consulte a decisão e a justificativa.",
      url: "/selos/solicitacoes",
      entidadeTipo: "selo",
      entidadeId: id,
      chaveOrigem: "selo-decisao:" + id,
    });
  }).immediate();
}
export function imagemSelo(ator: string, id: string, revisor: boolean) {
  const db = conexaoInternaCypher();
  const pedido = db
    .prepare(
      `
    SELECT p.autor_id,p.imagem,p.mime,p.selo_id,s.retirado_em
    FROM pedidos_selo_externo p LEFT JOIN selos_perfil s ON s.id=p.selo_id WHERE p.id=?
  `
    )
    .get(id) as
    | {
        autor_id: string;
        imagem: Buffer;
        mime: string;
        selo_id: string | null;
        retirado_em: number | null;
      }
    | undefined;
  if (
    !pedido ||
    !(
      revisor ||
      pedido.autor_id === ator ||
      (pedido.selo_id &&
        !pedido.retirado_em &&
        !objetoSobMedida(db, "selo", pedido.selo_id) &&
        objetoDisponivel(db, "perfil", pedido.autor_id, ator))
    )
  )
    throw new ErroInteracao("Imagem indisponível.", 404);
  return pedido;
}

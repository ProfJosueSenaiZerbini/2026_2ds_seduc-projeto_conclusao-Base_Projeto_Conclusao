import {
  situacaoContaModeracao,
  objetoSobMedida,
  objetoDisponivel,
} from "./politicasModeracao.js";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { caminhoBancoCypher, conexaoInternaCypher } from "./bancoDados.js";
import { detectarMidia } from "./projetosTrabalho.js";
import { contatoEtarioPermitido } from "./protecoesConta.js";
import { capaPublicacao } from "./midiasPublicacoes.js";
import { imagemPerfilDemo } from "./catalogoDemonstrativo.js";
import {
  conta,
  profissional,
  todos,
  um,
  semBloqueio,
  notificar,
  historico,
  repeticao,
  registrarOperacao,
  type Linha,
} from "./oportunidades.js";
import { exigirAdministrador } from "./administracao.js";
import {
  exigir,
  texto,
  validarChamada,
  ErroOportunidade,
} from "../validators/validarOportunidade.js";
const db = () => conexaoInternaCypher();
function contatoPermitido(ator: string, alvo: string) {
  const u = conta(ator);
  exigir(
    contatoEtarioPermitido(db(), ator, alvo),
    "Este contato não está disponível pelas proteções etárias da conta.",
    403
  );
  exigir(
    !situacaoContaModeracao(db(), ator).contatoRestrito &&
      !situacaoContaModeracao(db(), alvo).contatoRestrito,
    "Contato restrito por medida administrativa.",
    403
  );
  conta(alvo);
  semBloqueio(ator, alvo);
  exigir(ator !== alvo, "Selecione outra pessoa.");
  const p = um("SELECT * FROM preferencias_contato WHERE usuario_id=?", alvo);
  exigir(
    u.tipo_conta === "consumidor"
      ? p?.consumidores === 1
      : p?.profissionais !== 0,
    "O destinatário não permite este contato.",
    403
  );
}
export function podeIniciarConversa(ator: string, alvo: string) {
  try {
    const origem = conta(ator);
    const destino = conta(alvo);
    if (
      !["consumidor", "profissional"].includes(origem.tipo_conta) ||
      destino.tipo_conta !== "profissional" ||
      !objetoDisponivel(db(), "perfil", alvo, ator)
    )
      return false;
    contatoPermitido(ator, alvo);
    return true;
  } catch (e) {
    if (e instanceof ErroOportunidade) return false;
    throw e;
  }
}
export function iniciarConversa(ator: string, alvo: string) {
  return db()
    .transaction(() => {
      exigir(
        podeIniciarConversa(ator, alvo),
        "Este perfil não está disponível para novo contato.",
        403
      );
      const [a, b] = [ator, alvo].sort();
      db()
        .prepare(
          "INSERT INTO conversas(id,participante_a,participante_b,contexto) VALUES(?,?,?,'Conversa direta') ON CONFLICT DO NOTHING"
        )
        .run(randomUUID(), a, b);
      const id = um(
        "SELECT id FROM conversas WHERE participante_a=? AND participante_b=? AND contexto='Conversa direta'",
        a,
        b
      )!.id;
      db()
        .prepare(
          "DELETE FROM conversas_ocultas WHERE conversa_id=? AND usuario_id=?"
        )
        .run(id, ator);
      return id as string;
    })
    .immediate();
}
function fotoPerfilVisivel(ator: string, alvo: string, identificador?: string) {
  if (!identificador || !objetoDisponivel(db(), "perfil", alvo, ator)) return "";
  const enviada = capaPublicacao(ator, "perfil", alvo);
  const catalogo = !enviada ? imagemPerfilDemo(identificador) : "";
  return enviada
    ? `/publication-media/${encodeURIComponent(enviada)}`
    : catalogo ? `/img/${catalogo}` : "";
}
export function listarConversas(ator: string) {
  return todos(
    `
    SELECT c.id, c.contexto, coalesce(p.nome,a.nome,'Conta') interlocutor,
      p.identificador, p.iniciais,
      CASE WHEN c.participante_a=@ator THEN c.participante_b ELSE c.participante_a END outro_id,
      (SELECT coalesce(nullif(m.texto,''),(SELECT 'Anexo: '||a.nome FROM mensagens_anexos a WHERE a.mensagem_id=m.id))
        FROM mensagens m WHERE m.conversa_id=c.id ORDER BY m.criada_em DESC,m.rowid DESC LIMIT 1) ultima_mensagem,
      (SELECT criada_em FROM mensagens WHERE conversa_id=c.id ORDER BY criada_em DESC,rowid DESC LIMIT 1) ultima_data,
      (SELECT count(*) FROM mensagens m LEFT JOIN mensagens_leituras l ON l.mensagem_id=m.id
        WHERE m.conversa_id=c.id AND m.autor_id<>@ator AND l.mensagem_id IS NULL) nao_lidas
    FROM conversas c
    LEFT JOIN perfis p ON p.usuario_id=CASE WHEN c.participante_a=@ator THEN c.participante_b ELSE c.participante_a END
    LEFT JOIN administradores a ON a.usuario_id=CASE WHEN c.participante_a=@ator THEN c.participante_b ELSE c.participante_a END
    WHERE (c.participante_a=@ator OR c.participante_b=@ator)
      AND NOT EXISTS (SELECT 1 FROM conversas_ocultas o WHERE o.conversa_id=c.id AND o.usuario_id=@ator)
    ORDER BY coalesce((SELECT max(criada_em) FROM mensagens WHERE conversa_id=c.id),c.criada_em) DESC,c.id
  `,
    { ator }
  ).map(c => ({
    ...c,
    foto: fotoPerfilVisivel(ator, c.outro_id, c.identificador),
  }) as Linha);
}
export function listarContatosDisponiveis(ator: string, busca = "") {
  const termo = busca.trim().slice(0, 100);
  const candidatos = todos(
    `SELECT p.usuario_id, p.nome, p.identificador, p.iniciais, p.funcao,
      (SELECT c.id FROM conversas c WHERE c.contexto='Conversa direta'
        AND ((c.participante_a=@ator AND c.participante_b=p.usuario_id)
          OR (c.participante_b=@ator AND c.participante_a=p.usuario_id)) LIMIT 1) conversa_id
      ,NOT EXISTS (
        SELECT 1 FROM conversas c JOIN mensagens m ON m.conversa_id=c.id
        WHERE (c.participante_a=@ator AND c.participante_b=p.usuario_id)
          OR (c.participante_b=@ator AND c.participante_a=p.usuario_id)
      ) novo
    FROM perfis p JOIN usuarios u ON u.id=p.usuario_id
    WHERE p.usuario_id<>@ator AND p.perfil_publico=1 AND u.tipo_conta='profissional'
      AND u.demonstracao=0 AND u.email_confirmado_em IS NOT NULL
      AND (@busca='' OR p.nome LIKE @padrao ESCAPE '!' OR p.identificador LIKE @padrao ESCAPE '!')
      AND (@busca<>'' OR NOT EXISTS (
        SELECT 1 FROM conversas c JOIN mensagens m ON m.conversa_id=c.id
        WHERE (c.participante_a=@ator AND c.participante_b=p.usuario_id)
          OR (c.participante_b=@ator AND c.participante_a=p.usuario_id)
      ))
    ORDER BY p.nome COLLATE NOCASE, p.identificador COLLATE NOCASE LIMIT 200`,
    { ator, busca: termo, padrao: `%${termo.replace(/[!%_]/g, "!$&")}%` }
  );
  return candidatos
    .filter(p => podeIniciarConversa(ator, p.usuario_id))
    .slice(0, 40)
    .map(p => ({
      ...p,
      foto: fotoPerfilVisivel(ator, p.usuario_id, p.identificador),
    }));
}
export function ocultarConversa(ator: string, id: string) {
  const r = db()
    .prepare(
      `
    INSERT INTO conversas_ocultas (conversa_id,usuario_id)
    SELECT id,@ator FROM conversas WHERE id=@id AND @ator IN (participante_a,participante_b)
    ON CONFLICT DO NOTHING
  `
    )
    .run({ id, ator });
  if (!r.changes)
    exigir(
      um(
        "SELECT 1 FROM conversas_ocultas WHERE conversa_id=? AND usuario_id=?",
        id,
        ator
      ),
      "Conversa privada ou indisponível.",
      403
    );
}
export function registrarLeitura(c: Linha, ator: string) {
  const novas = c.mensagens.filter(
    (m: Linha) => m.autor_id !== ator && !m.lida_em
  );
  if (!novas.length) return;
  const inserir = db().prepare(
    "INSERT INTO mensagens_leituras(mensagem_id) VALUES(?) ON CONFLICT DO NOTHING"
  );
  db()
    .transaction(() => {
      for (const mensagem of novas) inserir.run(mensagem.id);
    })
    .immediate();
}
export function conversa(id: string, ator: string) {
  conta(ator);
  const c = um("SELECT * FROM conversas WHERE id=?", id);
  exigir(
    c && (c.participante_a === ator || c.participante_b === ator),
    "Conversa privada ou indisponível.",
    403
  );
  c.outro = c.participante_a === ator ? c.participante_b : c.participante_a;
  const interlocutor = um(`
    SELECT coalesce(p.nome,a.nome,'Conta') nome,p.identificador FROM usuarios u
    LEFT JOIN perfis p ON p.usuario_id=u.id
    LEFT JOIN administradores a ON a.usuario_id=u.id WHERE u.id=?
  `, c.outro);
  c.interlocutor = interlocutor?.nome ?? "Conta";
  c.identificador = interlocutor?.identificador ?? "";
  c.foto = fotoPerfilVisivel(ator, c.outro, c.identificador);
  c.envioPermitido = true;
  c.motivoEnvio = "";
  try {
    contatoPermitido(ator, c.outro);
  } catch (e) {
    if (!(e instanceof ErroOportunidade)) throw e;
    c.envioPermitido = false;
    c.motivoEnvio = e.message;
  }
  c.mensagens = todos(
    "SELECT m.*,coalesce(p.nome,a.nome) AS nome,l.lida_em FROM mensagens m LEFT JOIN perfis p ON p.usuario_id=m.autor_id LEFT JOIN administradores a ON a.usuario_id=m.autor_id LEFT JOIN mensagens_leituras l ON l.mensagem_id=m.id WHERE conversa_id=? ORDER BY m.criada_em,m.rowid",
    id
  ).filter(m => !objetoSobMedida(db(), "mensagem", m.id));
  const anexos = new Map(todos(
    "SELECT a.* FROM mensagens_anexos a JOIN mensagens m ON m.id=a.mensagem_id WHERE m.conversa_id=?",
    id
  ).map(a => [a.mensagem_id, a]));
  for (const mensagem of c.mensagens) mensagem.anexo = anexos.get(mensagem.id) ?? null;
  return c;
}
export function enviarMensagem(
  ator: string,
  id: string,
  conteudo: unknown,
  chave: unknown
) {
  const t = texto(conteudo, 4000),
    key = texto(chave, 100);
  exigir(
    t && /^[a-zA-Z0-9-]{16,100}$/.test(key),
    "Mensagem ou identificador inválido."
  );
  return db()
    .transaction(() => {
      const c = conversa(id, ator);
      exigir(c.envioPermitido, c.motivoEnvio, 403);
      const mid = randomUUID();
      const r = db()
        .prepare(
          "INSERT INTO mensagens(id,conversa_id,autor_id,texto,chave) VALUES(?,?,?,?,?) ON CONFLICT(autor_id,chave) DO NOTHING"
        )
        .run(mid, id, ator, t, key);
      if (r.changes) {
        db()
          .prepare("DELETE FROM conversas_ocultas WHERE conversa_id=?")
          .run(id);
        notificar(
          c.outro,
          "Nova mensagem",
          conta(c.outro).tipo_conta === "administrativo"
            ? `/admin/oportunidades/mensagens/${id}`
            : `/messages/${id}`,
          `mensagem:${mid}`,
          "mensagem"
        );
      }
    })
    .immediate();
}
const pastaAnexos = () => path.join(path.dirname(caminhoBancoCypher()), "anexos-mensagens");
const maximoAnexo = 25 * 1024 * 1024;
const formatosAnexo: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", weba: "audio/webm",
  mp4: "video/mp4", webm: "video/webm",
  txt: "text/plain", md: "text/markdown",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
function validarAnexo(nomeInformado: string, arquivo: Buffer) {
  const nome = path.basename(nomeInformado.replace(/[\\/]/g, "_"))
    .replace(/[\x00-\x1f\x7f]/g, "_").slice(0, 160);
  const extensao = nome.split(".").pop()?.toLowerCase() ?? "";
  const mime = formatosAnexo[extensao];
  exigir(mime && nome.length > extensao.length + 1, "Formato de anexo não permitido.");
  exigir(Buffer.isBuffer(arquivo) && arquivo.length > 0 && arquivo.length <= maximoAnexo,
    "O anexo deve ter até 25 MB.");
  if (mime.startsWith("image/") || mime.startsWith("audio/") || mime.startsWith("video/")) {
    let detectado = "";
    try { detectado = detectarMidia(arquivo); } catch { /* tipo inválido */ }
    exigir(detectado === mime || (mime === "audio/webm" && detectado === "video/webm"),
      "O conteúdo do arquivo não corresponde ao formato informado.");
    if (mime.startsWith("image/")) exigir(arquivo.length <= 8 * 1024 * 1024, "Imagens podem ter até 8 MB.");
  } else if (mime === "text/plain" || mime === "text/markdown") {
    exigir(arquivo.length <= 1024 * 1024, "Textos podem ter até 1 MB.");
    try {
      exigir(!new TextDecoder("utf-8", { fatal: true }).decode(arquivo).includes("\0"), "Texto inválido.");
    } catch { throw new ErroOportunidade("Envie um texto UTF-8 válido."); }
  } else if (mime === "application/pdf") {
    exigir(arquivo.subarray(0, 5).toString() === "%PDF-", "PDF inválido.");
  } else {
    exigir(arquivo.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) &&
      arquivo.includes(Buffer.from("[Content_Types].xml")) &&
      arquivo.includes(Buffer.from("word/document.xml")), "DOCX inválido.");
  }
  return { nome, mime };
}
export function enviarAnexo(ator: string, conversaId: string, nome: string, arquivo: Buffer, legenda: unknown, chave: unknown) {
  const { nome: nomeSeguro, mime } = validarAnexo(nome, arquivo);
  const key = texto(chave, 100);
  const conteudo = texto(legenda, 1000);
  exigir(/^[a-zA-Z0-9-]{16,100}$/.test(key), "Identificador de envio inválido.");
  const id = randomUUID(), anexoId = randomUUID();
  const destino = path.join(pastaAnexos(), anexoId);
  const c = conversa(conversaId, ator);
  exigir(c.envioPermitido, c.motivoEnvio, 403);
  const existente = um("SELECT id FROM mensagens WHERE autor_id=? AND chave=?", ator, key);
  if (existente) return existente.id as string;
  fs.mkdirSync(pastaAnexos(), { recursive: true });
  try {
    db().transaction(() => {
      const total = um(
        "SELECT coalesce(sum(a.bytes),0) total FROM mensagens_anexos a JOIN mensagens m ON m.id=a.mensagem_id WHERE m.autor_id=?",
        ator
      )?.total ?? 0;
      exigir(total + arquivo.length <= 250 * 1024 * 1024, "Seu limite de 250 MB de anexos foi atingido.");
      fs.writeFileSync(destino, arquivo, { flag: "wx" });
      db().prepare("INSERT INTO mensagens(id,conversa_id,autor_id,texto,chave) VALUES(?,?,?,?,?)")
        .run(id, conversaId, ator, conteudo, key);
      db().prepare("INSERT INTO mensagens_anexos(id,mensagem_id,nome,mime,bytes) VALUES(?,?,?,?,?)")
        .run(anexoId, id, nomeSeguro, mime, arquivo.length);
      db().prepare("DELETE FROM conversas_ocultas WHERE conversa_id=?").run(conversaId);
      notificar(c.outro, "Nova mensagem",
        conta(c.outro).tipo_conta === "administrativo"
          ? `/admin/oportunidades/mensagens/${conversaId}` : `/messages/${conversaId}`,
        `mensagem:${id}`, "mensagem");
    }).immediate();
  } catch (erro) {
    fs.rmSync(destino, { force: true });
    throw erro;
  }
  return id;
}
export function arquivoAnexo(ator: string, id: string) {
  conta(ator);
  const anexo = um(`SELECT a.*,m.conversa_id,m.id mensagem_id FROM mensagens_anexos a
    JOIN mensagens m ON m.id=a.mensagem_id JOIN conversas c ON c.id=m.conversa_id
    WHERE a.id=? AND ? IN (c.participante_a,c.participante_b)`, id, ator);
  exigir(anexo && !objetoSobMedida(db(), "mensagem", anexo.mensagem_id),
    "Anexo privado ou indisponível.", 404);
  return { ...anexo, caminho: path.join(pastaAnexos(), id) } as Linha & { caminho: string };
}
export function pedirMediacao(
  ator: string,
  alvo: string,
  mensagem: unknown,
  chave: unknown
) {
  exigir(
    conta(ator).tipo_conta === "consumidor",
    "Este fluxo é destinado a consumidores.",
    403
  );
  profissional(alvo);
  contatoPermitido(ator, alvo);
  exigir(
    um("SELECT 1 FROM perfis WHERE usuario_id=? AND perfil_publico=1", alvo),
    "Perfil indisponível.",
    404
  );
  return db().transaction(() => {
    let c = um(
        "SELECT id FROM conversas WHERE participante_a=? AND participante_b=? AND contexto='Solicitação de mediação'",
      ator,
      alvo
    );
    if (!c) {
      c = { id: randomUUID() };
      db()
        .prepare(
          "INSERT INTO conversas(id,participante_a,participante_b,contexto) VALUES(?,?,?,?)"
        )
        .run(c.id, ator, alvo, "Solicitação de mediação");
    }
    enviarMensagem(ator, c.id, mensagem, chave);
    return c.id as string;
  })();
}
export function preferenciasContato(ator: string, b: Record<string, unknown>) {
  conta(ator);
  db()
    .prepare(
      `INSERT INTO preferencias_contato(usuario_id,profissionais,consumidores) VALUES(?,?,?) ON CONFLICT(usuario_id) DO UPDATE SET profissionais=excluded.profissionais,consumidores=excluded.consumidores`
    )
    .run(
      ator,
      b.profissionais === "sim" ? 1 : 0,
      b.consumidores === "sim" ? 1 : 0
    );
}
export function bloquear(ator: string, alvo: string, ativo: boolean) {
  conta(ator);
  exigir(
    ator !== alvo && um("SELECT id FROM usuarios WHERE id=?", alvo),
    "Conta inválida."
  );
  if (ativo)
    db()
      .prepare(
        "INSERT INTO bloqueios_usuarios(autor_id,alvo_id) VALUES(?,?) ON CONFLICT DO NOTHING"
      )
      .run(ator, alvo);
  else
    db()
      .prepare("DELETE FROM bloqueios_usuarios WHERE autor_id=? AND alvo_id=?")
      .run(ator, alvo);
}
export function solicitarPedido(ator: string, b: Record<string, unknown>) {
  exigir(
    conta(ator).tipo_conta === "consumidor",
    "Somente consumidores podem enviar pedidos excepcionais.",
    403
  );
  const d = validarChamada(b);
  exigir(
    !d.evento_id && !d.projeto_id,
    "Pedidos excepcionais não vinculam trabalhos de terceiros."
  );
  return db().transaction(() => {
    const existente = repeticao(ator, b.submissao, "pedido");
    if (existente) return existente;
    const id = randomUUID();
    db()
      .prepare(
        "INSERT INTO pedidos_oportunidade(id,solicitante_id,dados_json,estado) VALUES(?,?,?,'pendente')"
      )
      .run(
        id,
        ator,
        JSON.stringify({
          ...d,
          valor:
            d.valor_centavos === null ? "" : String(d.valor_centavos / 100),
          prazo: d.prazo?.slice(0, 10) || "",
        })
      );
    registrarOperacao(ator, b.submissao, "pedido", id);
    historico(ator, "pedido_enviado", d, null, id);
    for (const a of todos(
      "SELECT usuario_id FROM administradores WHERE ativo=1 AND papel IN('super_admin','moderador')"
    ))
      notificar(
        a.usuario_id,
        "Pedido excepcional para análise",
        `/admin/oportunidades/pedidos/${id}`,
        `pedido:${id}`
      );
    return id;
  })();
}
export function pedido(id: string, ator: string) {
  conta(ator);
  const p = um(
    "SELECT p.*,u.nome AS solicitante FROM pedidos_oportunidade p JOIN perfis u ON u.usuario_id=p.solicitante_id WHERE p.id=?",
    id
  );
  exigir(p, "Pedido não encontrado.", 404);
  if (p.solicitante_id !== ator) exigirAdministrador(ator, "excecoes");
  p.dados = JSON.parse(p.dados_json);
  p.historico = todos(
    "SELECT acao,dados_json,criado_em FROM historico_oportunidades WHERE pedido_id=? ORDER BY criado_em,rowid",
    id
  );
  p.publicacao = um(
    "SELECT id,estado,autor_id FROM oportunidades_profissionais WHERE pedido_id=?",
    id
  );
  return p;
}
export function responderPedido(ator: string, id: string, resposta: unknown) {
  const p = pedido(id, ator);
  exigir(
    p.solicitante_id === ator && p.estado === "esclarecimento",
    "Não há esclarecimento pendente."
  );
  const t = texto(resposta, 4000);
  exigir(t, "Escreva o esclarecimento.");
  db().transaction(() => {
    db()
      .prepare("UPDATE pedidos_oportunidade SET estado='pendente' WHERE id=?")
      .run(id);
    historico(ator, "esclarecimento", { mensagem: t }, null, id);
    if (p.revisor_id)
      notificar(
        p.revisor_id,
        "Esclarecimento recebido",
        `/admin/oportunidades/pedidos/${id}`,
        `esclarecimento:${randomUUID()}`
      );
  })();
}
export function revisarPedido(
  ator: string,
  id: string,
  acao: string,
  motivo: unknown
) {
  conta(ator);
  exigirAdministrador(ator, "excecoes");
  const p = pedido(id, ator);
  exigir(
    ator !== p.solicitante_id,
    "A análise exige responsável independente.",
    403
  );
  const justificativa = texto(motivo, 3000);
  exigir(justificativa, "Registre uma justificativa.");
  exigir(
    ["aprovado", "recusado", "esclarecimento"].includes(acao),
    "Decisão inválida."
  );
  return db()
    .transaction(() => {
      const p = pedido(id, ator);
      exigir(
        ["pendente", "esclarecimento"].includes(p.estado),
        "Este pedido já recebeu decisão."
      );
      let oid: string | null = null;
      if (acao === "aprovado") {
        // Publicação específica sob gestão administrativa. Não altera a conta solicitante.
        const d = validarChamada(p.dados);
        const { funcoes, ...campos } = d;
        oid = randomUUID();
        db()
          .prepare(
            `INSERT INTO oportunidades_profissionais(id,autor_id,${Object.keys(campos).join(",")},estado,pedido_id,publicada_em) VALUES(${Array(
              Object.keys(campos).length + 2
            )
              .fill("?")
              .join(",")},'aberta',?,CURRENT_TIMESTAMP)`
          )
          .run(oid, ator, ...Object.values(campos), id);
        for (const f of funcoes)
          db()
            .prepare(
              "INSERT INTO funcoes_oportunidade(id,oportunidade_id,profissao_id,vagas,responsabilidades,requisitos,desejaveis) VALUES(?,?,?,?,?,?,?)"
            )
            .run(
              randomUUID(),
              oid,
              f.profissao_id,
              f.vagas,
              f.responsabilidades,
              f.requisitos,
              f.desejaveis
            );
      }
      db()
        .prepare(
          "UPDATE pedidos_oportunidade SET estado=?,revisor_id=?,justificativa=? WHERE id=?"
        )
        .run(acao, ator, justificativa, id);
      historico(
        ator,
        "decisao_administrativa",
        { estado: acao, mensagem: justificativa, publicacao: oid },
        oid,
        id
      );
      db()
        .prepare(
          "INSERT INTO auditoria_administrativa(id,autor_id,acao,alvo_id,detalhe) VALUES(?,?,?,?,?)"
        )
        .run(
          randomUUID(),
          ator,
          "pedido_oportunidade_" + acao,
          p.solicitante_id,
          JSON.stringify({ pedido: id, justificativa })
        );
      notificar(
        p.solicitante_id,
        `Pedido de serviço: ${acao}`,
        `/service-requests/${id}`,
        `revisao:${id}:${randomUUID()}`
      );
      return oid;
    })
    .immediate();
}
export function criarProjeto(ator: string, b: Record<string, unknown>) {
  profissional(ator);
  const titulo = texto(b.titulo, 120),
    descricao = texto(b.descricao, 4000);
  exigir(titulo && descricao, "Informe título e descrição.");
  const id = randomUUID();
  db()
    .prepare(
      "INSERT INTO projetos_trabalho(id,autor_id,titulo,descricao,publico) VALUES(?,?,?,?,?)"
    )
    .run(id, ator, titulo, descricao, b.publico === "sim" ? 1 : 0);
  return id;
}

import {
  situacaoContaModeracao,
  objetoSobMedida,
} from "./politicasModeracao.js";
import { randomUUID } from "node:crypto";
import { conexaoInternaCypher } from "./bancoDados.js";
import { contatoEtarioPermitido } from "./protecoesConta.js";
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
export function conversa(id: string, ator: string) {
  conta(ator);
  const c = um("SELECT * FROM conversas WHERE id=?", id);
  exigir(
    c && (c.participante_a === ator || c.participante_b === ator),
    "Conversa privada ou indisponível.",
    403
  );
  c.outro = c.participante_a === ator ? c.participante_b : c.participante_a;
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
    "SELECT m.*,coalesce(p.nome,a.nome) AS nome FROM mensagens m LEFT JOIN perfis p ON p.usuario_id=m.autor_id LEFT JOIN administradores a ON a.usuario_id=m.autor_id WHERE conversa_id=? ORDER BY m.criada_em,m.rowid",
    id
  ).filter(m => !objetoSobMedida(db(), "mensagem", m.id));
  return c;
}
export function enviarMensagem(
  ator: string,
  id: string,
  conteudo: unknown,
  chave: unknown
) {
  const c = conversa(id, ator);
  contatoPermitido(ator, c.outro);
  const t = texto(conteudo, 4000),
    key = texto(chave, 100);
  exigir(
    t && /^[a-zA-Z0-9-]{16,100}$/.test(key),
    "Mensagem ou identificador inválido."
  );
  return db().transaction(() => {
    const mid = randomUUID();
    const r = db()
      .prepare(
        "INSERT INTO mensagens(id,conversa_id,autor_id,texto,chave) VALUES(?,?,?,?,?) ON CONFLICT(autor_id,chave) DO NOTHING"
      )
      .run(mid, id, ator, t, key);
    if (r.changes)
      notificar(
        c.outro,
        "Nova mensagem",
        conta(c.outro).tipo_conta === "administrativo"
          ? `/admin/oportunidades/mensagens/${id}`
          : `/messages/${id}`,
        `mensagem:${mid}`,
        "mensagem"
      );
  })();
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
      "SELECT id FROM conversas WHERE participante_a=? AND participante_b=? AND candidatura_id IS NULL",
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

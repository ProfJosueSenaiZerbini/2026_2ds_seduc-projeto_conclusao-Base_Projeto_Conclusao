import { randomUUID } from "node:crypto";
import { exigirAdministrador } from "./administracao.js";
import {
  confirmarCreditoObra,
  conexaoInternaCypher as banco,
  criarNotificacaoCypher,
} from "./bancoDados.js";
import { enderecoObra } from "./enderecosPerfil.js";
import { exigirContaInteracao, ErroInteracao } from "./interacoesConteudo.js";
import {
  objetoDisponivel,
  situacaoContaModeracao,
} from "./politicasModeracao.js";
import { contatoEtarioPermitido } from "./protecoesConta.js";
import { seloPerfil } from "./seloPerfil.js";

const fontes = {
  obra: ["obras", "proprietario_id"],
  beat: ["beats", "produtor_id"],
  evento: ["eventos", "proprietario_id"],
} as const;
export type TipoCredito = keyof typeof fontes;
export const categoriasEvento = {
  organizacao: "Organização",
  atracao: "Atração",
  equipe: "Equipe",
};
export const estadosCredito: Record<string, string> = {
  pendente: "Aguardando confirmação",
  confirmado: "Confirmado",
  recusado: "Recusado",
  contestado: "Em revisão",
  validado: "Confirmado pela moderação",
  invalidado: "Invalidado pela moderação",
};

function exigir(ok: unknown, mensagem: string, status = 400): asserts ok {
  if (!ok) throw new ErroInteracao(mensagem, status);
}
function texto(valor: unknown, min: number, max: number, erro: string) {
  const termo = typeof valor === "string" ? valor.trim() : "";
  exigir(termo.length >= min && termo.length <= max, erro);
  return termo;
}
export function acessoRevisao(ator: string) {
  try {
    exigirAdministrador(ator, "moderacao");
  } catch (e) {
    if (!(e instanceof Error) || e.message !== "ACESSO_ADMINISTRATIVO_NEGADO")
      throw e;
    throw new ErroInteracao("Acesso restrito à moderação.", 403);
  }
}
function origem(tipo: TipoCredito, id: string) {
  const [tabela, responsavel] = fontes[tipo];
  const r = banco()
    .prepare(
      `
    SELECT o.id,o.titulo,o.${responsavel} dono,p.identificador,p.nome autor,
           ${tipo === "obra" ? "trim(o.funcao_principal || ' ' || o.funcao_detalhe)" : tipo === "beat" ? "'Produção do beat'" : "'Organização'"} funcao,
           ${tipo === "obra" ? "o.publicada=1 AND o.situacao IN ('','Lançado')" : "1"} publicavel
    FROM ${tabela} o JOIN perfis p ON p.usuario_id=o.${responsavel} WHERE o.id=?
  `
    )
    .get(id) as
    | {
        id: string;
        titulo: string;
        dono: string;
        identificador: string;
        autor: string;
        funcao: string;
        publicavel: number;
      }
    | undefined;
  exigir(r, "Registro indisponível.", 404);
  return {
    ...r,
    url:
      tipo === "obra"
        ? enderecoObra(r.identificador, r.id)
        : (tipo === "beat" ? "/beats/" : "/events/") + encodeURIComponent(r.id),
  };
}

type Credito = {
  id: string;
  objeto_id: string;
  pessoa: string;
  nome: string;
  funcao: string;
  detalhe: string;
  categoria: string;
  confirmado: number;
  estado: string;
};
function linhas(tipo: TipoCredito, filtro: "id" | "objeto_id", id: string) {
  return banco()
    .prepare(
      `
    WITH registros AS (
      ${
        tipo === "obra"
          ? "SELECT id,obra_id objeto_id,usuario_creditado_id pessoa,nome_creditado nome,funcao,participacao detalhe,'' categoria,verificado confirmado FROM creditos WHERE demonstracao=0 AND usuario_creditado_id IS NOT NULL"
          : "SELECT c.id,c.objeto_id,c.usuario_id pessoa,p.nome,c.funcao,'' detalhe,c.categoria,c.confirmado FROM creditos_publicacoes c JOIN perfis p ON p.usuario_id=c.usuario_id WHERE c.tipo=@tipo AND c.retirado_em IS NULL"
      }
    )
    SELECT r.*,coalesce((SELECT h.estado FROM historico_creditos h WHERE h.tipo=@tipo AND h.credito_id=r.id ORDER BY h.id DESC LIMIT 1),
      CASE WHEN r.confirmado=1 THEN 'confirmado' ELSE 'pendente' END) estado
    FROM registros r WHERE r.${filtro}=@id ORDER BY r.nome,r.funcao,r.id
  `
    )
    .all({ tipo, id }) as Credito[];
}
export function creditosFicha(
  visitante: string,
  tipo: TipoCredito,
  id: string
) {
  const trabalho = origem(tipo, id);
  const seloResponsavel = objetoDisponivel(
    banco(),
    "perfil",
    trabalho.dono,
    visitante
  )
    ? seloPerfil(trabalho.dono)
    : null;
  const equipe = linhas(tipo, "objeto_id", id)
    .filter(
      c =>
        c.confirmado && objetoDisponivel(banco(), "perfil", c.pessoa, visitante)
    )
    .map(c => ({ ...c, selo: seloPerfil(c.pessoa) }));
  return {
    equipe,
    assinatura: seloResponsavel
      ? { nome: trabalho.autor, funcao: trabalho.funcao, selo: seloResponsavel }
      : null,
  };
}
export function painelCreditos(ator: string, tipo: TipoCredito, id: string) {
  exigirContaInteracao(ator);
  const trabalho = origem(tipo, id);
  exigir(
    trabalho.dono === ator && objetoDisponivel(banco(), tipo, id, ator),
    "Registro indisponível.",
    404
  );
  return { trabalho, creditos: linhas(tipo, "objeto_id", id) };
}
function urlCredito(tipo: TipoCredito, id: string) {
  return "/creditos/" + tipo + "/" + encodeURIComponent(id);
}
function notificar(
  ator: string,
  tipo: TipoCredito,
  id: string,
  evento: string,
  titulo: string
) {
  criarNotificacaoCypher({
    usuarioDestinoId: ator,
    tipo: "credito_" + evento,
    titulo,
    mensagem: "Consulte o crédito para acompanhar a participação.",
    url: urlCredito(tipo, id),
    entidadeTipo: "credito",
    entidadeId: id,
    chaveOrigem: `credito-publicacao:${tipo}:${id}:${evento}:${ator}`,
  });
}
export function convidarCredito(
  ator: string,
  tipo: "beat" | "evento",
  objeto: string,
  dados: Record<string, unknown>
) {
  const funcao = texto(
    dados.funcao,
    2,
    80,
    "Informe a função da pessoa no trabalho."
  );
  const handle = texto(dados.perfil, 2, 81, "Informe o @ do profissional.");
  const categoria = tipo === "evento" ? String(dados.categoria ?? "") : "";
  exigir(
    tipo !== "evento" || Object.hasOwn(categoriasEvento, categoria),
    "Selecione o tipo de participação no evento."
  );
  banco()
    .transaction(() => {
      painelCreditos(ator, tipo, objeto);
      const p = banco()
        .prepare(
          `
      SELECT u.id FROM usuarios u JOIN perfis p ON p.usuario_id=u.id
      WHERE p.identificador=? COLLATE NOCASE AND u.tipo_conta='profissional'
        AND u.email_confirmado_em IS NOT NULL AND u.demonstracao=0
    `
        )
        .get(handle) as { id: string } | undefined;
      exigir(
        p &&
          p.id !== ator &&
          objetoDisponivel(banco(), "perfil", p.id, ator) &&
          objetoDisponivel(banco(), tipo, objeto, p.id) &&
          contatoEtarioPermitido(banco(), ator, p.id) &&
          !situacaoContaModeracao(banco(), p.id).contatoRestrito &&
          !situacaoContaModeracao(banco(), ator).contatoRestrito,
        "Profissional indisponível para receber este crédito.",
        404
      );
      const id = randomUUID();
      const r = banco()
        .prepare(
          `
      INSERT INTO creditos_publicacoes(id,tipo,objeto_id,usuario_id,funcao,categoria,criado_em)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING
    `
        )
        .run(id, tipo, objeto, p.id, funcao, categoria, Date.now());
      if (r.changes)
        notificar(
          p.id,
          tipo,
          id,
          "pendente",
          "Confira um crédito profissional"
        );
    })
    .immediate();
}
export function consultarCredito(
  ator: string,
  tipo: TipoCredito,
  id: string,
  admin = false
) {
  if (admin) acessoRevisao(ator);
  else exigirContaInteracao(ator);
  const [credito] = linhas(tipo, "id", id);
  exigir(credito, "Crédito indisponível.", 404);
  const trabalho = origem(tipo, credito.objeto_id);
  const titular = trabalho.dono === ator;
  exigir(
    admin ||
      ((titular || credito.pessoa === ator) &&
        objetoDisponivel(banco(), tipo, trabalho.id, ator) &&
        (titular || trabalho.publicavel)),
    "Crédito indisponível.",
    404
  );
  const historico = banco()
    .prepare(
      "SELECT estado,motivo,criado_em FROM historico_creditos WHERE tipo=? AND credito_id=? ORDER BY id DESC"
    )
    .all(tipo, id) as { estado: string; motivo: string; criado_em: number }[];
  return { trabalho, credito, titular, historico };
}
export function responderCredito(
  ator: string,
  tipo: TipoCredito,
  id: string,
  dados: Record<string, unknown>,
  admin = false
) {
  banco()
    .transaction(() => {
      const {
        credito: c,
        trabalho,
        titular,
      } = consultarCredito(ator, tipo, id, admin);
      const acao = String(dados.acao ?? "");
      if (
        !admin &&
        !titular &&
        c.estado === "confirmado" &&
        acao === "confirmado"
      )
        return;
      const muda = admin
        ? c.estado === "contestado" && ["validado", "invalidado"].includes(acao)
        : acao === "contestado"
          ? ["confirmado", "recusado"].includes(c.estado) ||
            (!titular && c.estado === "pendente")
          : !titular &&
            c.estado === "pendente" &&
            ["confirmado", "recusado"].includes(acao);
      exigir(
        muda,
        "Esta decisão não está disponível para o estado atual do crédito.",
        409
      );
      const motivo = ["contestado", "validado", "invalidado"].includes(acao)
        ? texto(
            dados.motivo,
            10,
            1500,
            "Descreva o motivo em 10 a 1500 caracteres."
          )
        : "";
      const confirmado = acao === "confirmado" || acao === "validado";
      if (!admin && acao === "confirmado")
        exigir(
          contatoEtarioPermitido(banco(), trabalho.dono, c.pessoa) &&
            !situacaoContaModeracao(banco(), trabalho.dono).contatoRestrito &&
            !situacaoContaModeracao(banco(), c.pessoa).contatoRestrito,
          "A confirmação não está disponível.",
          403
        );
      if (tipo === "obra" && acao === "confirmado") {
        exigir(confirmarCreditoObra(id, ator), "Crédito indisponível.", 404);
      } else {
        banco()
          .prepare(
            tipo === "obra"
              ? "UPDATE creditos SET verificado=? WHERE id=?"
              : "UPDATE creditos_publicacoes SET confirmado=? WHERE id=?"
          )
          .run(Number(confirmado), id);
      }
      banco()
        .prepare(
          "INSERT INTO historico_creditos(credito_id,tipo,ator_id,estado,motivo,criado_em) VALUES(?,?,?,?,?,?)"
        )
        .run(id, tipo, ator, acao, motivo, Date.now());
      for (const destinatario of [trabalho.dono, c.pessoa])
        if (
          destinatario !== ator &&
          !(tipo === "obra" && acao === "confirmado")
        )
          notificar(destinatario, tipo, id, acao, "Crédito atualizado");
    })
    .immediate();
}
export function filaCreditos(ator: string) {
  acessoRevisao(ator);
  return banco()
    .prepare(
      `
    SELECT h.tipo,h.credito_id id,h.criado_em FROM historico_creditos h
    WHERE h.estado='contestado' AND h.id=(SELECT max(x.id) FROM historico_creditos x WHERE x.tipo=h.tipo AND x.credito_id=h.credito_id)
    ORDER BY h.id LIMIT 100
  `
    )
    .all() as { tipo: TipoCredito; id: string; criado_em: number }[];
}

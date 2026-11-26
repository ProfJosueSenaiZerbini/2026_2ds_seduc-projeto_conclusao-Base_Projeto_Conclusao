import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import * as m from "../models/oportunidades.js";
import * as contato from "../models/contatosOportunidades.js";
import { agruparMensagensPorDia, horaMensagem, rotuloDataConversa } from "../models/tempoMensagens.js";
import { conexaoInternaCypher } from "../models/bancoDados.js";
import {
  objetoDisponivel,
  situacaoContaModeracao,
} from "../models/politicasModeracao.js";
import { contatoEtarioPermitido } from "../models/protecoesConta.js";
import {
  profissoesCatalogo,
  catalogoProfissional,
} from "../models/modeloPerfil.js";
import { exigirAdministrador } from "../models/administracao.js";
import {
  profissoesOportunidade,
  ErroOportunidade,
  exigir,
  tiposChamada,
  modosTrabalho,
  remuneracoes,
  estadosChamada,
  estadosCandidatura,
} from "../validators/validarOportunidade.js";
type Handler = (req: Request, res: Response) => unknown;
const uid = (res: Response) => res.locals.usuario.id as string;
const prefixo = (req: Request) =>
  req.path.startsWith("/admin/") ? "/admin/oportunidades" : "/opportunities";
function render(
  req: Request,
  res: Response,
  tela: string,
  dados: m.Linha = {}
) {
  return res.render("pages/chamadas", {
    title: tela === "mensagens" ? "Mensagens" : "Oportunidades",
    stylesheet: "chamadas",
    path: req.path.startsWith("/admin/") ? req.path : tela === "mensagens" ? "/messages" : "/opportunities",
    authenticated: true,
    tela,
    profissional: res.locals.usuario.tipoConta === "profissional",
    administrativo: req.path.startsWith("/admin/"),
    base: prefixo(req),
    nonce: randomUUID(),
    profissoes: profissoesOportunidade,
    areas: catalogoProfissional.map(a => ({
      ...a,
      profissoes: a.profissoes.filter(p => p.id !== "podcaster"),
    })),
    tiposChamada,
    modosTrabalho,
    remuneracoes,
    estadosChamada,
    estadosCandidatura,
    erro: "",
    campos: {},
    sucesso: req.query.ok === "1",
    moeda: (v: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v / 100),
    data: (v: string) =>
      v
        ? new Date(
            v.length === 10
              ? v + "T12:00:00-03:00"
              : /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)
                ? v.replace(" ", "T") + "Z"
                : v
          ).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
        : "Sem prazo definido",
    hora: horaMensagem,
    dataConversa: rotuloDataConversa,
    ...dados,
  });
}
export function seguro(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      m.conta(uid(res));
      return fn(req, res);
    } catch (e) {
      if (e instanceof ErroOportunidade)
        if (req.path.includes("/attachments")) return res.status(e.status).json({ erro: e.message });
      if (e instanceof ErroOportunidade)
        return res.status(e.status).render("pages/chamadas", {
          ...res.locals,
          title: "Oportunidades",
          stylesheet: "chamadas",
          path: "/opportunities",
          authenticated: true,
          tela: "erro",
          erro: e.message,
          profissional: false,
          administrativo: req.path.startsWith("/admin/"),
          base: prefixo(req),
          sucesso: false,
        });
      if ((e as Error).message === "ACESSO_ADMINISTRATIVO_NEGADO")
        return res.status(403).send("Acesso administrativo negado.");
      console.error("Oportunidades:", e);
      return res
        .status(500)
        .send(
          "Não foi possível concluir a operação. Seus registros anteriores foram preservados."
        );
    }
  };
}
export const explorar: Handler = (req, res) => {
  const contexto =
    req.path === "/my-opportunities"
      ? "minhas"
      : req.path === "/my-applications"
        ? "candidaturas"
        : "explorar";
  const filtros = Object.fromEntries(
    Object.entries(req.query)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, String(v).slice(0, 150)])
  );
  const url = (trocas: Record<string, string>) => {
    const p = new URLSearchParams(filtros);
    p.delete("ok");
    for (const [k, v] of Object.entries(trocas)) v ? p.set(k, v) : p.delete(k);
    return req.path + (p.size ? "?" + p : "");
  };
  return render(req, res, "lista", {
    contexto,
    filtros,
    url,
    ...m.listar(uid(res), filtros, contexto),
  });
};
function form(
  req: Request,
  res: Response,
  b: m.Linha = {},
  id?: string,
  erro = "",
  campos = {}
) {
  const consumidor = req.path.startsWith("/service-requests");
  if (consumidor)
    exigir(
      res.locals.usuario.tipoConta === "consumidor",
      "Área exclusiva de consumidores.",
      403
    );
  else if (id) m.titularProfissional(uid(res));
  else m.profissional(uid(res));
  return render(req, res, "formulario", {
    dados: b,
    id,
    consumidor,
    erro,
    campos,
    eventos: m
      .todos(
        "SELECT id,titulo FROM eventos WHERE proprietario_id=? AND demonstracao=0",
        uid(res)
      )
      .filter(e =>
        objetoDisponivel(conexaoInternaCypher(), "evento", e.id, uid(res))
      ),
    projetos: m
      .todos(
        "SELECT id,titulo FROM projetos_trabalho WHERE autor_id=? AND NOT EXISTS(SELECT 1 FROM detalhes_projetos d WHERE d.projeto_id=projetos_trabalho.id AND d.retirado=1)",
        uid(res)
      )
      .filter(p =>
        objetoDisponivel(conexaoInternaCypher(), "projeto", p.id, uid(res))
      ),
  });
}
export const novo: Handler = (req, res) => form(req, res);
export const editar: Handler = (req, res) => {
  const o = m.ficha(req.params.id!, uid(res));
  exigir(o.autor_id === uid(res), "Esta chamada pertence a outra pessoa.", 403);
  return form(
    req,
    res,
    {
      ...o,
      valor: o.valor_centavos === null ? "" : o.valor_centavos / 100,
      prazo: o.prazo?.slice(0, 10),
    },
    o.id
  );
};
export const salvar: Handler = (req, res) => {
  try {
    const id = m.salvarChamada(uid(res), req.body, req.params.id);
    res.redirect(303, `/opportunities/${id}?ok=1`);
  } catch (e) {
    if (e instanceof ErroOportunidade && e.status === 400)
      return (
        res.status(400),
        form(req, res, req.body, req.params.id, e.message, e.campos)
      );
    throw e;
  }
};
export const detalhe: Handler = (req, res) => {
  const o = m.ficha(req.params.id!, uid(res));
  const proprio = o.autor_id === uid(res);
  const candidaturas = m.todos(
    `SELECT c.*,p.nome,f.profissao_id FROM candidaturas_oportunidade c JOIN perfis p ON p.usuario_id=c.candidato_id JOIN funcoes_oportunidade f ON f.id=c.funcao_id WHERE c.oportunidade_id=? AND (?=1 OR c.candidato_id=?) ORDER BY c.criada_em DESC`,
    o.id,
    proprio ? 1 : 0,
    uid(res)
  );
  return render(req, res, "ficha", {
    o,
    proprio,
    candidaturas,
    ativas: m.profissoesAtivas(uid(res)),
    historico: proprio
      ? m.todos(
          "SELECT acao,criado_em FROM historico_oportunidades WHERE oportunidade_id=? ORDER BY criado_em DESC",
          o.id
        )
      : [],
  });
};
export const estado: Handler = (req, res) => {
  m.mudarEstado(uid(res), req.params.id!, String(req.body.estado));
  res.redirect(303, `${prefixo(req)}/${req.params.id}?ok=1`);
};
export const aplicar: Handler = (req, res) => {
  const id = m.candidatar(uid(res), req.params.id!, req.body);
  res.redirect(303, `/opportunities/applications/${id}?ok=1`);
};
export const negociacao: Handler = (req, res) => {
  const c = m.candidatura(req.params.id!, uid(res));
  const conversa = c.conversa ? contato.conversa(c.conversa.id, uid(res)) : null;
  if (conversa) contato.registrarLeitura(conversa, uid(res));
  return render(req, res, "negociacao", {
    c,
    conversa,
    negBase: req.path.startsWith("/admin/")
      ? "/admin/oportunidades/candidaturas"
      : "/opportunities/applications",
  });
};
export const decisao: Handler = (req, res) => {
  m.decidirCandidatura(uid(res), req.params.id!, String(req.body.estado));
  res.redirect(303, req.path.replace(/\/decision$/, "") + "?ok=1");
};
export const proposta: Handler = (req, res) => {
  m.propor(uid(res), req.params.id!, req.body);
  res.redirect(303, req.path.replace(/\/proposals$/, "") + "?ok=1");
};
export const aceite: Handler = (req, res) => {
  exigir(req.body.confirmacao === "sim", "Confirme expressamente sua decisão.");
  m.responderProposta(
    uid(res),
    req.params.id!,
    String(req.body.proposta_id),
    String(req.body.acao)
  );
  res.redirect(303, req.path.replace(/\/response$/, "") + "?ok=1");
};
export const desistir: Handler = (req, res) => {
  m.desistirAcordo(uid(res), req.params.id!, req.body.motivo);
  res.redirect(303, req.path.replace(/\/release$/, "") + "?ok=1");
};
export const solicitar: Handler = (req, res) => {
  try {
    const id = contato.solicitarPedido(uid(res), req.body);
    res.redirect(303, `/service-requests/${id}?ok=1`);
  } catch (e) {
    if (e instanceof ErroOportunidade && e.status === 400)
      return (
        res.status(400),
        form(req, res, req.body, undefined, e.message, e.campos)
      );
    throw e;
  }
};
export const pedidos: Handler = (req, res) => {
  const admin = req.path.startsWith("/admin/");
  if (admin) exigirAdministrador(uid(res), "excecoes");
  else
    exigir(
      res.locals.usuario.tipoConta === "consumidor",
      "Área exclusiva de consumidores.",
      403
    );
  const itens = m
    .todos(
      `SELECT * FROM pedidos_oportunidade ${admin ? "" : "WHERE solicitante_id=?"} ORDER BY criado_em DESC`,
      ...(admin ? [] : [uid(res)])
    )
    .map(p => ({ ...p, dados: JSON.parse(p.dados_json) }));
  return render(req, res, "pedidos", {
    itens,
    geridas: admin
      ? m.todos(
          "SELECT id,titulo,estado FROM oportunidades_profissionais WHERE autor_id=? AND pedido_id IS NOT NULL",
          uid(res)
        )
      : [],
  });
};
export const pedido: Handler = (req, res) =>
  render(req, res, "pedido", { p: contato.pedido(req.params.id!, uid(res)) });
export const revisar: Handler = (req, res) => {
  contato.revisarPedido(
    uid(res),
    req.params.id!,
    String(req.body.acao),
    req.body.motivo
  );
  res.redirect(303, `/admin/oportunidades/pedidos/${req.params.id}?ok=1`);
};
export const esclarecer: Handler = (req, res) => {
  contato.responderPedido(uid(res), req.params.id!, req.body.mensagem);
  res.redirect(303, `/service-requests/${req.params.id}?ok=1`);
};
export const mensagens: Handler = (req, res) => {
  const busca = String(req.query.q ?? "").trim().slice(0, 100);
  res.set("Cache-Control", "private, no-store");
  return render(req, res, "mensagens", {
    conversa: null,
    conversas: contato.listarConversas(uid(res)).filter(c =>
      (c.ultima_mensagem || c.contexto !== "Conversa direta") &&
      (!busca || `${c.interlocutor} ${c.identificador ?? ""}`.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")))),
    contatos: contato.listarContatosDisponiveis(uid(res), busca),
    busca,
    preferencias: m.um(
      "SELECT * FROM preferencias_contato WHERE usuario_id=?",
      uid(res)
    ) ?? { profissionais: 1, consumidores: 0 },
    bloqueados: m.todos(
      "SELECT b.alvo_id,p.nome FROM bloqueios_usuarios b LEFT JOIN perfis p ON p.usuario_id=b.alvo_id WHERE b.autor_id=?",
      uid(res)
    ),
  });
};
export const mensagem: Handler = (req, res) => {
  const conversa = contato.conversa(req.params.id!, uid(res));
  contato.registrarLeitura(conversa, uid(res));
  res.set("Cache-Control", "private, no-store");
  return render(req, res, "mensagens", {
    conversa,
    gruposMensagens: agruparMensagensPorDia(conversa.mensagens),
    conversas: contato.listarConversas(uid(res)).filter(c =>
      c.ultima_mensagem || c.contexto !== "Conversa direta"),
    contatos: contato.listarContatosDisponiveis(uid(res)),
    busca: "",
    preferencias: m.um(
      "SELECT * FROM preferencias_contato WHERE usuario_id=?",
      uid(res)
    ) ?? { profissionais: 1, consumidores: 0 },
    bloqueados: m.todos(
      "SELECT b.alvo_id,p.nome FROM bloqueios_usuarios b LEFT JOIN perfis p ON p.usuario_id=b.alvo_id WHERE b.autor_id=?",
      uid(res)
    ),
  });
};
export const iniciarMensagem: Handler = (req, res) => {
  const id = contato.iniciarConversa(uid(res), String(req.body.alvo_id ?? ""));
  return res.redirect(303, "/messages/" + encodeURIComponent(id));
};
export const ocultarMensagem: Handler = (req, res) => {
  contato.ocultarConversa(uid(res), req.params.id!);
  return res.redirect(303, "/messages?ok=1");
};
export const enviar: Handler = (req, res) => {
  contato.enviarMensagem(
    uid(res),
    req.params.id!,
    req.body.texto,
    req.body.chave
  );
  res.redirect(303, req.path + "?ok=1");
};
export const anexarMensagem: Handler = (req, res) => {
  let nome = "";
  let legenda = "";
  try {
    nome = decodeURIComponent(req.get("x-file-name") ?? "");
    legenda = decodeURIComponent(req.get("x-message-text") ?? "");
  } catch { throw new ErroOportunidade("Nome ou legenda inválidos."); }
  contato.enviarAnexo(uid(res), req.params.id!, nome, req.body,
    legenda, req.get("x-message-key"));
  return res.status(201).json({ ok: true });
};
export const baixarAnexo: Handler = (req, res) => {
  const anexo = contato.arquivoAnexo(uid(res), req.params.attachmentId!);
  res.set({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
  if (!/^(image|audio|video)\//.test(anexo.mime)) res.attachment(anexo.nome);
  res.type(anexo.mime);
  return res.sendFile(anexo.caminho);
};
export const preferencias: Handler = (req, res) => {
  contato.preferenciasContato(uid(res), req.body);
  res.redirect(303, "/messages?ok=1");
};
export const bloquear: Handler = (req, res) => {
  contato.bloquear(
    uid(res),
    String(req.body.alvo_id),
    req.body.acao === "bloquear"
  );
  res.redirect(303, "/messages?ok=1");
};
export const mediadores: Handler = (req, res) => {
  exigir(
    res.locals.usuario.tipoConta === "consumidor",
    "Área exclusiva de consumidores.",
    403
  );
  return render(req, res, "mediacao", {
    itens: m
      .todos(
        `SELECT p.usuario_id,p.nome,p.identificador FROM perfis p JOIN usuarios u ON u.id=p.usuario_id JOIN preferencias_contato pc ON pc.usuario_id=u.id WHERE pc.consumidores=1 AND p.perfil_publico=1 AND u.tipo_conta='profissional' AND u.demonstracao=0 AND u.email_confirmado_em IS NOT NULL AND EXISTS(SELECT 1 FROM profissoes_usuario f WHERE f.usuario_id=u.id AND f.estado='ativa') AND NOT EXISTS(SELECT 1 FROM bloqueios_usuarios b WHERE (b.autor_id=? AND b.alvo_id=u.id) OR (b.alvo_id=? AND b.autor_id=u.id)) AND p.nome LIKE ? LIMIT 50`,
        uid(res),
        uid(res),
        "%" + String(req.query.q ?? "").slice(0, 100) + "%"
      )
      .filter(
        p =>
          objetoDisponivel(
            conexaoInternaCypher(),
            "perfil",
            p.usuario_id,
            uid(res)
          ) &&
          !situacaoContaModeracao(conexaoInternaCypher(), p.usuario_id)
            .contatoRestrito &&
          contatoEtarioPermitido(conexaoInternaCypher(), uid(res), p.usuario_id)
      ),
  });
};
export const mediar: Handler = (req, res) => {
  const id = contato.pedirMediacao(
    uid(res),
    String(req.body.alvo_id),
    req.body.mensagem,
    req.body.chave
  );
  res.redirect(303, `/messages/${id}?ok=1`);
};

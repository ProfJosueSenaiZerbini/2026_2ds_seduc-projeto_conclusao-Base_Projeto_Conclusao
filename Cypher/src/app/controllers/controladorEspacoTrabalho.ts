import type { Request, Response } from "express";
import type { UsuarioDaSessao } from "../models/bancoDados.js";
import {
  acoesCriacao,
  normalizarBusca,
  profissoesDaConta,
  rotaEspaco,
  trabalhoDaConta,
  trabalhosDaConta,
} from "../models/espacoTrabalho.js";
import { publicacoesDescoberta } from "../models/modeloDescoberta.js";
import { CypherModel } from "../models/modeloCypher.js";
import { obterPreferenciasUsuario } from "../models/identidadeUsuario.js";

const texto = (valor: unknown) =>
  typeof valor === "string" ? valor.trim().slice(0, 120) : "";
const mensagens: Record<string, string> = {
  criada: "Obra cadastrada.",
  atualizada: "Alterações da obra salvas.",
  excluida: "Obra excluída.",
  beatCriado: "Beat cadastrado.",
  beatAtualizado: "Alterações do beat salvas.",
  beatExcluido: "Beat excluído.",
  eventoCriado: "Evento criado.",
  eventoAtualizado: "Alterações do evento salvas.",
  eventoExcluido: "Evento excluído.",
};
function mensagem(req: Request) {
  const chave = texto(req.query.resultado);
  return Object.hasOwn(mensagens, chave)
    ? mensagens[chave] +
        (req.query.genero === "analise"
          ? " A especificação de gênero foi enviada para análise."
          : "")
    : "";
}

function profissional(res: Response) {
  const usuario = res.locals.usuario as UsuarioDaSessao | undefined;
  if (
    !usuario ||
    usuario.tipoConta !== "profissional" ||
    usuario.demonstracao
  ) {
    res.sendStatus(403);
    return;
  }
  res.set("Cache-Control", "private, no-store");
  return usuario;
}

export function espacoTrabalho(req: Request, res: Response) {
  const usuario = profissional(res);
  if (!usuario) return;
  const profissoes = profissoesDaConta(usuario);
  const profissao =
    profissoes.find(p => p.id === req.query.profissao)?.id ?? "todas";
  const secao =
    req.query.secao === "proprios" || req.query.secao === "participacoes"
      ? req.query.secao
      : "";
  const q = texto(req.query.q);
  const termos = normalizarBusca(q).split(/\s+/);
  const registros = trabalhosDaConta(usuario);
  const filtrados = registros.filter(
    r =>
      (profissao === "todas" || r.atuacoes.includes(profissao)) &&
      termos.every(t =>
        normalizarBusca(
          [r.titulo, r.autor, r.tipo, r.metadados, r.papel, r.descricao].join(
            " "
          )
        ).includes(t)
      )
  );
  const grupos = [
    {
      id: "proprios",
      nome: "Meus trabalhos",
      todos: "Ver todos os trabalhos",
      descricao: "Criações e projetos pelos quais você é responsável.",
      vazio: "Você ainda não publicou trabalhos.",
      proprio: true,
    },
    {
      id: "participacoes",
      nome: "Participações",
      todos: "Ver todas as participações",
      descricao:
        "Trabalhos de outras pessoas em que sua participação foi confirmada.",
      vazio: "Nenhuma participação confirmada.",
      proprio: false,
    },
  ]
    .filter(g => !secao || secao === g.id)
    .map(g => {
      const itens = filtrados.filter(r => r.proprio === g.proprio);
      const apenasObras =
        g.proprio &&
        itens.length > 0 &&
        itens.every(r => r.modalidade === "obra");
      return {
        ...g,
        nome: apenasObras ? "Minhas obras" : g.nome,
        todos: apenasObras ? "Ver todas as obras" : g.todos,
        quantidade: itens.length,
        itens: secao ? itens : itens.slice(0, g.proprio ? 4 : 3),
        vazio: q
          ? "Nenhum resultado para sua pesquisa."
          : profissao !== "todas"
            ? g.proprio
              ? "Nenhum trabalho encontrado para esta profissão."
              : "Nenhuma participação encontrada para esta profissão."
            : g.vazio,
      };
    });
  const url = (grupo = "") => {
    const parametros = new URLSearchParams();
    if (q) parametros.set("q", q);
    if (profissao !== "todas") parametros.set("profissao", profissao);
    if (grupo) parametros.set("secao", grupo);
    return rotaEspaco + (parametros.size ? "?" + parametros : "");
  };
  res.render("pages/espaco-trabalho", {
    title: "Espaço de Trabalho",
    stylesheet: "espaco-trabalho",
    path: rotaEspaco,
    temaPreferido: obterPreferenciasUsuario(usuario.id, "").tema,
    profissoes,
    profissao,
    q,
    grupos,
    secao,
    url,
    acoes: acoesCriacao(usuario),
    mensagem: mensagem(req),
  });
}

export function fichaTrabalho(req: Request, res: Response) {
  const usuario = profissional(res);
  if (!usuario) return;
  const item = trabalhoDaConta(
    usuario,
    req.params.modalidade ?? "",
    req.params.id ?? ""
  );
  if (!item) return res.sendStatus(404);
  const creditos =
    item.proprio && item.modalidade === "obra"
      ? (CypherModel.obraDoUsuario(item.id, usuario.id)?.creditDetails ?? [])
      : [];
  const ofertas =
    item.modalidade === "beat"
      ? (CypherModel.obterBeat(item.id, usuario.id)?.ofertas ?? [])
      : [];
  const lista = new URLSearchParams();
  for (const nome of ["q", "profissao", "secao"])
    if (texto(req.query[nome])) lista.set(nome, texto(req.query[nome]));
  res.render("pages/ficha-trabalho", {
    title: item.titulo,
    stylesheet: "espaco-trabalho",
    path: rotaEspaco,
    item,
    creditos,
    ofertas,
    voltar: rotaEspaco + (lista.size ? "?" + lista : ""),
  });
}

export function catalogoObras(req: Request, res: Response) {
  const q = texto(req.query.q);
  const termos = normalizarBusca(q).split(/\s+/);
  const catalogo = publicacoesDescoberta("obras");
  const formatos = [...new Set(catalogo.map(obra => obra.tipo).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const generos = [...new Set(catalogo.map(obra => obra.genero).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const formato = formatos.find(opcao => opcao === req.query.formato) ?? "";
  const genero = generos.find(opcao => opcao === req.query.genero) ?? "";
  const obras = catalogo.filter(obra => {
    if ((formato && obra.tipo !== formato) || (genero && obra.genero !== genero))
      return false;

    const busca = normalizarBusca(
      [obra.titulo, obra.autor, obra.handle, obra.tipo, obra.genero].join(" ")
    );
    return termos.every(termo => busca.includes(termo));
  });
  res.render("pages/obras", {
    title: "Obras",
    stylesheet: "espaco-trabalho",
    path: "/works",
    q,
    formato,
    genero,
    formatos,
    generos,
    obras,
    permissao: req.query.erro === "permissao",
  });
}

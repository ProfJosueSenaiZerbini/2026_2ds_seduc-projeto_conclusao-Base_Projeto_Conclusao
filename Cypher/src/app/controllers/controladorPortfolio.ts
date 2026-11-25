import { enderecoObra } from "../models/enderecosPerfil.js";
import type { Request, Response, NextFunction } from "express";
import * as m from "../models/portfolio.js";
import { um } from "../models/oportunidades.js";
import { ErroOportunidade } from "../validators/validarOportunidade.js";
import { ErroTrabalho } from "../models/projetosTrabalho.js";
type Acao = (req: Request, res: Response) => unknown;
const uid = (res: Response) => res.locals.usuario.id as string;
export const seguro =
  (fn: Acao) => (req: Request, res: Response, next: NextFunction) => {
    try {
      res.set("Cache-Control", "private, no-store");
      return fn(req, res);
    } catch (e) {
      if (
        e instanceof m.ErroPortfolio ||
        e instanceof ErroOportunidade ||
        e instanceof ErroTrabalho
      )
        return res
          .status(e.status)
          .render("pages/portfolio-erro", {
            title: "Portfólio indisponível",
            stylesheet: "portfolio",
            path: "/espaco-de-trabalho",
            erro:
              e.status === 404
                ? "Portfólio ou trabalho indisponível."
                : e.message,
          });
      next(e);
    }
  };
function editor(
  res: Response,
  erro = "",
  status = 200,
  rascunho?: Record<string, unknown>
) {
  const id = uid(res);
  m.titularPortfolio(id);
  const config = m.configuracaoPortfolio(id);
  let itens = m.candidatosPortfolio(id);
  if (rascunho) {
    if (rascunho.modo === "manual" || rascunho.modo === "inteligente")
      config.modo = rascunho.modo;
    if (["grade", "editorial", "lista"].includes(String(rascunho.molde)))
      config.molde = rascunho.molde as typeof config.molde;
    config.visivel = rascunho.visivel === "sim";
    try {
      const raw: unknown = JSON.parse(String(rascunho.itens ?? "[]"));
      if (Array.isArray(raw)) {
        itens = itens
          .map(item => {
            const choice = raw.find(c => c && c.chave === item.chave);
            if (!choice) return item;
            return {
              ...item,
              selecionado:
                typeof choice.selecionado === "boolean"
                  ? choice.selecionado
                  : item.selecionado,
              oculto:
                typeof choice.oculto === "boolean"
                  ? choice.oculto
                  : item.oculto,
              destaque:
                typeof choice.destaque === "boolean"
                  ? choice.destaque
                  : item.destaque,
              ordem:
                Number.isInteger(choice.ordem) &&
                choice.ordem >= 0 &&
                choice.ordem <= 100000
                  ? choice.ordem
                  : item.ordem,
              secao:
                typeof choice.secao === "string" && choice.secao.length <= 60
                  ? choice.secao
                  : item.secao,
            };
          })
          .sort((a, b) => a.ordem - b.ordem);
      }
    } catch {
      /* Mantém as escolhas persistidas se a lista recebida estiver inválida. */
    }
  }
  return res
    .status(status)
    .render("pages/portfolio-edicao", {
      title: "Meu portfólio",
      stylesheet: "portfolio",
      path: "/espaco-de-trabalho",
      config,
      itens,
      titular: m.titularPortfolio(id),
      erro,
      salvo: res.locals.salvo ?? false,
      preview: false,
    });
}
export const editar: Acao = (req, res) => {
  res.locals.salvo = req.query.salvo === "1";
  return editor(res);
};
export const salvar: Acao = (req, res) => {
  try {
    m.salvarPortfolio(uid(res), req.body);
    res.redirect(303, "/portfolio/edit?salvo=1");
  } catch (e) {
    if (e instanceof m.ErroPortfolio && e.status === 400)
      return editor(res, e.message, 400, req.body);
    throw e;
  }
};
export const preview: Acao = (req, res) => {
  const id = uid(res),
    dados = m.montarPortfolio(id, id, req.body);
  for (const item of dados.itens) {
    const perfil = um(
      "SELECT identificador FROM perfis WHERE usuario_id=?",
      item.responsavel
    );
    item.url =
      item.tipo === "projeto"
        ? "/work-projects/" + encodeURIComponent(item.id)
        : item.tipo === "obra"
          ? enderecoObra(String(perfil?.identificador ?? ""), item.id)
          : item.tipo === "beat"
            ? "/beats#beat-" + encodeURIComponent(item.id)
            : "/events?localizacao=#evento-" + encodeURIComponent(item.id);
  }
  return res.render("pages/portfolio", {
    title: "Prévia do portfólio",
    stylesheet: "portfolio",
    path: "/espaco-de-trabalho",
    ...dados,
    dono: true,
    preview: true,
  });
};
export const consultar: Acao = (req, res) => {
  const p = m.lerPortfolioPorHandle(req.params.identificador!, uid(res));
  if (p.redirecionar)
    return res.redirect(
      308,
      "/portfolio/" + encodeURIComponent(p.handle.replace(/^@/, ""))
    );
  return res.render("pages/portfolio", {
    title: "Portfólio profissional",
    stylesheet: "portfolio",
    path: "/espaco-de-trabalho",
    ...m.montarPortfolio(p.id, uid(res)),
    dono: p.id === uid(res),
    preview: false,
  });
};
export const ficha: Acao = (req, res) => {
  const p = m.lerPortfolioPorHandle(req.params.identificador!, uid(res));
  const dados = m.montarPortfolio(p.id, uid(res));
  const item = dados.itens.find(
    i => i.tipo === req.params.tipo && i.id === req.params.id
  );
  if (!item) throw new m.ErroPortfolio("Trabalho indisponível.", 404);
  if (p.redirecionar) return res.redirect(308, item.url);
  const fontes: Record<
    string,
    { sql: string; labels: Record<string, string> }
  > = {
    obra: {
      sql: "SELECT tipo,genero,bpm,isrc,iswc,data_lancamento FROM obras WHERE id=?",
      labels: {
        tipo: "Formato",
        genero: "Gênero",
        bpm: "BPM",
        isrc: "ISRC",
        iswc: "ISWC",
        data_lancamento: "Data de lançamento",
      },
    },
    beat: {
      sql: "SELECT genero,bpm,tom_musical,duracao,licenca,condicoes_uso FROM beats WHERE id=?",
      labels: {
        genero: "Gênero",
        bpm: "BPM",
        tom_musical: "Tonalidade",
        duracao: "Duração",
        licenca: "Licença",
        condicoes_uso: "Condições de uso",
      },
    },
    evento: {
      sql: "SELECT categoria,data_texto,horario,local,formato FROM eventos WHERE id=?",
      labels: {
        categoria: "Categoria",
        data_texto: "Data",
        horario: "Horário",
        local: "Local",
        formato: "Formato",
      },
    },
  };
  const fonte = fontes[item.tipo];
  const fatos = fonte
    ? Object.entries(um(fonte.sql, item.id) ?? {})
        .filter(([, v]) => v !== null && v !== "")
        .map(([k, v]) => [fonte.labels[k], v])
    : [];
  return res.render("pages/portfolio-ficha", {
    title: item.titulo,
    stylesheet: "portfolio",
    path: "/espaco-de-trabalho",
    item,
    fatos,
    titular: dados.titular,
    origem:
      item.tipo === "projeto"
        ? "/work-projects/" + encodeURIComponent(item.id)
        : "",
    voltar: "/portfolio/" + encodeURIComponent(p.handle.replace(/^@/, "")),
  });
};

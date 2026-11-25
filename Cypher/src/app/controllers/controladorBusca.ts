import type { Request, Response } from "express";
import type { UsuarioDaSessao } from "../models/bancoDados.js";
import {
  categoriasBusca,
  pesquisarGlobal,
  rotulosPessoa,
  textoBusca,
  urlBusca,
} from "../models/buscaGlobal.js";

export function buscaGlobal(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioDaSessao;
  return res.render("pages/busca-pessoas", {
    title: "Busca global",
    stylesheet: "busca-pessoas",
    path: "/search",
    authenticated: true,
    ...pesquisarGlobal(req.query, usuario.id),
    categorias: categoriasBusca,
    urlBusca,
    rotulosPessoa,
  });
}

export function sugestoesBusca(req: Request, res: Response) {
  res.set("Cache-Control", "no-store");
  const q = textoBusca(req.query.q);
  if (q.length < 2) return res.json({ itens: [], url: urlBusca({ q }) });
  const resultado = pesquisarGlobal(
    { q },
    (res.locals.usuario as UsuarioDaSessao).id
  );
  const itens = categoriasBusca
    .filter(c => c.id !== "tudo")
    .flatMap(categoria => {
      const grupo =
        resultado.grupos[categoria.id as keyof typeof resultado.grupos];
      return grupo.slice(0, 2).map(item =>
        "name" in item
          ? {
              titulo: item.name,
              detalhe: [item.handle, ...rotulosPessoa(item)].join(" · "),
              categoria: categoria.nome,
              url: "/p/" + encodeURIComponent(item.handle.replace(/^@/, "")),
            }
          : {
              titulo: item.titulo,
              detalhe: item.autor,
              categoria: categoria.nome,
              url: item.url,
            }
      );
    });
  return res.json({ itens, url: urlBusca({ q }), total: resultado.total });
}

import type { Request, Response } from "express";
import type { UsuarioDaSessao } from "../models/bancoDados.js";
import { CypherModel } from "../models/modeloCypher.js";
import {
  fotoEventoDemonstrativo,
  publicacoesDescoberta,
  type PublicacaoDescoberta,
} from "../models/modeloDescoberta.js";
import { obterPreferenciasUsuario } from "../models/identidadeUsuario.js";
import { discoDemo } from "../models/catalogoDemonstrativo.js";
import { resolverTemaEvento } from "../models/temasEvento.js";

const categorias = [
  { id: "tudo", nome: "Tudo", icone: "" },
  {
    id: "obras",
    nome: "Obras",
    icone: "music",
    foto: "Obras/profetiza-LEZIN.jpg",
    legenda: "Faixas e lançamentos",
  },
  {
    id: "beats",
    nome: "Beats",
    icone: "headphones",
    foto: "Beats/Parece-Sorte-HXTEL.png",
    legenda: "Produção e instrumentais",
  },
  {
    id: "eventos",
    nome: "Eventos",
    icone: "calendarDays",
    foto: "descoberta/eventos.jpg",
    legenda: "Encontros da cena",
  },
  {
    id: "profissionais",
    nome: "Profissionais",
    icone: "users",
    foto: "descoberta/profissionais.png",
    legenda: "Artistas e criadores",
  },
];
const texto = (valor: unknown) =>
  typeof valor === "string" ? valor.trim().slice(0, 100) : "";
const normalizar = (valor: string) =>
  valor.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
const perfilUrl = (handle: string) =>
  "/p/" + encodeURIComponent(handle.replace(/^@/, ""));
const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function ficha(item: PublicacaoDescoberta) {
  const id = encodeURIComponent(item.id);
  if (item.grupo === "obras") return perfilUrl(item.handle) + "#obra-" + id;
  if (item.grupo === "beats") return "/beats#beat-" + id;
  return "/events?localizacao=#evento-" + id;
}

export function descoberta(req: Request, res: Response) {
  const usuario = res.locals.usuario as UsuarioDaSessao;
  const categoria =
    req.query.tipo === "musica"
      ? "musica"
      : (categorias.find(item => item.id === req.query.tipo)?.id ?? "tudo");
  const q = texto(req.query.q);
  const detalhe = texto(req.query.detalhe);
  const termos = normalizar(q).split(/\s+/).filter(Boolean);
  const preferencias = obterPreferenciasUsuario(usuario.id, "");
  const generos = new Set(preferencias.generos.map(normalizar));
  const regiao = normalizar(preferencias.regiao);
  const afinidade = (local: string, estilos: string[]) =>
    Number(Boolean(regiao && normalizar(local).includes(regiao))) +
    Number(estilos.some(estilo => generos.has(normalizar(estilo))));
  // Sugestões profissionais usam somente atuações visíveis e a função da própria conta.
  const complementares = new Set<string>();
  if (usuario.tipoConta === "profissional") {
    const criadoresMusicais = [
      "Rapper",
      "MC",
      "Freestyleiro",
      "Compositor(a)",
      "Letrista",
    ];
    const producao = ["Beatmaker", "Produtor(a)", "DJ", "Videomaker"];
    if (usuario.categories.some(c => criadoresMusicais.includes(c)))
      producao.forEach(c => complementares.add(c));
    if (usuario.categories.some(c => producao.includes(c)))
      criadoresMusicais.forEach(c => complementares.add(c));
  }
  const pessoas = CypherModel.buscarPessoasPublicas(
    { q, categoria: "", genero: "", localizacao: "" },
    usuario.id
  )
    .pessoas.map(p => ({
      grupo: "profissionais",
      titulo: p.name,
      autor: p.handle,
      tipo: p.role,
      genero: "",
      local: p.city,
      url: perfilUrl(p.handle),
      iniciais: p.initials,
      categorias: p.categories,
      estilos: p.genres,
      afinidade: afinidade(p.city, p.genres),
      complementar: p.categories.some(c => complementares.has(c)),
    }))
    .sort(
      (a, b) =>
        Number(b.complementar) - Number(a.complementar) ||
        b.afinidade - a.afinidade
    );
  const publicacoes = publicacoesDescoberta()
    .filter(item => {
      const campos = normalizar(
        [
          item.titulo,
          item.autor,
          item.handle,
          item.tipo,
          item.categoria,
          item.genero,
          item.local,
          item.descricao,
        ].join(" ")
      );
      return termos.every(termo => campos.includes(termo));
    })
    .map(item => {
      const data = /^\d{4}-\d{2}-\d{2}$/.test(item.data)
        ? new Date(item.data + "T12:00:00Z")
        : null;
      const partes =
        data && !Number.isNaN(data.getTime())
          ? dataCurta.formatToParts(data)
          : [];
      return {
        ...item,
        temaCartao: resolverTemaEvento(item.temaCartao),
        url: ficha(item),
        fotoDestaque:
          item.grupo === "eventos" && item.demonstracao
            ? fotoEventoDemonstrativo(item.id)
            : undefined,
        dataCurta: partes.map(parte => parte.value).join(""),
        dia: partes.find(parte => parte.type === "day")?.value,
        mes: partes
          .find(parte => parte.type === "month")
          ?.value.replace(/\.$/, ""),
        afinidade: afinidade(item.local, [item.genero]),
      };
    })
    .sort((a, b) => b.afinidade - a.afinidade);
  const musica = publicacoes.filter(item => item.grupo !== "eventos");
  const hoje = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const agenda = publicacoes
    .filter(
      item =>
        item.grupo === "eventos" && !item.fotoDestaque && item.data >= hoje
    )
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const candidatos = [...publicacoes, ...pessoas].filter(
    item =>
      categoria === "tudo" ||
      item.grupo === categoria ||
      (categoria === "musica" &&
        (item.grupo === "obras" || item.grupo === "beats"))
  );
  // As opções refletem os metadados visíveis da categoria e da consulta atual.
  const facetas = (item: (typeof candidatos)[number]) =>
    "categorias" in item
      ? [...item.categorias, ...item.estilos, item.local].filter(Boolean)
      : [
          item.tipo,
          item.categoria,
          item.genero,
          item.local,
          categoria === "eventos" && item.dataCurta
            ? item.data >= hoje
              ? "Próximos eventos"
              : "Eventos passados"
            : "",
        ].filter(Boolean);
  const opcoes = [...new Set(candidatos.flatMap(facetas))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const resultados = candidatos.filter(
    item => !detalhe || facetas(item).includes(detalhe)
  );
  const paginas = Math.max(1, Math.ceil(resultados.length / 24));
  const pagina = Math.max(
    1,
    Math.min(paginas, Number.parseInt(texto(req.query.pagina), 10) || 1)
  );
  return res.render("pages/descoberta", {
    title: "Descoberta",
    stylesheet: "descoberta",
    temaPreferido: preferencias.tema,
    path: req.path,
    usuario,
    authenticated: true,
    categorias,
    categoria,
    q,
    detalhe,
    opcoes,
    filtrado: Boolean(q || detalhe || categoria !== "tudo"),
    resultados: resultados.slice((pagina - 1) * 24, pagina * 24),
    total: resultados.length,
    paginas,
    pagina,
    musica: musica.slice(0, 4),
    discosDestacados: musica.filter(item => item.grupo === "obras" && item.demonstracao && discoDemo(item.id)),
    obraDestacada: musica.find(item => item.grupo === "obras" && !item.demonstracao),
    beatDestacado: musica.find(item => item.grupo === "beats"),
    pessoas: pessoas.slice(0, 6),
    agenda: agenda.slice(0, 3),
    eventosDestacados: publicacoes
      .filter(item => item.fotoDestaque)
      .sort((a, b) => a.data.localeCompare(b.data)),
    guia: CypherModel.faqs()[0],
  });
}

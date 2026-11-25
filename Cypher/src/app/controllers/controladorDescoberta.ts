import { perfilUrl, enderecoObra } from "../models/enderecosPerfil.js";
import { artigosPublicados } from "../models/central.js";
import { randomInt } from "node:crypto";
import type { Request, Response } from "express";
import type { UsuarioDaSessao } from "../models/bancoDados.js";
import { CypherModel } from "../models/modeloCypher.js";
import {
  fotoEventoDemonstrativo,
  publicacoesDescoberta,
  type PublicacaoDescoberta,
} from "../models/modeloDescoberta.js";
import { obterPreferenciasUsuario } from "../models/identidadeUsuario.js";
import {
  discoDemo,
  idFaixaDemo,
  imagemPerfilDemo,
  imagemPublicacaoDemo,
} from "../models/catalogoDemonstrativo.js";
import { dataAtualCadastro } from "../validators/validarIdentidade.js";
import { resolverTemaEvento } from "../models/temasEvento.js";

const albumAteAUltimaRima = "demo-obra-ate-a-ultima-rima";
const faixaAlice = idFaixaDemo(albumAteAUltimaRima, 7);
const perfisDestacados = new Set([
  "demo-catalogo-lezin.demo",
  "demo-catalogo-levinsk.demo",
]);
const acoesPublicacoesDestacadas = new Map([
  ["demo-workshop-dj-producao", "Ver evento"],
  ["demo-destaque-roda-da-madrugada", "Ver evento"],
  ["demo-obra-lmc-vol-1", "Ver lançamento"],
  [albumAteAUltimaRima, "Ver lançamento"],
  ["demo-obra-profetiza", "Ver faixa"],
  [faixaAlice, "Ver faixa"],
  ["demo-beat-caos", "Ver beat"],
  ["demo-beat-parece-sorte", "Ver beat"],
]);

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
const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function ficha(item: PublicacaoDescoberta) {
  const id = encodeURIComponent(item.id);
  if (item.grupo === "obras") return enderecoObra(item.handle, item.id);
  if (item.grupo === "beats") return "/beats#beat-" + id;
  return item.demonstracao
    ? "/events?localizacao=#evento-" + id
    : "/events/" + id;
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
  const cartaoPerfil = (
    p: ReturnType<typeof CypherModel.buscarPessoasPublicas>["pessoas"][number]
  ) => ({
    userId: p.userId,
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
  });
  const filtrosPessoas = { q, categoria: "", genero: "", localizacao: "" };
  const pessoas = CypherModel.buscarPessoasPublicas(filtrosPessoas, usuario.id)
    .pessoas.map(cartaoPerfil)
    .sort(
      (a, b) =>
        Number(b.complementar) - Number(a.complementar) ||
        b.afinidade - a.afinidade
    );
  const filtrado = Boolean(q || detalhe || categoria !== "tudo");
  const publicacoesComDestaques = publicacoesDescoberta(
    "",
    filtrado ? "" : faixaAlice,
    false,
    usuario.id
  )
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
          item.grupo === "eventos"
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
  const destaques = filtrado
    ? []
    : [
        ...publicacoesComDestaques.flatMap(item => {
          const acao = acoesPublicacoesDestacadas.get(item.id);
          if (!acao) return [];
          const disco = discoDemo(item.id);
          const detalhes =
            item.grupo === "eventos"
              ? [item.dataCurta, item.hora, item.local]
              : [
                  item.autor,
                  item.grupo === "beats" ? item.genero : item.tipo,
                  disco && disco.faixas.length + " faixas",
                ];
          return [
            {
              titulo: item.titulo,
              texto: detalhes.filter(Boolean).join(" · "),
              foto: item.fotoDestaque
                ? item.fotoDestaque.includes("/")
                  ? item.fotoDestaque
                  : "descoberta/" + item.fotoDestaque
                : imagemPublicacaoDemo(item.id),
              url: item.url,
              acao,
            },
          ];
        }),
        ...pessoas
          .filter(item => perfisDestacados.has(item.userId))
          .map(item => ({
            titulo: item.titulo,
            texto: [item.tipo, item.local].filter(Boolean).join(" · "),
            foto: imagemPerfilDemo(item.autor),
            url: item.url,
            acao: "Ver perfil",
          })),
      ];
  for (let i = destaques.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [destaques[i], destaques[j]] = [destaques[j], destaques[i]];
  }
  const publicacoes = publicacoesComDestaques.filter(
    item => item.id !== faixaAlice
  );
  const musica = publicacoes.filter(item => item.grupo !== "eventos");
  const hoje = dataAtualCadastro();
  const agenda = publicacoes
    .filter(
      item => item.grupo === "eventos" && item.dataCurta && item.data >= hoje
    )
    .sort(
      (a, b) =>
        a.data.localeCompare(b.data) ||
        a.hora.localeCompare(b.hora) ||
        a.id.localeCompare(b.id)
    );
  const populares = filtrado
    ? []
    : CypherModel.buscarPessoasPublicas(
        { ...filtrosPessoas, ordem: "populares" },
        usuario.id
      )
        .pessoas.slice(0, 3)
        .map(cartaoPerfil);
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
    filtrado,
    destaques,
    resultados: resultados.slice((pagina - 1) * 24, pagina * 24),
    total: resultados.length,
    paginas,
    pagina,
    musica: musica.slice(0, 4),
    pessoas: pessoas.slice(0, 6),
    populares,
    agenda: agenda.slice(0, 4),
    eventosDestacados: publicacoes
      .filter(item => item.fotoDestaque)
      .sort((a, b) => a.data.localeCompare(b.data)),
    guias: artigosPublicados()
      .slice(0, 3)
      .map(a => ({ q: a.titulo, a: a.resumo, href: "/central/" + a.slug })),
  });
}

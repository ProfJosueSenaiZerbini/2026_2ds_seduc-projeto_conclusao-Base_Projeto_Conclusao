import { perfilUrl, enderecoObra } from "./enderecosPerfil.js";
import { CypherModel } from "./modeloCypher.js";
import { publicacoesDescoberta } from "./modeloDescoberta.js";
import { normalizarBusca } from "./espacoTrabalho.js";
import { fotoEventoDemonstrativo } from "./modeloDescoberta.js";
import { resolverTemaEvento } from "./temasEvento.js";
import { dataAtualCadastro } from "../validators/validarIdentidade.js";
import type { PerfilBuscaPublico } from "./bancoDados.js";

export const categoriasBusca = [
  { id: "tudo", nome: "Tudo", icone: "search" },
  { id: "pessoas", nome: "Pessoas", icone: "users" },
  { id: "obras", nome: "Obras", icone: "music" },
  { id: "beats", nome: "Beats", icone: "headphones" },
  { id: "eventos", nome: "Eventos", icone: "calendarDays" },
] as const;
export type TipoBusca = (typeof categoriasBusca)[number]["id"];
export const textoBusca = (valor: unknown) =>
  typeof valor === "string" ? valor.trim().slice(0, 100) : "";
export const urlBusca = (
  valores: Record<string, string | number | undefined>
) => {
  const params = new URLSearchParams();
  for (const [nome, valor] of Object.entries(valores))
    if (valor && !(nome === "tipo" && valor === "tudo"))
      params.set(nome, String(valor));
  return "/search" + (params.size ? "?" + params : "");
};

// Página e sugestões compartilham as mesmas projeções e políticas públicas.
export function pesquisarGlobal(
  consulta: Record<string, unknown>,
  usuarioId: string
) {
  const q = textoBusca(consulta.q);
  const legado = ["categoria", "genero", "localizacao", "ordem"].some(chave =>
    textoBusca(consulta[chave])
  );
  const tipo =
    categoriasBusca.find(c => c.id === consulta.tipo)?.id ??
    (legado ? "pessoas" : "tudo");
  const pessoas = CypherModel.buscarPessoasPublicas(
    { q, categoria: "", genero: "", localizacao: "" },
    usuarioId
  );
  const termos = normalizarBusca(q).split(/\s+/).filter(Boolean);
  const data = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
  const publicacoes = publicacoesDescoberta("", "", false, usuarioId)
    .filter(item => {
      const campos = normalizarBusca(
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
      const partes =
        /^\d{4}-\d{2}-\d{2}$/.test(item.data) &&
        !Number.isNaN(Date.parse(item.data))
          ? data.formatToParts(new Date(item.data + "T12:00:00Z"))
          : [];
      return {
        ...item,
        url:
          item.grupo === "obras"
            ? enderecoObra(item.handle, item.id)
            : item.grupo === "beats"
              ? "/beats#beat-" + encodeURIComponent(item.id)
              : item.demonstracao
                ? "/events?localizacao=#evento-" + encodeURIComponent(item.id)
                : "/events/" + encodeURIComponent(item.id),
        temaCartao: resolverTemaEvento(item.temaCartao),
        fotoDestaque: fotoEventoDemonstrativo(item.id),
        dia: partes.find(p => p.type === "day")?.value,
        mes: partes.find(p => p.type === "month")?.value.replace(/\.$/, ""),
        dataCurta: partes.map(p => p.value).join(""),
      };
    });
  const grupos = {
    pessoas: pessoas.pessoas,
    obras: publicacoes.filter(p => p.grupo === "obras"),
    beats: publicacoes.filter(p => p.grupo === "beats"),
    eventos: publicacoes.filter(p => p.grupo === "eventos"),
  };
  const contagens = {
    ...Object.fromEntries(
      Object.entries(grupos).map(([chave, itens]) => [chave, itens.length])
    ),
    tudo: pessoas.pessoas.length + publicacoes.length,
  };
  const unicas = (valores: string[]) =>
    [...new Set(valores.filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  const fonte = tipo === "tudo" || tipo === "pessoas" ? [] : grupos[tipo];
  const opcoes =
    tipo === "pessoas"
      ? pessoas.opcoes
      : {
          categorias: tipo === "beats" ? [] : unicas(fonte.map(p => p.tipo)),
          generos: unicas(fonte.map(p => p.genero)),
          localizacoes: unicas(fonte.map(p => p.local)),
        };
  const filtros = {
    categoria:
      tipo === "tudo" || tipo === "beats" ? "" : textoBusca(consulta.categoria),
    genero:
      tipo === "pessoas" || tipo === "obras" || tipo === "beats"
        ? textoBusca(consulta.genero)
        : "",
    localizacao:
      tipo === "pessoas" || tipo === "eventos"
        ? textoBusca(consulta.localizacao)
        : "",
    ordem:
      tipo === "pessoas" && consulta.ordem === "populares" ? "populares" : "",
    periodo:
      tipo === "eventos" &&
      ["proximos", "passados"].includes(String(consulta.periodo))
        ? String(consulta.periodo)
        : "",
  };
  // O filtro legado de popularidade continua usando o cálculo original.
  if (tipo === "pessoas") {
    grupos.pessoas = CypherModel.buscarPessoasPublicas(
      {
        ...filtros,
        q,
        ordem: filtros.ordem === "populares" ? "populares" : undefined,
      },
      usuarioId
    ).pessoas.filter(
      p =>
        (!filtros.categoria ||
          [...p.categories, p.otherCategory].some(
            c => normalizarBusca(c) === normalizarBusca(filtros.categoria)
          )) &&
        (!filtros.genero ||
          p.genres.some(
            g => normalizarBusca(g) === normalizarBusca(filtros.genero)
          )) &&
        (!filtros.localizacao ||
          normalizarBusca(p.city) === normalizarBusca(filtros.localizacao))
    );
  } else if (tipo !== "tudo") {
    const hoje = dataAtualCadastro();
    grupos[tipo] = fonte.filter(
      p =>
        (!filtros.categoria || p.tipo === filtros.categoria) &&
        (!filtros.genero || p.genero === filtros.genero) &&
        (!filtros.localizacao || p.local === filtros.localizacao) &&
        (!filtros.periodo ||
          (Boolean(p.data) &&
            (filtros.periodo === "proximos" ? p.data >= hoje : p.data < hoje)))
    );
  }
  const total = tipo === "tudo" ? contagens.tudo : grupos[tipo].length;
  const paginas = Math.max(1, Math.ceil(total / 24));
  const pagina = Math.max(
    1,
    Math.min(paginas, parseInt(textoBusca(consulta.pagina), 10) || 1)
  );
  return {
    q,
    tipo,
    filtros,
    opcoes,
    grupos,
    contagens,
    total,
    paginas,
    pagina,
    filtrosAtivos: Object.values(filtros).some(Boolean),
  };
}

export function rotulosPessoa(pessoa: PerfilBuscaPublico) {
  return pessoa.categories.map(c =>
    c === "Outros" && pessoa.otherCategory
      ? pessoa.otherCategory
      : (pessoa.rotulosCategorias[c] ?? c)
  );
}

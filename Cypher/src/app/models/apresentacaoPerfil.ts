import {
  conexaoInternaCypher,
  listarObrasPublicasPerfilCypher,
} from "./bancoDados.js";
import {
  discoDemo,
  idFaixaDemo,
  imagemPerfilDemo,
  imagemPublicacaoDemo,
} from "./catalogoDemonstrativo.js";
import { plataformaDaObra } from "./catalogoObras.js";
import {
  capaPublicacao,
  listarMidiasPublicacoes,
} from "./midiasPublicacoes.js";
import {
  configuracaoPortfolio,
  inferirAtuacoes,
  montarPortfolio,
  origensPortfolio,
} from "./portfolio.js";
import {
  objetoDisponivel,
  situacaoContaModeracao,
} from "./politicasModeracao.js";
import { contatoEtarioPermitido } from "./protecoesConta.js";
import { idProfissaoPorCategoria } from "./questionarioAtuacao.js";
import { podePublicar } from "./permissoes.js";
import { projetoTrabalho } from "./projetosTrabalho.js";
import { reputacaoPublica, resumoReputacao } from "./colaboracoes.js";
import { seloPerfil } from "./seloPerfil.js";
import { conexoesCena, itemCena } from "./catalogoCena.js";
import { enderecoObra } from "./enderecosPerfil.js";

export type NavegacaoPerfil = {
  aba?: string;
  atuacao?: string;
  pagina?: string;
  obra?: string;
};
type Identidade = {
  id: string;
  handle: string;
  categorias: string[];
  demo: boolean;
};
type Visitante = { id: string; tipoConta: string; demonstracao: boolean };
const abasPerfil = {
  catalogo: "Catálogo",
  creditos: "Participações",
  galeria: "Galeria e portfólio",
  sobre: "Sobre",
  atuacao: "Atuação",
  avaliacoes: "Avaliações",
};
type Aba = keyof typeof abasPerfil;
type Trabalho = {
  id: string;
  tipo: string;
  titulo: string;
  formato: string;
  detalhe: string;
  atuacoes: string[];
  url: string;
  capa?: string;
  secao: Aba;
  album?: string;
};

function trabalhosDoPerfil(
  p: Identidade,
  visitante: string,
  proprio: boolean
): Trabalho[] {
  const db = conexaoInternaCypher();
  if (p.demo) {
    return listarObrasPublicasPerfilCypher(p.handle, visitante).map(
      (o: {
        id: string;
        title: string;
        type: string;
        genre: string;
        role: string;
      }) => ({
        id: o.id,
        titulo: o.title,
        tipo: "obra",
        formato: o.type,
        detalhe: o.genre,
        atuacoes: inferirAtuacoes(o.role || ""),
        url: enderecoObra(p.handle, o.id),
        secao: "catalogo",
      })
    );
  }
  const saida: Trabalho[] = [];
  for (const o of origensPortfolio(p.id)) {
    // Presença em evento não constitui crédito profissional.
    if (!o.proprio && o.tipo !== "obra") continue;
    if (!(proprio && o.proprio) && !o.origem_publica) continue;
    if (!o.proprio && !o.autor_confirmado) continue;
    if (
      !objetoDisponivel(db, o.tipo, o.id, visitante) ||
      (!o.proprio && !objetoDisponivel(db, o.tipo, o.id, p.id))
    )
      continue;
    const atuacoes: string[] = JSON.parse(o.atuacoes || "[]");
    if (!atuacoes.length) atuacoes.push(...inferirAtuacoes(o.papel || ""));
    if (o.tipo === "beat" && p.categorias.includes("Produtor(a)"))
      atuacoes.push("produtor");
    const secao = !o.proprio
      ? "creditos"
      : o.tipo === "projeto"
        ? "galeria"
        : "catalogo";
    const nomes: Record<string, string> = {
      visual: "Galeria",
      audiovisual: "Audiovisual",
      tecnico: "Trabalho técnico",
      danca: "Dança",
      texto: "Texto",
      audio: "Áudio",
      projeto: "Projeto",
    };
    const id = encodeURIComponent(o.id);
    const url =
      o.tipo === "obra"
        ? proprio && o.proprio
          ? "/espaco-de-trabalho/obra/" + id
          : enderecoObra(o.identificador, o.id)
        : o.tipo === "projeto"
          ? "/work-projects/" + id
          : o.tipo === "evento"
            ? "/events/" + id
            : "/beats/" + id;
    saida.push({
      id: o.id,
      tipo: o.tipo,
      titulo: o.titulo,
      formato: nomes[o.nome_tipo] || o.nome_tipo,
      detalhe: !o.proprio
        ? [o.papel, o.autor].filter(Boolean).join(" · ")
        : [o.papel, o.origem_publica ? "" : "Privado"]
            .filter(Boolean)
            .join(" · "),
      atuacoes,
      url,
      secao,
      album: o.album,
    });
  }
  return saida;
}

export function montarApresentacao(
  p: Identidade,
  visitante: Visitante,
  proprio: boolean,
  nav: NavegacaoPerfil
) {
  const db = conexaoInternaCypher();
  const contexto = p.categorias.includes(nav.atuacao || "") ? nav.atuacao! : "";
  const profissao = idProfissaoPorCategoria(contexto) || contexto;
  const corresponde = (item: { atuacoes: string[] }) =>
    !contexto || item.atuacoes.includes(profissao);
  const acervo = trabalhosDoPerfil(p, visitante.id, proprio);
  const trabalhos = acervo.filter(corresponde);
  const ids = new Set(trabalhos.map(i => i.id));
  const catalogo = trabalhos.filter(
    i => i.secao === "catalogo" && !(i.album && ids.has(i.album))
  );
  const participacoes = trabalhos.filter(i => i.secao === "creditos");
  const projetos = trabalhos.filter(i => i.secao === "galeria");
  const slug = encodeURIComponent(p.handle.replace(/^@/, ""));
  const editavel = proprio && !p.demo;
  const vitrineVisivel =
    !p.demo && !visitante.demonstracao && configuracaoPortfolio(p.id).visivel;
  const portfolio = vitrineVisivel ? montarPortfolio(p.id, visitante.id) : null;
  const galeria: Trabalho[] = portfolio
    ? portfolio.itens.filter(corresponde).map(i => ({
        ...i,
        formato: i.nomeTipo,
        detalhe: i.proprio
          ? i.secao || i.papel
          : [i.papel, i.autor].join(" · "),
        secao: "galeria",
      }))
    : projetos;
  const rep =
    p.demo || visitante.demonstracao
      ? null
      : proprio
        ? { ...resumoReputacao(p.id), avaliacoesPublicas: [] }
        : reputacaoPublica(p.id, visitante.id);
  const capacidades = {
    tipoConta: "profissional" as const,
    categories: contexto ? [contexto] : p.categorias,
  };
  const podeCatalogo =
    podePublicar(capacidades, "obra") ||
    podePublicar(capacidades, "beat") ||
    podePublicar(capacidades, "evento");
  const abas = (Object.keys(abasPerfil) as Aba[])
    .filter(
      a =>
        ({
          catalogo: catalogo.length > 0 || (editavel && podeCatalogo),
          creditos: participacoes.length > 0,
          galeria: galeria.length > 0 || editavel || (!!portfolio && !contexto),
          sobre: true,
          atuacao: p.categorias.length > 0,
          avaliacoes: !!rep,
        })[a]
    )
    .map(id => ({ id, nome: abasPerfil[id] }));
  const aba =
    abas.find(a => a.id === nav.aba)?.id ??
    (catalogo.length
      ? "catalogo"
      : galeria.length
        ? "galeria"
        : participacoes.length
          ? "creditos"
          : "sobre");
  const itens =
    aba === "catalogo"
      ? catalogo
      : aba === "creditos"
        ? participacoes
        : aba === "galeria"
          ? galeria
          : [];
  const paginas = Math.max(1, Math.ceil(itens.length / 8));
  const pagina = Math.max(
    1,
    Math.min(paginas, Math.floor(Number(nav.pagina)) || 1)
  );
  const visiveis = itens.slice((pagina - 1) * 8, pagina * 8).map(i => {
    const imagem = listarMidiasPublicacoes(visitante.id, i.tipo, i.id).find(
      m => m.finalidade === "imagem"
    );
    const acervo = imagemPublicacaoDemo(i.id);
    const capa = imagem
      ? "/publication-media/" + imagem.id
      : i.capa || (acervo ? "/img/" + acervo : "");
    if (capa || i.tipo !== "projeto") return { ...i, capa };
    const foto = projetoTrabalho(visitante.id, i.id).itens.find(
      m =>
        m.mime.startsWith("image/") &&
        (proprio ||
          db
            .prepare("SELECT 1 FROM midias_trabalho WHERE id=? AND publico=1")
            .get(m.origem_id))
    );
    return { ...i, capa: foto?.url || "" };
  });
  const detalhe =
    !proprio && nav.obra
      ? listarObrasPublicasPerfilCypher(p.handle, visitante.id, nav.obra)[0]
      : null;
  const faixas: Trabalho[] = [];
  if (detalhe) {
    const ordem: string[] = detalhe.faixasJson
      ? JSON.parse(detalhe.faixasJson)
      : (discoDemo(detalhe.id)?.faixas.map((_, i) =>
          idFaixaDemo(detalhe.id, i)
        ) ?? []);
    const posicao = new Map(ordem.map((id, indice) => [id, indice]));
    faixas.push(
      ...acervo.filter(
        i =>
          i.secao === "catalogo" &&
          i.tipo === "obra" &&
          i.id !== detalhe.id &&
          (i.album === detalhe.id || posicao.has(i.id))
      )
    );
    faixas.sort(
      (a, b) =>
        (posicao.get(a.id) ?? Infinity) - (posicao.get(b.id) ?? Infinity)
    );
  }
  const midias = listarMidiasPublicacoes(visitante.id, "perfil", p.id);
  const capa = midias.find(m => m.posicao === "capa");
  const foto = midias.find(m => m.posicao === "principal");
  const slugFoto =
    itemCena("perfil", p.id)?.dados.slug || (p.demo ? p.handle : "");
  const fotoCatalogo = slugFoto
    ? imagemPerfilDemo("@" + slugFoto.replace(/^@/, ""))
    : "";
  let destaque: { titulo: string; url: string; imagem: string } | null = null;
  if (!capa) {
    for (const item of acervo) {
      if (item.secao === "creditos" || item.album) continue;
      const enviada = capaPublicacao(visitante.id, item.tipo, item.id);
      const original = imagemPublicacaoDemo(item.id);
      const imagem = enviada
        ? "/publication-media/" + enviada
        : original
          ? "/img/" + original
          : "";
      if (imagem) {
        destaque = { titulo: item.titulo, url: item.url, imagem };
        break;
      }
    }
  }
  const outraPessoa =
    !visitante.demonstracao &&
    !p.demo &&
    visitante.id !== p.id &&
    visitante.tipoConta !== "administrativo";
  const contato =
    outraPessoa &&
    contatoEtarioPermitido(db, visitante.id, p.id) &&
    !situacaoContaModeracao(db, visitante.id).contatoRestrito &&
    !situacaoContaModeracao(db, p.id).contatoRestrito;
  const conversa = contato
    ? (db
        .prepare(
          `SELECT id FROM conversas WHERE
    (participante_a=? AND participante_b=?) OR (participante_a=? AND participante_b=?) ORDER BY criada_em DESC LIMIT 1`
        )
        .get(visitante.id, p.id, p.id, visitante.id) as
        { id: string } | undefined)
    : null;
  const base = proprio ? "/profile" : "/p/" + slug;
  const url = (secao: Aba, pag = 1, atuacao = contexto) => {
    const query = new URLSearchParams({ aba: secao });
    if (atuacao) query.set("atuacao", atuacao);
    if (pag > 1) query.set("pagina", String(pag));
    return base + "?" + query + "#conteudo-perfil";
  };
  return {
    abas,
    aba,
    base,
    url,
    contexto,
    rep,
    selo: seloPerfil(p.id),
    editavel,
    proprio,
    outraPessoa,
    propor: contato && visitante.tipoConta === "profissional",
    representar:
      contato &&
      visitante.tipoConta === "profissional" &&
      objetoDisponivel(db, "perfil", visitante.id, p.id),
    conversa: conversa?.id,
    foto: foto
      ? "/publication-media/" + foto.id
      : fotoCatalogo
        ? "/img/" + fotoCatalogo
        : "",
    capa: capa ? "/publication-media/" + capa.id : "",
    destaque,
    itens: visiveis,
    quantidade: itens.length,
    pagina,
    paginas,
    portfolioUrl: portfolio ? "/portfolio/" + slug : "",
    cena:
      !contexto && (aba === "sobre" || aba === "creditos")
        ? conexoesCena(visitante.id, p.id)
        : null,
    obra: detalhe
      ? {
          ...detalhe,
          faixas,
          plataforma: plataformaDaObra(detalhe.id, detalhe.listenLink),
        }
      : null,
  };
}

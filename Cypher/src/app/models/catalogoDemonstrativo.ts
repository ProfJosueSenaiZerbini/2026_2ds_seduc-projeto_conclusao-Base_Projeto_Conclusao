import { imagemCena } from "./imagensCena.js";
import { pessoasCena, encontrosCena, projetosCena } from "./cenaConteudo.js";
export const perfisDemonstrativos = [
  { slug: "nog.demo", nome: "NOG", funcao: "Rapper", iniciais: "NG", imagem: "Rappers/NOG.jpg", genero: "Rap", cidade: "", bio: "Artista da faixa HORIZONTAL!, com participação de Levinsk." },
  { slug: "eureka.demo", nome: "Eureka Beats", funcao: "Beatmaker", iniciais: "EB", imagem: "Beatmaker/EUREKA BEATS-PROFILE.jpg", genero: "R&B", cidade: "", bio: "Beatmaker de instrumentais como Vice City." },
  {
    slug: "jotape.demo",
    nome: "Jotapê",
    funcao: "Rapper",
    iniciais: "JP",
    imagem: "Rappers/JOTAPE.jpg",
    genero: "Rap",
    cidade: "Guarulhos, SP",
    bio: "Rapper de Guarulhos com trajetória nas batalhas de rima e no rap nacional.",
  },
  {
    slug: "levinsk.demo",
    nome: "Levinsk",
    funcao: "Rapper",
    iniciais: "LV",
    imagem: "Rappers/LEVINSK.jpg",
    genero: "Rap",
    cidade: "",
    bio: "Artista de rap com lançamentos como Baby Hair e participação em HORIZONTAL!.",
  },
  {
    slug: "lezin.demo",
    nome: "Lezin",
    funcao: "Rapper",
    iniciais: "LZ",
    imagem: "Rappers/LEZIN.jpg",
    genero: "Trap",
    cidade: "Bahia",
    bio: "Rapper baiano da cena do trap nacional, com lançamentos pela Papatunes.",
  },
  {
    slug: "wkilla.demo",
    nome: "DJ Wkilla",
    funcao: "Beatmaker",
    iniciais: "WK",
    imagem: "Beatmaker/WKILLA.jpg",
    genero: "Trap",
    cidade: "Manaus, AM",
    bio: "DJ e produtor de Manaus com trabalhos em Detroit, trap e breakbeat.",
  },
  {
    slug: "hxtel.demo",
    nome: "HXTEL Beats",
    funcao: "Beatmaker",
    iniciais: "HX",
    imagem: "Beatmaker/HXTEL.webp",
    genero: "Boom Bap",
    cidade: "",
    bio: "Produtor de instrumentais de boom bap e rap.",
  },
];

export const beatsDemonstrativos = [
  { id: "demo-beat-vice-city", slug: "eureka.demo", titulo: "Vice City", imagem: "Beats/Vice-City-EUREKA BEATS.jpg", genero: "R&B", bpm: "" },
  {
    id: "demo-beat-visao-de-rua",
    slug: "hxtel.demo",
    titulo: "Visão de Rua",
    imagem: "Beats/Visao-de-Rua-HXTEL.webp",
    genero: "Boom Bap",
    bpm: "88",
  },
  {
    id: "demo-beat-parece-sorte",
    slug: "hxtel.demo",
    titulo: "Parece Sorte",
    imagem: "Beats/Parece-Sorte-HXTEL.png",
    genero: "Boom Bap",
    bpm: "92",
  },
  {
    id: "demo-beat-desde-ontem",
    slug: "hxtel.demo",
    titulo: "Desde Ontem",
    imagem: "Beats/Desde-Ontem-HXTEL.webp",
    genero: "Boom Bap",
    bpm: "84",
  },
  {
    id: "demo-beat-spider-man",
    slug: "wkilla.demo",
    titulo: "Spider-Man Detroit",
    imagem: "Beats/Spider-Man-WKILLA.png",
    genero: "Detroit",
    bpm: "96",
  },
  {
    id: "demo-beat-caos",
    slug: "wkilla.demo",
    titulo: "Caos",
    imagem: "Beats/Caos-WKILLA.png",
    genero: "Trap",
    bpm: "142",
  },
];

export const discosDemonstrativos = [
  {
    id: "demo-album-profetiza",
    slug: "lezin.demo",
    titulo: "Profetiza",
    tipo: "Álbum",
    imagem: "Albuns/Profetiza-LEZIN.png",
    genero: "Trap",
    data: "2026-08-24",
    link: "https://open.spotify.com/intl-pt/album/2IKZ3qQg3vuKblNCHXgQdp",
    producao: "",
    // Repertório e participações conforme a referência enviada pelo usuário (2026).
    faixas: ["Intro", "Ovelha Negra", "Profetiza", "Latifundiário", "Gana",
      "Sem dor, Sem ganho", "Mustang", "Tipo Amar", "Não Perco a Minha Paz",
      "7AM", "Predestinadão", "Sou quem sou", "Gigante", "Burro"],
    duracoes: ["1:20", "3:04", "2:55", "2:32", "2:16", "2:24", "2:34",
      "2:18", "2:26", "3:04", "3:00", "2:15", "2:27", "2:19"],
    participacoes: { 1: "Matteuzin, Papatunes", 2: "yvri, Papatunes",
      3: "Papatunes", 4: "yvri, Papatunes", 5: "Papatunes", 6: "Papatunes",
      7: "Papatunes", 8: "Papatunes", 9: "yvri, Papatunes", 10: "meLLo, Papatunes",
      11: "Papatinho, Papatunes", 12: "Matteuzin, Papatunes",
      13: "yvri, Papatunes", 14: "Papatunes" } as Record<number, string>,
  },
  {
    id: "demo-obra-ate-a-ultima-rima",
    slug: "jotape.demo",
    titulo: "Até A Última Rima",
    tipo: "Álbum",
    imagem: "Albuns/ate-a-ultima-rima-JOTAPE.jpg",
    genero: "Rap",
    data: "2025-07-03",
    link: "https://open.spotify.com/album/0q7BnzgfpF9TiaYAN01K3E",
    producao: "Papatinho",
    faixas: [
      "MacGyver",
      "Demar Derozan",
      "LULU (incidental O Último Romântico)",
      "O Sonho de Brida",
      "Jay Jay",
      "O Legado de Pryor",
      "Furacão Elis",
      "Alice e o Jaguadarte",
      "Sr. e Sra. Montenegro",
      "Mauro, o Antagonista",
      "Problemas de Terry Crews",
      "Virgil",
      "Leandro Roque",
      "Roteiro de J. Peele",
    ],
    participacoes: {
      3: "Lulu Santos",
      4: "Major RD",
      5: "Lezin",
      12: "GNÃO",
      13: "Emicida",
    } as Record<number, string>,
  },
  {
    id: "demo-obra-lmc-vol-1",
    slug: "lezin.demo",
    titulo: "LMC Vol.1",
    tipo: "EP",
    imagem: "Albuns/LEZIN-LMC-vol1.jpg",
    genero: "Trap",
    data: "2026-08-05",
    link: "https://open.spotify.com/album/2nXcz3AyIkcI3NTV2u138e",
    producao: "LeodoKick",
    faixas: ["Sold Out", "Go Girl", "Longe"],
    participacoes: { 2: "H4lfmeasures", 3: "Prod Zuca" } as Record<
      number,
      string
    >,
  },
];

export const faixasDemonstrativas = [
  {
    id: "demo-obra-profetiza",
    slug: "lezin.demo",
    titulo: "Profetiza",
    imagem: "Obras/profetiza-LEZIN.jpg",
    genero: "Trap",
    data: "2026-09-22",
    link: "https://open.spotify.com/track/15LIYNKJg18a0fQ4bnK3pf",
    producao: "Thiago Sub",
    participacao: "",
  },
  {
    id: "demo-obra-horizontal",
    slug: "nog.demo",
    titulo: "HORIZONTAL!",
    imagem: "Obras/LEVINSK-NOG-HORIZONTAL.jpg",
    genero: "Rap",
    data: "2026-09-18",
    link: "https://open.spotify.com/track/2K6FdNNrVeTIgMQnmCrz4w",
    producao: "Teo Guedx",
    participacao: "Levinsk",
  },
];

const imagensPerfil = new Map(
  [...perfisDemonstrativos.map(p => ["@" + p.slug, p.imagem] as const),...pessoasCena.flatMap(p=>[["@"+p.slug,p.imagem||'cena/perfis/'+p.slug+'.svg'] as const,["@"+p.slug+'.cena',p.imagem||'cena/perfis/'+p.slug+'.svg'] as const])]
);
const imagensPublicacao = new Map([
  ...encontrosCena.map(e=>[e.id,'cena/obras/'+e.id+'.svg'] as const),
  ...projetosCena.map(e=>[e.id,'cena/obras/'+e.id+'.svg'] as const),
  ...beatsDemonstrativos.map(b => [b.id, b.imagem] as const),
  ...faixasDemonstrativas.map(f => [f.id, f.imagem] as const),
  ...discosDemonstrativos.flatMap(d => [
    [d.id, d.imagem] as const,
    ...d.faixas.map((_, i) => [idFaixaDemo(d.id, i), d.imagem] as const),
  ]),
]);

export function idFaixaDemo(discoId: string, indice: number) {
  return `${discoId}-faixa-${indice + 1}`;
}

export const imagemPerfilDemo = (handle: string) => imagemCena(handle.replace(/^@/, "").replace(/\.cena$/, "").replace(/\.demo$/, "")) || imagensPerfil.get(handle);
export const imagemPublicacaoDemo = (id: string) => imagemCena(id) || imagensPublicacao.get(id);
export const discoDemo = (id: string) =>
  discosDemonstrativos.find(disco => disco.id === id);

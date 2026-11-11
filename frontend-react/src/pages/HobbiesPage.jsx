import React, { useState, useEffect } from 'react';
import { 
  Compass, Home as HomeIcon, MapPin, Sparkles, Coffee, BookOpen, 
  Camera, Palette, Music, Film, ExternalLink, Heart, Search, Check,
  Sun, Moon, Scissors, Feather
} from 'lucide-react';
import Tape from '../components/ui/Tape';
import Badge from '../components/ui/Badge';

const HOBBIES_DATA = [
  // ✦ HOBBIES FORA DE CASA (OUTDOOR & CIDADE)
  {
    id: 'h-out-1',
    tipo: 'FORA_DE_CASA',
    categoria: 'Cafés & Sebos',
    titulo: 'Garimpo em Sebos & Tardes em Cafés com Livros',
    vibe: 'Nostálgico & Calmo',
    tempo: '2 a 4 horas',
    custo: 'Acessível',
    imagem: 'https://images.unsplash.com/photo-1521056787327-165dc2a32836?w=700&h=480&fit=crop',
    descricao: 'Tirar uma tarde para explorar prateleiras empoeiradas de sebos em busca de edições antigas dos seus autores favoritos, seguida de uma pausa com cappuccino e caderno em um café charmoso.',
    lugarTitulo: 'Sebos Tradicionais & Cafeterias com Luz Natural',
    lugarDescricao: 'Ruas históricas com sebos tradicionais, livrarias de rua e cafés de esquina com mesinhas na calçada (como os sebos da Av. Augusta, Centro e bairros culturais).',
    mapQuery: 'sebos e livrarias charmosas',
    dicaLumina: 'Leve uma sacola de tecido (tote bag) e não tenha pressa. O encanto está em folhear páginas amareladas com dedicatórias antigas.'
  },
  {
    id: 'h-out-2',
    tipo: 'FORA_DE_CASA',
    categoria: 'Artes & Museus',
    titulo: 'Tarde Contemplativa em Museus & Galerias de Arte',
    vibe: 'Inspirador & Cultural',
    tempo: '3 a 5 horas',
    custo: 'Gratuito ou Meia-Entrada',
    imagem: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=700&h=480&fit=crop',
    descricao: 'Caminhar sem pressa entre esculturas, pinturas clássicas e instalações contemporâneas. Deixar-se envolver pelo silêncio reverente das salas de exposição.',
    lugarTitulo: 'Pinacotecas, Museus de Arte Moderna & Galerias Independentes',
    lugarDescricao: 'Grandes museus públicos com jardins (como Pinacoteca, MASP, MAM) e pequenos ateliês e galerias de artistas locais.',
    mapQuery: 'museus de arte e galerias contemporaneas',
    dicaLumina: 'Visite em dias de entrada gratuita e leve um pequeno bloco para desenhar ou anotar as frases das legendas que te emocionarem.'
  },
  {
    id: 'h-out-3',
    tipo: 'FORA_DE_CASA',
    categoria: 'Moda & Vintage',
    titulo: 'Caça ao Tesouro em Brechós & Feirinhas de Antiguidades',
    vibe: 'Criativo & Y2K',
    tempo: '2 a 3 horas',
    custo: 'Variável',
    imagem: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&h=480&fit=crop',
    descricao: 'Achar aquela jaqueta de couro dos anos 90, um vestido floral vintage ou óculos de armação colorida que ninguém mais tem. A moda sustentável tem história.',
    lugarTitulo: 'Feiras de Antiguidades & Bairros com Brechós Selecionados',
    lugarDescricao: 'Feiras de praça aos finais de semana (como a Feira da Benedito Calixto, Feira do Bixiga) e ruas com concentração de brechós vintage.',
    mapQuery: 'brechos vintage e feiras de antiguidades',
    dicaLumina: 'Vá com roupas fáceis de provar e olhe com carinho para as araras do fundo; é lá que ficam as peças mais especiais.'
  },
  {
    id: 'h-out-4',
    tipo: 'FORA_DE_CASA',
    categoria: 'Fotografia',
    titulo: 'Expedição de Fotografia Analógica & Passeio Urbano',
    vibe: 'Contemplativo & Artístico',
    tempo: '2 a 4 horas',
    custo: 'Médio (filmes)',
    imagem: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&h=480&fit=crop',
    descricao: 'Carregar uma câmera de filme 35mm e sair à pé observando detalhes da cidade: fachadas históricas, sombras das árvores no asfalto e retratos espontâneos.',
    lugarTitulo: 'Parques Arborizados, Praças Centrais & Bairros Históricos',
    lugarDescricao: 'Parques botânicos, pontes com vista para o pôr do sol e feiras de rua cheias de texturas e cores vivas.',
    mapQuery: 'parques historicos e jardins botanicos',
    dicaLumina: 'Cada foto carrega peso real. Espere o momento exato em que a luz da tarde (golden hour) beijar o cenário.'
  },
  {
    id: 'h-out-5',
    tipo: 'FORA_DE_CASA',
    categoria: 'Natureza & Convívio',
    titulo: 'Piquenique Cultural com Livros & Frutas na Grama',
    vibe: 'Relaxante & Afetuoso',
    tempo: '3 a 5 horas',
    custo: 'Super Acessível',
    imagem: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=700&h=480&fit=crop',
    descricao: 'Estender uma toalha xadrez, levar baguetes frescas, frutas da estação, morangos, um livro cativante e convidar amigas para passar a tarde descalça na grama.',
    lugarTitulo: 'Gramados de Parques Urbanos & Bosques Tranquilos',
    lugarDescricao: 'Áreas sombreadas sob copas de árvores em parques amplos da sua cidade.',
    mapQuery: 'parques com gramado para piquenique',
    dicaLumina: 'Leve uma garrafa térmica com café ou chá gelado de frutas vermelhas e jogos de cartas ou diários para preencher em grupo.'
  },
  {
    id: 'h-out-6',
    tipo: 'FORA_DE_CASA',
    categoria: 'Artesanato & Oficinas',
    titulo: 'Aulas Práticas de Cerâmica no Torno ou Encadernação',
    vibe: 'Tátil & Conectivo',
    tempo: '2 a 3 horas',
    custo: 'Médio',
    imagem: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&h=480&fit=crop',
    descricao: 'Colocar as mãos na terra, sentir o movimento do torno girando e moldar sua própria xícara de argila com orientação de artesãos apaixonados.',
    lugarTitulo: 'Ateliês de Cerâmica & Escolas Livres de Arte',
    lugarDescricao: 'Espaços comunitários de cerâmica, marcenaria artística e ateliês compartilhados nos polos culturais da cidade.',
    mapQuery: 'atelies de ceramica e cursos de artesanato',
    dicaLumina: 'Não se preocupe com linhas perfeitas; as ondulações orgânicas são a impressão digital da sua própria criação.'
  },

  // ✦ HOBBIES EM CASA (INDOOR & AUTOCUIDADO)
  {
    id: 'h-in-1',
    tipo: 'EM_CASA',
    categoria: 'Colagem & Memória',
    titulo: 'Scrapbook Analógico, Diário Visual & Fanzines Y2K',
    vibe: 'Criativo & Nostálgico',
    tempo: '1 a 2 horas',
    custo: 'Econômico',
    imagem: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&h=480&fit=crop',
    descricao: 'Resgatar papéis coloridos, fita washi tape, ingressos de cinema guardados e recortes de revistas antigas para criar páginas que eternizam suas semanas com afeto.',
    lugarTitulo: 'Seu cantinho de trabalho ou tapete da sala',
    lugarDescricao: 'Um espaço com boa luz natural, tesoura sem ponta, cola em bastão e suas músicas favoritas de fundo.',
    mapQuery: null,
    dicaLumina: 'Imprima fotos pequenas do celular em papel comum e combine com frases de livros que você amou ler.'
  },
  {
    id: 'h-in-2',
    tipo: 'EM_CASA',
    categoria: 'Arte & Modelagem',
    titulo: 'Cerâmica Fria: Criação de Porta-Joias & Vasinhos',
    vibe: 'Zen & Sensorial',
    tempo: '2 horas',
    custo: 'Muito Acessível',
    imagem: 'https://images.unsplash.com/photo-1594913785162-e678a0c23ddb?w=700&h=480&fit=crop',
    descricao: 'Modelar pequenos pratinhos orgânicos para brincos e incensos usando massa de cerâmica plástica (air dry clay) que seca naturalmente sem forno.',
    lugarTitulo: 'Mesa da cozinha ou bancada de trabalho',
    lugarDescricao: 'Basta um pedaço de papel manteiga para não grudar na mesa e um copo liso para usar como rolo de massa.',
    mapQuery: null,
    dicaLumina: 'Após secar por 24h, pinte com tinta acrílica em tons pastéis e finalize com verniz brilhante para dar efeito de porcelana.'
  },
  {
    id: 'h-in-3',
    tipo: 'EM_CASA',
    categoria: 'Cinema & Conforto',
    titulo: 'Cineclube Feminino em Casa com Pipoca Gourmet',
    vibe: 'Aconchegante & Crítico',
    tempo: '2 horas',
    custo: 'Quase zero',
    imagem: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=700&h=480&fit=crop',
    descricao: 'Apagar as luzes principais, acender velas aromáticas e maratonar produções dirigidas por mulheres ou clássicos cult que marcaram os anos 2000.',
    lugarTitulo: 'Sofá aconchegante com mantas e almofadas',
    lugarDescricao: 'Ambiente com iluminação difusa e lanche quentinho.',
    mapQuery: null,
    dicaLumina: 'Faça pipoca com azeite de oliva e alecrim seco ou finalize com raspas de chocolate meio amargo. Anote suas impressões na revista Lumina!'
  },
  {
    id: 'h-in-4',
    tipo: 'EM_CASA',
    categoria: 'Culinária Afetiva',
    titulo: 'Cafeteria em Casa: Rituais de Matcha & Pães Caseiros',
    vibe: 'Acalento & Presença',
    tempo: '1 a 2 horas',
    custo: 'Acessível',
    imagem: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=700&h=480&fit=crop',
    descricao: 'Aprender a preparar bebidas especiais como matcha latte cremoso, chai indiano com especiarias ou um bolo de cenoura e especiarias para perfumar a casa.',
    lugarTitulo: 'Cozinha iluminada pela manhã',
    lugarDescricao: 'Momento de desconexão total: celular longe e foco nas cores, aromas e texturas dos ingredientes.',
    mapQuery: null,
    dicaLumina: 'Bata o leite vegetal com espumador manual para criar aquela camada densa de cafeteria gourmet.'
  },
  {
    id: 'h-in-5',
    tipo: 'EM_CASA',
    categoria: 'Botânica & Verde',
    titulo: 'Jardinagem Urbana, Poda & Terrários em Vidro',
    vibe: 'Cuidado & Vida',
    tempo: '1 hora',
    custo: 'Econômico',
    imagem: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=700&h=480&fit=crop',
    descricao: 'Propagar mudinhas de jiboia na água, replantar suculentas, limpar folhas com pano úmido e acompanhar o desabrochar de novos brotos no peitoril da janela.',
    lugarTitulo: 'Varanda, peitoril da janela ou cantinho verde da sala',
    lugarDescricao: 'Local que receba luz indireta brilhante durante as manhãs.',
    mapQuery: null,
    dicaLumina: 'Acompanhar o ritmo lento de uma planta ensina sobre paciência e processos de florescimento próprio.'
  },
  {
    id: 'h-in-6',
    tipo: 'EM_CASA',
    categoria: 'Escrita & Introspecção',
    titulo: 'Morning Pages & Escrita Terapêutica com Caneta Tinteiro',
    vibe: 'Clareza & Autocuidado',
    tempo: '20 a 40 minutos',
    custo: 'Apenas um caderno',
    imagem: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=700&h=480&fit=crop',
    descricao: 'Escrever três páginas livres assim que acordar, sem julgamentos gramaticais. Deixar pensamentos, sonhos da noite e expectativas fluírem livremente.',
    lugarTitulo: 'Cama arrumada ou poltrona com uma xícara de café',
    lugarDescricao: 'O primeiro ritual antes de checar qualquer notificação digital.',
    mapQuery: null,
    dicaLumina: 'Não releia imediatamente. Trate esse caderno como uma conversa íntima e sincera com a sua própria mente.'
  }
];

const HobbiesPage = () => {
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // 'TODOS' | 'EM_CASA' | 'FORA_DE_CASA'
  const [busca, setBusca] = useState('');
  const [hobbiesSalvos, setHobbiesSalvos] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleSalvar = (id) => {
    setHobbiesSalvos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const hobbiesFiltrados = HOBBIES_DATA.filter((hobby) => {
    const matchTipo = filtroTipo === 'TODOS' || hobby.tipo === filtroTipo;
    const termo = busca.toLowerCase().trim();
    const matchBusca = !termo || 
      hobby.titulo.toLowerCase().includes(termo) ||
      hobby.categoria.toLowerCase().includes(termo) ||
      hobby.descricao.toLowerCase().includes(termo) ||
      hobby.lugarTitulo.toLowerCase().includes(termo);

    return matchTipo && matchBusca;
  });

  return (
    <div className="w-full bg-[#F4F1EA] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* ✦ CABEÇALHO EDITORIAL ✦ */}
        <div className="bg-white border-2 border-graphite p-8 sm:p-12 shadow-[6px_6px_0_0_#111111] relative">
          <Tape variant="yellow" className="-top-3 right-8 w-28 h-6 rotate-2 pointer-events-none" />

          <div className="flex items-center gap-2 mb-3">
            <span className="bg-red-editorial text-white text-[10px] font-mono font-bold tracking-widest px-3 py-1 uppercase shadow-2xs">
              GUIA EDITORIAL LUMINA
            </span>
            <span className="font-mono text-xs uppercase font-bold text-gray-500 tracking-wider">
              ✦ ESTILO DE VIDA, BEM-ESTAR & CULTURA
            </span>
          </div>

          <h1 className="font-serif font-black text-4xl sm:text-6xl text-graphite tracking-tight leading-tight mb-4">
            Guia de Hobbies & Desaceleração: <br />
            <span className="italic text-red-editorial">Em Casa & Na Cidade</span>.
          </h1>

          <p className="font-sans text-base text-gray-700 max-w-3xl leading-relaxed mb-8">
            Uma curadoria inspiradora de práticas manuais, rituais de autocuidado sem telas e passeios culturais 
            pela cidade. Escolha entre o aconchego do seu lar ou explore novos cenários com direcionamento de lugares.
          </p>

          {/* ✦ FILTROS POR ABA ✦ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t-2 border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFiltroTipo('TODOS')}
                className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 border-2 border-graphite transition-all cursor-pointer ${
                  filtroTipo === 'TODOS'
                    ? 'bg-graphite text-white shadow-[2px_2px_0_0_#C8102E]'
                    : 'bg-white text-graphite hover:border-red-editorial hover:text-red-editorial'
                }`}
              >
                ✦ TODOS ({HOBBIES_DATA.length})
              </button>

              <button
                onClick={() => setFiltroTipo('EM_CASA')}
                className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 border-2 border-graphite transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTipo === 'EM_CASA'
                    ? 'bg-graphite text-white shadow-[2px_2px_0_0_#C8102E]'
                    : 'bg-white text-graphite hover:border-red-editorial hover:text-red-editorial'
                }`}
              >
                <HomeIcon size={14} className="text-amber-500" />
                <span>EM CASA (INDOOR)</span>
              </button>

              <button
                onClick={() => setFiltroTipo('FORA_DE_CASA')}
                className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 border-2 border-graphite transition-all flex items-center gap-1.5 cursor-pointer ${
                  filtroTipo === 'FORA_DE_CASA'
                    ? 'bg-graphite text-white shadow-[2px_2px_0_0_#C8102E]'
                    : 'bg-white text-graphite hover:border-red-editorial hover:text-red-editorial'
                }`}
              >
                <MapPin size={14} className="text-red-editorial" />
                <span>FORA DE CASA (CIDADE & EXPLORAÇÃO)</span>
              </button>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar hobby ou lugar..."
                className="w-full bg-[#FAF8F5] border-2 border-graphite pl-9 pr-3 py-1.5 text-xs font-sans text-graphite focus:outline-none focus:border-red-editorial"
              />
            </div>
          </div>

        </div>

        {/* ✦ GRID DE CARDS DE HOBBIES ✦ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hobbiesFiltrados.map((hobby, index) => {
            const isSalvo = !!hobbiesSalvos[hobby.id];
            const isFora = hobby.tipo === 'FORA_DE_CASA';

            return (
              <article
                key={hobby.id}
                className="bg-white border-2 border-graphite flex flex-col justify-between shadow-[6px_6px_0_0_#111111] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#C8102E] transition-all duration-200 relative group overflow-hidden"
              >
                {/* Fita adesiva retrô nos cantos */}
                {index % 2 === 0 ? (
                  <Tape variant="yellow" className="-top-3 left-6 w-20 h-5 rotate-1 pointer-events-none z-10" />
                ) : (
                  <Tape variant="blue" className="-top-3 right-6 w-18 h-5 -rotate-2 pointer-events-none z-10" />
                )}

                <div>
                  {/* Foto de Capa Estilo Polaroid com Badge de Localização */}
                  <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-graphite bg-gray-100">
                    <img
                      src={hobby.imagem}
                      alt={hobby.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Badge: Em Casa vs Fora de Casa */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-graphite/95 text-white font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 border border-white shadow-xs">
                      {isFora ? (
                        <>
                          <MapPin size={11} className="text-red-editorial" />
                          <span>FORA DE CASA</span>
                        </>
                      ) : (
                        <>
                          <HomeIcon size={11} className="text-amber-400" />
                          <span>EM CASA</span>
                        </>
                      )}
                    </div>

                    {/* Tag de Humor / Vibe */}
                    <span className="absolute bottom-3 right-3 z-10 bg-white/95 text-graphite font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border border-graphite shadow-2xs">
                      ✧ {hobby.vibe}
                    </span>
                  </div>

                  {/* Conteúdo Informativo */}
                  <div className="p-6 space-y-4">
                    
                    {/* Metadados: Categoria, Tempo e Custo */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 pb-2 border-b border-gray-200">
                      <span className="text-red-editorial font-bold uppercase tracking-wider">
                        {hobby.categoria}
                      </span>
                      <span>{hobby.tempo} · {hobby.custo}</span>
                    </div>

                    {/* Título do Hobby */}
                    <h3 className="font-serif font-black text-xl text-graphite leading-snug group-hover:text-red-editorial transition-colors">
                      {hobby.titulo}
                    </h3>

                    {/* Descrição Afetiva */}
                    <p className="font-sans text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {hobby.descricao}
                    </p>

                    {/* ✦ BOX: DIRECIONAMENTO DO LUGAR / ONDE PRATICAR ✦ */}
                    <div className={`p-3.5 border-2 ${isFora ? 'bg-[#FAF6F0] border-graphite' : 'bg-[#FDFBF7] border-gray-300'} space-y-1.5`}>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-graphite">
                        {isFora ? (
                          <>
                            <MapPin size={13} className="text-red-editorial" />
                            <span>ONDE PRATICAR & DIRECIONAMENTO DE LUGAR:</span>
                          </>
                        ) : (
                          <>
                            <Coffee size={13} className="text-amber-700" />
                            <span>AMBIENTE RECOMENDADO EM CASA:</span>
                          </>
                        )}
                      </div>

                      <h4 className="font-serif font-bold text-sm text-graphite">
                        {hobby.lugarTitulo}
                      </h4>
                      <p className="font-sans text-xs text-gray-500 leading-snug">
                        {hobby.lugarDescricao}
                      </p>

                      {/* Botão de Direcionamento com Link para Mapa caso seja Fora de Casa */}
                      {isFora && hobby.mapQuery && (
                        <div className="pt-2">
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(hobby.mapQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-graphite hover:bg-red-editorial text-white font-mono text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-2xs transition-colors shadow-2xs"
                          >
                            <span>VER LUGARES NO MAPA</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Dica Especial Lumina */}
                    <div className="bg-red-50/70 border-l-2 border-red-editorial p-2.5 text-xs font-sans text-gray-700 leading-relaxed italic">
                      <span className="font-bold font-mono text-[10px] not-italic text-red-editorial uppercase block mb-0.5">
                        ✧ DICA ESPECIAL LUMINA:
                      </span>
                      "{hobby.dicaLumina}"
                    </div>

                  </div>
                </div>

                {/* Rodapé do Card com Ação de Salvar / Favoritar */}
                <div className="p-6 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleSalvar(hobby.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 border transition-all cursor-pointer ${
                      isSalvo
                        ? 'bg-red-editorial text-white border-red-editorial shadow-[2px_2px_0_0_#111111]'
                        : 'bg-white text-graphite border-gray-300 hover:border-red-editorial hover:text-red-editorial'
                    }`}
                  >
                    <Heart size={13} className={isSalvo ? 'fill-white text-white' : 'text-red-editorial'} />
                    <span>{isSalvo ? 'SALVO NA LISTA' : 'QUERO PRATICAR'}</span>
                  </button>

                  <span className="font-mono text-[10px] uppercase font-bold text-gray-400">
                    LUMINA HOBBIES ✧
                  </span>
                </div>

              </article>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default HobbiesPage;

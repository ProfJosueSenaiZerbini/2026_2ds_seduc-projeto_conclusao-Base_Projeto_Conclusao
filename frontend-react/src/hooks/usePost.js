import { useState, useEffect, useCallback } from 'react';
import { getPost } from '../services/api';

const MOCK_ARTICLES = {
  'mock-1': {
    id: 'mock-1',
    titulo: 'O Futuro da Inteligência Artificial no Design e na Criatividade',
    categoria: 'TECNOLOGIA',
    autor: 'Lucas Almeida',
    tempoLeitura: '5 min de leitura',
    criando_em: '2026-10-08T10:00:00.000Z',
    imagem: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&h=600&fit=crop',
    conteudo: `A ascensão vertiginosa dos modelos de inteligência artificial generativa colocou a comunidade de design em uma encruzilhada fascinante. Longe de ser apenas uma ferramenta de automação fria, a IA passa a operar como uma parceira de co-criação nos ateliês digitais contemporâneos.

Em vez de substituir o olhar sensível do diretor de arte, os novos sistemas desafiam os profissionais a refinarem sua capacidade de síntese e direcionamento conceitual. O debate central de 2026 não é mais sobre se a tecnologia é capaz de desenhar, mas sobre quem define as intenções éticas, a originalidade estética e o peso emocional de cada composição.

Quando a produção visual se torna infinita e instantânea, o valor real volta-se para a curadoria, a intenção autoral e a capacidade humana de conectar formas a narrativas genuínas.`
  },
  'mock-2': {
    id: 'mock-2',
    titulo: 'O Renascimento do Cinema em Película de 35mm',
    categoria: 'FILMES & CINEMA',
    autor: 'Beatriz Vasconcelos',
    tempoLeitura: '8 min de leitura',
    criando_em: '2026-10-07T14:30:00.000Z',
    imagem: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000&h=600&fit=crop',
    conteudo: `Em uma época dominada pela precisão clínica das resoluções 8K, um movimento silencioso mas poderoso ganha força nos principais festivais ao redor do mundo: cineastas e diretores de fotografia estão retornando aos rolos de celuloide 35mm e 16mm.

A textura dos grãos, a saturação química das cores e as pequenas imperfeições físicas conferem à película uma respiração orgânica que os sensores digitais ainda lutam para emular. Gravar em película impõe uma disciplina cênica única: cada tomada carrega o peso e o custo do tempo real.

O público não busca perfeição asséptica, mas verdade táctil. O grão da película funciona como a assinatura do tempo na tela grande.`
  },
  'mock-3': {
    id: 'mock-3',
    titulo: 'Elogio à Lentidão: Como Redescobrir o Prazer do Café e da Manhã',
    categoria: 'COTIDIANO & ESTILO',
    autor: 'Juliana Mendes',
    tempoLeitura: '4 min de leitura',
    criando_em: '2026-10-06T09:15:00.000Z',
    imagem: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000&h=600&fit=crop',
    conteudo: `O ritmo febril das notificações matinais costuma transformar as primeiras horas do dia em uma corrida antes mesmo dos pés tocarem o chão. Redescobrir a manhã como um território sagrado de calma é um dos maiores luxos contemporâneos.

O simples ritual de moer os grãos de café manualmente, observar a água aquecer e permitir-se dez minutos de contemplação sem telas em mãos altera radicalmente o estado de espírito para as horas seguintes.

A lentidão não é improdutividade; é a fundação para a clareza mental e para a apreciação das pequenas belezas que o cotidiano teima em esconder na pressa.`
  },
  'mock-4': {
    id: 'mock-4',
    titulo: 'Vozes Emergentes na Literatura Latino-Americana',
    categoria: 'LIVROS & LITERATURA',
    autor: 'Rafael Costa',
    tempoLeitura: '6 min de leitura',
    criando_em: '2026-10-05T18:00:00.000Z',
    imagem: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1000&h=600&fit=crop',
    conteudo: `Uma nova geração de escritores da América Latina está reinventando o legado do realismo mágico, cruzando tensões urbanas urgentes, memória coletiva e experimentos de linguagem ousados.

Obras que desafiam fronteiras geográficas e desconstroem narrativas lineares conquistam leitores globais sedentos por visões descolonizadas do presente. A literatura latino-americana de 2026 é vigorosa, lírica e profundamente enraizada em suas contradições sociais.`
  },
  'mock-5': {
    id: 'mock-5',
    titulo: 'A Ressonância do Jazz nas Batidas Urbanas Modernas',
    categoria: 'MÚSICA & CULTURA',
    autor: 'Camila Rocha',
    tempoLeitura: '7 min de leitura',
    criando_em: '2026-10-04T12:00:00.000Z',
    imagem: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&h=600&fit=crop',
    conteudo: `O jazz nunca foi um museu de acordes do passado, mas um organismo vivo em constante mutação. Hoje, jovens produtores de hip-hop, neo-soul e música eletrônica encontram na improvisação harmônica e nos compassos quebrados a chave para transcender a repetição dos algoritmos.

A fusão de instrumentos acústicos com sintetizadores cria paisagens sonoras que homenageiam os mestres do bebop enquanto abrem caminhos inéditos para as pistas e fones de ouvido.`
  },
  'mock-6': {
    id: 'mock-6',
    titulo: 'Minimalismo Quente: A Arquitetura dos Espaços Acolhedores',
    categoria: 'DESIGN & ESPAÇO',
    autor: 'Thiago Silva',
    tempoLeitura: '5 min de leitura',
    criando_em: '2026-10-03T16:20:00.000Z',
    imagem: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&h=600&fit=crop',
    conteudo: `O minimalismo frio e hospitalar dos anos anteriores cedeu lugar ao chamado 'minimalismo quente': interiores marcados pela pureza das linhas, mas enriquecidos com madeiras naturais, têxteis orgânicos, cerâmicas artesanais e iluminação difusa.

Construir espaços para viver significa acolher a imperfeição, valorizar a passagem da luz do sol pelas janelas e criar refúgios que abracem o corpo e a alma.`
  }
};

export const usePost = (id) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;

    // Se for um post de demonstração/mock, carrega diretamente os dados completos
    if (String(id).startsWith('mock-') && MOCK_ARTICLES[id]) {
      setPost(MOCK_ARTICLES[id]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getPost(id);
      setPost(data);
    } catch (err) {
      // Se não encontrou no backend, mas existe nos mocks (ex: 'mock-1' ou '1')
      const fallback = MOCK_ARTICLES[id] || MOCK_ARTICLES[`mock-${id}`];
      if (fallback) {
        setPost(fallback);
      } else {
        setError(err.response?.data?.mensagem || 'Erro ao carregar a resenha. Pode ter sido removida ou não existe.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, loading, error, refetch: fetchPost };
};

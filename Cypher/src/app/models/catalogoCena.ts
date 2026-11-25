import fs from "node:fs";
import { enderecoObra } from "./enderecosPerfil.js";
import { imagemCena } from "./imagensCena.js";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { conexaoInternaCypher } from "./bancoDados.js";
import {
  perfisDemonstrativos,
  faixasDemonstrativas,
  discosDemonstrativos,
  beatsDemonstrativos,
  idFaixaDemo,
} from "./catalogoDemonstrativo.js";
import {
  pessoasCena,
  encontrosCena,
  projetosCena,
  oportunidadesCena,
  ofertasCena,
  conversasCena,
} from "./cenaConteudo.js";
import { profissoesCatalogo } from "./modeloPerfil.js";
import { audioCatalogoLocal } from "./audioCatalogoLocal.js";
import {
  uploadArquivoBeat,
  salvarOfertaBeat,
  gestaoBeat,
} from "./licenciamentoBeats.js";
import { objetoDisponivel } from "./politicasModeracao.js";
import { pastaMidias } from "./projetosTrabalho.js";
import { salvarArtigo, transicionarArtigo } from "./central.js";
type Linha = Record<string, any>;
const db = conexaoInternaCypher;
const um = (sql: string, ...v: any[]) =>
  db()
    .prepare(sql)
    .get(...v) as Linha | undefined;
const todos = (sql: string, ...v: any[]) =>
  db()
    .prepare(sql)
    .all(...v) as Linha[];
const run = (sql: string, ...v: any[]) =>
  db()
    .prepare(sql)
    .run(...v);
export function idPessoaCena(slug: string) {
  const antiga = perfisDemonstrativos.find(
    p => p.slug.replace(/\.demo$/, "") === slug
  );
  return antiga ? "demo-catalogo-" + antiga.slug : "cena-perfil-" + slug;
}
export function itemCena(tipo: string, id: string) {
  const r = um("SELECT * FROM catalogo_cena WHERE tipo=? AND id=?", tipo, id);
  return r ? { ...r, dados: JSON.parse(r.dados_json) } : null;
}
function registrar(
  tipo: string,
  id: string,
  chave: string,
  dados: unknown = {},
  ficcional = true
) {
  run(
    `INSERT INTO catalogo_cena(tipo,id,chave,dados_json,ficcional,atualizado_em) VALUES(?,?,?,?,?,?) ON CONFLICT(tipo,id) DO UPDATE SET dados_json=excluded.dados_json,atualizado_em=excluded.atualizado_em`,
    tipo,
    id,
    chave,
    JSON.stringify(dados),
    Number(ficcional),
    Date.now()
  );
}
const iniciais = (s: string) =>
  s
    .split(/[\s·-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join("")
    .toUpperCase();
export function semearCatalogoCena(
  opcoes: { audioSintetico?: boolean; gerarArte?: boolean } = {}
) {
  const agora = Date.now();
  db()
    .transaction(() => {
      for (const [i, p] of pessoasCena.entries()) {
        const id = idPessoaCena(p.slug),
          anterior = um("SELECT * FROM usuarios WHERE id=?", id);
        if (anterior && !anterior.demonstracao && !itemCena("perfil", id))
          throw new Error("Identidade do catálogo em conflito: " + p.slug);
        run(
          `INSERT INTO usuarios(id,tipo_conta,email_confirmado_em,demonstracao,criado_em) VALUES(?,'profissional',CURRENT_TIMESTAMP,0,'2025-02-01') ON CONFLICT(id) DO UPDATE SET demonstracao=0,email_confirmado_em=coalesce(email_confirmado_em,CURRENT_TIMESTAMP)`,
          id
        );
        const atual = um(
          "SELECT identificador FROM perfis WHERE usuario_id=?",
          id
        )?.identificador;
        let handle = "@" + p.slug;
        if (
          um(
            "SELECT 1 FROM identificadores_usuario WHERE identificador=? AND usuario_id<>?",
            handle,
            id
          ) ||
          um(
            "SELECT 1 FROM perfis WHERE identificador=? AND usuario_id<>?",
            handle,
            id
          )
        )
          handle += "." + "cena";
        const categorias = p.profissoes.map(
          s => profissoesCatalogo.find(v => v.id === s)!.rotulo
        );
        const genero = ["ucla", "duzz", "sobs", "lezin", "wkilla"].some(s =>
          (p.nucleo + p.slug).toLowerCase().includes(s)
        )
          ? "Trap"
          : "Rap";
        run(
          `INSERT INTO perfis(usuario_id,nome,nome_informado,vulgo,tratamento,funcao,identificador,iniciais,cidade,biografia,generos_json,categorias_json,perfil_publico,localizacao_publica,demonstracao,disponibilidade) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,1,0,'disponivel-colaboracao') ON CONFLICT(usuario_id) DO UPDATE SET nome=excluded.nome,nome_informado=excluded.nome_informado,vulgo=excluded.vulgo,tratamento=excluded.tratamento,funcao=excluded.funcao,identificador=excluded.identificador,cidade=excluded.cidade,biografia=excluded.biografia,generos_json=excluded.generos_json,categorias_json=excluded.categorias_json,perfil_publico=1,localizacao_publica=1,demonstracao=0,disponibilidade=excluded.disponibilidade`,
          id,
          p.nome,
          p.nome,
          p.nome,
          p.tratamento || "masculino",
          categorias.join(" · "),
          handle,
          iniciais(p.nome),
          p.cidade,
          p.bio,
          JSON.stringify([genero]),
          JSON.stringify(categorias)
        );
        for (const h of [atual, handle].filter(Boolean))
          run(
            "INSERT INTO identificadores_usuario(identificador,usuario_id) VALUES(?,?) ON CONFLICT DO NOTHING",
            h,
            id
          );
        registrar("perfil", id, "perfil:" + p.slug, {
          slug: p.slug,
          nucleo: p.nucleo,
          imagem: p.imagem || "cena/perfis/" + p.slug + ".svg",
          contexto:
            "Personagem do catálogo local baseado em referências públicas.",
        });
        for (const profissao of p.profissoes) {
          const rotulo = profissoesCatalogo.find(
            s => s.id === profissao
          )!.rotulo;
          run(
            `INSERT INTO profissoes_usuario(id,usuario_id,profissao_id,valor_original,origem,estado,selecionada_em) VALUES(?,?,?,?,'catalogo','ativa','2025-02-01') ON CONFLICT(id) DO NOTHING`,
            "cena-atuacao-" + p.slug + "-" + profissao,
            id,
            profissao,
            rotulo
          );
          const respostas = JSON.stringify({
            tempoAtuacao: ">5a",
            etapaProjetos: "publicados",
            participacaoColetiva: "equipe-coletivo",
            praticaAtual: "pratica-regular",
          });
          const visibilidades = JSON.stringify({
            tempoAtuacao: "publico",
            etapaProjetos: "publico",
            participacaoColetiva: "publico",
            praticaAtual: "publico",
          });
          run(
            "INSERT INTO respostas_atuacao_profissao(usuario_id,profissao_id,respostas_json,visibilidades_json) VALUES(?,?,?,?) ON CONFLICT DO NOTHING",
            id,
            profissao,
            respostas,
            visibilidades
          );
          run(
            "INSERT INTO respostas_atuacao_categoria(usuario_id,categoria,respostas_json,visibilidades_json) VALUES(?,?,?,?) ON CONFLICT DO NOTHING",
            id,
            rotulo,
            respostas,
            visibilidades
          );
        }
        run(
          `INSERT INTO portfolio_config(usuario_id,modo,molde,visivel) VALUES(?,'inteligente',?,1) ON CONFLICT DO NOTHING`,
          id,
          ["grade", "editorial", "lista"][i % 3]
        );
        run(
          "INSERT INTO preferencias_contato(usuario_id,profissionais,consumidores) VALUES(?,1,1) ON CONFLICT DO NOTHING",
          id
        );
      }
      const nomes = new Map(
        pessoasCena.map(p => [p.nome.toLowerCase(), p.slug])
      );
      for (const [nome, slug] of [
        ["lêzin", "lezin"],
        ["thiago sub", "thiagosub"],
        ["teo guedx", "teoguedx"],
        ["2f unflow", "2funflow"],
      ])
        nomes.set(nome, slug);
      function credito(
        obraId: string,
        slugOuNome: string,
        funcao: string,
        indice: number
      ) {
        const slug =
          nomes.get(slugOuNome.toLowerCase()) ||
          pessoasCena.find(p => p.slug === slugOuNome)?.slug;
        const nome = slug
          ? pessoasCena.find(p => p.slug === slug)!.nome
          : slugOuNome;
        run(
          `INSERT INTO creditos(id,obra_id,usuario_creditado_id,nome_creditado,funcao,verificado,demonstracao) VALUES(?,?,?,?,?,1,0) ON CONFLICT(id) DO UPDATE SET usuario_creditado_id=excluded.usuario_creditado_id,nome_creditado=excluded.nome_creditado,funcao=excluded.funcao,verificado=1,demonstracao=0`,
          "cena-credito-" + obraId + "-" + indice,
          obraId,
          slug ? idPessoaCena(slug) : null,
          nome,
          funcao
        );
      }
      function obra(
        item: Linha,
        tipo: string,
        equipe: [string, string][],
        meta: unknown = {},
        ficcional = false
      ) {
        const autor = idPessoaCena(item.slug.replace(/\.demo$/, "")),
          existente = um(
            "SELECT proprietario_id,demonstracao FROM obras WHERE id=?",
            item.id
          );
        if (existente && existente.proprietario_id !== autor)
          throw new Error("Obra do catálogo em conflito: " + item.id);
        run(
          `INSERT INTO obras(id,proprietario_id,titulo,tipo,situacao,metadados,funcao_principal,genero,data_lancamento,link_escuta,publicada,demonstracao,descricao,quantidade_creditos,criado_em) VALUES(?,?,?,?,'Lançado',?,'Artista principal',?,?,?,1,0,?,?,?) ON CONFLICT(id) DO UPDATE SET demonstracao=0,descricao=excluded.descricao,quantidade_creditos=excluded.quantidade_creditos,metadados=excluded.metadados`,
          item.id,
          autor,
          item.titulo,
          tipo,
          JSON.stringify(meta),
          item.genero,
          item.data || "2026-11-12",
          item.link || "",
          item.descricao || "",
          equipe.length,
          new Date(
            agora -
              (20 - encontrosCena.findIndex(e => e.id === item.id)) * 86400000
          ).toISOString()
        );
        run(
          "DELETE FROM creditos WHERE obra_id=? AND demonstracao=1 AND verificado=0",
          item.id
        );
        run("UPDATE creditos SET demonstracao=0 WHERE obra_id=?", item.id);
        // Substitui apenas menções textuais antigas do catálogo, nunca créditos de outros registros.
        for (const [i, [p, f]] of equipe.entries()) credito(item.id, p, f, i);
        run(
          "INSERT OR IGNORE INTO atuacoes_obra(obra_id,profissao_id) VALUES(?,?)",
          item.id,
          "rapper"
        );
        registrar(
          "obra",
          item.id,
          "obra:" + item.id,
          {
            titulo: item.titulo,
            autor,
            novo: ficcional,
            contexto: ficcional
              ? "Obra inventada para o enredo local; sem fonograma externo associado."
              : "Referência preexistente; créditos nominais vinculados aos perfis correspondentes.",
          },
          ficcional
        );
      }
      for (const f of faixasDemonstrativas)
        obra(f, "Música", [
          [f.slug.replace(".demo", ""), "Interpretação"],
          ...(f.producao ? [[f.producao, "Produção musical"]] : []),
          ...(f.participacao
            ? [[f.participacao, "Participação como feat"]]
            : []),
        ] as [string, string][]);
      for (const d of discosDemonstrativos) {
        obra(
          d,
          d.tipo,
          [
            [d.slug.replace(".demo", ""), "Interpretação"],
            ...(d.producao ? [[d.producao, "Produção musical"]] : []),
          ] as [string, string][],
          {
            faixas: d.faixas.map((_, i) => idFaixaDemo(d.id, i)),
            ano: d.data.slice(0, 4),
          }
        );
        d.faixas.forEach((titulo, i) => {
          const equipe: [string, string][] = [
            [d.slug.replace(".demo", ""), "Interpretação"],
          ];
          if (d.producao) equipe.push([d.producao, "Produção musical"]);
          for (const nome of (d.participacoes[i + 1] || "")
            .split(",")
            .map(n => n.trim())
            .filter(n => n && n !== "Papatunes"))
            equipe.push([nome, "Participação como feat"]);
          if (d.id === "demo-obra-ate-a-ultima-rima") {
            equipe.push(["lwally", "Mixagem"], ["2funflow", "Masterização"]);
          }
          obra(
            { ...d, id: idFaixaDemo(d.id, i), titulo, link: "" },
            "Música",
            equipe,
            {
              disco: d.id,
              faixa: i + 1,
              ...(d.duracoes ? { duracao: d.duracoes[i] } : {}),
            }
          );
        });
      }
      for (const e of encontrosCena)
        obra(
          { ...e, slug: e.autor },
          "Música",
          [[e.autor, "Interpretação"], ...e.equipe] as [string, string][],
          { capa: "/img/cena/obras/" + e.id + ".svg" },
          true
        );
      for (const p of projetosCena) {
        const autor = idPessoaCena(p.autor),
          equipe = p.equipe
            .map(s => pessoasCena.find(p => p.slug === s)!.nome)
            .join(" · ");
        run(
          "INSERT INTO projetos_trabalho(id,autor_id,titulo,descricao,publico) VALUES(?,?,?,?,1) ON CONFLICT DO NOTHING",
          p.id,
          autor,
          p.titulo,
          p.descricao
        );
        const modalidade = ["fotografia", "galeria"].includes(p.modalidade)
          ? "visual"
          : p.modalidade;
        run(
          `INSERT INTO detalhes_projetos(projeto_id,modalidade,profissoes_json,objetivo,inicio,fim,papel,equipe,entregas,resultados,texto) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`,
          p.id,
          modalidade,
          JSON.stringify(p.profissoes),
          p.descricao,
          "2026-10-01",
          "2026-12-20",
          p.papel,
          equipe,
          p.entregas,
          "Processo compartilhado entre linguagens, com funções identificadas.",
          p.modalidade === "texto"
            ? "Antes de uma faixa chegar à rua, muita gente encontra um jeito de somar. Esta série acompanha as conversas que acontecem entre a escrita, o estúdio, a câmera e o palco. O que muda quando olhamos para a equipe inteira?"
            : ""
        );
        const relacionadas = encontrosCena
          .filter(e => p.equipe.includes(e.autor) || p.autor === e.autor)
          .slice(0, 3);
        relacionadas.forEach((e, i) =>
          run(
            "INSERT OR IGNORE INTO itens_projeto(projeto_id,tipo,origem_id,legenda,ordem) VALUES(?,'obra',?,?,?)",
            p.id,
            e.id,
            e.titulo,
            i
          )
        );
        registrar("projeto", p.id, "projeto:" + p.id, {
          equipe: p.equipe,
          nucleo: pessoasCena.find(v => v.slug === p.autor)!.nucleo,
        });
      }
      // Vínculos públicos em diferentes etapas; sem notas ou depoimentos fabricados.
      const duplas: [string, string, string, string][] = [
        ["lezin", "papatinho", "cena-obra-sem-atalho", "concluida"],
        ["jotape", "lezin", "cena-obra-sem-atalho", "concluida"],
        ["duzz", "ecologyk", "cena-obra-asfalto-em-orbita", "concluida"],
        ["drizzy", "pecaos", "cena-obra-asfalto-em-orbita", "em_andamento"],
        ["nog", "teoguedx", "cena-obra-lado-b-da-vila", "concluida"],
        ["levinsk", "yanbello", "cena-obra-lado-b-da-vila", "concluida"],
        ["rincon", "gabb", "cena-obra-corpo-palavra", "em_andamento"],
        ["gabb", "maricarvalho", "cena-obra-corpo-palavra", "concluida"],
        ["emicida", "rincon", "cena-obra-corpo-palavra", "concluida"],
        ["cassol", "hxtel", "cena-obra-entre-linhas", "em_andamento"],
        ["binho", "speto", "", "em_andamento"],
        ["aquiles", "andrefelipe", "", "em_andamento"],
      ];
      for (const [a, b, origem, estado] of duplas) {
        const aid = idPessoaCena(a),
          bid = idPessoaCena(b),
          id = "cena-collab-" + a + "-" + b,
          titulo =
            encontrosCena.find(e => e.id === origem)?.titulo ||
            "Encontro de linguagens";
        run(
          `INSERT INTO colaboracoes(id,proponente_id,convidado_id,dupla,chave_contexto,titulo,natureza,descricao,funcao_proponente,funcao_convidado,origem_tipo,origem_id,estado,criada_em,aceita_em,concluida_em,prazo_avaliacao_em,publico_a,publico_b) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,1) ON CONFLICT DO NOTHING`,
          id,
          aid,
          bid,
          [aid, bid].sort().join(":"),
          id,
          titulo,
          "Criação e produção",
          "Encontro construído a partir do contexto criativo do projeto, com participação e funções reconhecidas pelas duas partes.",
          pessoasCena.find(p => p.slug === a)!.profissoes[0],
          pessoasCena.find(p => p.slug === b)!.profissoes[0],
          origem ? "obra" : "",
          origem,
          estado,
          agora - 45 * 86400000,
          agora - 40 * 86400000,
          estado === "concluida" ? agora - 20 * 86400000 : null,
          estado === "concluida" ? agora - 6 * 86400000 : null
        );
        registrar("colaboracao", id, "colaboracao:" + a + ":" + b, {
          a: aid,
          b: bid,
          titulo,
        });
      }
      for (const o of oportunidadesCena) {
        const autor = idPessoaCena(o.autor);
        run(
          `INSERT INTO oportunidades_profissionais(id,autor_id,titulo,tipo,descricao,contexto,modalidade,localizacao,remuneracao,valor_centavos,condicoes,prazo,projeto_id,estado,publicada_em) VALUES(?,?,?,'projeto',?,?,'hibrido','São Paulo, SP','remunerada',?,?,?,?,'aberta',CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`,
          o.id,
          autor,
          o.titulo,
          o.descricao,
          "Projeto com equipe definida e espaço para novas contribuições.",
          o.valor,
          "Escopo, prazos e direitos combinados por proposta bilateral.",
          new Date(agora + 45 * 86400000).toISOString().slice(0, 10),
          o.projeto
        );
        run(
          "INSERT INTO funcoes_oportunidade(id,oportunidade_id,profissao_id,vagas,responsabilidades,requisitos,desejaveis) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING",
          o.id + "-funcao",
          o.id,
          o.profissao,
          o.vagas,
          "Desenvolver as entregas descritas na chamada em diálogo com a direção do projeto.",
          "Portfólio com trabalhos pertinentes e disponibilidade para alinhar o cronograma.",
          "Experiência com projetos musicais e criação em equipe."
        );
        registrar("oportunidade", o.id, "oportunidade:" + o.id, {
          projeto: o.projeto,
        });
        const candidatas = pessoasCena
          .filter(p => p.profissoes.includes(o.profissao) && p.slug !== o.autor)
          .slice(0, 2);
        candidatas.forEach((p, i) =>
          run(
            "INSERT INTO candidaturas_oportunidade(id,oportunidade_id,funcao_id,candidato_id,apresentacao,estado) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING",
            o.id + "-candidatura-" + p.slug,
            o.id,
            o.id + "-funcao",
            idPessoaCena(p.slug),
            "Conheço a linguagem do projeto e gostaria de conversar sobre a entrega. Meu portfólio reúne trabalhos relacionados à proposta.",
            i === 0 ? "analise" : "enviada"
          )
        );
      }
      // Preserva os eventos anteriores, com organizadores que possuem perfil público.
      const eventosAnteriores: [string, string][] = [
        ["demo-evento-batalha", "jay"],
        ["demo-evento-cypher", "jay"],
        ["demo-evento-show", "fioti"],
        ["demo-destaque-mulheres-no-mic", "caroljafet"],
        ["demo-destaque-roda-da-madrugada", "jay"],
        ["demo-destaque-voz-da-praca", "fioti"],
        ["demo-workshop-dj-producao", "wkilla"],
        ["demo-workshop-slam-poesia", "jay"],
        ["demo-workshop-beatbox", "caroljafet"],
      ];
      for (const [id, slug] of eventosAnteriores) {
        const anterior = um(
          "SELECT * FROM eventos WHERE id=? AND demonstracao=1",
          id
        );
        if (!anterior) continue;
        const dono = um(
          "SELECT demonstracao FROM usuarios WHERE id=?",
          anterior.proprietario_id
        );
        if (
          !dono?.demonstracao &&
          !itemCena("perfil", anterior.proprietario_id)
        )
          continue;
        run(
          "UPDATE eventos SET proprietario_id=?,demonstracao=0 WHERE id=?",
          idPessoaCena(slug),
          id
        );
        const inicio = Date.parse(
          anterior.data_texto +
            "T" +
            (anterior.horario || "19:00").slice(0, 5) +
            ":00-03:00"
        );
        run(
          "INSERT INTO eventos_configuracoes(evento_id,capacidade,criterios,fuso,inicio_em,fim_em) VALUES(?,80,'Respeite os horários e as orientações da organização.','America/Sao_Paulo',?,?) ON CONFLICT DO NOTHING",
          id,
          Number.isFinite(inicio) ? inicio : null,
          Number.isFinite(inicio) ? inicio + 7200000 : null
        );
        registrar("evento", id, "evento:" + id, {
          organizador: idPessoaCena(slug),
          migrado: true,
          localizacao_confirmada: false,
        });
      }
      const eventos = [
        {
          id: "cena-evento-verso",
          autor: "jay",
          titulo: "Verso em Construção · Encontro da Papatunes",
          local: "Rio de Janeiro, RJ · local comunicado aos inscritos",
          descricao:
            "Lezin, Jotapê e Papatinho abrem uma conversa sobre escrita e criação coletiva. A equipe de produção compartilha o caminho entre a primeira ideia e a faixa.",
          dias: 12,
          vagas: 60,
        },
        {
          id: "cena-evento-corpo",
          autor: "caroljafet",
          titulo: "Corpo e Palavra · Laboratório Aberto",
          local: "São Paulo, SP · espaço informado aos participantes",
          descricao:
            "Rincon Sapiência, Gabb Cabo Verde e Mari Carvalho aproximam verso e movimento, com uma roda de pesquisa e criação de dança.",
          dias: 19,
          vagas: 30,
        },
        {
          id: "cena-evento-muros",
          autor: "fioti",
          titulo: "Muros que Rimam · Arte em Encontro",
          local: "São Paulo, SP · endereço confirmado com a organização",
          descricao:
            "Binho Ribeiro e Speto conversam com a equipe visual sobre mural, capa e cidade. Um encontro para quem desenha, produz e faz a cultura circular.",
          dias: 26,
          vagas: 45,
        },
      ];
      for (const [i, e] of eventos.entries()) {
        const data = new Date(agora + e.dias * 86400000)
            .toISOString()
            .slice(0, 10),
          autor = idPessoaCena(e.autor);
        run(
          `INSERT INTO eventos(id,proprietario_id,titulo,categoria,data_texto,horario,local,organizador,situacao,cor,descricao,formato,inscricao,tipo_participacao,tema_cartao,demonstracao) VALUES(?,?,?,'Encontro',?,'19:00',?,?,'Inscrições abertas','green',?,'Presencial','Inscrição sujeita à aprovação da organização.','aprovacao','classico',0) ON CONFLICT DO NOTHING`,
          e.id,
          autor,
          e.titulo,
          data,
          e.local,
          pessoasCena.find(p => p.slug === e.autor)!.nome,
          e.descricao
        );
        run(
          "INSERT INTO eventos_configuracoes(evento_id,capacidade,criterios,fuso,inicio_em,fim_em) VALUES(?,?,?,'America/Sao_Paulo',?,?) ON CONFLICT DO NOTHING",
          e.id,
          e.vagas,
          "Participação mediante inscrição e confirmação da organização. Respeite o horário e os combinados do encontro.",
          Date.parse(data + "T22:00:00Z"),
          Date.parse(data + "T00:00:00Z") + 86400000
        );
        for (const p of pessoasCena
          .filter(p => p.slug !== e.autor)
          .slice(i + 2, i + 5)) {
          const uid = idPessoaCena(p.slug);
          run(
            "INSERT INTO eventos_acompanhamentos(evento_id,usuario_id,interessado,salvo,criada_em) VALUES(?,?,1,1,?) ON CONFLICT DO NOTHING",
            e.id,
            uid,
            agora
          );
          run(
            "INSERT INTO eventos_inscricoes(id,evento_id,usuario_id,estado,justificativa,criada_em,atualizada_em) VALUES(?,?,?,'pendente','Gostaria de participar da conversa e conhecer o processo da equipe.',?,?) ON CONFLICT DO NOTHING",
            e.id + "-" + p.slug,
            e.id,
            uid,
            agora,
            agora
          );
        }
        registrar("evento", e.id, "evento:" + e.id, {
          equipe: e.autor,
          localizacao_confirmada: false,
        });
      }
      // Interações persistidas, restritas aos personagens; não invadem contas existentes.
      for (const [i, e] of encontrosCena.entries()) {
        for (const p of pessoasCena
          .filter(p => p.slug !== e.autor)
          .slice(i, i + 4))
          run(
            "INSERT OR IGNORE INTO curtidas_obras(obra_id,usuario_id) VALUES(?,?)",
            e.id,
            idPessoaCena(p.slug)
          );
        const equipe = [
          ...new Set([e.autor, ...e.equipe.map(([slug]) => slug)]),
        ];
        for (const slug of equipe.filter(s => s !== e.autor)) {
          for (const [de, para] of [
            [slug, e.autor],
            [e.autor, slug],
          ])
            run(
              "INSERT INTO profissionais_seguidos(seguidor_id,profissional_id) VALUES(?,?) ON CONFLICT DO NOTHING",
              idPessoaCena(de),
              idPessoaCena(para)
            );
        }
        for (const [j, c] of (conversasCena[e.id] || []).entries()) {
          const id = e.id + "-conversa-" + j;
          run(
            "INSERT INTO comentarios_conteudo(id,autor_id,objeto_tipo,objeto_id,texto,criado_em,chave_envio) VALUES(?,?,'obra',?,?,?,?) ON CONFLICT DO NOTHING",
            id,
            idPessoaCena(c.autor),
            e.id,
            c.texto,
            agora - (8 - i) * 86400000 + j * 3600000,
            id
          );
        }
      }
      for (const beat of beatsDemonstrativos) {
        const autor = idPessoaCena(beat.slug.replace(".demo", "")),
          dados = ofertasCena[beat.id];
        run(
          `INSERT INTO beats(id,produtor_id,titulo,bpm,genero,descricao,licenca,condicoes_uso,demonstracao,tom_musical,duracao,venda_exclusiva) VALUES(?,?,?,?,?,?,?,'Cada oferta possui suas condições de utilização.',0,?,?,?) ON CONFLICT(id) DO UPDATE SET demonstracao=0,descricao=excluded.descricao,licenca=excluded.licenca,tom_musical=excluded.tom_musical,duracao=excluded.duracao,venda_exclusiva=excluded.venda_exclusiva`,
          beat.id,
          autor,
          beat.titulo,
          beat.bpm,
          beat.genero,
          dados.classificacao +
            " · " +
            (dados.vendidoPara
              ? "Instrumental com exclusividade reservada."
              : "Instrumental disponível para novas vozes."),
          dados.vendidoPara
            ? "Exclusiva"
            : dados.free
              ? "Free Use / Premium"
              : "Premium",
          dados.tom,
          dados.duracao,
          Number(!!dados.vendidoPara)
        );
        run(
          "INSERT INTO beat_catalogo(beat_id,disponivel,atualizado_em) VALUES(?,?,?) ON CONFLICT DO NOTHING",
          beat.id,
          Number(!dados.vendidoPara),
          agora
        );
        registrar("beat", beat.id, "beat:" + beat.id, {
          ...dados,
          vendidoPara: dados.vendidoPara
            ? idPessoaCena(dados.vendidoPara)
            : null,
          comprador: dados.vendidoPara
            ? pessoasCena.find(p => p.slug === dados.vendidoPara)!.nome
            : null,
          licenciamentoLocal: true,
        });
      }
    })
    .immediate();
  // Arquivos em etapas próprias: uma falha não deixa uma oferta apontando para bytes inexistentes.
  for (const b of beatsDemonstrativos) {
    const autor = idPessoaCena(b.slug.replace(".demo", "")),
      dados = ofertasCena[b.id];
    let audio = audioCatalogoLocal[b.id];
    if (!audio && b.id === "demo-beat-spider-man")
      audio =
        "/audio/beats/" +
        encodeURIComponent(
          fs
            .readdirSync(path.resolve("public/audio/beats"))
            .find(n => n.includes("Spider-Man")) || ""
        );
    if (!audio && !opcoes.audioSintetico)
      throw new Error("Áudio não encontrado para " + b.titulo);
    const arquivo = opcoes.audioSintetico
      ? Buffer.from("ID3catalogo-cena-fixture")
      : fs.readFileSync(
          path.resolve("public", "." + decodeURIComponent(audio))
        );
    let entregavel = um(
      "SELECT * FROM beat_arquivos WHERE beat_id=? AND finalidade='entrega' ORDER BY criado_em LIMIT 1",
      b.id
    );
    if (!entregavel)
      entregavel = uploadArquivoBeat(
        autor,
        b.id,
        b.titulo + " - MP3.mp3",
        "entrega",
        arquivo
      );
    if (
      !um(
        "SELECT 1 FROM beat_arquivos WHERE beat_id=? AND finalidade='previa'",
        b.id
      )
    )
      uploadArquivoBeat(
        autor,
        b.id,
        b.titulo + " - prévia.mp3",
        "previa",
        arquivo.subarray(0, Math.min(arquivo.length, 4 * 1024 * 1024))
      );
    const modalidades = dados.vendidoPara
      ? ["exclusiva"]
      : dados.free
        ? ["free", "premium"]
        : ["premium"];
    for (const modalidade of modalidades) {
      const chave = "oferta:" + b.id + ":" + modalidade;
      const existente = um("SELECT id FROM catalogo_cena WHERE chave=?", chave);
      if (existente) continue;
      const id = salvarOfertaBeat(autor, b.id, {
        modalidade,
        versao: 0,
        titulo:
          modalidade === "free"
            ? "Free Use · Estudo e escrita"
            : modalidade === "premium"
              ? "Premium · Lançamento independente"
              : "Exclusiva · Catálogo reservado",
        preco: String(dados.preco / 100),
        usos:
          modalidade === "free"
            ? "Estudo, escrita e gravação de guias de voz sem monetização."
            : "Gravação de voz e distribuição de uma faixa, conforme os limites descritos.",
        restricoes:
          "Sem revenda do instrumental, sublicenciamento, Content ID do beat isolado ou transferência de autoria.",
        creditos:
          "Informe o produtor no título ou na ficha técnica do lançamento.",
        limites:
          modalidade === "free"
            ? "Uso pessoal e não comercial. Lançamento monetizado depende da oferta Premium."
            : "Uma faixa por licença; usos adicionais são combinados com o produtor.",
        entregaveis:
          "Arquivo MP3 do instrumental. Não inclui stems ou arquivos de sessão.",
        arquivos: [entregavel.id],
      });
      registrar("oferta", id, chave, { beat: b.id, modalidade, local: true });
    }
    if (dados.vendidoPara)
      run("UPDATE beat_catalogo SET disponivel=0 WHERE beat_id=?", b.id);
  }
  if (opcoes.gerarArte !== false) {
    gerarArteCena();
    const pasta = pastaMidias();
    fs.mkdirSync(pasta, { recursive: true });
    for (const p of projetosCena) {
      const mid = "cena-midia-" + p.id,
        arte = imagemCena(p.id),
        arquivo = fs.readFileSync(
          arte
            ? path.resolve("public/img", arte)
            : path.resolve("public/img/cena/obras", p.id + ".svg")
        );
      // SVG gerado pelo próprio código, com XML escapado; uploads externos continuam restritos.
      if (!um("SELECT 1 FROM midias_trabalho WHERE id=?", mid)) {
        fs.writeFileSync(path.join(pasta, mid), arquivo, { flag: "wx" });
        run(
          "INSERT INTO midias_trabalho(id,autor_id,nome,mime,bytes,publico) VALUES(?,?,?,'image/svg+xml',?,1)",
          mid,
          idPessoaCena(p.autor),
          p.titulo,
          arquivo.length
        );
      }
      if (arte) {
        fs.writeFileSync(path.join(pasta, mid), arquivo);
        run(
          "UPDATE midias_trabalho SET mime='image/jpeg',bytes=? WHERE id=?",
          arquivo.length,
          mid
        );
      }
      run(
        "INSERT OR IGNORE INTO itens_projeto(projeto_id,tipo,origem_id,legenda,ordem) VALUES(?,'midia',?,?,0)",
        p.id,
        mid,
        p.titulo
      );
    }
  }
  const editor = um(
    "SELECT usuario_id FROM administradores WHERE papel='super_admin' AND ativo=1 ORDER BY criado_em LIMIT 1"
  )?.usuario_id;
  if (editor)
    for (const a of todos(
      "SELECT * FROM central_artigos WHERE estado='publicado'"
    )) {
      const original = JSON.parse(a.rascunho_json);
      const limpar = (v: any): any =>
        typeof v === "string"
          ? v
              .replace(/Exemplo ilustrativo: /g, "Na prática: ")
              .replace(/\bpedido demonstrativo\b/gi, "pedido")
              .replace(/\bcheckout de teste\b/gi, "checkout")
              .replace(/Mercado Pago de teste/g, "Mercado Pago")
              .replace(/\baquisição demonstrativa\b/gi, "aquisição")
              .replace(/\blicença demonstrativa\b/gi, "licença")
              .replace(
                "confirmado pelo backend no Mercado Pago",
                "confirmado no fluxo da compra"
              )
          : Array.isArray(v)
            ? v.map(limpar)
            : v && typeof v === "object"
              ? Object.fromEntries(
                  Object.entries(v).map(([k, val]) => [k, limpar(val)])
                )
              : v;
      const limpo = limpar(original);
      if (JSON.stringify(limpo) === JSON.stringify(original)) continue;
      salvarArtigo(
        editor,
        { ...limpo, passos: JSON.stringify(limpo.passos), versao: a.versao },
        a.id
      );
      for (const acao of ["revisar", "publicar"])
        transicionarArtigo(editor, a.id, {
          acao,
          versao: um("SELECT versao FROM central_artigos WHERE id=?", a.id)!
            .versao,
          motivo:
            "Ajuste da linguagem de apresentação solicitado para a plataforma.",
        });
    }
  return {
    perfis: pessoasCena.length,
    obras: encontrosCena.length,
    projetos: projetosCena.length,
    oportunidades: oportunidadesCena.length,
    beats: beatsDemonstrativos.length,
  };
}
const xml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!
  );
export function gerarArteCena() {
  const root = path.resolve("public/img/cena");
  fs.mkdirSync(path.join(root, "perfis"), { recursive: true });
  fs.mkdirSync(path.join(root, "obras"), { recursive: true });
  for (const [i, p] of pessoasCena.entries())
    if (!p.imagem) {
      const cor = ["#bfd77f", "#edce65", "#a7c6ad", "#d1b18c"][i % 4];
      fs.writeFileSync(
        path.join(root, "perfis", p.slug + ".svg"),
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><rect width="640" height="640" fill="#10150f"/><path d="M0 490 640 80V0L0 410z" fill="${cor}" opacity=".15"/><circle cx="330" cy="330" r="233" fill="none" stroke="${cor}" stroke-width="2"/><path d="M48 48h544v544H48z" stroke="${cor}" fill="none" opacity=".4"/><text x="60" y="108" fill="${cor}" font-family="Arial" font-size="22" letter-spacing="7">CYPHER / CENA</text><text x="320" y="385" text-anchor="middle" fill="${cor}" font-family="Arial" font-weight="700" font-size="180">${xml(iniciais(p.nome))}</text><text x="320" y="552" text-anchor="middle" fill="${cor}" font-family="Arial" font-size="24">${xml(p.nome)}</text></svg>`
      );
    }
  for (const [i, e] of [...encontrosCena, ...projetosCena].entries()) {
    const cor = ["#bfd77f", "#e6c659", "#e2a082", "#a6c7b7"][i % 4],
      palavras = e.titulo.toUpperCase().split(" ");
    let linhas: string[] = [""];
    for (const palavra of palavras) {
      if ((linhas.at(-1)! + " " + palavra).length > 16) linhas.push(palavra);
      else linhas[linhas.length - 1] += (linhas.at(-1) ? " " : "") + palavra;
    }
    fs.writeFileSync(
      path.join(root, "obras", e.id + ".svg"),
      `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900"><rect width="900" height="900" fill="#111510"/><path d="M0 750 900 100v170L0 900z" fill="${cor}" opacity=".16"/><circle cx="670" cy="670" r="280" fill="none" stroke="${cor}" stroke-width="2" opacity=".5"/><circle cx="670" cy="670" r="200" fill="none" stroke="${cor}" opacity=".4"/><text x="58" y="95" fill="${cor}" font-family="Arial" font-size="24" letter-spacing="8">CYPHER / ENCONTROS</text>${linhas
        .slice(0, 5)
        .map(
          (l, j) =>
            `<text x="54" y="${270 + j * 85}" fill="${cor}" font-family="Arial" font-weight="900" font-size="70">${xml(l)}</text>`
        )
        .join(
          ""
        )}<text x="58" y="795" fill="${cor}" font-family="Arial" font-size="24">${xml(pessoasCena.find(p => p.slug === e.autor)!.nome.toUpperCase())} + CONVIDADOS</text><path d="M58 825h784" stroke="${cor}"/><text x="58" y="865" fill="${cor}" font-family="Arial" font-size="18" letter-spacing="5">CRIAÇÃO QUE NASCE DO ENCONTRO / 2026</text></svg>`
    );
  }
}
export function conexoesCena(visitante: string, titular: string) {
  const info = itemCena("perfil", titular);
  if (!info) return null;
  const obras = todos(
    `SELECT DISTINCT o.id,o.metadados FROM obras o LEFT JOIN creditos c ON c.obra_id=o.id
     WHERE o.publicada=1 AND o.situacao IN('','Lançado') AND (o.proprietario_id=? OR (c.usuario_creditado_id=? AND c.verificado=1))`,
    titular,
    titular
  ).filter(o => objetoDisponivel(db(), "obra", o.id, visitante));
  const rede = new Map<string, Linha>();
  for (const o of obras) {
    const origem = um(
      "SELECT proprietario_id,titulo FROM obras WHERE id=?",
      o.id
    )!;
    for (const p of todos(
      "SELECT DISTINCT usuario_creditado_id id FROM creditos WHERE obra_id=? AND usuario_creditado_id IS NOT NULL AND verificado=1 UNION SELECT ? id",
      o.id,
      origem.proprietario_id
    )) {
      if (
        p.id === titular ||
        !objetoDisponivel(db(), "perfil", p.id, visitante)
      )
        continue;
      const perfil = um(
        "SELECT usuario_id id,nome,identificador,funcao FROM perfis WHERE usuario_id=?",
        p.id
      )!;
      const anterior = rede.get(p.id);
      if (anterior) {
        anterior.total++;
        continue;
      }
      rede.set(p.id, {
        ...perfil,
        total: 1,
        obra: origem.titulo,
        url: "/p/" + encodeURIComponent(perfil.identificador.slice(1)),
      });
    }
  }
  const projetos = projetosCena.filter(
    p =>
      [p.autor, ...p.equipe].some(s => idPessoaCena(s) === titular) &&
      objetoDisponivel(db(), "projeto", p.id, visitante)
  );
  for (const projeto of projetos)
    for (const slug of [projeto.autor, ...projeto.equipe]) {
      const id = idPessoaCena(slug);
      if (id === titular || !objetoDisponivel(db(), "perfil", id, visitante))
        continue;
      const anterior = rede.get(id);
      if (anterior) {
        anterior.total++;
        continue;
      }
      const p = um(
        "SELECT usuario_id id,nome,identificador,funcao FROM perfis WHERE usuario_id=?",
        id
      )!;
      rede.set(id, {
        ...p,
        total: 1,
        obra: projeto.titulo,
        url: "/p/" + encodeURIComponent(p.identificador.slice(1)),
      });
    }
  const destaques = obras
    .filter(o => {
      let disco: string | undefined;
      try { disco = JSON.parse(o.metadados || "{}")?.disco; } catch { /* Texto livre nos registros antigos. */ }
      return !disco || !obras.some(v => v.id === disco);
    })
    .map(o =>
      um(
        "SELECT o.id,o.titulo,p.nome autor,p.identificador FROM obras o JOIN perfis p ON p.usuario_id=o.proprietario_id WHERE o.id=?",
        o.id
      )!
    )
    .filter(Boolean)
    .sort(
      (a, b) =>
        Number(b.id.startsWith("cena-")) - Number(a.id.startsWith("cena-"))
    )
    .slice(0, 4)
    .map(o => ({
      ...o,
      url: enderecoObra(o.identificador, o.id),
    }));
  for (const p of projetos)
    if (destaques.length < 4)
      destaques.push({
        id: p.id,
        titulo: p.titulo,
        autor: pessoasCena.find(v => v.slug === p.autor)!.nome,
        url: "/work-projects/" + p.id,
      } as any);
  return {
    nucleo: info.dados.nucleo,
    totalTrabalhos: obras.length + projetos.length,
    destaques,
    conexoes: [...rede.values()].sort((a, b) => b.total - a.total).slice(0, 8),
    projetos: projetos.map(p => ({ id: p.id, titulo: p.titulo })),
  };
}

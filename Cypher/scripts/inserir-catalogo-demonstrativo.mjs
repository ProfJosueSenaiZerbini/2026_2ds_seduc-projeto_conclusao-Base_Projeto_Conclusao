import {
  fecharBancoCypher,
  inicializarBancoCypher,
  conexaoInternaCypher,
} from "../src/app/models/bancoDados.ts";
import {
  beatsDemonstrativos,
  discosDemonstrativos,
  faixasDemonstrativas,
  idFaixaDemo,
  perfisDemonstrativos,
} from "../src/app/models/catalogoDemonstrativo.ts";

const dono = slug => `demo-catalogo-${slug}`;
inicializarBancoCypher();
try {
  const banco = conexaoInternaCypher();
  banco
    .transaction(() => {
      const usuario = banco.prepare(
        "INSERT INTO usuarios (id,codigo_publico,demonstracao) VALUES (?, ?, 1) ON CONFLICT(id) DO NOTHING"
      );
      const perfil =
        banco.prepare(`INSERT INTO perfis (usuario_id,c_tag,nome,funcao,identificador,iniciais,cidade,biografia,generos_json,categorias_json,perfil_publico,localizacao_publica,demonstracao)
      VALUES (?,?,?,?,?,?,?,?,?,?,1,1,1) ON CONFLICT(usuario_id) DO NOTHING`);
      const conferir = banco.prepare(
        "SELECT 1 FROM usuarios u JOIN perfis p ON p.usuario_id=u.id WHERE u.id=? AND u.demonstracao=1 AND p.demonstracao=1 AND p.identificador=?"
      );
      const reservar = banco.prepare(
        "INSERT INTO identificadores_usuario (identificador,usuario_id) VALUES (?,?) ON CONFLICT(identificador) DO NOTHING"
      );
      const reserva = banco.prepare(
        "SELECT usuario_id FROM identificadores_usuario WHERE identificador=?"
      );
      for (const p of perfisDemonstrativos) {
        const id = dono(p.slug);
        usuario.run(id, `DEMO-${p.iniciais}`);
        perfil.run(
          id,
          `DEMO-${p.iniciais}`,
          p.nome,
          p.funcao,
          `@${p.slug}`,
          p.iniciais,
          p.cidade,
          p.bio,
          JSON.stringify([p.genero]),
          JSON.stringify([p.funcao])
        );
        if (!conferir.get(id, `@${p.slug}`))
          throw new Error(`Identidade demonstrativa em conflito: ${p.slug}`);
        reservar.run(`@${p.slug}`, id);
        if (reserva.get(`@${p.slug}`).usuario_id !== id)
          throw new Error(`Identificador ocupado: ${p.slug}`);
      }

      const inserirObra =
        banco.prepare(`INSERT INTO obras (id,proprietario_id,titulo,tipo,situacao,metadados,funcao_principal,quantidade_creditos,genero,data_lancamento,link_escuta,publicada,demonstracao)
      VALUES (?,?,?,?,'Lançado',?,?,?,?,?,?,1,1)
      ON CONFLICT(id) DO UPDATE SET link_escuta = excluded.link_escuta
      WHERE obras.demonstracao = 1 AND obras.proprietario_id = excluded.proprietario_id`);
      const obraDemo = banco.prepare(
        "SELECT 1 FROM obras WHERE id=? AND proprietario_id=? AND demonstracao=1"
      );
      const credito = banco.prepare(
        "INSERT INTO creditos (id,obra_id,nome_creditado,funcao,demonstracao) VALUES (?,?,?,?,1) ON CONFLICT(id) DO NOTHING"
      );
      function obra(
        item,
        tipo,
        participacao = "",
        metadados = "",
        funcao = "Artista principal"
      ) {
        const proprietario = dono(item.slug);
        inserirObra.run(
          item.id,
          proprietario,
          item.titulo,
          tipo,
          metadados,
          funcao,
          participacao ? 2 : 1,
          item.genero,
          item.data,
          item.link
        );
        if (!obraDemo.get(item.id, proprietario))
          throw new Error(`Obra demonstrativa em conflito: ${item.id}`);
        credito.run(
          `${item.id}-prod`,
          item.id,
          item.producao,
          "Produção musical"
        );
        if (participacao)
          credito.run(
            `${item.id}-feat`,
            item.id,
            participacao,
            tipo === "Música" && item.id === "demo-obra-horizontal"
              ? "Artista principal"
              : "Colaboração"
          );
      }
      for (const faixa of faixasDemonstrativas)
        obra(
          faixa,
          "Música",
          faixa.participacao,
          "",
          faixa.id === "demo-obra-horizontal"
            ? "Participação"
            : "Artista principal"
        );
      for (const disco of discosDemonstrativos) {
        obra(
          disco,
          disco.tipo,
          "",
          JSON.stringify({
            faixas: disco.faixas.map((_, i) => idFaixaDemo(disco.id, i)),
          })
        );
        disco.faixas.forEach((titulo, i) => {
          const link =
            disco.id === "demo-obra-lmc-vol-1" && i === 0
              ? "https://www.youtube.com/watch?v=5gObise6YJQ"
              : "";
          obra(
            { ...disco, id: idFaixaDemo(disco.id, i), titulo, link },
            "Música",
            disco.participacoes[i + 1],
            JSON.stringify({ disco: disco.id, faixa: i + 1 })
          );
        });
      }

      const beat =
        banco.prepare(`INSERT INTO beats (id,produtor_id,titulo,bpm,genero,descricao,licenca,condicoes_uso,demonstracao)
      VALUES (?,?,?,?,?,'Ficha demonstrativa. BPM estimado.','Não informada','Consulte o produtor para informações de licenciamento.',1) ON CONFLICT(id) DO NOTHING`);
      for (const b of beatsDemonstrativos)
        beat.run(b.id, dono(b.slug), b.titulo, b.bpm, b.genero);

      const workshopsDemonstrativos = [
        {
          id: "demo-workshop-dj-producao",
          titulo: "Do toca-discos ao beat",
          tipos: ["DJ e produção musical"],
          data: "2026-12-06",
          horario: "14h",
          local: "Estúdio Cypher · São Paulo, SP",
          descricao: "Uma sessão prática sobre discotecagem, construção de sets e fundamentos da produção musical.",
          formato: "Presencial · 2 horas",
          etiquetas: ["DJ", "Produção musical", "Workshop"],
        },
        {
          id: "demo-workshop-slam-poesia",
          titulo: "Slam: palavra em voz alta",
          tipos: ["Slam e Poesia Falada"],
          data: "2026-12-13",
          horario: "16h",
          local: "Teatro de Bolso · São Paulo, SP",
          descricao: "Encontro aberto para experimentar escrita, presença de palco e poesia falada em comunidade.",
          formato: "Presencial · 90 minutos",
          etiquetas: ["Slam", "Poesia falada", "Workshop"],
        },
        {
          id: "demo-workshop-beatbox",
          titulo: "Beatbox e percussão vocal",
          tipos: ["Beatbox e Percussão Vocal"],
          data: "2026-12-20",
          horario: "15h",
          local: "Casa Cypher · São Paulo, SP",
          descricao: "Prática de ritmo, timbres e criação de bases usando a voz e o corpo como instrumentos.",
          formato: "Presencial · 2 horas",
          etiquetas: ["Beatbox", "Percussão vocal", "Workshop"],
        },
      ];
      const inserirWorkshop = banco.prepare(`
        INSERT INTO eventos (
          id, proprietario_id, titulo, categoria, categoria_detalhe,
          tipos_workshop_json, data_texto, horario, local, organizador,
          situacao, cor, tema_cartao, descricao, formato, inscricao, premio,
          etiquetas_json, tipo_participacao, demonstracao, ordem_demo
        ) VALUES (
          ?, ?, ?, 'Workshop', '', ?, ?, ?, ?, 'Cypher',
          'Inscrições abertas', 'yellow', 'cartaz-de-rua', ?, ?,
          'Gratuito · vagas limitadas', '', ?, 'aberta', 1, 0
        )
        ON CONFLICT(id) DO UPDATE SET
          titulo=excluded.titulo,
          tipos_workshop_json=excluded.tipos_workshop_json,
          data_texto=excluded.data_texto,
          horario=excluded.horario,
          local=excluded.local,
          organizador=excluded.organizador,
          descricao=excluded.descricao,
          formato=excluded.formato,
          inscricao=excluded.inscricao,
          etiquetas_json=excluded.etiquetas_json
        WHERE eventos.demonstracao=1
          AND eventos.proprietario_id=excluded.proprietario_id
      `);
      for (const workshop of workshopsDemonstrativos) {
        inserirWorkshop.run(
          workshop.id,
          dono("wkilla.demo"),
          workshop.titulo,
          JSON.stringify(workshop.tipos),
          workshop.data,
          workshop.horario,
          workshop.local,
          workshop.descricao,
          workshop.formato,
          JSON.stringify(workshop.etiquetas)
        );
      }
    })
    .immediate();
  console.log("Catálogo demonstrativo disponível no SQLite.");
} finally {
  fecharBancoCypher();
}

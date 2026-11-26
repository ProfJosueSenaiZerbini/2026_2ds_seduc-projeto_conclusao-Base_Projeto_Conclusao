import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

const pasta = process.env.CYPHER_HOMOLOGACAO_DIR
  ? path.resolve(process.env.CYPHER_HOMOLOGACAO_DIR)
  : await fs.mkdtemp(path.join(os.tmpdir(), "cypher-homologacao-"));
await fs.mkdir(pasta, { recursive: true });
process.env.CYPHER_DB_PATH = path.join(pasta, "carga.sqlite");
await (await fs.open(process.env.CYPHER_DB_PATH, "wx")).close();
const banco = await import("../dist/src/app/models/bancoDados.js");
const { iniciarSessao, gerarHashSenha } =
  await import("../dist/src/app/models/autenticacaoCypher.js");
const prefixo = "homolog";
const csrf = "e".repeat(64);
const senha = "Cypher-homologacao-2026!";
const fixture = i => prefixo + i;
const titulo = (tipo, i) => `${tipo} Homologação ${i}`;
const data = new Date();
data.setUTCFullYear(data.getUTCFullYear() - 17);
const nascimentoMenor = data.toISOString().slice(0, 10);

banco.inicializarBancoCypher();
const db = banco.conexaoInternaCypher();
const senhaHash = await gerarHashSenha(senha);
const sessoes = db.transaction(() => {
  const tokens = [];
  for (let i = 0; i < 1000; i++) {
    const id = fixture(i);
    banco.criarContaCypher({
      id,
      email: `${id}@example.test`,
      senhaHash,
      tipoConta: "profissional",
      nome: titulo("Artista", i),
      funcao: "Rapper",
      identificador: "@" + id,
      iniciais: "AH",
      nascimento: i === 999 ? nascimentoMenor : "1990-01-01",
      categorias: ["Rapper", "Beatmaker"],
      outraCategoria: "",
    });
    db.prepare(
      "UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(id);
    db.prepare(
      "UPDATE perfis SET perfil_publico=1 WHERE usuario_id=? AND usuario_id<>'homolog999'"
    ).run(id);
    if (i < 20 || i === 999) tokens.push(iniciarSessao(id));
  }
  const inserirObra = db.prepare(
    "INSERT INTO obras(id,proprietario_id,titulo,tipo,situacao,publicada,genero,letra) VALUES(?,?,?,'Composição','',?,'Rap',?)"
  );
  const inserirProjeto = db.prepare(
    "INSERT INTO projetos_trabalho(id,autor_id,titulo,descricao,publico) VALUES(?,?,?,'Descrição de homologação.',1)"
  );
  for (let i = 0; i < 500; i++) {
    inserirObra.run(
      "obra-" + i,
      fixture(i),
      titulo("Obra", i),
      i === 0 ? 0 : 1,
      i === 0 ? "LETRA RESERVADA HOMOLOGACAO" : ""
    );
    db.prepare("INSERT INTO composicoes(id) VALUES(?)").run("obra-" + i);
    inserirProjeto.run("projeto-" + i, fixture(i), titulo("Projeto", i));
  }
  for (let i = 0; i < 200; i++)
    db.prepare(
      "INSERT INTO beats(id,produtor_id,titulo,bpm,genero) VALUES(?,?,?,'90','Rap')"
    ).run("beat-" + i, fixture(i), titulo("Beat", i));
  for (let i = 0; i < 100; i++) {
    db.prepare(
      "INSERT INTO eventos(id,proprietario_id,titulo,categoria,data_texto) VALUES(?,?,?,'Show','2030-03-20')"
    ).run("evento-" + i, fixture(i), titulo("Evento", i));
    db.prepare(
      `INSERT INTO oportunidades_profissionais(id,autor_id,titulo,tipo,descricao,modalidade,remuneracao,estado,publicada_em)
      VALUES(?,?,?,'colaboracao','Uma oportunidade de homologação','remoto','a_combinar','aberta',CURRENT_TIMESTAMP)`
    ).run("oportunidade-" + i, fixture(i), titulo("Oportunidade", i));
  }
  return tokens;
})();
const { salvarMidiaPublicacao } =
  await import("../dist/src/app/models/midiasPublicacoes.js");
const arquivo = Buffer.from("MIDIA RESERVADA HOMOLOGACAO\n");
const idMidia = salvarMidiaPublicacao(
  fixture(0),
  "obra",
  "obra-0",
  "texto",
  "reservada.txt",
  arquivo
);
const volume = Object.fromEntries(
  [
    "perfis",
    "obras",
    "projetos_trabalho",
    "beats",
    "eventos",
    "oportunidades_profissionais",
  ].map(tabela => [
    tabela,
    db.prepare(`SELECT count(*) FROM ${tabela}`).pluck().get(),
  ])
);
banco.fecharBancoCypher();
const reserva = net.createServer();
await new Promise(resolve => reserva.listen(0, "127.0.0.1", resolve));
const porta = reserva.address().port;
await new Promise(resolve => reserva.close(resolve));
const base = `http://127.0.0.1:${porta}`;
const processo = spawn(process.execPath, ["dist/src/aplicacao.js"], {
  env: {
    ...process.env,
    PORT: String(porta),
    CYPHER_BIND_HOST: "127.0.0.1",
    NODE_ENV: "development",
    CYPHER_EMAIL_TRANSPORT: "local",
    CYPHER_VIEW_CACHE: "1",
    CYPHER_EMAIL_DIR: path.join(pasta, "emails"),
    CYPHER_SUPER_ADMIN_EMAIL: "admin-homolog@example.test",
    CYPHER_SUPER_ADMIN_PASSWORD: senha,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let erros = "";
processo.stderr.on("data", dados => (erros += dados.toString()));
const sessao = i => `cypher_session=${sessoes[i]}; cypher_csrf=${csrf}`;
const pedir = (rota, i, opcoes = {}) =>
  fetch(base + rota, {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    ...opcoes,
    headers: {
      ...(i === null ? {} : { cookie: sessao(i) }),
      ...opcoes.headers,
    },
  });

try {
  for (let i = 0; ; i++) {
    try {
      const r = await pedir("/login", null);
      if (r.ok) {
        await r.text();
        break;
      }
    } catch {
      if (processo.exitCode !== null || i >= 100)
        throw new Error("A instância de homologação não iniciou. " + erros);
    }
    if (i >= 100) throw new Error("A instância não ficou pronta.");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const media = "/publication-media/" + idMidia;
  console.log("Instância pronta. Verificando controles de privacidade.");
  const semSessao = await pedir(media, null);
  assert.equal(semSessao.status, 302);
  assert.equal((await pedir(media, 1)).status, 404);
  const recuperada = await pedir(media, 0);
  assert.equal(recuperada.status, 200);
  assert.deepEqual(Buffer.from(await recuperada.arrayBuffer()), arquivo);
  console.log("Download privado conferido. Verificando perfis e letras.");
  assert.doesNotMatch(
    await (await pedir("/p/homolog0?obra=obra-0", 1)).text(),
    /LETRA RESERVADA HOMOLOGACAO/
  );
  const menor = await (await pedir("/p/homolog999", 1)).text();
  assert.ok(
    !menor.includes(nascimentoMenor) &&
      !menor.includes("Artista Homologação 999")
  );
  const menorLogado = await pedir("/settings", 20);
  assert.equal(menorLogado.status, 200);
  await menorLogado.text();
  console.log("Privacidade conferida.");

  if (process.env.CYPHER_HOMOLOGACAO_NAVEGADORES) {
    const ferramenta = path.resolve(process.env.CYPHER_HOMOLOGACAO_NAVEGADORES);
    const browser = spawn(
      process.execPath,
      ["scripts/testar-navegadores.mjs", base, pasta, ferramenta],
      {
        env: {
          ...process.env,
          PLAYWRIGHT_BROWSERS_PATH: path.join(ferramenta, "browsers"),
        },
        stdio: "inherit",
      }
    );
    process.exitCode = await new Promise((resolve, reject) => {
      browser.once("error", reject);
      browser.once("exit", codigo => resolve(codigo ?? 1));
    });
  } else {
    const cenarios = [
      ["Descoberta", 3000, () => "/dashboard"],
      ["Obras", 3000, () => "/works"],
      ["Banco de Beats", 3000, () => "/beats"],
      ["Eventos", 3000, () => "/events"],
      ["Oportunidades", 3000, () => "/opportunities"],
      ["Busca global", 2000, () => "/search?q=homologacao"],
      ["Filtrar Descoberta", 2000, () => "/dashboard?tipo=obras&q=homologacao"],
      ["Filtrar Obras", 2000, () => "/works?q=homologacao"],
      ["Filtrar Beats", 2000, () => "/beats?q=homologacao&genero=Rap"],
      ["Filtrar Eventos", 2000, () => "/events?categoria=Show"],
      ["Filtrar Oportunidades", 2000, () => "/opportunities?tipo=colaboracao"],
      ["Ficha de obra", 3000, i => "/espaco-de-trabalho/obra/obra-" + i],
      ["Cadastrar composição", 3000, () => "/works/new", "POST"],
      ["Editar composição", 3000, i => "/works/obra-" + i + "/edit", "POST"],
    ];
    const resultados = [];
    for (const [nome, limite, rota, metodo] of cenarios) {
      const tempos = [];
      const status = {};
      for (let rodada = 0; rodada < 3; rodada++) {
        await Promise.all(
          sessoes.slice(0, 20).map(async (_, i) => {
            const inicio = performance.now();
            let codigo;
            try {
              const r = await pedir(
                rota(i),
                i,
                metodo
                  ? {
                      method: metodo,
                      headers: { "x-csrf-token": csrf },
                      body: new URLSearchParams({
                        acervo: "1",
                        titulo: titulo("Composição", i),
                        tipo: "Composição",
                        genero: "Rap",
                        visibilidade: "privada",
                        papel: "Composição",
                      }),
                    }
                  : {}
              );
              await r.arrayBuffer();
              codigo = r.status;
            } catch (erro) {
              codigo = erro.name;
            }
            tempos.push(performance.now() - inicio);
            status[codigo] = (status[codigo] ?? 0) + 1;
          })
        );
      }
      tempos.sort((a, b) => a - b);
      const p95 = Math.round(tempos[Math.ceil(tempos.length * 0.95) - 1]);
      const aprovado =
        p95 <= limite && status[metodo ? 303 : 200] === tempos.length;
      resultados.push({
        nome,
        p95,
        limite,
        amostras: tempos.length,
        status,
        aprovado,
      });
      console.log(`${nome}: ${p95} ms (${JSON.stringify(status)})`);
    }
    const relatorio = {
      ambiente: {
        plataforma: os.platform(),
        cpu: os.cpus()[0].model,
        processadoresLogicos: os.cpus().length,
        node: process.version,
        rede: "loopback HTTP",
      },
      volume,
      sessoesSimultaneas: 20,
      resultados,
      privacidade: "arquivo privado, letra privada e perfil de menor",
      erros,
    };
    await fs.writeFile(
      path.join(pasta, "desempenho.json"),
      JSON.stringify(relatorio, null, 2)
    );
    console.log(JSON.stringify(relatorio, null, 2));
    if (resultados.some(r => !r.aprovado)) process.exitCode = 1;
  }
} catch (erro) {
  if (erros) console.error(erros);
  throw erro;
} finally {
  if (processo.exitCode === null) {
    processo.kill();
    await new Promise(resolve => processo.once("exit", resolve));
  }
}

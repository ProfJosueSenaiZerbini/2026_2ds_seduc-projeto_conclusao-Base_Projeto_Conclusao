import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const [base, pasta, ferramentas] = process.argv.slice(2);
if (!base || !pasta || !ferramentas)
  throw new Error(
    "Informe a URL, a pasta do relatório e o diretório com node_modules de Playwright e axe-core."
  );
const require = createRequire(
  path.join(path.resolve(ferramentas), "package.json")
);
const { chromium, firefox, webkit } = require("playwright");
const axe = require.resolve("axe-core/axe.min.js");
const senha = "Cypher-homologacao-2026!";
const navegadores = [
  ["Chrome", chromium, { channel: "chrome" }],
  ["Edge", chromium, { channel: "msedge" }],
  ["Firefox", firefox, {}],
  ["WebKit", webkit, {}],
];
const relatorio = [];
await fs.mkdir(pasta, { recursive: true });

for (const [nome, motor, opcoes] of navegadores) {
  const resultado = { nome, etapas: [], axe: [], falhas: [] };
  relatorio.push(resultado);
  const etapa = async (rotulo, fn) => {
    try {
      await fn();
      resultado.etapas.push(rotulo);
    } catch (erro) {
      resultado.falhas.push({ etapa: rotulo, erro: erro.message });
    }
  };
  await etapa("iniciar navegador", async () => {
    const navegador = await motor.launch({ ...opcoes, headless: true });
    try {
      resultado.versao = navegador.version();
      const pagina = await navegador.newPage({
        viewport: { width: 360, height: 800 },
        reducedMotion: "reduce",
      });
      pagina.setDefaultTimeout(8_000);
      const ir = async rota => {
        const resposta = await pagina.goto(base + rota, {
          waitUntil: "domcontentloaded",
        });
        assert.ok(
          [200, 304].includes(resposta?.status()),
          rota + " retornou " + resposta?.status()
        );
      };
      const chave = "qa_" + nome.toLowerCase() + "_" + Date.now().toString(36);
      const tituloFonograma = "Fonograma navegador " + nome + " " + chave;
      await etapa("cadastro de consumidor", async () => {
        await ir("/register?tipo=consumidor");
        await pagina.locator('[name="name"]').fill("Pessoa de Homologação");
        await pagina
          .locator('[data-register-stage="conta"] [data-continue]')
          .press("Enter");
        await pagina.locator('[name="identificador"]').fill(chave);
        await pagina.locator('[name="email"]').fill(chave + "@example.test");
        await pagina
          .locator('[data-register-stage="contato"] [data-continue]')
          .press("Enter");
        await pagina.locator('[name="nascimento"]').fill("1990-01-01");
        await pagina.locator('[name="password"]').fill(senha);
        await pagina.locator('[name="passwordConfirmation"]').fill(senha);
        await pagina.locator('[name="aceiteTermos"]').check();
        await pagina.locator("[data-account-next]").press("Enter");
        await pagina.waitForURL("**/email/pendente**");
        const caixa = path.join(pasta, "emails");
        const mensagens = await Promise.all(
          (await fs.readdir(caixa)).map(nome => fs.readFile(path.join(caixa, nome), "utf8"))
        );
        const email = mensagens.find(texto => texto.startsWith("To: " + chave + "@example.test\n"));
        const token = email?.match(/token=([a-f0-9]{64})/)?.[1];
        assert.ok(token, "E-mail local de confirmação recebido");
        await ir("/confirmar-email?token=" + token);
        await pagina.getByRole("button", { name: "Confirmar e-mail" }).press("Enter");
        await pagina.getByRole("heading", { name: "E-mail confirmado" }).waitFor();
      });
      await etapa("autenticação profissional por teclado", async () => {
        await ir("/login");
        await pagina
          .locator('[name="identificador"]')
          .fill("homolog0@example.test");
        await pagina.locator('[name="password"]').fill(senha);
        await pagina.locator('[name="password"]').press("Enter");
        await pagina.waitForURL(/\/dashboard(?:\?|$)/);
      });
      await etapa("busca e leitura", async () => {
        await ir("/search?q=Homologa%C3%A7%C3%A3o");
        await pagina.getByRole("heading", { level: 1 }).first().waitFor();
        assert.match(await pagina.locator("main").innerText(), /Homologação/i);
        await ir("/p/homolog1?obra=obra-1#obra-obra-1");
        await pagina
          .locator(".pf-work-detail")
          .getByRole("heading", { name: "Obra Homologação 1", exact: true })
          .waitFor();
      });
      await etapa("publicação e leitura de fonograma por teclado", async () => {
        await ir("/works/new?tipo=Fonograma");
        await pagina.locator('[name="titulo"]').fill(tituloFonograma);
        await pagina.locator('[name="genero"]').selectOption("Rap");
        await pagina.locator('[name="isrc"]').fill("BRABC2600123");
        await pagina
          .locator('[name="composicaoId"]')
          .first()
          .selectOption("obra-0");
        await pagina.locator("[data-adicionar-vinculo]").press("Enter");
        assert.equal(await pagina.locator('[name="composicaoId"]').count(), 2);
        assert.ok(
          await pagina
            .locator('[name="composicaoId"]')
            .nth(1)
            .evaluate(el => el === document.activeElement)
        );
        await pagina
          .locator('form[data-work-form] button[type="submit"]')
          .press("Enter");
        await pagina.waitForURL("**/espaco-de-trabalho?resultado=criada**");
        await ir(
          "/espaco-de-trabalho?q=" + encodeURIComponent(tituloFonograma)
        );
        const ficha = pagina
          .getByRole("link", { name: tituloFonograma })
          .first();
        await ficha.press("Enter");
        await pagina.getByText("BRABC2600123", { exact: true }).waitFor();
      });
      await etapa("largura de 360 px e foco na publicação", async () => {
        await ir("/works/new?tipo=Fonograma");
        assert.ok(
          await pagina.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        );
        const titulo = pagina.locator('[name="titulo"]');
        await titulo.focus();
        await pagina.keyboard.press("Tab");
        assert.ok(
          await pagina.evaluate(
            () =>
              document.activeElement !== document.body &&
              document.activeElement.matches(":focus-visible")
          )
        );
      });
      await etapa("leitura horizontal e desktop", async () => {
        for (const viewport of [
          { width: 800, height: 360 },
          { width: 1440, height: 900 },
        ]) {
          await pagina.setViewportSize(viewport);
          await ir("/works/new?tipo=Fonograma");
          assert.ok(
            await pagina.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth
            )
          );
        }
      });
      if (nome === "Chrome") {
        await etapa("montagem e evidência de Single", async () => {
          await ir("/works/new?tipo=Single");
          const titulo = "Single de homologação " + chave;
          await pagina.locator('[name="titulo"]').fill(titulo);
          await pagina.locator('[name="genero"]').selectOption("Rap");
          await pagina
            .locator('[name="fonogramaId"]')
            .selectOption({ label: tituloFonograma });
          await pagina
            .locator('form[data-work-form] button[type="submit"]')
            .press("Enter");
          await pagina.waitForURL("**/espaco-de-trabalho?resultado=criada**");
          await ir("/espaco-de-trabalho?q=" + encodeURIComponent(titulo));
          await pagina
            .getByRole("link", { name: titulo })
            .first()
            .press("Enter");
          await pagina.getByText("Faixas em ordem").press("Enter");
          await pagina.getByRole("link", { name: tituloFonograma }).waitFor();
          await pagina
            .getByText("Comprovar lançamento", { exact: true })
            .press("Enter");
          await pagina.locator('[name="tipo"]').selectOption("externa");
          await pagina.locator('[name="data"]').fill("2025-05-13");
          await pagina
            .locator('[name="url"]')
            .fill("https://example.test/lancamento");
          await pagina.locator('[name="autorizado"]').check();
          await pagina
            .getByRole("button", { name: "Enviar evidência" })
            .press("Enter");
          await pagina.getByText("Evidência aguardando revisão").waitFor();
          const ficha = pagina.url();
          const equipe = await navegador.newPage();
          await equipe.goto(base + "/admin/login");
          await equipe.locator('[name="email"]').fill("admin-homolog@example.test");
          await equipe.locator('[name="password"]').fill(senha);
          await equipe.getByRole("button", { name: "Entrar" }).press("Enter");
          await equipe.waitForURL("**/admin");
          await equipe.goto(base + "/admin/lancamentos");
          const pendencia = equipe.locator("article").filter({ has: equipe.getByRole("heading", { name: titulo }) });
          await pendencia.getByRole("button", { name: "Recusar evidência" }).press("Enter");
          await equipe.getByText("Nenhuma evidência aguarda análise.").waitFor();
          await equipe.close();
          await pagina.goto(ficha);
          await pagina.getByText("Evidência recusada").waitFor();
        });
        await etapa("auditoria axe-core WCAG 2.2 AA", async () => {
          for (const tema of ["dark", "light"]) {
            await pagina.emulateMedia({ colorScheme: tema });
            await pagina.evaluate(tema => {
              localStorage.setItem("cypher-tema", tema);
            }, tema);
            for (const rota of [
              "/login",
              "/register?tipo=consumidor",
              "/dashboard",
              "/works",
              "/works/new?tipo=Fonograma",
              "/espaco-de-trabalho/obra/obra-0",
            ]) {
              await ir(rota);
              await pagina.addScriptTag({ path: axe });
              const auditoria = await pagina.evaluate(async () => {
                const r = await window.axe.run({
                  runOnly: {
                    type: "tag",
                    values: [
                      "wcag2a",
                      "wcag2aa",
                      "wcag21a",
                      "wcag21aa",
                      "wcag22aa",
                    ],
                  },
                });
                return {
                  temaAplicado: document.documentElement.classList.contains(
                    "dark"
                  )
                    ? "dark"
                    : "light",
                  violacoes: r.violations.map(v => ({
                    id: v.id,
                    impacto: v.impact,
                    elementos: v.nodes.map(n => ({ alvo: n.target, detalhe: n.failureSummary })),
                  })),
                  revisaoManual: r.incomplete.map(v => v.id),
                };
              });
              resultado.axe.push({ rota, tema, ...auditoria });
            }
          }
        });
      }
    } finally {
      await navegador.close();
    }
  });
  console.log(JSON.stringify(resultado));
  await fs.writeFile(
    path.join(pasta, "navegadores.json"),
    JSON.stringify(relatorio, null, 2)
  );
}
if (relatorio.some(r => r.falhas.length)) process.exitCode = 1;

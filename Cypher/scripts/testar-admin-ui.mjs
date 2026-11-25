import { criarClienteHttp } from "./cliente-http-teste.mjs";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const lerZIndexCSS = (css, seletor) => {
  const regras = [
    ...css.matchAll(new RegExp(`${seletor}\\s*\\{([^}]*)\\}`, "g")),
  ];
  assert.ok(regras.length, `Regra CSS ausente: ${seletor}`);
  const valores = regras
    .map(regra => regra[1].match(/\bz-index\s*:\s*(\d+)/))
    .filter(Boolean)
    .map(valor => Number(valor[1]));
  assert.ok(valores.length, `z-index ausente na regra ${seletor}`);
  return Math.max(...valores);
};
const cssEstrutura = fs.readFileSync("public/css/estrutura.css", "utf8");
const cssResponsivo = fs.readFileSync("public/css/responsivo.css", "utf8");
const cssComponentes = fs.readFileSync("public/css/componentes.css", "utf8");
const zTopbar = lerZIndexCSS(cssEstrutura, "\\.topbar");
const zPopover = lerZIndexCSS(cssEstrutura, "\\.notification-popover");
const zOverlay = lerZIndexCSS(
  cssResponsivo,
  "\\.mobile-overlay:not\\(\\[hidden\\]\\)"
);
const zSidebarMovel = lerZIndexCSS(cssResponsivo, "\\.sidebar");
const zModal = lerZIndexCSS(cssComponentes, "\\.modal-backdrop");
assert.ok(
  zTopbar > zPopover,
  "A barra superior deve conter o popover acima do conteúdo"
);
assert.ok(
  zTopbar < zOverlay,
  "O overlay móvel deve permanecer acima da barra superior"
);
assert.ok(
  zOverlay < zSidebarMovel,
  "A navegação móvel deve permanecer acima do overlay"
);
assert.ok(zTopbar < zModal, "Modais devem permanecer acima da barra superior");

const diretorio = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-admin-ui-"));
const arquivoBanco = path.join(diretorio, "cypher.sqlite");
const servidorPorta = createServer();
const porta = await new Promise((resolve, reject) => {
  servidorPorta.once("error", reject);
  servidorPorta.listen(0, "127.0.0.1", () => {
    const endereco = servidorPorta.address();
    servidorPorta.close(error =>
      error ? reject(error) : resolve(endereco.port)
    );
  });
});
const base = `http://127.0.0.1:${porta}`;
const fetch = criarClienteHttp(base,{caixaEmail:path.join(diretorio,"emails")});
const processo = spawn(
  process.execPath,
  ["--import", "tsx", "src/aplicacao.ts"],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CYPHER_DB_PATH: arquivoBanco,
      CYPHER_EMAIL_DIR: path.join(diretorio,"emails"),
      CYPHER_ADMIN_EMAILS: "admin-ui@example.test",
      NODE_ENV: "test",
      PORT: String(porta),
    },
    stdio: ["ignore", "pipe", "pipe"],
  }
);
let logServidor = "";
processo.stdout.on("data", dados => (logServidor += dados));
processo.stderr.on("data", dados => (logServidor += dados));

async function aguardarServidor() {
  for (let tentativa = 0; tentativa < 100; tentativa += 1) {
    try {
      const resposta = await fetch(`${base}/login`);
      if (resposta.ok) return;
    } catch {}
    if (processo.exitCode !== null) break;
    await new Promise(resolve => setTimeout(resolve, 120));
  }
  throw new Error(`Servidor não iniciou.\n${logServidor}`);
}

async function registrar(email, nome) {
  const resposta = await fetch(`${base}/register`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      name: nome,
      email,
      password: "SenhaForteDeTeste2026",
      categorias: "Rapper",
      respostasAtuacoesJson: JSON.stringify({
        Rapper: {
          tempoAtuacao: "1-3a",
          etapaProjetos: "em-desenvolvimento",
          participacaoColetiva: "em-colaboracao",
          atividadePratica: "pratica-inicial",
        },
      }),
      visibilidadesAtuacoesJson: JSON.stringify({}),
    }),
  });
  const corpo = await resposta.text();
  assert.equal(resposta.status, 303, `Cadastro falhou para ${email}: ${corpo}`);
}

try {
  await aguardarServidor();
  const cadastroInicial = await fetch(`${base}/register`);
  assert.equal(cadastroInicial.status, 200);
  const cadastroInicialHtml = await cadastroInicial.text();
  assert.match(cadastroInicialHtml, /Dados da conta/);
  assert.match(
    cadastroInicialHtml,
    /data-register-stage="categorias"[^>]*hidden/
  );
  assert.match(
    cadastroInicialHtml,
    /data-register-stage="questionarios"[^>]*hidden/
  );
  assert.match(cadastroInicialHtml, /data-question-previous/);
  assert.match(cadastroInicialHtml, /data-atuacao-questionario/);
  assert.match(cadastroInicialHtml, /data-category-area-picker/);
  assert.match(cadastroInicialHtml, /data-category-area="musica"/);
  assert.match(cadastroInicialHtml, /data-category-back-to-areas/);
  assert.doesNotMatch(cadastroInicialHtml, /data-category-other/);
  assert.doesNotMatch(cadastroInicialHtml, /Compartilhe sua atuação profissional/);
  assert.match(cadastroInicialHtml, /data-question-next/);
  const validacaoConta = await fetch(`${base}/register/validate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Conta temporária",
      email: "previa@example.test",
      password: "SenhaForteDeTeste2026",
    }),
  });
  assert.equal(validacaoConta.status, 200);
  assert.equal((await validacaoConta.json()).valido, true);
  const semContaPrematura = new Database(arquivoBanco);
  assert.equal(
    semContaPrematura
      .prepare("SELECT COUNT(*) AS total FROM usuarios WHERE email = ?")
      .get("previa@example.test").total,
    0,
    "A pré-validação não deve criar conta antes de concluir o onboarding"
  );
  semContaPrematura.close();
  const invalidacaoConta = await fetch(`${base}/register/validate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "A", email: "invalido", password: "curta" }),
  });
  assert.equal(invalidacaoConta.status, 400);
  assert.equal((await invalidacaoConta.json()).field, "name");
  await registrar("admin-ui@example.test", "Admin UI");
  const criarInterno = spawnSync(process.execPath,["--import","tsx","--input-type=module","-e",`
    import { inicializarBancoCypher } from './src/app/models/bancoDados.ts';
    import { criarAdministrador } from './src/app/models/administracao.ts';
    inicializarBancoCypher();
    await criarAdministrador({nome:'Equipe de teste',email:'equipe-ui@example.test',senha:'SenhaForteDeTeste2026',papel:'super_admin'});
  `],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'test',CYPHER_DB_PATH:arquivoBanco},encoding:'utf8'});
  assert.equal(criarInterno.status,0,criarInterno.stderr);

  const emailDuplicado = await fetch(`${base}/register/validate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Conta duplicada",
      email: "ADMIN-UI@example.test",
      password: "SenhaForteDeTeste2026",
    }),
  });
  assert.equal(emailDuplicado.status, 409);
  assert.equal((await emailDuplicado.json()).field, "email");
  const banco = new Database(arquivoBanco);
  const inserirUsuario = banco.prepare(
    `INSERT INTO usuarios (id, email, senha_hash, tipo_conta, demonstracao)
     VALUES (?, ?, 'teste', 'profissional', 0)`
  );
  const inserirPerfil = banco.prepare(
    `INSERT INTO perfis (usuario_id, nome, funcao, identificador, iniciais, categorias_json, ultima_alteracao_categorias_em, demonstracao)
     VALUES (?, ?, 'Rapper · MC', ?, 'TT', '["Rapper","MC"]', datetime('now', '-10 days'), 0)`
  );
  const adicionarContas = banco.transaction(() => {
    for (let indice = 1; indice <= 9; indice += 1) {
      const id = `admin-ui-fixture-${indice}`;
      inserirUsuario.run(
        id,
        `pessoa${indice}@example.test`
      );
      inserirPerfil.run(
        id,
        `Pessoa Teste ${indice}`,
        `@pessoa_teste_${indice}`
      );
    }
  });
  adicionarContas();
  banco.exec("UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE tipo_conta='profissional'");
  const adminId = banco
    .prepare("SELECT id FROM usuarios WHERE email = ?")
    .get("admin-ui@example.test").id;
  const registrarHistorico = banco.prepare(
    `INSERT INTO auditoria_categorias (
       id, usuario_id, administrador_id, categorias_antes_json,
       categorias_depois_json, motivo
     ) VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (const id of ["admin-ui-fixture-1", "admin-ui-fixture-2"]) {
    registrarHistorico.run(
      `auditoria-inicial-${id}`,
      id,
      adminId,
      '["Rapper"]',
      '["Rapper"]',
      "Histórico anterior para validar o prazo de 60 dias."
    );
  }
  banco
    .prepare("UPDATE perfis SET perfil_publico = 1 WHERE usuario_id = ?")
    .run("admin-ui-fixture-1");
  const identificadorPublico = banco
    .prepare("SELECT identificador FROM perfis WHERE usuario_id = ?")
    .get("admin-ui-fixture-1").identificador;
  banco.close();

  const login = await fetch(`${base}/login`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      email: "admin-ui@example.test",
      password: "SenhaForteDeTeste2026",
    }),
  });
  assert.equal(login.status, 302);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  const loginEquipe = await fetch(`${base}/admin/login`,{method:'POST',redirect:'manual',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:'equipe-ui@example.test',password:'SenhaForteDeTeste2026'})});
  assert.equal(loginEquipe.status,303);
  const cookieEquipe = loginEquipe.headers.getSetCookie().find(c => c.startsWith('cypher_admin_session='))?.split(';')[0];
  assert.ok(cookieEquipe);
  fetch.definirSessoes(cookie,cookieEquipe);


  const perfilEditorResponse = await fetch(
    `${base}/profile?editar=1&secao=profissional`,
    { headers: { cookie } }
  );
  const perfilEditorHtml = await perfilEditorResponse.text();
  assert.equal(
    perfilEditorResponse.status,
    200,
    `Falha ao renderizar edição por seção: ${perfilEditorHtml.slice(0, 1600)}`
  );
  assert.match(perfilEditorHtml, /data-profile-editor/);
  assert.match(perfilEditorHtml, /data-default-section="profissional"/);
  assert.match(perfilEditorHtml, /data-profile-edit-tab="privacidade"/);
  assert.match(perfilEditorHtml, /data-profile-edit-tab="conta"/);
  assert.match(perfilEditorHtml, /data-profile-edit-panel="profissional"/);
  assert.doesNotMatch(perfilEditorHtml, /class="profile-layout"/);
  assert.match(perfilEditorHtml, /data-category-other-suggestion hidden/);
  assert.match(
    perfilEditorHtml,
    /name="categoria" minlength="2" maxlength="60" required/
  );
  assert.match(perfilEditorHtml, /data-other-genre-field/);
  assert.match(perfilEditorHtml, /name="outroGenero"/);
  assert.match(
    perfilEditorHtml,
    /action="\/profile\/secoes\/contato"[^>]*data-profile-section="privacidade"/
  );
  const sugestaoCategoria = await fetch(`${base}/profile/categorias/sugerir`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ categoria: "Operador de palco Cypher" }),
  });
  assert.equal(sugestaoCategoria.status, 303);
  assert.match(
    sugestaoCategoria.headers.get("location") ?? "",
    /secao=profissional&categoria=enviada/
  );
  const bancoPropostaCategoria = new Database(arquivoBanco);
  assert.equal(
    bancoPropostaCategoria
      .prepare(
        "SELECT status FROM propostas_categorias WHERE usuario_id = ? AND categoria = ?"
      )
      .get(adminId, "Operador de palco Cypher").status,
    "pendente"
  );
  bancoPropostaCategoria.close();

  const formularioObraResponse = await fetch(`${base}/works/new?tipo=Outro`, {
    headers: { cookie },
  });
  assert.equal(formularioObraResponse.status, 200);
  const formularioObraHtml = await formularioObraResponse.text();
  assert.match(formularioObraHtml, /data-work-type-other-field/);
  assert.match(formularioObraHtml, /name="tipoOutro"[^>]*required/);
  assert.match(formularioObraHtml, /data-work-genre-other-field hidden/);
  assert.match(formularioObraHtml, /name="generoOutro"/);
  const dadosObraTeste = {
    titulo: "Obra de categoria livre para teste",
    tipo: "Outro",
    tipoOutro: "Coletivo audiovisual independente",
    genero: "Outro",
    generoOutro: "Gênero autoral Cypher",
    status: "Rascunho",
    papel: "Artista principal",
    descricao: "Registro temporário do teste de campos condicionais.",
    letra: "",
    bpm: "",
    isrc: "",
    iswc: "",
    dataLancamento: "",
    link: "",
  };
  const obraOutroInvalida = await fetch(`${base}/works/new`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...dadosObraTeste,
      tipoOutro: "",
      generoOutro: "",
    }),
  });
  assert.equal(obraOutroInvalida.status, 400);
  assert.match(await obraOutroInvalida.text(), /Especifique o tipo de projeto/);
  const obraOutroCriada = await fetch(`${base}/works/new`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(dadosObraTeste),
  });
  assert.equal(obraOutroCriada.status, 303);
  assert.match(
    obraOutroCriada.headers.get("location") ?? "",
    /resultado=criada.*genero=analise/
  );
  const bancoObraOutro = new Database(arquivoBanco);
  const obraSalva = bancoObraOutro
    .prepare(
      `SELECT id, tipo, tipo_detalhe, genero, genero_detalhe
       FROM obras WHERE proprietario_id = ? AND titulo = ?`
    )
    .get(adminId, dadosObraTeste.titulo);
  assert.deepEqual(
    {
      tipo: obraSalva.tipo,
      tipoDetalhe: obraSalva.tipo_detalhe,
      genero: obraSalva.genero,
      generoDetalhe: obraSalva.genero_detalhe,
    },
    {
      tipo: "Outro",
      tipoDetalhe: dadosObraTeste.tipoOutro,
      genero: "Outro",
      generoDetalhe: dadosObraTeste.generoOutro,
    }
  );
  assert.equal(
    bancoObraOutro
      .prepare(
        "SELECT COUNT(*) AS total FROM propostas_generos WHERE usuario_id = ? AND genero = ? AND status = 'pendente'"
      )
      .get(adminId, dadosObraTeste.generoOutro).total,
    1
  );
  bancoObraOutro.close();

  const dadosPapelOutro = {
    titulo: "Obra com crédito especializado",
    tipo: "Música",
    genero: "Rap",
    status: "Lançado",
    papel: "Outro crédito",
    papelOutro: "",
    descricao: "Registro para testar a especificação do papel Outro crédito.",
    letra: "",
    bpm: "",
    isrc: "",
    iswc: "",
    dataLancamento: "2026-10-29",
    link: "",
  };
  const papelOutroSemDetalhe = await fetch(`${base}/works/new`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(dadosPapelOutro),
  });
  assert.equal(papelOutroSemDetalhe.status, 400);
  assert.match(
    await papelOutroSemDetalhe.text(),
    /Especifique seu crédito em 2 a 80 caracteres/
  );
  dadosPapelOutro.papelOutro = "Direção de arte e visualizers";
  const criarPapelOutro = await fetch(`${base}/works/new`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(dadosPapelOutro),
  });
  assert.equal(criarPapelOutro.status, 303);
  const bancoPapelOutro = new Database(arquivoBanco);
  const obraPapelOutro = bancoPapelOutro
    .prepare(
      "SELECT id, funcao_principal, funcao_detalhe FROM obras WHERE proprietario_id = ? AND titulo = ?"
    )
    .get(adminId, dadosPapelOutro.titulo);
  assert.equal(obraPapelOutro.funcao_principal, "Outro crédito");
  assert.equal(obraPapelOutro.funcao_detalhe, dadosPapelOutro.papelOutro);
  const edicaoPapelOutro = await fetch(
    `${base}/works/${encodeURIComponent(obraPapelOutro.id)}/edit`,
    { headers: { cookie } }
  );
  assert.equal(edicaoPapelOutro.status, 200);
  assert.match(
    await edicaoPapelOutro.text(),
    /name="papelOutro"[^>]*value="Direção de arte e visualizers"[^>]*required/
  );
  bancoPapelOutro
    .prepare("UPDATE obras SET funcao_detalhe = '' WHERE id = ?")
    .run(obraPapelOutro.id);
  bancoPapelOutro.close();
  const edicaoPapelOutroLegado = await fetch(
    `${base}/works/${encodeURIComponent(obraPapelOutro.id)}/edit`,
    { headers: { cookie } }
  );
  const edicaoPapelOutroLegadoHtml = await edicaoPapelOutroLegado.text();
  assert.equal(edicaoPapelOutroLegado.status, 200);
  const campoPapelOutroLegado = edicaoPapelOutroLegadoHtml.match(
    /<input name="papelOutro"[^>]*>/
  )?.[0];
  assert.ok(campoPapelOutroLegado);
  assert.doesNotMatch(campoPapelOutroLegado, /required/);
  const salvarPapelOutroLegado = await fetch(
    `${base}/works/${encodeURIComponent(obraPapelOutro.id)}/edit`,
    {
      method: "POST",
      redirect: "manual",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...dadosPapelOutro, papelOutro: "" }),
    }
  );
  assert.equal(salvarPapelOutroLegado.status, 303);
  const restaurarDetalhePapelOutro = new Database(arquivoBanco);
  restaurarDetalhePapelOutro
    .prepare("UPDATE obras SET funcao_detalhe = ? WHERE id = ?")
    .run(dadosPapelOutro.papelOutro, obraPapelOutro.id);
  restaurarDetalhePapelOutro.close();

  const catalogoObra = await fetch(
    `${base}/espaco-de-trabalho?resultado=criada&genero=analise`,
    { headers: { cookie } }
  );
  const catalogoObraHtml = await catalogoObra.text();
  assert.equal(catalogoObra.status, 200);
  assert.match(
    catalogoObraHtml,
    /Coletivo audiovisual independente/
  );
  assert.match(catalogoObraHtml, /Gênero autoral Cypher/);
  const fichaPapel = await fetch(`${base}/espaco-de-trabalho/obra/${obraPapelOutro.id}`, {headers:{cookie}});
  assert.match(
    await fichaPapel.text(),
    /Outro crédito · Direção de arte e visualizers/
  );
  assert.match(catalogoObraHtml, /enviada para análise/);
  const formularioEdicaoObra = await fetch(
    `${base}/works/${encodeURIComponent(obraSalva.id)}/edit`,
    { headers: { cookie } }
  );
  const formularioEdicaoObraHtml = await formularioEdicaoObra.text();
  assert.equal(formularioEdicaoObra.status, 200);
  assert.match(
    formularioEdicaoObraHtml,
    /name="tipoOutro"[^>]*value="Coletivo audiovisual independente"/
  );
  assert.match(
    formularioEdicaoObraHtml,
    /name="generoOutro"[^>]*value="Gênero autoral Cypher"/
  );
  const configuracoesResponse = await fetch(`${base}/settings`, {
    headers: { cookie },
  });
  assert.equal(configuracoesResponse.status, 200);
  const configuracoesHtml = await configuracoesResponse.text();
  assert.match(configuracoesHtml, /id="privacidade"/);
  assert.match(configuracoesHtml, /Salvar visibilidade/);
  assert.doesNotMatch(configuracoesHtml, /name="retorno" value="perfil"/);

  const bancoEdicao = new Database(arquivoBanco);
  const perfilAntes = bancoEdicao
    .prepare(
      `SELECT nome, cidade, biografia, contato, disponibilidade,
              generos_json, categorias_json, equipamentos_json
       FROM perfis WHERE usuario_id = ?`
    )
    .get(adminId);
  const snapshotAntes = bancoEdicao
    .prepare(
      `SELECT categoria, respostas_json, visibilidades_json
       FROM respostas_atuacao_categoria WHERE usuario_id = ?`
    )
    .all(adminId);
  bancoEdicao.close();

  const salvarPessoal = await fetch(`${base}/profile/secoes/pessoal`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      nome: "Admin UI Revisado",
      cidade: "Belém, PA",
      biografia: "Biografia editada na seção pessoal.",
      categorias: "Beatmaker",
    }),
  });
  assert.equal(salvarPessoal.status, 303);
  assert.match(salvarPessoal.headers.get("location") ?? "", /secao=pessoal/);

  const bancoAposPessoal = new Database(arquivoBanco);
  const perfilAposPessoal = bancoAposPessoal
    .prepare(
      `SELECT nome, cidade, biografia, contato, disponibilidade,
              generos_json, categorias_json, equipamentos_json
       FROM perfis WHERE usuario_id = ?`
    )
    .get(adminId);
  const snapshotAposPessoal = bancoAposPessoal
    .prepare(
      `SELECT categoria, respostas_json, visibilidades_json
       FROM respostas_atuacao_categoria WHERE usuario_id = ?`
    )
    .all(adminId);
  bancoAposPessoal.close();
  assert.equal(perfilAposPessoal.nome, "Admin UI Revisado");
  assert.equal(perfilAposPessoal.cidade, "Belém, PA");
  assert.equal(
    perfilAposPessoal.biografia,
    "Biografia editada na seção pessoal."
  );
  assert.equal(perfilAposPessoal.contato, perfilAntes.contato);
  assert.equal(perfilAposPessoal.disponibilidade, perfilAntes.disponibilidade);
  assert.equal(perfilAposPessoal.generos_json, perfilAntes.generos_json);
  assert.equal(perfilAposPessoal.categorias_json, perfilAntes.categorias_json);
  assert.equal(
    perfilAposPessoal.equipamentos_json,
    perfilAntes.equipamentos_json
  );
  assert.deepEqual(snapshotAposPessoal, snapshotAntes);

  const respostasOriginais = Object.fromEntries(
    snapshotAntes.map(item => [item.categoria, JSON.parse(item.respostas_json)])
  );
  const visibilidadesOriginais = Object.fromEntries(
    snapshotAntes.map(item => [
      item.categoria,
      JSON.parse(item.visibilidades_json),
    ])
  );
  const salvarProfissional = await fetch(
    `${base}/profile/secoes/profissional`,
    {
      method: "POST",
      redirect: "manual",
      headers: {
        cookie,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        categorias: "Rapper",
        disponibilidade: "",
        equipamentos: "Microfone\nInterface de áudio",
        respostasAtuacoesJson: JSON.stringify(respostasOriginais),
        visibilidadesAtuacoesJson: JSON.stringify(visibilidadesOriginais),
      }),
    }
  );
  assert.equal(salvarProfissional.status, 303);
  assert.match(
    salvarProfissional.headers.get("location") ?? "",
    /secao=profissional/
  );
  const objetivoOutroSemDetalhe = await fetch(
    `${base}/profile/secoes/profissional`,
    {
      method: "POST",
      redirect: "manual",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        categorias: "Rapper",
        disponibilidade: "",
        equipamentos: "Microfone\nInterface de áudio",
        respostasAtuacoesJson: JSON.stringify({
          Rapper: {
            tempoAtuacao: "1-3a",
            etapaProjetos: "em-desenvolvimento",
            participacaoColetiva: "em-colaboracao",
            campoDeOutraProfissao: "não permitido",
          },
        }),
        visibilidadesAtuacoesJson: JSON.stringify({}),
      }),
    }
  );
  assert.equal(objetivoOutroSemDetalhe.status, 400);
  const bancoAposProfissional = new Database(arquivoBanco);
  const perfilAposProfissional = bancoAposProfissional
    .prepare(
      `SELECT nome, cidade, biografia, categorias_json, equipamentos_json
       FROM perfis WHERE usuario_id = ?`
    )
    .get(adminId);
  assert.equal(perfilAposProfissional.nome, "Admin UI Revisado");
  assert.equal(perfilAposProfissional.cidade, "Belém, PA");
  assert.equal(
    perfilAposProfissional.biografia,
    "Biografia editada na seção pessoal."
  );
  assert.deepEqual(JSON.parse(perfilAposProfissional.categorias_json), [
    "Rapper",
  ]);
  assert.deepEqual(JSON.parse(perfilAposProfissional.equipamentos_json), [
    "Microfone",
    "Interface de áudio",
  ]);
  bancoAposProfissional.close();

  const salvarContato = await fetch(`${base}/profile/secoes/contato`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ contato: "contato.profissional@example.test" }),
  });
  assert.equal(salvarContato.status, 303);
  assert.match(
    salvarContato.headers.get("location") ?? "",
    /secao=privacidade/
  );
  const salvarPrivacidade = await fetch(`${base}/settings/privacy`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      retorno: "perfil",
      perfilPublico: "on",
      localizacaoPublica: "on",
      contatoPublico: "on",
    }),
  });
  assert.equal(salvarPrivacidade.status, 303);
  assert.match(
    salvarPrivacidade.headers.get("location") ?? "",
    /profile\?editar=1&secao=privacidade&privacidade=salva/
  );
  const bancoAposPrivacidade = new Database(arquivoBanco);
  const perfilAposPrivacidade = bancoAposPrivacidade
    .prepare(
      `SELECT nome, biografia, contato, categorias_json, equipamentos_json,
              perfil_publico, localizacao_publica, contato_publico
       FROM perfis WHERE usuario_id = ?`
    )
    .get(adminId);
  const snapshotAposPrivacidade = bancoAposPrivacidade
    .prepare(
      `SELECT categoria, respostas_json, visibilidades_json
       FROM respostas_atuacao_categoria WHERE usuario_id = ?`
    )
    .all(adminId);
  bancoAposPrivacidade.close();
  assert.equal(perfilAposPrivacidade.nome, "Admin UI Revisado");
  assert.equal(
    perfilAposPrivacidade.biografia,
    "Biografia editada na seção pessoal."
  );
  assert.equal(
    perfilAposPrivacidade.contato,
    "contato.profissional@example.test"
  );
  assert.deepEqual(JSON.parse(perfilAposPrivacidade.categorias_json), [
    "Rapper",
  ]);
  assert.deepEqual(JSON.parse(perfilAposPrivacidade.equipamentos_json), [
    "Microfone",
    "Interface de áudio",
  ]);
  assert.equal(perfilAposPrivacidade.perfil_publico, 1);
  assert.equal(perfilAposPrivacidade.localizacao_publica, 1);
  assert.equal(perfilAposPrivacidade.contato_publico, 1);
  assert.deepEqual(snapshotAposPrivacidade, snapshotAntes);
  const perfilPrivacidadeSalva = await fetch(
    `${base}/profile?editar=1&secao=privacidade&privacidade=salva`,
    { headers: { cookie } }
  );
  const perfilPrivacidadeHtml = await perfilPrivacidadeSalva.text();
  assert.equal(perfilPrivacidadeSalva.status, 200);
  assert.match(
    perfilPrivacidadeHtml,
    /Preferências de visibilidade atualizadas/
  );
  assert.match(perfilPrivacidadeHtml, /name="retorno" value="perfil"/);

  const generoPerfilOutro = await fetch(`${base}/profile/secoes/profissional`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      categorias: "Rapper",
      disponibilidade: "",
      equipamentos: "Microfone\nInterface de áudio",
      generos: "Outro",
      outroGenero: "Gênero de ensaio Cypher",
      respostasAtuacoesJson: JSON.stringify(respostasOriginais),
      visibilidadesAtuacoesJson: JSON.stringify(visibilidadesOriginais),
    }),
  });
  assert.equal(generoPerfilOutro.status, 303);
  assert.match(
    generoPerfilOutro.headers.get("location") ?? "",
    /secao=profissional.*genero=analise/
  );
  const bancoGeneroPerfil = new Database(arquivoBanco);
  assert.equal(
    bancoGeneroPerfil
      .prepare(
        "SELECT status FROM propostas_generos WHERE usuario_id = ? AND genero = ?"
      )
      .get(adminId, "Gênero de ensaio Cypher").status,
    "pendente"
  );
  bancoGeneroPerfil.close();

  const analisesResponse = await fetch(`${base}/admin/revisao`, {
    headers: { cookie },
  });
  assert.equal(analisesResponse.status, 200);
  const analises = await analisesResponse.text();
  assert.match(analises, /Análises/);
  assert.match(analises, /Gêneros sugeridos/);
  assert.doesNotMatch(analises, /admin-exception-search/);
  assert.doesNotMatch(analises, /href="#/);

  const excecoesResponse = await fetch(`${base}/admin/revisao/excecoes`, {
    headers: { cookie },
  });
  assert.equal(excecoesResponse.status, 200);
  const excecoes = await excecoesResponse.text();
  assert.match(excecoes, /Exceções ao prazo/);
  assert.match(excecoes, /admin-exception-search/);
  assert.doesNotMatch(excecoes, /Gêneros sugeridos/);
  assert.doesNotMatch(excecoes, /href="#/);
  assert.match(excecoes, /7\s*de\s*10\s*contas exibidas/);
  const linhasIniciais = excecoes.match(/class="admin-account-row"/g) ?? [];
  assert.equal(
    linhasIniciais.length,
    7,
    "A página inicial deve renderizar somente sete contas"
  );
  assert.match(excecoes, /data-initial-limit="7"/);
  assert.match(excecoes, /Mostrar todas as\s*10\s*contas/);
  assert.match(excecoes, /href="\/admin\/revisao\/excecoes" class="active"/);

  const expandidasResponse = await fetch(
    `${base}/admin/revisao/excecoes/busca?todos=1`,
    { headers: { cookie, accept: "application/json" } }
  );
  assert.equal(expandidasResponse.status, 200);
  const expandidas = await expandidasResponse.json();
  assert.equal(expandidas.total, 10);
  assert.equal(expandidas.perfis.length, 10);

  const buscaResponse = await fetch(
    `${base}/admin/revisao/excecoes/busca?q=${encodeURIComponent("Pessoa Teste 9")}`,
    { headers: { cookie, accept: "application/json" } }
  );
  assert.equal(buscaResponse.status, 200);
  const busca = await buscaResponse.json();
  assert.equal(busca.total, 1);
  assert.equal(busca.perfis[0].nome, "Pessoa Teste 9");

  const tokenComum = randomBytes(32).toString("base64url");
  const bancoSessao = new Database(arquivoBanco);
  bancoSessao
    .prepare(
      "INSERT INTO sessoes (token_hash, usuario_id, expira_em, criada_em) VALUES (?, ?, ?, ?)"
    )
    .run(
      createHash("sha256").update(tokenComum).digest("hex"),
      "admin-ui-fixture-1",
      Date.now() + 60_000,
      Date.now()
    );
  bancoSessao.close();
  const tokenSegundoUsuario = randomBytes(32).toString("base64url");
  const bancoSegundaSessao = new Database(arquivoBanco);
  bancoSegundaSessao
    .prepare(
      "INSERT INTO sessoes (token_hash, usuario_id, expira_em, criada_em) VALUES (?, ?, ?, ?)"
    )
    .run(
      createHash("sha256").update(tokenSegundoUsuario).digest("hex"),
      "admin-ui-fixture-2",
      Date.now() + 60_000,
      Date.now()
    );
  bancoSegundaSessao.close();

  const motivoInvalido = await fetch(
    `${base}/profile/categorias/solicitar-excecao`,
    {
      method: "POST",
      redirect: "manual",
      headers: {
        cookie: `cypher_session=${tokenSegundoUsuario}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ categorias: "Rapper", motivoCodigo: "" }),
    }
  );
  assert.equal(motivoInvalido.status, 400);
  assert.match(await motivoInvalido.text(), /Selecione um motivo/);

  const motivoOutroCurto = await fetch(
    `${base}/profile/categorias/solicitar-excecao`,
    {
      method: "POST",
      redirect: "manual",
      headers: {
        cookie: `cypher_session=${tokenSegundoUsuario}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        categorias: "Rapper",
        motivoCodigo: "outro",
        motivoOutro: "curto",
      }),
    }
  );
  assert.equal(motivoOutroCurto.status, 400);
  const motivoOutroHtml = await motivoOutroCurto.text();
  assert.match(motivoOutroHtml, /option value="outro" selected/);
  assert.match(motivoOutroHtml, /name="motivoOutro"[^>]*required/);
  assert.match(motivoOutroHtml, />curto<\/textarea>/);

  for (const token of [tokenComum, tokenSegundoUsuario]) {
    const solicitacao = await fetch(
      `${base}/profile/categorias/solicitar-excecao`,
      {
        method: "POST",
        redirect: "manual",
        headers: {
          cookie: `cypher_session=${token}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          categorias: "Rapper",
          motivoCodigo: "novos_trabalhos",
          respostasAtuacoesJson: JSON.stringify({
            Rapper: {
              tempoAtuacao: "1-3a",
              etapaProjetos: "em-desenvolvimento",
              participacaoColetiva: "em-colaboracao",
              atividadePratica: "pratica-inicial",
            },
          }),
          visibilidadesAtuacoesJson: JSON.stringify({}),
        }),
      }
    );
    assert.equal(solicitacao.status, 303);
    assert.match(
      solicitacao.headers.get("location") ?? "",
      /profile\?editar=1/
    );
  }

  const perfilPendente = await fetch(
    `${base}/profile?editar=1&secao=profissional`,
    {
      headers: { cookie: `cypher_session=${tokenComum}` },
    }
  );
  assert.equal(perfilPendente.status, 200);
  const perfilPendenteHtml = await perfilPendente.text();
  assert.match(perfilPendenteHtml, /data-profile-editor/);
  assert.match(perfilPendenteHtml, /data-profile-edit-tab="profissional"/);
  assert.match(perfilPendenteHtml, /data-profile-edit-panel="profissional"/);
  assert.doesNotMatch(perfilPendenteHtml, /class="profile-layout"/);
  assert.match(
    perfilPendenteHtml,
    /Sua solicitação foi enviada e aguarda análise/
  );
  assert.doesNotMatch(perfilPendenteHtml, /profile-exception-request-form/);

  const perfilProprio = await fetch(`${base}/profile?aba=atuacao&atuacao=Rapper`, {
    headers: { cookie: `cypher_session=${tokenComum}` },
  });
  assert.equal(perfilProprio.status, 200);
  const perfilProprioHtml = await perfilProprio.text();
  assert.match(perfilProprioHtml, /class="pf-experience"/);
  assert.match(perfilProprioHtml, /<details open><summary>Rapper/);
  assert.match(perfilProprioHtml, /Editar atuação profissional/);

  const perfilPublico = await fetch(
    `${base}/p/${identificadorPublico.replace(/^@/, "")}`,
    { headers: { cookie: `cypher_session=${tokenSegundoUsuario}` } }
  );
  assert.equal(perfilPublico.status, 200);
  const perfilPublicoHtml = await perfilPublico.text();
  assert.match(perfilPublicoHtml, /aria-labelledby="artista-nome"/);
  assert.match(perfilPublicoHtml, /aria-label="Seções do perfil"/);
  assert.match(perfilPublicoHtml, /aba=atuacao/);
  assert.doesNotMatch(perfilPublicoHtml, /Editar atuação profissional|Organizar portfólio/);

  const bancoPedidos = new Database(arquivoBanco);
  const pedido1 = bancoPedidos
    .prepare(
      "SELECT id FROM solicitacoes_excecao_categorias WHERE usuario_id = ? AND status = 'pendente'"
    )
    .get("admin-ui-fixture-1").id;
  const pedido2 = bancoPedidos
    .prepare(
      "SELECT id FROM solicitacoes_excecao_categorias WHERE usuario_id = ? AND status = 'pendente'"
    )
    .get("admin-ui-fixture-2").id;
  bancoPedidos.close();

  const pedidosResponse = await fetch(`${base}/admin/revisao/excecoes`, {
    headers: { cookie },
  });
  assert.equal(pedidosResponse.status, 200);
  const pedidosHtml = await pedidosResponse.text();
  assert.match(pedidosHtml, /Solicitações de exceção/);
  assert.match(pedidosHtml, /Aguardando análise da equipe/);
  assert.match(pedidosHtml, /Motivo informado:/);
  assert.match(pedidosHtml, /Recusar solicitação/);
  assert.match(pedidosHtml, /Aprovar e liberar/);
  assert.match(pedidosHtml, /data-exception-request=/);

  const solicitarEsclarecimento = await fetch(
    `${base}/admin/revisao/solicitacoes-excecao/${pedido1}/esclarecimento`,
    {
      method: "POST",
      redirect: "manual",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        mensagem: "Pode detalhar a mudança profissional recente?",
      }),
    }
  );
  assert.equal(solicitarEsclarecimento.status, 303);
  const pedidoAguardandoResposta = await fetch(
    `${base}/admin/revisao/excecoes`,
    { headers: { cookie } }
  );
  const pedidoAguardandoRespostaHtml = await pedidoAguardandoResposta.text();
  assert.match(
    pedidoAguardandoRespostaHtml,
    /Aguardando resposta do profissional/
  );
  assert.match(
    pedidoAguardandoRespostaHtml,
    /A decisão fica pausada até o profissional responder/
  );
  const decisaoPrematura = await fetch(
    `${base}/admin/revisao/solicitacoes-excecao/${pedido1}`,
    {
      method: "POST",
      redirect: "manual",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        acao: "aprovar",
        motivo: "Tentativa anterior ao retorno do solicitante.",
      }),
    }
  );
  assert.equal(decisaoPrematura.status, 303);
  assert.match(
    decisaoPrematura.headers.get("location") ?? "",
    /erro=aguarda_resposta/
  );
  const respostaProfissional = await fetch(
    `${base}/profile/categorias/solicitacoes/${pedido1}/responder`,
    {
      method: "POST",
      redirect: "manual",
      headers: {
        cookie: `cypher_session=${tokenComum}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mensagem: "A mudança é necessária por causa de novos trabalhos.",
      }),
    }
  );
  assert.equal(respostaProfissional.status, 303);
  const pedidoDeVoltaAnalise = await fetch(`${base}/admin/revisao/excecoes`, {
    headers: { cookie },
  });
  assert.match(
    await pedidoDeVoltaAnalise.text(),
    /Aguardando análise da equipe/
  );

  const recusaNaoAdmin = await fetch(
    `${base}/admin/revisao/solicitacoes-excecao/${pedido1}`,
    {
      method: "POST",
      redirect: "manual",
      headers: {
        cookie: `cypher_session=${tokenComum}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        acao: "rejeitar",
        motivo: "Justificativa de teste.",
      }),
    }
  );
  assert.equal(recusaNaoAdmin.status, 403);

  const aprovarPedido = await fetch(
    `${base}/admin/revisao/solicitacoes-excecao/${pedido1}`,
    {
      method: "POST",
      redirect: "manual",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        acao: "aprovar",
        motivo: "Mudança profissional verificada pela equipe.",
      }),
    }
  );
  assert.equal(aprovarPedido.status, 303);
  assert.match(
    aprovarPedido.headers.get("location") ?? "",
    /solicitacoes=decididas.*solicitacao_excecao_aprovada/
  );

  const recusarPedido = await fetch(
    `${base}/admin/revisao/solicitacoes-excecao/${pedido2}`,
    {
      method: "POST",
      redirect: "manual",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        acao: "rejeitar",
        motivo: "O motivo apresentado não indica necessidade imediata.",
      }),
    }
  );
  assert.equal(recusarPedido.status, 303);
  assert.match(
    recusarPedido.headers.get("location") ?? "",
    /solicitacoes=decididas.*solicitacao_excecao_rejeitada/
  );

  const filaExcecoesAtualizada = await fetch(`${base}/admin/revisao/excecoes`, {
    headers: { cookie },
  });
  const filaExcecoesHtml = await filaExcecoesAtualizada.text();
  assert.equal(filaExcecoesAtualizada.status, 200);
  assert.doesNotMatch(
    filaExcecoesHtml,
    new RegExp(`data-exception-request="${pedido1}"`)
  );
  assert.doesNotMatch(
    filaExcecoesHtml,
    new RegExp(`data-exception-request="${pedido2}"`)
  );
  assert.match(filaExcecoesHtml, /Decididos/);

  const historicoExcecoesResponse = await fetch(
    `${base}/admin/revisao/excecoes?solicitacoes=decididas`,
    { headers: { cookie } }
  );
  const historicoExcecoesHtml = await historicoExcecoesResponse.text();
  assert.equal(historicoExcecoesResponse.status, 200);
  assert.match(historicoExcecoesHtml, /Aprovada/);
  assert.match(historicoExcecoesHtml, /Recusada/);
  assert.match(historicoExcecoesHtml, /Filtrar por decisão/);
  assert.match(historicoExcecoesHtml, /data-admin-decision-filter="todas"/);
  assert.match(historicoExcecoesHtml, /data-admin-decision-filter="aprovado"/);
  assert.match(historicoExcecoesHtml, /data-admin-decision-filter="rejeitado"/);
  assert.match(historicoExcecoesHtml, /data-admin-decision-empty hidden/);
  assert.match(
    historicoExcecoesHtml,
    /Mudança profissional verificada pela equipe\./
  );
  assert.match(
    historicoExcecoesHtml,
    /O motivo apresentado não indica necessidade imediata\./
  );
  assert.match(
    historicoExcecoesHtml,
    new RegExp(
      `data-exception-decision="aprovado"[^>]*data-exception-request="${pedido1}"`
    )
  );
  assert.match(
    historicoExcecoesHtml,
    new RegExp(
      `data-exception-decision="rejeitado"[^>]*data-exception-request="${pedido2}"`
    )
  );

  const bancoDecisoes = new Database(arquivoBanco);
  assert.equal(
    bancoDecisoes
      .prepare(
        "SELECT status FROM solicitacoes_excecao_categorias WHERE id = ?"
      )
      .get(pedido1).status,
    "aprovado"
  );
  assert.ok(
    bancoDecisoes
      .prepare(
        "SELECT usada_em FROM excecoes_categorias WHERE usuario_id = ? AND usada_em IS NOT NULL"
      )
      .get("admin-ui-fixture-1")
  );
  assert.deepEqual(
    JSON.parse(
      bancoDecisoes
        .prepare("SELECT categorias_json FROM perfis WHERE usuario_id = ?")
        .get("admin-ui-fixture-1").categorias_json
    ),
    ["Rapper"]
  );
  assert.equal(
    bancoDecisoes
      .prepare(
        "SELECT status, motivo_revisao FROM solicitacoes_excecao_categorias WHERE id = ?"
      )
      .get(pedido2).status,
    "rejeitado"
  );
  assert.equal(
    bancoDecisoes
      .prepare(
        "SELECT COUNT(*) AS total FROM excecoes_categorias WHERE usuario_id = ?"
      )
      .get("admin-ui-fixture-2").total,
    0
  );
  bancoDecisoes.close();

  const perfilAprovado = await fetch(`${base}/profile?editar=1`, {
    headers: { cookie: `cypher_session=${tokenComum}` },
  });
  assert.equal(perfilAprovado.status, 200);
  const perfilRecusado = await fetch(`${base}/profile?editar=1`, {
    headers: { cookie: `cypher_session=${tokenSegundoUsuario}` },
  });
  const perfilRecusadoHtml = await perfilRecusado.text();
  assert.match(perfilRecusadoHtml, /Solicitação anterior recusada/);
  assert.match(
    perfilRecusadoHtml,
    /O motivo apresentado não indica necessidade imediata/
  );
  assert.match(perfilRecusadoHtml, /profile-exception-request-form/);

  const buscaNaoAdmin = await fetch(
    `${base}/admin/revisao/excecoes/busca?todos=1`,
    { headers: { cookie: `cypher_session=${tokenComum}` } }
  );
  assert.equal(buscaNaoAdmin.status, 403);

  const bancoOrganizador = new Database(arquivoBanco);
  bancoOrganizador
    .prepare(
      "UPDATE perfis SET categorias_json = ?, funcao = ? WHERE usuario_id = ?"
    )
    .run(
      JSON.stringify(["Organizador(a) de eventos"]),
      "Organizador(a) de eventos",
      adminId
    );
  bancoOrganizador.prepare("UPDATE profissoes_usuario SET estado='inativa' WHERE usuario_id=?").run(adminId);
  bancoOrganizador.prepare("INSERT INTO profissoes_usuario(id,usuario_id,profissao_id,valor_original) VALUES(?,?,?,?)").run("atuacao-organizador-ui",adminId,"organizador-eventos","Organizador(a) de eventos");
  bancoOrganizador.close();
  const formularioEventoResponse = await fetch(`${base}/events/new`, {
    headers: { cookie },
  });
  assert.equal(formularioEventoResponse.status, 200);
  const formularioEventoHtml = await formularioEventoResponse.text();
  assert.match(formularioEventoHtml, /data-event-category-other-field hidden/);
  assert.match(formularioEventoHtml, /name="categoriaDetalhe"/);
  const dadosEventoTeste = {
    titulo: "Encontro de DJs independentes de teste",
    categoria: "Outro",
    categoriaDetalhe: "",
    data: "2026-03-12",
    horario: "18h",
    local: "Centro Cultural Cypher de teste",
    organizador: "Equipe de teste Cypher",
    situacao: "Inscrições abertas",
    cor: "yellow",
    descricao: "Evento temporário de teste de categoria Outro.",
    formato: "Presencial e aberto à comunidade",
    inscricao: "",
    premio: "",
    etiquetas: "Teste, Música",
    tipoParticipacao: "aberta",
  };
  const eventoOutroInvalido = await fetch(`${base}/events/new`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(dadosEventoTeste),
  });
  assert.equal(eventoOutroInvalido.status, 400);
  assert.match(
    await eventoOutroInvalido.text(),
    /Especifique a categoria do evento/
  );
  dadosEventoTeste.categoriaDetalhe = "Encontro de DJs independentes";
  dadosEventoTeste.temaCartao = "cartaz-de-rua";
  const eventoOutroCriado = await fetch(`${base}/events/new`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(dadosEventoTeste),
  });
  assert.equal(eventoOutroCriado.status, 302);
  assert.match(
    eventoOutroCriado.headers.get("location") ?? "",
    /\/events\?mensagem=/
  );
  const bancoEvento = new Database(arquivoBanco);
  const eventoSalvo = bancoEvento
    .prepare(
      "SELECT id, categoria, categoria_detalhe, tema_cartao FROM eventos WHERE proprietario_id = ? AND titulo = ?"
    )
    .get(adminId, dadosEventoTeste.titulo);
  assert.equal(eventoSalvo.categoria, "Outro");
  assert.equal(eventoSalvo.tema_cartao, "cartaz-de-rua");
  assert.equal(
    eventoSalvo.categoria_detalhe,
    dadosEventoTeste.categoriaDetalhe
  );
  bancoEvento.close();
  const oportunidades = await fetch(`${base}/events`, { headers: { cookie } });
  const oportunidadesHtml = await oportunidades.text();
  assert.equal(oportunidades.status, 200);
  assert.match(oportunidadesHtml, /data-event-theme="cartaz-de-rua"/);
  assert.match(
    oportunidadesHtml,
    /data-detail-category-detail="Encontro de DJs independentes"/
  );
  assert.match(
    oportunidadesHtml,
    /data-detail-title="Encontro de DJs independentes de teste"[\s\S]*?<time class="dc-event-date" datetime="\d{4}-03-12"[^>]*>\s*<span aria-hidden="true">MAR<\/span>\s*<strong aria-hidden="true">12<\/strong>/
  );
  assert.match(oportunidadesHtml, /Outro · Encontro de DJs independentes/);
  const formularioEdicaoEvento = await fetch(
    `${base}/events/${encodeURIComponent(eventoSalvo.id)}/edit`,
    { headers: { cookie } }
  );
  const formularioEdicaoEventoHtml = await formularioEdicaoEvento.text();
  assert.equal(formularioEdicaoEvento.status, 200);
  assert.match(formularioEdicaoEventoHtml, /name="temaCartao" value="cartaz-de-rua" checked/);
  assert.match(
    formularioEdicaoEventoHtml,
    /name="categoriaDetalhe"[^>]*value="Encontro de DJs independentes"[^>]*required/
  );
  const categoriaOutroVazia = await fetch(
    `${base}/events/${encodeURIComponent(eventoSalvo.id)}/edit`,
    {
      method: "POST",
      redirect: "manual",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...dadosEventoTeste, categoriaDetalhe: "" }),
    }
  );
  assert.equal(categoriaOutroVazia.status, 400);
  assert.match(
    await categoriaOutroVazia.text(),
    /Especifique a categoria do evento/
  );

  const bancoEventoLegado = new Database(arquivoBanco);
  bancoEventoLegado
    .prepare("UPDATE eventos SET categoria_detalhe = '' WHERE id = ?")
    .run(eventoSalvo.id);
  bancoEventoLegado.close();
  const formularioEventoLegado = await fetch(
    `${base}/events/${encodeURIComponent(eventoSalvo.id)}/edit`,
    { headers: { cookie } }
  );
  const formularioEventoLegadoHtml = await formularioEventoLegado.text();
  const campoEventoLegado = formularioEventoLegadoHtml.match(
    /<input name="categoriaDetalhe"[^>]*>/
  )?.[0];
  assert.ok(campoEventoLegado);
  assert.doesNotMatch(campoEventoLegado, /required/);
  const salvarEventoLegado = await fetch(
    `${base}/events/${encodeURIComponent(eventoSalvo.id)}/edit`,
    {
      method: "POST",
      redirect: "manual",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ...dadosEventoTeste, categoriaDetalhe: "", temaCartao: "classico" }),
    }
  );
  assert.equal(salvarEventoLegado.status, 302);
  const eventoLegadoAtualizado = new Database(arquivoBanco);
  assert.equal(
    eventoLegadoAtualizado.prepare("SELECT tema_cartao FROM eventos WHERE id = ?")
      .get(eventoSalvo.id).tema_cartao,
    "classico"
  );
  assert.equal(
    eventoLegadoAtualizado
      .prepare("SELECT categoria_detalhe FROM eventos WHERE id = ?")
      .get(eventoSalvo.id).categoria_detalhe,
    ""
  );
  eventoLegadoAtualizado.close();

  const bancoPerfilPublico = new Database(arquivoBanco);
  bancoPerfilPublico
    .prepare("UPDATE perfis SET perfil_publico = 1 WHERE usuario_id = ?")
    .run(adminId);
  bancoPerfilPublico
    .prepare(
      "UPDATE obras SET situacao = 'Lançado', publicada = 1, data_lancamento = '2026-10-29' WHERE id = ?"
    )
    .run(obraSalva.id);
  const identificadorPerfilPublico = bancoPerfilPublico
    .prepare("SELECT identificador FROM perfis WHERE usuario_id = ?")
    .get(adminId).identificador;
  bancoPerfilPublico.close();
  const perfilDoTitular = await fetch(`${base}/profile`, {
    headers: { cookie },
  });
  assert.equal(perfilDoTitular.status, 200);
  assert.match(
    await perfilDoTitular.text(),
    /Coletivo audiovisual independente/
  );
  const perfilPublicoOutro = await fetch(
    `${base}/p/${encodeURIComponent(identificadorPerfilPublico.replace(/^@/, ""))}`
  );
  assert.equal(perfilPublicoOutro.status, 200);
  const perfilPublicoOutroHtml = await perfilPublicoOutro.text();
  assert.match(perfilPublicoOutroHtml, /Coletivo audiovisual independente/);
  assert.match(perfilPublicoOutroHtml, /Gênero autoral Cypher/);
  assert.match(perfilPublicoOutroHtml, /Direção de arte e visualizers/);

  console.log(
    "OK: admin e busca; cadastro/profissional; propostas de categoria; dependências Outro; obras e eventos detalhados com moderação; solicitações de exceção e permissões."
  );
} catch (erro) {
  console.error(erro);
  if (logServidor) console.error(logServidor);
  process.exitCode = 1;
} finally {
  processo.kill("SIGTERM");
  await new Promise(resolve => setTimeout(resolve, 250));
  fs.rmSync(diretorio, { recursive: true, force: true });
}

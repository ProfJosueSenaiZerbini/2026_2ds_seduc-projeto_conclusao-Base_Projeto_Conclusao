import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "cypher-fundacao-"));
process.env.CYPHER_DB_PATH = path.join(pasta, "cypher.sqlite");
process.env.NODE_ENV = "test";
const banco = await import("../dist/src/app/models/bancoDados.js");
const admin = await import("../dist/src/app/models/administracao.js");
const auth = await import("../dist/src/app/models/autenticacaoCypher.js");
const regras = await import("../dist/src/app/models/permissoes.js");
const catalogo = await import("../dist/src/app/models/modeloPerfil.js");
try {
  banco.inicializarBancoCypher();
  const db = banco.conexaoInternaCypher();
  assert.equal(catalogo.categoriasGerais.length, 25);
  assert.deepEqual(
    Object.keys(regras.matrizProfissional).sort(),
    [...catalogo.categoriasGerais].sort()
  );
  assert.deepEqual(
    catalogo.listarGruposProfissionais().map(g => g.profissoes.length),
    [8, 3, 3, 3, 3, 3, 2]
  );
  for (const profissao of catalogo.listarProfissoesCatalogo()) {
    const id = `conta-${profissao.id}`;
    banco.criarContaCypher({
      id,
      email: `${id}@example.test`,
      senhaHash: "hash",
      tipoConta: "profissional",
      nome: profissao.rotulo,
      funcao: profissao.rotulo,
      identificador: `@${id}`,
      iniciais: "TE",
      categorias: [profissao.rotulo],
      outraCategoria: "",
    });
    db.prepare("UPDATE usuarios SET email_confirmado_em=CURRENT_TIMESTAMP WHERE id=?").run(id);
    for (const tipo of [
      "Obra",
      "Música",
      "Single",
      "EP",
      "Álbum",
      "Mixtape",
      "Instrumental",
      "Outro",
    ]) {
      const esperado =
        regras.matrizProfissional[profissao.rotulo].obras.includes(tipo);
      assert.equal(
        regras.podePublicar(
          { tipoConta: "profissional", categories: [profissao.rotulo] },
          "obra",
          tipo
        ),
        esperado,
        `${profissao.rotulo}: ${tipo}`
      );
      if (!esperado)
        assert.throws(
          () => banco.criarObraCypher(id, { type: tipo }, []),
          /PUBLICACAO_NAO_PERMITIDA/
        );
    }
    if (!["beatmaker", "produtor"].includes(profissao.id))
      assert.throws(
        () => banco.criarBeatCypher(id, {}),
        /PUBLICACAO_NAO_PERMITIDA/
      );
    if (profissao.id !== "organizador-eventos")
      assert.throws(
        () => banco.criarEventoCypher(id, {}),
        /PUBLICACAO_NAO_PERMITIDA/
      );
    assert.equal(
      banco.listarProfissoesUsuarioCypher(id)[0].profissaoId,
      profissao.id
    );
  }
  for (const categoria of [
    "MC",
    "DJ",
    "Mixador(a)",
    "Organizador(a) de eventos",
  ])
    assert.equal(
      regras.podePublicar(
        { tipoConta: "profissional", categories: [categoria] },
        "obra"
      ),
      false
    );
  assert.deepEqual(regras.tiposObraPermitidos(["Compositor(a)"]), ["Obra", "Composição"]);
  assert.deepEqual(regras.tiposObraPermitidos(["Letrista"]), ["Letra"]);
  assert.equal(
    regras.podePublicar(
      { tipoConta: "profissional", categories: ["Letrista", "Beatmaker"] },
      "beat"
    ),
    true
  );
  assert.equal(
    regras.podePublicar(
      { tipoConta: "profissional", categories: ["Letrista", "Beatmaker"] },
      "obra",
      "Música"
    ),
    false
  );
  for (const tipoConta of ["consumidor", "administrativo"])
    for (const modalidade of ["obra", "beat", "evento"])
      assert.equal(
        regras.podePublicar(
          { tipoConta, categories: [...catalogo.categoriasGerais] },
          modalidade
        ),
        false
      );
  banco.criarContaCypher({
    id: "consumidor",
    email: "consumidor@example.test",
    senhaHash: "hash",
    tipoConta: "consumidor",
    nome: "Público",
    funcao: "",
    identificador: "@publico",
    iniciais: "PU",
    categorias: [],
    outraCategoria: "",
  });
  assert.throws(
    () =>
      banco.salvarProfissoesUsuarioCypher("consumidor", [
        { profissaoId: "rapper", valorOriginal: "Rapper", origem: "catalogo" },
      ]),
    /ACAO_PROFISSIONAL/
  );
  assert.throws(() => banco.criarObraCypher("conta-rapper", {
    title:"Obra de teste",type:"Música",typeDetail:"",status:"Rascunho",role:"Artista principal",roleDetail:"",
    description:"",genre:"Rap",genreDetail:"",lyrics:"",bpm:"",isrc:"",iswc:"",releaseDate:"",listenLink:""
  },[{handle:"@publico",name:"Público",role:"Composição",participation:""}]),/CREDITO_PERFIL_NAO_ENCONTRADO/);
  assert.equal(db.prepare("SELECT count(*) AS total FROM obras").get().total,0,"Crédito inválido deve reverter a criação inteira");
  assert.throws(
    () =>
      banco.criarContaCypher({ tipoConta: "administrativo", categorias: [] }),
    /TIPO_CONTA_INVALIDO/
  );
  assert.throws(
    () =>
      banco.criarContaCypher({
        tipoConta: "profissional",
        categorias: ["Muralista"],
      }),
    /CATEGORIA_PROFISSIONAL_INVALIDA/
  );
  assert.throws(
    () =>
      banco.salvarProfissoesUsuarioCypher("conta-rapper", [
        { profissaoId: null, valorOriginal: "Outros", origem: "personalizado" },
      ]),
    /Profissão não pertence/
  );
  const senha = "SenhaForteDaEquipe2026";
  const superId = await admin.criarAdministrador({
    nome: "Equipe Geral",
    email: "super@example.test",
    senha,
    papel: "super_admin",
  });
  assert.equal(
    await auth.autenticarUsuario("super@example.test", senha),
    superId
  );
  assert.equal(
    db
      .prepare("SELECT count(*) AS total FROM perfis WHERE usuario_id=?")
      .get(superId).total,
    0
  );
  assert.notEqual(
    db.prepare("SELECT senha_hash FROM usuarios WHERE id=?").get(superId)
      .senha_hash,
    senha
  );
  await assert.rejects(
    admin.criarAdministrador({
      nome: "Invasor",
      email: "invasor@example.test",
      senha,
      papel: "super_admin",
    }),
    /PROVISIONAMENTO_INICIAL_ENCERRADO/
  );
  const moderador = await admin.criarAdministrador(
    {
      nome: "Moderação",
      email: "moderador@example.test",
      senha,
      papel: "moderador",
    },
    superId
  );
  const editor = await admin.criarAdministrador(
    { nome: "Editor", email: "editor@example.test", senha, papel: "editor" },
    superId
  );
  await assert.rejects(
    admin.criarAdministrador(
      {
        nome: "Invasor",
        email: "invasor@example.test",
        senha,
        papel: "super_admin",
      },
      moderador
    ),
    /ACESSO_ADMINISTRATIVO_NEGADO/
  );
  assert.throws(
    () =>
      banco.revisarPropostaGeneroCypher("qualquer", moderador, true, "Motivo"),
    /ACESSO_ADMINISTRATIVO_NEGADO/
  );
  assert.throws(
    () =>
      banco.concederExcecaoCategoriaCypher(
        "conta-rapper",
        editor,
        "editor@example.test",
        "Motivo"
      ),
    /ACESSO_ADMINISTRATIVO_NEGADO/
  );
  const token = auth.iniciarSessao(moderador);
  assert.equal(auth.usuarioDaSessao(token).papelAdministrativo, "moderador");
  admin.atualizarAdministrador(superId, moderador, "editor", true);
  assert.equal(auth.usuarioDaSessao(token), undefined);
  assert.throws(
    () => admin.atualizarAdministrador(superId, superId, "editor", false),
    /ALTERACAO_ADMINISTRATIVA_INVALIDA/
  );
  assert.equal(banco.obterPerfilPublicoCypher("@super"), undefined);
  assert.equal(
    db.prepare("SELECT count(*) AS total FROM auditoria_administrativa").get()
      .total,
    4
  );
  assert.deepEqual(db.pragma("foreign_key_check"), []);
  console.log(
    "OK: 25 profissões, permissões contextuais, bloqueios nos models, consumidor, administradores sem perfil, RBAC, revogação e auditoria."
  );
} finally {
  banco.fecharBancoCypher();
  assert.equal(path.dirname(path.resolve(pasta)), path.resolve(os.tmpdir()));
  fs.rmSync(pasta, { recursive: true, force: true });
}


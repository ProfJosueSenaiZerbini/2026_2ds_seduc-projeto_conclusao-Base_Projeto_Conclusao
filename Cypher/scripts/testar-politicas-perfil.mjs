import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const diretorio = fs.mkdtempSync(
  path.join(os.tmpdir(), "cypher-profile-policy-")
);
const arquivoBanco = path.join(diretorio, "cypher.sqlite");
const roteiro = `
  import assert from "node:assert/strict";
  import Database from "better-sqlite3";
  import { inicializarAplicacaoCypher } from "./src/app/models/modeloCypher.ts";
  import {
    atualizarPerfilCypher,
    estadoAlteracaoCategoriasCypher,
    concederExcecaoCategoriaCypher,
    solicitarExcecaoCategoriaCypher,
    revisarSolicitacaoExcecaoCategoriaCypher,
    obterEstadoSolicitacaoExcecaoCategoriaCypher,
    listarSolicitacoesExcecaoCategoriaPendentesCypher,
    revisarPropostaGeneroCypher,
    revisarPropostaCategoriaCypher,
    listarCategoriasProfissionaisCypher,
    listarPropostasCategoriasPendentesCypher,
    solicitarCategoriaProfissionalCypher,
    criarContaCypher,
    obterPerfilPublicoCypher,
  } from "./src/app/models/bancoDados.ts";
  import { podeCriarBeat, podeCriarObra, podeCriarEvento } from "./src/app/models/modeloPerfil.ts";
  import { validarRespostasAtuacao } from "./src/app/models/questionarioAtuacao.ts";

  const respostaIncompleta = validarRespostasAtuacao("Rapper", {
    etapaProjetos: "em-desenvolvimento",
  }, true);
  assert.equal(respostaIncompleta.valido, false);
  assert.ok(respostaIncompleta.erros.some(erro => erro.campo === "tempoAtuacao"));
  assert.equal(validarRespostasAtuacao("Rapper", {
    tempoAtuacao: "1-3a",
    etapaProjetos: "em-desenvolvimento",
    participacaoColetiva: "em-colaboracao",
    atividadePratica: "pratica-inicial",
  }, true).valido, true);
  const campoDeOutraProfissao = validarRespostasAtuacao("Rapper", {
    tempoAtuacao: "1-3a",
    etapaProjetos: "em-desenvolvimento",
    participacaoColetiva: "em-colaboracao",
    atividadePratica: "pratica-inicial",
    respostaEspecificaDeOutraProfissao: "não permitido",
  }, true);
  assert.equal(campoDeOutraProfissao.valido, false);
  assert.ok(campoDeOutraProfissao.erros.some(erro => erro.codigo === "campo_desconhecido"));

  inicializarAplicacaoCypher();
  const db = new Database(process.env.CYPHER_DB_PATH);
  const usuario = { id: "usuario-teste-politica", email: "teste-politica@example.test", nome: "Teste Política" };
  const admin = { id: "admin-teste-politica", email: "admin-politica@example.test", nome: "Equipe Cypher" };
  const inserirUsuario = db.prepare("INSERT INTO usuarios (id, email, senha_hash, tipo_conta, demonstracao) VALUES (?, ?, NULL, 'profissional', 0)");
  const inserirPerfil = db.prepare("INSERT INTO perfis (usuario_id, nome, funcao, identificador, iniciais, categorias_json, ultima_alteracao_categorias_em, demonstracao) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)");
  const solicitante = { id: "usuario-solicitante-excecao", email: "solicitante-excecao@example.test", nome: "Solicitante Exceção" };
  for (const conta of [usuario, admin, solicitante]) {
    inserirUsuario.run(conta.id, conta.email);
    inserirPerfil.run(conta.id, conta.nome, "Rapper", "@" + conta.id, "TP", JSON.stringify(["Rapper"]));
  }
  db.exec("UPDATE usuarios SET email_confirmado_em = CURRENT_TIMESTAMP");
  db.prepare("DELETE FROM perfis WHERE usuario_id = ?").run(admin.id);
  db.prepare("UPDATE usuarios SET tipo_conta = 'administrativo' WHERE id = ?").run(admin.id);
  db.prepare("INSERT INTO administradores (usuario_id,nome,papel) VALUES (?,?,'super_admin')").run(admin.id,admin.nome);
  db.prepare("UPDATE perfis SET ultima_alteracao_categorias_em = datetime('now', '-10 days') WHERE usuario_id = ?").run(solicitante.id);
  const inserirAuditoriaAnterior = db.prepare(
    "INSERT INTO auditoria_categorias (id, usuario_id, administrador_id, categorias_antes_json, categorias_depois_json, motivo) VALUES (?, ?, ?, ?, ?, ?)"
  );
  for (const conta of [usuario, solicitante]) {
    inserirAuditoriaAnterior.run(
      "auditoria-anterior-" + conta.id,
      conta.id,
      admin.id,
      JSON.stringify(["Rapper"]),
      JSON.stringify(["Rapper"]),
      "Registro anterior para o cenário de cooldown."
    );
  }

  const dados = (categories, propostaGenero = "") => ({
    id: usuario.id,
    name: usuario.nome,
    role: categories.join(" · "),
    city: "",
    biography: "",
    contact: "",
    availability: "",
    genres: ["Rap"],
    propostaGenero,
    categories,
    otherCategory: "",
    equipment: [],
    initials: "TP",
    tipoConta: "profissional",
  });

  assert.equal(estadoAlteracaoCategoriasCypher(usuario.id).bloqueada, true);
  assert.throws(
    () => atualizarPerfilCypher(dados(["Rapper", "Beatmaker"], "Drill")),
    /CATEGORIAS_BLOQUEADAS/
  );
  assert.equal(
    concederExcecaoCategoriaCypher(usuario.id, admin.id, admin.email, "Justificativa verificada para ajuste excepcional."),
    "concedida"
  );
  assert.equal(estadoAlteracaoCategoriasCypher(usuario.id).excecaoDisponivel, true);
  assert.equal(atualizarPerfilCypher(dados(["Rapper", "Beatmaker"], "Drill")), true);
  assert.equal(estadoAlteracaoCategoriasCypher(usuario.id).bloqueada, true);
  assert.equal(estadoAlteracaoCategoriasCypher(usuario.id).excecaoDisponivel, false);
  assert.throws(() => atualizarPerfilCypher(dados(["Beatmaker"])), /CATEGORIAS_BLOQUEADAS/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM auditoria_categorias WHERE usuario_id = ?").get(usuario.id).n, 2);
  assert.ok(db.prepare("SELECT usada_em FROM excecoes_categorias WHERE usuario_id = ?").get(usuario.id).usada_em);

  assert.equal(solicitarExcecaoCategoriaCypher(solicitante.id, "Preciso atualizar a categoria para refletir uma mudança de função.",), "criada");
  assert.equal(concederExcecaoCategoriaCypher(solicitante.id, admin.id, admin.email, "Concessão direta com pedido em aberto."), "solicitacao_pendente");
  assert.equal(solicitarExcecaoCategoriaCypher(solicitante.id, "Pedido duplicado com motivo válido.",), "ja_pendente");
  assert.equal(listarSolicitacoesExcecaoCategoriaPendentesCypher().length, 1);
  const pedidoRecusado = db.prepare("SELECT id FROM solicitacoes_excecao_categorias WHERE usuario_id = ? AND status = 'pendente'").get(solicitante.id).id;
  assert.equal(revisarSolicitacaoExcecaoCategoriaCypher(pedidoRecusado, admin.id, admin.email, false, "A justificativa não demonstra necessidade imediata."), "rejeitada");
  assert.equal(revisarSolicitacaoExcecaoCategoriaCypher(pedidoRecusado, admin.id, admin.email, false, "Repetição não permitida."), "nao_pendente");
  const estadoPedidoRecusado = obterEstadoSolicitacaoExcecaoCategoriaCypher(solicitante.id);
  assert.equal(estadoPedidoRecusado.status, "rejeitado");
  assert.equal(estadoPedidoRecusado.motivo, "Preciso atualizar a categoria para refletir uma mudança de função.");
  assert.equal(estadoPedidoRecusado.motivoRevisao, "A justificativa não demonstra necessidade imediata.");
  assert.equal(estadoPedidoRecusado.categoriasAntes[0], "Rapper");
  assert.equal(estadoPedidoRecusado.historico.length, 2);
  assert.equal(estadoPedidoRecusado.criadaEm, db.prepare("SELECT criada_em AS criadaEm FROM solicitacoes_excecao_categorias WHERE id = ?").get(pedidoRecusado).criadaEm);
  assert.deepEqual(db.prepare("SELECT status, revisor_email AS revisorEmail, motivo_revisao AS motivoRevisao FROM solicitacoes_excecao_categorias WHERE id = ?").get(pedidoRecusado), {
    status: "rejeitado",
    revisorEmail: admin.email,
    motivoRevisao: "A justificativa não demonstra necessidade imediata.",
  });
  assert.equal(estadoAlteracaoCategoriasCypher(solicitante.id).excecaoDisponivel, false);
  assert.equal(solicitarExcecaoCategoriaCypher(solicitante.id, "A empresa confirmou uma nova função com prazo imediato."), "criada");
  const pedidoAprovado = db.prepare("SELECT id FROM solicitacoes_excecao_categorias WHERE usuario_id = ? AND status = 'pendente'").get(solicitante.id).id;
  assert.equal(revisarSolicitacaoExcecaoCategoriaCypher(pedidoAprovado, admin.id, admin.email, true, "Mudança profissional confirmada pela equipe."), "aprovada");
  assert.equal(revisarSolicitacaoExcecaoCategoriaCypher(pedidoAprovado, admin.id, admin.email, true, "Repetição não permitida."), "nao_pendente");
  assert.equal(estadoAlteracaoCategoriasCypher(solicitante.id).excecaoDisponivel, true);
  assert.deepEqual(db.prepare("SELECT status, revisor_email AS revisorEmail, motivo_revisao AS motivoRevisao, excecao_id AS excecaoId FROM solicitacoes_excecao_categorias WHERE id = ?").get(pedidoAprovado), {
    status: "aprovado",
    revisorEmail: admin.email,
    motivoRevisao: "Mudança profissional confirmada pela equipe.",
    excecaoId: db.prepare("SELECT id FROM excecoes_categorias WHERE usuario_id = ? AND usada_em IS NULL").get(solicitante.id).id,
  });
  assert.equal(solicitarExcecaoCategoriaCypher(solicitante.id, "Não deve gerar pedido se já existe autorização."), "excecao_disponivel");
  const dadosSolicitante = { ...dados(["Beatmaker"]), id: solicitante.id, name: solicitante.nome, initials: "SE" };
  assert.equal(atualizarPerfilCypher(dadosSolicitante), true);
  assert.equal(estadoAlteracaoCategoriasCypher(solicitante.id).excecaoDisponivel, false);
  assert.ok(db.prepare("SELECT usada_em FROM excecoes_categorias WHERE usuario_id = ?").get(solicitante.id).usada_em);

  db.prepare("UPDATE perfis SET ultima_alteracao_categorias_em = datetime('now', '-20 days') WHERE usuario_id = ?").run(usuario.id);
  const prazoAntes = db.prepare("SELECT ultima_alteracao_categorias_em AS value FROM perfis WHERE usuario_id = ?").get(usuario.id).value;
  assert.equal(atualizarPerfilCypher(dados(["Rapper", "Beatmaker"])), true);
  assert.equal(db.prepare("SELECT ultima_alteracao_categorias_em AS value FROM perfis WHERE usuario_id = ?").get(usuario.id).value, prazoAntes);
  assert.equal(estadoAlteracaoCategoriasCypher(usuario.id).bloqueada, true);

  const proposta = db.prepare("SELECT id FROM propostas_generos WHERE usuario_id = ? AND genero = 'Drill' AND status = 'pendente'").get(usuario.id);
  assert.ok(proposta);
  assert.equal(revisarPropostaGeneroCypher(proposta.id, admin.id, true, "Gênero válido e compatível com o ecossistema Cypher."), true);
  const generos = JSON.parse(db.prepare("SELECT generos_json FROM perfis WHERE usuario_id = ?").get(usuario.id).generos_json);
  assert.ok(generos.includes("Drill"));
  assert.equal(db.prepare("SELECT status, revisor_id FROM propostas_generos WHERE id = ?").get(proposta.id).status, "aprovado");

  const contaComSugestao = {
    id: "conta-categoria-pendente",
    email: "categoria-pendente@example.test",
    senhaHash: "hash-de-teste",
    tipoConta: "profissional",
    nome: "Conta de categoria pendente",
    funcao: "Outros",
    identificador: "@conta-categoria-pendente",
    iniciais: "CC",
    categorias: ["Outros"],
    outraCategoria: "Engenheiro de palco",
  };
  assert.throws(() => criarContaCypher(contaComSugestao), /CATEGORIA_PROFISSIONAL_INVALIDA/);
  assert.equal(listarCategoriasProfissionaisCypher().length, 25);
  assert.equal(solicitarCategoriaProfissionalCypher(usuario.id, "Engenheiro de palco"), "criada");
  const propostaCategoria = listarPropostasCategoriasPendentesCypher().find(item => item.categoria === "Engenheiro de palco");
  assert.ok(propostaCategoria);
  assert.equal(revisarPropostaCategoriaCypher(propostaCategoria.id, admin.id, admin.email, true, "Proposta fora do catálogo canônico."), false);
  assert.equal(listarCategoriasProfissionaisCypher().includes("Engenheiro de palco"), false);
  assert.equal(podeCriarObra(["Letrista"]), true);
  assert.equal(podeCriarObra(["MC"]), false);
  assert.equal(podeCriarObra(["Compositor(a)"]), true);
  assert.equal(solicitarCategoriaProfissionalCypher(usuario.id, "Diretor de palco"), "criada");
  const propostaRejeitada = listarPropostasCategoriasPendentesCypher().find(item => item.categoria === "Diretor de palco");
  assert.ok(propostaRejeitada);
  assert.equal(revisarPropostaCategoriaCypher(propostaRejeitada.id, admin.id, admin.email, false, "Não representa uma categoria distinta."), true);
  assert.equal(listarCategoriasProfissionaisCypher().includes("Diretor de palco"), false);

  db.prepare("UPDATE perfis SET ultima_alteracao_categorias_em = datetime('now', '-30 days') WHERE usuario_id = ?").run(usuario.id);
  assert.equal(estadoAlteracaoCategoriasCypher(usuario.id).bloqueada, false);
  assert.equal(atualizarPerfilCypher(dados(["Beatmaker"])), true);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM auditoria_categorias WHERE usuario_id = ?").get(usuario.id).n, 3);

  db.prepare("UPDATE perfis SET categorias_json = ?, funcao = ?, perfil_publico = 1 WHERE usuario_id = ?")
    .run(JSON.stringify(["Rapper"]), "Rapper", usuario.id);
  db.prepare(
    "INSERT INTO respostas_atuacao_categoria (usuario_id, categoria, respostas_json, visibilidades_json) " +
      "VALUES (?, 'Rapper', ?, ?)"
  ).run(
    usuario.id,
    JSON.stringify({
      tempoAtuacao: "1-3a",
      etapaProjetos: "em-desenvolvimento",
      participacaoColetiva: "em-colaboracao",
      atividadePratica: "pratica-inicial",
    }),
    JSON.stringify({
      __categoria__: "publico",
      tempoAtuacao: "publico",
      etapaProjetos: "privado",
      participacaoColetiva: "privado",
      atividadePratica: "colaboradores",
    })
  );
  db.prepare(
    "INSERT INTO obras (id, proprietario_id, titulo, tipo, situacao, publicada, demonstracao) " +
      "VALUES ('obra-creditada-privacidade', ?, 'Obra publicada', 'Música', 'Lançado', 1, 0)"
  ).run(usuario.id);
  db.prepare(
    "INSERT INTO creditos (id, obra_id, usuario_creditado_id, nome_creditado, funcao, demonstracao) " +
      "VALUES ('credito-colaborador-privacidade', 'obra-creditada-privacidade', ?, 'Colaborador', 'MC', 0)"
  ).run(solicitante.id);

  const antesConfirmacao = obterPerfilPublicoCypher("@usuario-teste-politica", solicitante.id);
  assert.deepEqual(antesConfirmacao.atuacoes[0].respostas, {tempoAtuacao:"1-3a"});
  db.exec("UPDATE creditos SET verificado=1");
  const perfilDoTitular = obterPerfilPublicoCypher("@usuario-teste-politica", usuario.id);
  const perfilDoColaborador = obterPerfilPublicoCypher("@usuario-teste-politica", solicitante.id);
  const perfilDoVisitante = obterPerfilPublicoCypher("@usuario-teste-politica", admin.id);
  assert.deepEqual(perfilDoTitular?.atuacoes[0].respostas, {
    tempoAtuacao: "1-3a",
    etapaProjetos: "em-desenvolvimento",
    participacaoColetiva: "em-colaboracao",
    atividadePratica: "pratica-inicial",
  });
  assert.deepEqual(perfilDoColaborador?.atuacoes[0].respostas, {
    tempoAtuacao: "1-3a",
    atividadePratica: "pratica-inicial",
  });
  assert.deepEqual(perfilDoVisitante?.atuacoes[0].respostas, {
    tempoAtuacao: "1-3a",
  });
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  db.close();
  console.log("OK: cooldown, governança, moderação de taxonomia e filtro de privacidade (titular, colaborador creditado em obra publicada e visitante externo).");
`;

try {
  const resultado = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", roteiro],
    {
      cwd: process.cwd(),
      env: { ...process.env, CYPHER_DB_PATH: arquivoBanco, NODE_ENV: "test" },
      encoding: "utf8",
    }
  );
  assert.equal(
    resultado.status,
    0,
    `Teste de política de perfil falhou:\n${resultado.stdout}\n${resultado.stderr}`
  );
  process.stdout.write(resultado.stdout);
} finally {
  fs.rmSync(diretorio, { recursive: true, force: true });
}

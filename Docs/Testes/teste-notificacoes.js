// Testes das regras dos avisos do sininho (src/notificacoes.js).
//
// Como rodar, na pasta do projeto:
//
//     node Docs/Testes/teste-notificacoes.js
//
// Os dados são inventados aqui mesmo: não precisa de banco nem de servidor.

const assert = require('assert');
const { diasDepois, montarNotificacoes } = require('../../src/notificacoes.js');

function testar(descricao, funcao) {
  try {
    funcao();
    console.log('  ok   ' + descricao);
  } catch (erro) {
    console.log('  FALHOU ' + descricao + '\n         ' + erro.message);
    process.exitCode = 1;
  }
}

const hoje = new Date(Date.UTC(2026, 10, 2)); // 02/11/2026

// Monta a lista com um tipo de dado só; o resto vem vazio.
function montar(dados) {
  return montarNotificacoes({ hoje, contasAPagar: [], metas: [], contas: [], limites: [], ...dados });
}

function conta(dias, extra = {}) {
  return {
    id_transacao: 1,
    descricao: 'Luz',
    valor_transacao: 100,
    data_transacao: diasDepois(hoje, dias),
    categoria: { nome_categoria: 'Moradia' },
    ...extra,
  };
}

function meta(dias) {
  return { id_meta: 1, titulo: 'Viagem', valor_alvo: 500, valor_atual: 100, data_limite: diasDepois(hoje, dias) };
}

function limite(situacao, id_limite = 1) {
  return { id_limite, nome_categoria: 'Lazer', valor_limite: 500, gasto_mes: 400, situacao };
}

// O formato de moeda usa um espaço especial depois do "R$".
const texto = (aviso) => aviso.mensagem.replace(/ /g, ' ');

console.log('\nContas a pagar');
testar('vence hoje: pede atenção', () => {
  const [a] = montar({ contasAPagar: [conta(0)] });
  assert.strictEqual(a.gravidade, 'atencao');
  assert.strictEqual(texto(a), 'Luz · R$ 100,00 · vence hoje');
});
testar('vence amanhã', () => assert.ok(texto(montar({ contasAPagar: [conta(1)] })[0]).endsWith('vence amanhã')));
testar('vence em 3 dias', () => assert.ok(texto(montar({ contasAPagar: [conta(3)] })[0]).endsWith('vence em 3 dias')));
testar('venceu ontem: vira alerta', () => {
  const [a] = montar({ contasAPagar: [conta(-1)] });
  assert.strictEqual(a.gravidade, 'alerta');
  assert.strictEqual(a.titulo, 'Conta atrasada');
  assert.ok(texto(a).endsWith('venceu ontem'));
});
testar('venceu há 5 dias', () => assert.ok(texto(montar({ contasAPagar: [conta(-5)] })[0]).endsWith('venceu há 5 dias')));
testar('sem descrição, usa o nome da categoria', () => {
  assert.ok(texto(montar({ contasAPagar: [conta(0, { descricao: null })] })[0]).startsWith('Moradia ·'));
});
testar('ao atrasar, a chave muda e o aviso aparece de novo', () => {
  assert.notStrictEqual(montar({ contasAPagar: [conta(0)] })[0].chave, montar({ contasAPagar: [conta(-1)] })[0].chave);
});

console.log('\nMetas');
testar('perto do prazo: mostra quanto falta', () => {
  const [a] = montar({ metas: [meta(12)] });
  assert.strictEqual(a.gravidade, 'atencao');
  assert.strictEqual(texto(a), 'Viagem · faltam R$ 400,00 · termina em 12 dias');
});
testar('prazo vencido: vira alerta', () => {
  const [a] = montar({ metas: [meta(-1)] });
  assert.strictEqual(a.gravidade, 'alerta');
  assert.strictEqual(texto(a), 'Viagem · faltam R$ 400,00');
});

console.log('\nSaldo');
testar('saldo negativo avisa', () => {
  const [a] = montar({ contas: [{ id_conta: 1, nome: 'Carteira', saldo: -50 }] });
  assert.strictEqual(a.titulo, 'Saldo negativo');
  assert.ok(texto(a).includes('50,00'));
});
testar('saldo zero não avisa', () => {
  assert.strictEqual(montar({ contas: [{ id_conta: 1, nome: 'Carteira', saldo: 0 }] }).length, 0);
});

console.log('\nLimites');
testar('situação ok não avisa', () => assert.strictEqual(montar({ limites: [limite('ok')] }).length, 0));
testar('atenção avisa', () => assert.strictEqual(montar({ limites: [limite('atencao')] })[0].gravidade, 'atencao'));
testar('estourado é alerta', () => assert.strictEqual(montar({ limites: [limite('estourado')] })[0].gravidade, 'alerta'));
testar('o mês entra na chave: renova no dia 1', () => {
  assert.strictEqual(montar({ limites: [limite('atencao')] })[0].chave, 'limite:1:2026-11:atencao');
});

console.log('\nOrdem');
testar('alertas vêm antes, sem embaralhar o resto', () => {
  const lista = montar({ contasAPagar: [conta(1)], metas: [meta(5)], limites: [limite('estourado')] });
  assert.deepStrictEqual(lista.map((a) => a.tipo), ['limite', 'conta', 'meta']);
});
testar('nada para avisar: lista vazia', () => assert.deepStrictEqual(montar({}), []));

console.log(process.exitCode ? '\nHá testes falhando.\n' : '\nTodos os testes passaram.\n');

// Testes unitários do endereço do bico verificado pelo CEP: validações, serviço de CEP (ViaCEP com a
// BrasilAPI de reserva), publicação do bico, rota /api/cep e privacidade do endereço nos detalhes.
// Não acessam a internet nem o banco: o serviço recebe um fetch simulado e o controller, um banco falso.
// Executar com: npm run test:unit
import { test, describe, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// A pool do MariaDB é criada ao importar os controllers. Apontamos para uma porta fechada
// para garantir que nenhum banco real seja contatado durante os testes.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'banco_inexistente_testes_unitarios';
delete process.env.CEP_FAKE;

const {
    validarCep,
    normalizarCep,
    formatarCep,
    validarNumeroEndereco,
    normalizarNumeroEndereco,
    validarComplemento,
    validarLogradouro
} = await import('../../validations/bicoValidation.js');
const { buscarEnderecoPorCep, CepIndisponivelError, modoCepFalso } = await import('../../services/cepService.js');
const { criarCadastradorBico, prepararEnderecoParaExibicao, MENSAGEM_CEP_INDISPONIVEL } =
    await import('../../controllers/bicoController.js');
const { criarConsultorCep } = await import('../../controllers/cepController.js');
const { default: pool } = await import('../../config/database.js');

after(async () => {
    await pool.end().catch(() => {});
});

// ---------------------------------------------------------------- fetch simulado

const respostaJson = (status, corpo) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => corpo
});

// Cada rota (ViaCEP / BrasilAPI) responde com uma função; as chamadas ficam registradas.
const criarFetchFalso = ({ viaCep, brasilApi }) => {
    const chamadas = [];
    const fetch = async (url, opcoes = {}) => {
        chamadas.push({ url, opcoes });
        if (url.startsWith('https://viacep.com.br/')) return viaCep(opcoes);
        if (url.startsWith('https://brasilapi.com.br/')) return brasilApi(opcoes);
        throw new Error(`URL inesperada: ${url}`);
    };
    return { fetch, chamadas };
};

const foraDoAr = async () => {
    throw new TypeError('fetch failed');
};
const naoDeveriaChamar = async () => {
    throw new Error('não deveria consultar esta API');
};

// Nunca responde: só termina quando o AbortController do serviço cancela a requisição.
const travado = (opcoes) =>
    new Promise((_, rejeitar) => {
        opcoes.signal.addEventListener('abort', () => rejeitar(new DOMException('Aborted', 'AbortError')));
    });

const VIACEP_PAULISTA = {
    cep: '01310-100',
    logradouro: 'Avenida Paulista',
    complemento: 'de 612 a 1510 - lado par',
    bairro: 'Bela Vista',
    localidade: 'São Paulo',
    uf: 'SP'
};
const BRASILAPI_PAULISTA = {
    cep: '01310100',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Bela Vista',
    street: 'Avenida Paulista',
    service: 'open-cep'
};
const ENDERECO_PAULISTA = {
    cep: '01310100',
    logradouro: 'Avenida Paulista',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP'
};

// ---------------------------------------------------------------- validações

describe('validações do endereço', () => {
    test('validarCep aceita 8 dígitos com ou sem traço e recusa o resto', () => {
        for (const cep of ['01310-100', '01310100', ' 01310-100 ']) {
            assert.equal(validarCep(cep), true, cep);
        }
        for (const cep of [
            '0131010',
            '013101000',
            '01310-10a',
            'abcdefgh',
            '01.310-100',
            '',
            undefined,
            null,
            1310100
        ]) {
            assert.equal(validarCep(cep), false, String(cep));
        }
    });

    test('normalizarCep remove o traço; formatarCep coloca de volta (e deixa valores antigos como estão)', () => {
        assert.equal(normalizarCep('01310-100'), '01310100');
        assert.equal(normalizarCep(' 13690-000 '), '13690000');
        assert.equal(formatarCep('01310100'), '01310-100');
        assert.equal(formatarCep(null), '');
        assert.equal(formatarCep('123'), '123');
    });

    test('validarNumeroEndereco: 1 a 10 caracteres, aceita "S/N"', () => {
        for (const numero of ['1', '1578', '1234567890', 'S/N', 's/n', '12A', 'Km 5']) {
            assert.equal(validarNumeroEndereco(numero), true, numero);
        }
        for (const numero of ['', '   ', '12345678901', undefined, 12]) {
            assert.equal(validarNumeroEndereco(numero), false, String(numero));
        }
        assert.equal(normalizarNumeroEndereco(' s/n '), 'S/N');
        assert.equal(normalizarNumeroEndereco('S / N'), 'S/N');
        assert.equal(normalizarNumeroEndereco(' 42 '), '42');
    });

    test('validarComplemento é opcional e aceita até 60 caracteres', () => {
        for (const complemento of [undefined, null, '', 'Apto 42', 'x'.repeat(60)]) {
            assert.equal(validarComplemento(complemento), true, String(complemento));
        }
        assert.equal(validarComplemento('x'.repeat(61)), false);
        assert.equal(validarComplemento(42), false);
    });

    test('validarLogradouro (CEP geral): 2 a 150 caracteres', () => {
        assert.equal(validarLogradouro('Rua XV de Novembro'), true);
        assert.equal(validarLogradouro('x'), false);
        assert.equal(validarLogradouro('x'.repeat(151)), false);
        assert.equal(validarLogradouro(undefined), false);
    });
});

// ---------------------------------------------------------------- serviço de CEP

describe('cepService: buscarEnderecoPorCep', () => {
    test('CEP válido na ViaCEP: devolve o endereço normalizado sem consultar a BrasilAPI', async () => {
        const { fetch, chamadas } = criarFetchFalso({
            viaCep: async () => respostaJson(200, VIACEP_PAULISTA),
            brasilApi: naoDeveriaChamar
        });

        assert.deepEqual(await buscarEnderecoPorCep('01310-100', { fetch }), ENDERECO_PAULISTA);
        assert.equal(chamadas.length, 1);
        assert.equal(chamadas[0].url, 'https://viacep.com.br/ws/01310100/json/');
        assert.ok(chamadas[0].opcoes.signal instanceof AbortSignal, 'a requisição tem tempo limite (AbortController)');
    });

    test('CEP inexistente: ViaCEP {"erro": true} é conferido na BrasilAPI, e só com 404 dela devolve null', async () => {
        const { fetch, chamadas } = criarFetchFalso({
            viaCep: async () => respostaJson(200, { erro: true }),
            brasilApi: async () => respostaJson(404, { message: 'CEP não encontrado' })
        });

        assert.equal(await buscarEnderecoPorCep('99999999', { fetch }), null);
        assert.deepEqual(
            chamadas.map((c) => c.url),
            ['https://viacep.com.br/ws/99999999/json/', 'https://brasilapi.com.br/api/cep/v2/99999999']
        );
    });

    test('CEP novo que a ViaCEP ainda não tem ({"erro": "true"}): usa o endereço da BrasilAPI', async () => {
        const { fetch } = criarFetchFalso({
            viaCep: async () => respostaJson(200, { erro: 'true' }),
            brasilApi: async () => respostaJson(200, BRASILAPI_PAULISTA)
        });

        assert.deepEqual(await buscarEnderecoPorCep('01310100', { fetch }), ENDERECO_PAULISTA);
    });

    test('ViaCEP fora do ar: a BrasilAPI responde e o endereço é devolvido', async () => {
        for (const viaCep of [
            foraDoAr,
            async () => respostaJson(500, null),
            async () => respostaJson(200, { qualquer: 'coisa' })
        ]) {
            const { fetch, chamadas } = criarFetchFalso({
                viaCep,
                brasilApi: async () => respostaJson(200, BRASILAPI_PAULISTA)
            });
            assert.deepEqual(await buscarEnderecoPorCep('01310100', { fetch }), ENDERECO_PAULISTA);
            assert.equal(chamadas.length, 2);
        }
    });

    test('ViaCEP estoura o tempo: a requisição é abortada e a BrasilAPI é usada', async () => {
        const { fetch } = criarFetchFalso({
            viaCep: travado,
            brasilApi: async () => respostaJson(200, BRASILAPI_PAULISTA)
        });

        const inicio = Date.now();
        assert.deepEqual(await buscarEnderecoPorCep('01310100', { fetch, timeoutMs: 30 }), ENDERECO_PAULISTA);
        assert.ok(Date.now() - inicio < 1000, 'não espera além do tempo limite');
    });

    test('ViaCEP fora e BrasilAPI 404: devolve null (CEP inexistente)', async () => {
        const { fetch } = criarFetchFalso({ viaCep: foraDoAr, brasilApi: async () => respostaJson(404, null) });
        assert.equal(await buscarEnderecoPorCep('99999999', { fetch }), null);
    });

    test('as duas APIs fora (erro ou tempo esgotado): lança CepIndisponivelError', async () => {
        const silenciarConsole = console.error;
        console.error = () => {};
        try {
            for (const [viaCep, brasilApi] of [
                [foraDoAr, foraDoAr],
                [travado, travado],
                [foraDoAr, async () => respostaJson(503, null)]
            ]) {
                const { fetch } = criarFetchFalso({ viaCep, brasilApi });
                await assert.rejects(buscarEnderecoPorCep('01310100', { fetch, timeoutMs: 20 }), CepIndisponivelError);
            }
        } finally {
            console.error = silenciarConsole;
        }
    });

    test('ViaCEP diz que não existe e a BrasilAPI está fora: não conclui (CepIndisponivelError, não null)', async () => {
        const silenciarConsole = console.error;
        console.error = () => {};
        try {
            const { fetch } = criarFetchFalso({
                viaCep: async () => respostaJson(200, { erro: true }),
                brasilApi: foraDoAr
            });
            await assert.rejects(buscarEnderecoPorCep('01310100', { fetch }), CepIndisponivelError);
        } finally {
            console.error = silenciarConsole;
        }
    });

    test('CEP com formato inválido: devolve null sem consultar nenhuma API', async () => {
        const { fetch, chamadas } = criarFetchFalso({ viaCep: naoDeveriaChamar, brasilApi: naoDeveriaChamar });
        assert.equal(await buscarEnderecoPorCep('123', { fetch }), null);
        assert.equal(chamadas.length, 0);
    });

    test('CEP geral (sem rua e bairro) é devolvido com logradouro e bairro vazios', async () => {
        const { fetch } = criarFetchFalso({
            viaCep: async () =>
                respostaJson(200, { cep: '13690-000', logradouro: '', bairro: '', localidade: 'Descalvado', uf: 'SP' }),
            brasilApi: naoDeveriaChamar
        });
        assert.deepEqual(await buscarEnderecoPorCep('13690000', { fetch }), {
            cep: '13690000',
            logradouro: '',
            bairro: '',
            cidade: 'Descalvado',
            uf: 'SP'
        });
    });
});

describe('cepService: provedor falso (CEP_FAKE=1)', () => {
    const ambienteOriginal = { CEP_FAKE: process.env.CEP_FAKE, NODE_ENV: process.env.NODE_ENV };
    const fetchOriginal = globalThis.fetch;

    beforeEach(() => {
        process.env.CEP_FAKE = '1';
        process.env.NODE_ENV = 'development';
        globalThis.fetch = naoDeveriaChamar; // garante que nenhuma API real é chamada
    });

    afterEach(() => {
        for (const [chave, valor] of Object.entries(ambienteOriginal)) {
            if (valor === undefined) delete process.env[chave];
            else process.env[chave] = valor;
        }
        globalThis.fetch = fetchOriginal;
    });

    test('responde os CEPs dos testes sem acessar a internet', async () => {
        assert.equal(modoCepFalso(), true);
        assert.deepEqual(await buscarEnderecoPorCep('01310-100'), ENDERECO_PAULISTA);
        assert.deepEqual(await buscarEnderecoPorCep('13690-000'), {
            cep: '13690000',
            logradouro: '',
            bairro: '',
            cidade: 'Descalvado',
            uf: 'SP'
        });
        assert.equal(await buscarEnderecoPorCep('99999-999'), null);
    });

    test('é ignorado em produção', () => {
        process.env.NODE_ENV = 'production';
        assert.equal(modoCepFalso(), false);
    });
});

// ---------------------------------------------------------------- publicação do bico (controller)

const CONTRATANTE = { id: 10, nome: 'Contratante Teste', tipo_perfil: 'Contratante', saldo_simulado: 0 };

const criarBancoFalso = () => {
    const insercoes = [];
    return {
        insercoes,
        query: async (sql, params) => {
            if (/INSERT INTO bicos/.test(sql)) insercoes.push(params);
            return { affectedRows: 1 };
        }
    };
};

const criarRespostaFalsa = () => {
    const resposta = {
        statusCode: 200,
        status(codigo) {
            this.statusCode = codigo;
            return this;
        },
        render(view, dados) {
            this.view = view;
            this.dados = dados;
            return this;
        },
        redirect(url) {
            this.statusCode = 302;
            this.location = url;
            return this;
        },
        json(dados) {
            this.corpo = dados;
            return this;
        },
        send(dados) {
            this.corpo = dados;
            return this;
        }
    };
    return resposta;
};

const corpoValido = (extra = {}) => ({
    titulo: 'Montagem de móveis',
    descricao: 'Montar dois armários e uma cama.',
    valor: '150.00',
    data_servico: '2026-12-10',
    horario: '09:00',
    cep: '01310-100',
    numero: '1578',
    complemento: 'Sala 4',
    ...extra
});

// Colunas na ordem do INSERT do controller.
const COLUNAS_INSERT = [
    'contratante_id',
    'titulo',
    'descricao',
    'valor',
    'bairro',
    'cep',
    'logradouro',
    'numero',
    'complemento',
    'cidade',
    'uf',
    'data_servico',
    'horario'
];
const linhaInserida = (params) => Object.fromEntries(COLUNAS_INSERT.map((coluna, i) => [coluna, params[i]]));

const publicar = async (corpo, buscarCep) => {
    const banco = criarBancoFalso();
    const chamadasCep = [];
    const buscar = async (cep) => {
        chamadasCep.push(cep);
        return buscarCep(cep);
    };
    const res = criarRespostaFalsa();
    await criarCadastradorBico(banco, buscar)({ body: corpo, session: { usuario: CONTRATANTE } }, res);
    return { res, banco, chamadasCep };
};

describe('publicar bico com endereço verificado pelo CEP', () => {
    test('grava logradouro, bairro, cidade e UF da consulta e ignora os enviados no formulário', async () => {
        const { res, banco, chamadasCep } = await publicar(
            corpoValido({
                logradouro: 'Rua Inventada',
                bairro: 'Bairro Falso',
                cidade: 'Cidade Falsa',
                uf: 'XX',
                numero: 's/n'
            }),
            async () => ({ ...ENDERECO_PAULISTA })
        );

        assert.equal(res.statusCode, 302);
        assert.equal(res.location, '/homeContratante');
        assert.deepEqual(chamadasCep, ['01310100'], 'consulta o CEP só com os dígitos');
        assert.equal(banco.insercoes.length, 1);
        const linha = linhaInserida(banco.insercoes[0]);
        assert.equal(linha.cep, '01310100', 'CEP gravado só com os 8 dígitos');
        assert.equal(linha.logradouro, 'Avenida Paulista');
        assert.equal(linha.bairro, 'Bela Vista');
        assert.equal(linha.cidade, 'São Paulo');
        assert.equal(linha.uf, 'SP');
        assert.equal(linha.numero, 'S/N');
        assert.equal(linha.complemento, 'Sala 4');
    });

    test('complemento vazio é gravado como NULL', async () => {
        const { banco } = await publicar(corpoValido({ complemento: '   ' }), async () => ({ ...ENDERECO_PAULISTA }));
        assert.equal(linhaInserida(banco.insercoes[0]).complemento, null);
    });

    test('CEP geral: aceita rua e bairro do formulário, mas cidade e UF continuam vindo da consulta', async () => {
        const consulta = async () => ({ cep: '13690000', logradouro: '', bairro: '', cidade: 'Descalvado', uf: 'SP' });
        const { res, banco } = await publicar(
            corpoValido({
                cep: '13690-000',
                logradouro: ' Rua XV de Novembro ',
                bairro: 'Centro',
                cidade: 'Outra',
                uf: 'RJ'
            }),
            consulta
        );

        assert.equal(res.statusCode, 302);
        const linha = linhaInserida(banco.insercoes[0]);
        assert.equal(linha.logradouro, 'Rua XV de Novembro');
        assert.equal(linha.bairro, 'Centro');
        assert.equal(linha.cidade, 'Descalvado');
        assert.equal(linha.uf, 'SP');
    });

    test('CEP geral sem rua ou sem bairro digitados: 400 e nada é gravado', async () => {
        const consulta = async () => ({ cep: '13690000', logradouro: '', bairro: '', cidade: 'Descalvado', uf: 'SP' });

        const semRua = await publicar(corpoValido({ cep: '13690-000', bairro: 'Centro' }), consulta);
        assert.equal(semRua.res.statusCode, 400);
        assert.match(semRua.res.dados.erro, /não informa a rua/);
        assert.equal(semRua.banco.insercoes.length, 0);

        const semBairro = await publicar(
            corpoValido({ cep: '13690-000', logradouro: 'Rua Um', bairro: 'x' }),
            consulta
        );
        assert.equal(semBairro.res.statusCode, 400);
        assert.match(semBairro.res.dados.erro, /não informa o bairro/);
        assert.equal(semBairro.banco.insercoes.length, 0);
    });

    test('CEP inexistente: 400 "CEP não encontrado" e o formulário volta preenchido', async () => {
        const { res, banco } = await publicar(corpoValido({ cep: '99999-999' }), async () => null);

        assert.equal(res.statusCode, 400);
        assert.equal(res.view, 'contratante/publicarBico');
        assert.match(res.dados.erro, /^CEP não encontrado/);
        assert.equal(res.dados.valores.cep, '99999-999');
        assert.equal(res.dados.valores.titulo, 'Montagem de móveis');
        assert.equal(res.dados.valores.numero, '1578');
        assert.equal(banco.insercoes.length, 0);
    });

    test('as duas APIs fora: o bico não é publicado e a mensagem pede para tentar de novo', async () => {
        const { res, banco } = await publicar(corpoValido(), async () => {
            throw new CepIndisponivelError();
        });

        assert.equal(res.statusCode, 503);
        assert.equal(res.view, 'contratante/publicarBico');
        assert.equal(res.dados.erro, MENSAGEM_CEP_INDISPONIVEL);
        assert.equal(res.dados.erro, 'Não conseguimos verificar o CEP agora, tente novamente em instantes.');
        assert.equal(res.dados.valores.complemento, 'Sala 4');
        assert.equal(banco.insercoes.length, 0);
    });

    test('CEP, número ou complemento inválidos: 400 sem consultar o CEP', async () => {
        const casos = [
            [{ cep: '1234' }, 'Informe um CEP válido, com 8 dígitos.'],
            [{ cep: undefined }, 'Informe um CEP válido, com 8 dígitos.'],
            [{ numero: '' }, 'Informe o número do endereço (até 10 caracteres) ou "S/N".'],
            [{ numero: '12345678901' }, 'Informe o número do endereço (até 10 caracteres) ou "S/N".'],
            [{ complemento: 'x'.repeat(61) }, 'O complemento deve ter no máximo 60 caracteres.'],
            [{ valor: '0' }, 'Informe um valor maior que zero, com até duas casas decimais.']
        ];

        for (const [alteracao, mensagem] of casos) {
            const { res, banco, chamadasCep } = await publicar(corpoValido(alteracao), async () => ({
                ...ENDERECO_PAULISTA
            }));
            assert.equal(res.statusCode, 400, mensagem);
            assert.equal(res.dados.erro, mensagem);
            assert.equal(chamadasCep.length, 0, 'não chama as APIs com o formulário inválido');
            assert.equal(banco.insercoes.length, 0);
        }
    });
});

// ---------------------------------------------------------------- rota /api/cep

describe('GET /api/cep/:cep', () => {
    const consultar = async (cep, buscarCep) => {
        const res = criarRespostaFalsa();
        await criarConsultorCep(buscarCep)({ params: { cep } }, res);
        return res;
    };

    test('200 com o endereço, 404 inexistente, 400 formato inválido e 503 com as APIs fora', async () => {
        const ok = await consultar('01310-100', async () => ({ ...ENDERECO_PAULISTA }));
        assert.equal(ok.statusCode, 200);
        assert.deepEqual(ok.corpo, ENDERECO_PAULISTA);

        const inexistente = await consultar('99999999', async () => null);
        assert.equal(inexistente.statusCode, 404);
        assert.deepEqual(inexistente.corpo, { erro: 'CEP não encontrado.' });

        const invalido = await consultar('123', async () => {
            throw new Error('não deveria consultar');
        });
        assert.equal(invalido.statusCode, 400);

        const fora = await consultar('01310100', async () => {
            throw new CepIndisponivelError();
        });
        assert.equal(fora.statusCode, 503);
        assert.equal(fora.corpo.erro, 'Não conseguimos verificar o CEP agora, tente novamente em instantes.');
    });
});

// ---------------------------------------------------------------- privacidade (detalhes do bico)

describe('privacidade do endereço nos detalhes do bico', () => {
    const bico = {
        id: 1,
        contratante_id: 10,
        trabalhador_id: 20,
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01310100',
        logradouro: 'Avenida Paulista',
        numero: '1578',
        complemento: 'Sala 4'
    };

    test('o contratante dono e o trabalhador aceito recebem o endereço completo, com o CEP formatado', () => {
        for (const usuarioId of [10, 20]) {
            const exibido = prepararEnderecoParaExibicao(bico, usuarioId);
            assert.equal(exibido.podeVerEnderecoCompleto, true);
            assert.equal(exibido.logradouro, 'Avenida Paulista');
            assert.equal(exibido.numero, '1578');
            assert.equal(exibido.complemento, 'Sala 4');
            assert.equal(exibido.cep_formatado, '01310-100');
        }
    });

    test('os demais recebem só bairro e cidade/UF (rua, número, complemento e CEP são retirados)', () => {
        for (const usuarioId of [11, 21, 0]) {
            const exibido = prepararEnderecoParaExibicao(bico, usuarioId);
            assert.equal(exibido.podeVerEnderecoCompleto, false);
            assert.equal(exibido.bairro, 'Bela Vista');
            assert.equal(exibido.cidade, 'São Paulo');
            assert.equal(exibido.uf, 'SP');
            for (const campo of ['cep', 'logradouro', 'numero', 'complemento']) {
                assert.equal(exibido[campo], null, campo);
            }
            assert.equal(exibido.cep_formatado, '');
        }
    });

    test('bico sem trabalhador: nenhum trabalhador vê o endereço completo', () => {
        const aberto = { ...bico, trabalhador_id: null };
        assert.equal(prepararEnderecoParaExibicao(aberto, 20).podeVerEnderecoCompleto, false);
        assert.equal(prepararEnderecoParaExibicao(aberto, 0).podeVerEnderecoCompleto, false);
    });

    test('bico antigo (sem CEP) continua com o bairro e sem CEP formatado', () => {
        const antigo = {
            id: 2,
            contratante_id: 10,
            trabalhador_id: null,
            bairro: 'Centro',
            cep: null,
            logradouro: null,
            numero: null,
            complemento: null,
            cidade: null,
            uf: null
        };
        const exibido = prepararEnderecoParaExibicao(antigo, 10);
        assert.equal(exibido.bairro, 'Centro');
        assert.equal(exibido.cep_formatado, '');
    });
});

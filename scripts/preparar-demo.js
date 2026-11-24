// Prepara o banco de DEMONSTRAÇÃO do iBico (professor no checkpoint e apresentação final).
//
// NÃO faz parte do `npm test`. Execute com:  npm run demo:preparar   (ou:  node scripts/preparar-demo.js [--sim])
//
// O que o script faz:
//   1. Recria um banco SEPARADO (db_bico_demo) a partir do schema.sql. O banco db_bico não é tocado.
//      Se o banco já existir, pede confirmação no terminal (use --sim para pular a pergunta).
//   2. Sobe o próprio app numa porta temporária (CEP_FAKE=1) só enquanto cria os dados e o derruba no fim.
//   3. Cria tudo pelas rotas reais da aplicação (cadastro, login, carteira, bicos, candidaturas, chat, avaliações...).
//      O SQL direto só é usado para consultar ids e para envelhecer datas (finalização, avaliação, histórico).
//   4. Imprime a "cola" (conta / e-mail / senha / o que testar) e grava a mesma cola em Docs/Teste/roteiro-demo.md.
//
// Nenhum código da aplicação é alterado. Todos os dados (nomes, CPFs, e-mails, valores) são fictícios.
import { request } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import path from 'node:path';
import {
    RAIZ,
    cpfValido,
    dataRelativa,
    form,
    bancoExiste,
    recriarBanco,
    abrirPool,
    portaLivre,
    subirServidor
} from './lib/demo-comum.js';

const BANCO = 'db_bico_demo';
const SENHA = 'ibico123';
const CEP_TESTE = '01310-100'; // Avenida Paulista, Bela Vista, São Paulo/SP (provedor falso)
const CEP_GERAL_TESTE = '13690000'; // CEP geral de Descalvado/SP: sem rua e bairro (o contratante informa a rua)
const ARQUIVO_ROTEIRO = path.join(RAIZ, 'Docs', 'Teste', 'roteiro-demo.md');

// ---------------------------------------------------------------- dados fictícios
const USUARIOS = {
    carla: {
        nome: 'Carla Mendes',
        email: 'contratante@demo.com',
        cpf: cpfValido('384729156'),
        idade: '38',
        tipo: 'contratante'
    },
    beatriz: {
        nome: 'Beatriz Nogueira',
        email: 'contratante.semsaldo@demo.com',
        cpf: cpfValido('196348275'),
        idade: '36',
        tipo: 'contratante'
    },
    marcos: {
        nome: 'Marcos Oliveira',
        email: 'contratante.outro@demo.com',
        cpf: cpfValido('529173846'),
        idade: '45',
        tipo: 'contratante'
    },
    rafael: {
        nome: 'Rafael Souza',
        email: 'trabalhador.experiente@demo.com',
        cpf: cpfValido('617284953'),
        idade: '27',
        tipo: 'trabalhador'
    },
    juliana: {
        nome: 'Juliana Lima',
        email: 'trabalhador.novo@demo.com',
        cpf: cpfValido('742915368'),
        idade: '31',
        tipo: 'trabalhador'
    },
    diego: {
        nome: 'Diego Santos',
        email: 'trabalhador.aceito@demo.com',
        cpf: cpfValido('853261479'),
        idade: '23',
        tipo: 'trabalhador'
    }
};

// dono: quem publica. dias: deslocamento da data do serviço (negativo = já realizado).
// Todos os bicos têm endereço por CEP (cep + número); `cep` e `logradouro` padrão = Avenida Paulista.
const BICOS = {
    // ---- Carla (contratante principal) ----
    a: {
        dono: 'carla',
        titulo: 'Montagem de guarda-roupa',
        valor: '120.00',
        dias: 5,
        horario: '14:00',
        numero: '1000',
        descricao:
            'Montagem de guarda-roupa de 6 portas com espelho. As ferramentas básicas ficam por conta do profissional.'
    },
    b: {
        dono: 'carla',
        titulo: 'Pintura de muro externo',
        valor: '80.00',
        dias: 6,
        horario: '09:00',
        numero: '1100',
        complemento: 'Casa',
        descricao:
            'Lixar e pintar muro externo de 8 metros com tinta acrílica branca. A tinta e os pincéis são fornecidos.'
    },
    c: {
        dono: 'carla',
        titulo: 'Ajudante para evento',
        valor: '100.00',
        dias: 3,
        horario: '10:00',
        numero: '1200',
        complemento: 'Salão de festas',
        descricao:
            'Ajudante para montagem de mesas e cadeiras, apoio no buffet e organização do espaço em confraternização.'
    },
    d: {
        dono: 'carla',
        titulo: 'Troca de resistência do chuveiro',
        valor: '90.00',
        dias: -2,
        horario: '16:00',
        numero: '1300',
        complemento: 'Apto 41',
        descricao:
            'Troca da resistência e revisão da fiação do chuveiro elétrico do banheiro social. Resistência já comprada.'
    },
    e: {
        dono: 'carla',
        titulo: 'Conserto de torneira',
        valor: '70.00',
        dias: -10,
        horario: '09:00',
        numero: '1400',
        descricao:
            'Torneira da cozinha pingando e registro com vazamento. Levar vedante; o material de reposição é fornecido.'
    },
    f: {
        dono: 'carla',
        titulo: 'Instalação de prateleiras',
        valor: '60.00',
        dias: 4,
        horario: '15:00',
        numero: '1500',
        descricao:
            'Instalar 5 prateleiras de madeira em parede de alvenaria no escritório. Furadeira e buchas já inclusas.'
    },
    // ---- Beatriz (sem saldo) ----
    semSaldo: {
        dono: 'beatriz',
        titulo: 'Reforma de bancada da cozinha',
        valor: '200.00',
        dias: 5,
        horario: '08:00',
        numero: '1600',
        descricao: 'Trocar o tampo da bancada da cozinha e refazer o acabamento com silicone. Material já comprado.'
    },
    // ---- Marcos (outro contratante): histórico do trabalhador experiente e vagas abertas no feed ----
    h1: {
        dono: 'marcos',
        titulo: 'Pintura de portão de ferro',
        valor: '100.00',
        dias: -20,
        horario: '08:30',
        numero: '1700',
        descricao:
            'Lixar e pintar portão de ferro de 3 metros com tinta esmalte preta. Tinta e pincéis por minha conta.'
    },
    h2: {
        dono: 'marcos',
        titulo: 'Reparo de reboco na sala',
        valor: '120.00',
        dias: -16,
        horario: '08:00',
        numero: '1800',
        descricao: 'Remover o reboco solto de uma parede da sala, refazer a massa e deixar pronta para pintura.'
    },
    h3: {
        dono: 'marcos',
        titulo: 'Troca de telhas do quintal',
        valor: '90.00',
        dias: -13,
        horario: '07:30',
        numero: '1900',
        descricao: 'Substituir 30 telhas quebradas da cobertura do quintal e vedar as emendas com manta.'
    },
    h4: {
        dono: 'marcos',
        titulo: 'Instalação de ventilador de teto',
        valor: '110.00',
        dias: -11,
        horario: '13:30',
        numero: '2000',
        descricao: 'Instalar dois ventiladores de teto em quarto e sala, com ligação elétrica ao interruptor.'
    },
    feed1: {
        dono: 'marcos',
        titulo: 'Poda de cerca viva',
        valor: '130.00',
        dias: 7,
        horario: '07:30',
        numero: '2100',
        descricao: 'Poda e retirada dos galhos de cerca viva com cerca de 25 metros de extensão, incluindo o descarte.'
    },
    feed2: {
        dono: 'marcos',
        titulo: 'Lavagem de calçada e quintal',
        valor: '110.00',
        dias: 4,
        horario: '09:30',
        cep: CEP_GERAL_TESTE,
        logradouro: 'Rua das Palmeiras',
        bairro: 'Centro',
        numero: '245',
        descricao:
            'Lavagem com lavadora de alta pressão da calçada e do quintal de uma casa térrea. A lavadora é fornecida.'
    }
};

// Ordem de publicação (= ordem de criação dos bicos).
const ORDEM_PUBLICACAO = ['h1', 'h2', 'h3', 'h4', 'e', 'd', 'c', 'f', 'a', 'b', 'feed2', 'feed1', 'semSaldo'];

// ---------------------------------------------------------------- a cola (contas e o que testar)
const COLA = [
    {
        conta: 'Contratante principal (Carla Mendes)',
        email: USUARIOS.carla.email,
        testes: [
            {
                texto: 'Publicar Bico: digite um CEP (com internet, qualquer CEP real; offline, 01310-100) e veja rua, bairro, cidade e UF preenchidos sozinhos. Informe o número, publique e abra o detalhe: o endereço completo aparece para a dona.',
                ct: 'CT05, CT25'
            },
            {
                texto: 'Início > Bicos > "Montagem de guarda-roupa": 2 candidatos Pendentes. Aceitar um: o valor (R$ 120,00) é reservado no saldo e no extrato e o outro candidato fica Recusado.',
                ct: 'CT08, CT19, CT21'
            },
            {
                texto: 'Bicos > "Pintura de muro externo" (sem candidatos): Cancelar bico, sem estorno no extrato.',
                ct: 'CT14'
            },
            {
                texto: 'Bicos > "Ajudante para evento" (Em andamento): abrir o chat com o trabalhador, Finalizar (R$ 100,00 creditados ao trabalhador) e avaliar.',
                ct: 'CT12, CT10, CT13'
            },
            {
                texto: 'Bicos > aba Concluídos > "Troca de resistência do chuveiro" (finalizado ontem, selo "Avaliar"): avaliar o trabalhador e editar a nota dentro do prazo de 7 dias.',
                ct: 'CT13, CT18'
            },
            {
                texto: 'Bicos > aba Concluídos > "Conserto de torneira" (finalizado há 8 dias): selo "Prazo encerrado", sem avaliar.',
                ct: 'CT18'
            },
            {
                texto: 'Aba Cancelados > "Instalação de prateleiras" (cancelado em andamento): estorno da reserva no extrato da carteira.',
                ct: 'CT15'
            },
            {
                texto: 'Detalhe de qualquer bico dela: endereço completo (rua, número, complemento, CEP) para a dona.',
                ct: 'CT25, CT26'
            },
            {
                texto: 'Meu Perfil > "Ver como os outros veem meu perfil": depois de o Diego avaliar, a nota dele aparece (avaliação mútua completa).',
                ct: 'CT17, CT19'
            }
        ]
    },
    {
        conta: 'Contratante sem saldo (Beatriz Nogueira)',
        email: USUARIOS.beatriz.email,
        testes: [
            {
                texto: 'Bicos > "Reforma de bancada da cozinha" (R$ 200,00, 1 candidato): Aceitar mostra o alerta "Saldo insuficiente" com o mascote triste e nada muda.',
                ct: 'CT09, CT21, CT22'
            }
        ]
    },
    {
        conta: 'Outro contratante (Marcos Oliveira)',
        email: USUARIOS.marcos.email,
        testes: [
            {
                texto: 'Perfil público dele: avaliações recebidas do trabalhador experiente. Tem 2 vagas abertas que aparecem no feed dos trabalhadores.',
                ct: 'CT17, CT19, CT23'
            }
        ]
    },
    {
        conta: 'Trabalhador com bom histórico (Rafael Souza)',
        email: USUARIOS.rafael.email,
        testes: [
            {
                texto: 'Perfil público: média 4,8 e reputação (4 avaliações recebidas, de bicos concluídos). Candidato Pendente em "Montagem de guarda-roupa".',
                ct: 'CT19, CT23, CT24'
            },
            {
                texto: 'Histórico: bicos finalizados com a nota que ele deu aos contratantes.',
                ct: 'CT17'
            }
        ]
    },
    {
        conta: 'Trabalhador novo, sem avaliações (Juliana Lima)',
        email: USUARIOS.juliana.email,
        testes: [
            {
                texto: 'Perfil público sem avaliações (sem indicadores fictícios). Candidata a bicos pelo feed (ex.: "Poda de cerca viva") e vê o endereço completo só depois de aceita.',
                ct: 'CT07, CT24, CT26'
            }
        ]
    },
    {
        conta: 'Trabalhador aceito no bico em andamento (Diego Santos)',
        email: USUARIOS.diego.email,
        testes: [
            {
                texto: 'Depois de a Carla finalizar "Ajudante para evento": Histórico > aba Concluídos > Abrir conversa (o chat continua liberado, com envio de mensagens) e Ver detalhes (endereço completo liberado). Avaliar a contratante; a nota aparece no perfil público da Carla.',
                ct: 'CT12, CT17, CT26'
            },
            {
                texto: 'No detalhe de bicos em que ele não foi aceito (ex.: "Montagem de guarda-roupa"), o endereço aparece só com a região (bairro/cidade).',
                ct: 'CT26'
            }
        ]
    }
];

// Ordem sugerida: cada passo traz o tempo estimado (em minutos); o total do título é a soma.
const ROTEIRO = [
    {
        min: 2,
        texto: 'Contratante principal: Publicar Bico digitando um CEP (com internet, qualquer CEP real; offline, 01310-100). Veja rua, bairro, cidade e UF preenchidos sozinhos, informe o número, publique e abra o detalhe com o endereço completo. [CT05, CT25]'
    },
    {
        min: 1,
        texto: 'Mesma conta: abra "Montagem de guarda-roupa" e aceite um dos 2 candidatos (saldo e extrato, recusa automática do outro). [CT08]'
    },
    {
        min: 1,
        texto: 'Mesma conta: cancele "Pintura de muro externo" (sem estorno) e olhe a aba Cancelados (a "Instalação de prateleiras" mostra o estorno). [CT14, CT15]'
    },
    {
        min: 2,
        texto: 'Mesma conta: abra "Ajudante para evento", converse no chat e Finalize (R$ 100,00 creditados ao trabalhador). [CT12, CT10]'
    },
    {
        min: 2,
        texto: 'Trabalhador aceito (Diego): em Histórico > aba Concluídos, abra a conversa do evento (o chat segue liberado depois de finalizado, dá para enviar mensagem) e o detalhe, com o endereço completo. Avalie a contratante. [CT17, CT12, CT26]'
    },
    {
        min: 1,
        texto: 'Volte à contratante principal: Meu Perfil > "Ver como os outros veem meu perfil" e veja a nota recebida do Diego (avaliação mútua completa). [CT17, CT19]'
    },
    {
        min: 1,
        texto: 'Mesma conta: em "Troca de resistência do chuveiro" (aba Concluídos) avalie e edite a nota; em "Conserto de torneira" veja o selo "Prazo encerrado". [CT13, CT18]'
    },
    {
        min: 1,
        texto: 'Contratante sem saldo: tente aceitar o candidato de R$ 200,00 e veja o alerta "Saldo insuficiente". [CT09, CT21]'
    },
    {
        min: 1,
        texto: 'Trabalhador novo: veja o feed, candidate-se a "Poda de cerca viva" e confira o perfil público do Rafael (média e reputação). [CT07, CT23]'
    }
];
const TOTAL_MINUTOS = ROTEIRO.reduce((soma, passo) => soma + passo.min, 0);

// ---------------------------------------------------------------- saída: tabela no terminal e Markdown
const linhasCola = () =>
    COLA.flatMap((c) =>
        c.testes.map((t, i) => ({
            conta: i === 0 ? c.conta : '',
            email: i === 0 ? c.email : '',
            senha: i === 0 ? SENHA : '',
            testar: t.texto,
            ct: t.ct
        }))
    );

function tabelaTerminal() {
    const linhas = linhasCola();
    const larguras = { conta: 38, email: 32, senha: 9 };
    const corta = (texto, n) => (texto.length > n ? `${texto.slice(0, n - 1)}…` : texto.padEnd(n));
    const cab = `${corta('CONTA', larguras.conta)} ${corta('E-MAIL', larguras.email)} ${corta('SENHA', larguras.senha)} O QUE TESTAR (CT)`;
    const saida = [cab, '-'.repeat(cab.length + 20)];
    for (const l of linhas) {
        saida.push(
            `${corta(l.conta, larguras.conta)} ${corta(l.email, larguras.email)} ${corta(l.senha, larguras.senha)} ${l.testar} [${l.ct}]`
        );
    }
    return saida.join('\n');
}

function markdownRoteiro() {
    const escapa = (t) => t.replaceAll('|', '\\|');
    const tabela = linhasCola()
        .map(
            (l) =>
                `| ${l.conta} | ${l.email ? `\`${l.email}\`` : ''} | ${l.senha ? `\`${l.senha}\`` : ''} | ${escapa(l.testar)} | ${l.ct} |`
        )
        .join('\n');
    return `# Roteiro de demonstração do iBico

Gerado por \`scripts/preparar-demo.js\` (não edite à mão: rode o script de novo para regenerar). Todos os dados são fictícios.

## Como usar

1. \`npm run demo:preparar\`: recria o banco \`db_bico_demo\` com este cenário (o \`db_bico\` não é tocado). Pede confirmação se o banco já existir; use \`npm run demo:preparar -- --sim\` para pular a pergunta.
2. \`npm run demo\`: sobe o iBico em http://localhost:3000 apontando para o \`db_bico_demo\`, com a consulta real de CEP.
3. Sem internet: \`npm run demo:offline\` (plano B). O CEP passa a ser consultado num provedor falso e só aceita \`01310-100\` (Avenida Paulista, São Paulo) e \`13690-000\` (CEP geral de Descalvado, sem rua).

**Senha de todas as contas:** \`${SENHA}\`. Na tela de login, escolha o perfil (Contratar ou Trabalhar) antes de entrar.

## Contas e o que testar

| Conta | E-mail | Senha | O que testar | Caso de teste |
| --- | --- | --- | --- | --- |
${tabela}

## Ordem sugerida (cerca de ${TOTAL_MINUTOS} minutos)

${ROTEIRO.map((r, i) => `${i + 1}. ${r.texto} ~${r.min} min`).join('\n')}

## Estado inicial dos saldos

- Carla Mendes: R$ 500,00 disponíveis e R$ 100,00 reservados no evento em andamento.
- Beatriz Nogueira: R$ 0,00 (por isso o alerta de saldo insuficiente).
- Marcos Oliveira: R$ 180,00 disponíveis (o resto pagou os 4 bicos do histórico do Rafael).

## Como resetar

Cada teste muda o banco de demonstração. Para voltar ao cenário inicial, pare o \`npm run demo\` (Ctrl+C) e rode \`npm run demo:preparar -- --sim\` outra vez. Todas as contas e bicos são recriados do zero.
`;
}

// ---------------------------------------------------------------- confirmação no terminal
async function confirmarRecriacao() {
    if (process.argv.includes('--sim')) return;
    if (!(await bancoExiste(BANCO))) return;
    if (!process.stdin.isTTY) {
        throw new Error(`O banco ${BANCO} já existe. Rode com --sim para recriá-lo sem confirmação.`);
    }
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    const resposta = (
        await terminal.question(`O banco ${BANCO} já existe e será APAGADO e recriado. Continuar? (s/N) `)
    )
        .trim()
        .toLowerCase();
    terminal.close();
    if (!['s', 'sim', 'y', 'yes'].includes(resposta)) {
        console.log('Cancelado. Nada foi alterado.');
        process.exit(0);
    }
}

// ---------------------------------------------------------------- main
async function main() {
    await confirmarRecriacao();

    console.log(`> Recriando o banco ${BANCO}...`);
    await recriarBanco(BANCO);

    const porta = await portaLivre();
    const base = `http://localhost:${porta}`;
    console.log(`> Subindo o app em ${base} (CEP_FAKE=1, só durante a criação dos dados)...`);
    const servidor = await subirServidor({ porta, banco: BANCO, env: { CEP_FAKE: '1', NODE_ENV: 'development' } });
    const banco = abrirPool(BANCO);
    const ctx = {};

    try {
        const ids = { usuarios: {}, bicos: {}, candidaturas: {} };
        const esperar = (resposta, status, rotulo) => {
            if (resposta.status() !== status) {
                throw new Error(`${rotulo}: esperado HTTP ${status}, recebido ${resposta.status()}`);
            }
        };
        const entrar = async (chave) => {
            const u = USUARIOS[chave];
            const r = await ctx[chave].post(
                `${base}/login`,
                form({ email: u.email, senha: SENHA, tipoPerfil: u.tipo })
            );
            esperar(r, 302, `login de ${chave}`);
        };

        // ---- 1. Usuários ---------------------------------------------------------------------------------
        console.log('> Criando usuários (rotas /cadastrar e /login)...');
        for (const [chave, u] of Object.entries(USUARIOS)) {
            ctx[chave] = await request.newContext();
            const r = await ctx[chave].post(
                `${base}/cadastrar`,
                form({
                    nome: u.nome,
                    email: u.email,
                    cpf: u.cpf,
                    idade: u.idade,
                    senha: SENHA,
                    confirmarSenha: SENHA,
                    tipoPerfil: u.tipo,
                    termos: 'on',
                    maiorIdade: 'true'
                })
            );
            esperar(r, 302, `cadastro de ${chave}`);
            await entrar(chave);
            const [linha] = await banco.query('SELECT id FROM usuarios WHERE email = ?', [u.email]);
            ids.usuarios[chave] = Number(linha.id);
        }

        // ---- 2. Saldo nas carteiras ----------------------------------------------------------------------
        // Carla: 760 = 500 que sobram + 100 reservados no evento + 90 e 70 pagos nos bicos finalizados.
        // Marcos: 600 = 420 pagos nos 4 bicos do histórico + 180 que sobram. Beatriz fica com R$ 0,00.
        console.log('> Adicionando saldo simulado...');
        for (const [chave, valor] of [
            ['carla', '500.00'],
            ['carla', '260.00'],
            ['marcos', '600.00']
        ]) {
            const r = await ctx[chave].post(`${base}/carteira/contratante/adicionar-saldo`, form({ valor }));
            esperar(r, 302, `adicionar saldo de ${chave}`);
        }

        // ---- 3. Bicos (endereço por CEP) -----------------------------------------------------------------
        console.log('> Publicando bicos...');
        for (const chave of ORDEM_PUBLICACAO) {
            const b = BICOS[chave];
            const r = await ctx[b.dono].post(
                `${base}/bicos/novo`,
                form({
                    titulo: b.titulo,
                    descricao: b.descricao,
                    valor: b.valor,
                    cep: b.cep || CEP_TESTE,
                    ...(b.logradouro ? { logradouro: b.logradouro, bairro: b.bairro } : {}),
                    numero: b.numero,
                    complemento: b.complemento || '',
                    data_servico: dataRelativa(b.dias),
                    horario: b.horario
                })
            );
            esperar(r, 302, `publicar ${chave}`);
            const [linha] = await banco.query('SELECT id FROM bicos WHERE titulo = ? AND contratante_id = ?', [
                b.titulo,
                ids.usuarios[b.dono]
            ]);
            ids.bicos[chave] = Number(linha.id);
        }

        // ---- 4. Candidaturas, aceites, chat, finalizações, avaliações e cancelamento ---------------------
        const candidatar = async (trabalhador, bico, mensagem) => {
            const r = await ctx[trabalhador].post(
                `${base}/bicos/candidatar`,
                form({ bico_id: String(ids.bicos[bico]), mensagem })
            );
            esperar(r, 302, `candidatura de ${trabalhador} em ${bico}`);
            const [linha] = await banco.query('SELECT id FROM candidaturas WHERE bico_id = ? AND trabalhador_id = ?', [
                ids.bicos[bico],
                ids.usuarios[trabalhador]
            ]);
            ids.candidaturas[`${bico}:${trabalhador}`] = Number(linha.id);
        };
        const aceitar = async (dono, bico, trabalhador) => {
            const r = await ctx[dono].post(
                `${base}/bicos/candidaturas/status`,
                form({ candidatura_id: String(ids.candidaturas[`${bico}:${trabalhador}`]), novo_status: 'Aceito' })
            );
            esperar(r, 302, `aceitar ${trabalhador} em ${bico}`);
        };
        const finalizar = async (dono, bico) => {
            const r = await ctx[dono].post(`${base}/bicos/${ids.bicos[bico]}/finalizar`, {
                failOnStatusCode: false,
                headers: { Accept: 'application/json' }
            });
            esperar(r, 200, `finalizar ${bico}`);
        };
        const avaliar = async (quem, bico, nota, comentario) => {
            const r = await ctx[quem].post(`${base}/bicos/${ids.bicos[bico]}/avaliacao`, {
                form: { nota: String(nota), comentario },
                failOnStatusCode: false,
                headers: { Accept: 'application/json' }
            });
            esperar(r, 200, `avaliar ${bico}`);
        };

        console.log('> Candidaturas, aceites, finalizações, avaliações e chat...');

        // Histórico do trabalhador experiente (Rafael) com o Marcos: 4 bicos concluídos e avaliados.
        const historico = [
            [
                'h1',
                5,
                'Pintura bem feita e acabamento caprichado. Entregou no combinado.',
                5,
                'O Marcos deixou tudo pronto e pagou na hora.'
            ],
            [
                'h2',
                5,
                'Rafael refez a parede com capricho e deixou a sala limpa. Recomendo!',
                4,
                'Tudo combinado foi cumprido, só atrasou o acesso.'
            ],
            ['h3', 4, 'Serviço bom e pontual. Só demorou um pouco para terminar a vedação.', null, null],
            ['h4', 5, 'Instalação perfeita dos dois ventiladores, sem sujeira. Muito profissional.', null, null]
        ];
        for (const [bico, nota, comentario, notaDele, comentarioDele] of historico) {
            await candidatar('rafael', bico, 'Tenho experiência na área e levo o material e as ferramentas próprias.');
            await aceitar('marcos', bico, 'rafael');
            await finalizar('marcos', bico);
            await avaliar('marcos', bico, nota, comentario);
            if (notaDele) await avaliar('rafael', bico, notaDele, comentarioDele);
        }

        // e) finalizado há 8 dias, sem avaliação; d) finalizado ontem, sem avaliações (Diego).
        for (const [bico, mensagem] of [
            ['e', 'Sou encanador autônomo há 5 anos e posso ir na quinta de manhã.'],
            ['d', 'Faço instalação elétrica residencial e levo o multímetro para testar a fiação.']
        ]) {
            await candidatar('diego', bico, mensagem);
            await aceitar('carla', bico, 'diego');
            await finalizar('carla', bico);
        }

        // f) cancelado em andamento (estorno da reserva).
        await candidatar('diego', 'f', 'Instalo prateleiras com nível a laser e levo a furadeira.');
        await aceitar('carla', 'f', 'diego');
        const cancelamento = await ctx.carla.post(`${base}/bicos/${ids.bicos.f}/cancelar`, {
            form: { motivo: 'Mudei o projeto do escritório e não vou mais instalar as prateleiras agora.' },
            failOnStatusCode: false
        });
        esperar(cancelamento, 200, 'cancelar f');

        // c) em andamento (Diego aceito) com conversa no chat.
        await candidatar('diego', 'c', 'Já trabalhei em eventos e tenho disponibilidade no sábado inteiro.');
        await aceitar('carla', 'c', 'diego');
        const conversa = [
            ['carla', 'Oi Diego, aceitei sua candidatura para o evento. Você consegue chegar às 9h30?'],
            ['diego', 'Olá, Carla! Consigo sim. Preciso levar algum equipamento?'],
            ['carla', 'Só roupa confortável e sapato fechado. Nós fornecemos luvas e almoço.'],
            ['diego', 'Perfeito! Qual é o endereço completo?'],
            ['carla', 'Está liberado no detalhe do bico: Avenida Paulista, 1200, salão de festas.'],
            ['diego', 'Combinado, estarei lá às 9h30. Até sábado!']
        ];
        for (const [quem, texto] of conversa) {
            const r = await ctx[quem].post(`${base}/bicos/candidaturas/${ids.candidaturas['c:diego']}/chat/mensagens`, {
                form: { texto },
                failOnStatusCode: false
            });
            if (!r.ok()) throw new Error(`mensagem de ${quem}: HTTP ${r.status()}`);
        }

        // a) aberto com 2 candidatos Pendentes (Rafael e Juliana); b) aberto sem candidatos (nada a fazer).
        await candidatar('rafael', 'a', 'Monto móveis há 3 anos e levo parafusadeira própria.');
        await candidatar('juliana', 'a', 'Tenho experiência com montagem de guarda-roupas de várias marcas.');

        // Beatriz (sem saldo): aberto com 1 candidato Pendente.
        await candidatar('juliana', 'semSaldo', 'Faço acabamento de bancadas e levo as ferramentas.');

        // ---- 5. Datas envelhecidas (só SQL de datas, pelas mesmas colunas que a aplicação usa) -----------
        console.log('> Envelhecendo datas de finalização e avaliação...');
        // [bico, dias desde a finalização]. d: ontem; e: 8 dias (prazo encerrado); h1-h4: histórico antigo.
        const envelhecer = [
            ['d', 1],
            ['e', 8],
            ['h1', 18],
            ['h2', 15],
            ['h3', 12],
            ['h4', 10]
        ];
        for (const [bico, dias] of envelhecer) {
            const id = ids.bicos[bico];
            await banco.query(
                "UPDATE historico_eventos_bicos SET data_evento = NOW() - INTERVAL ? DAY WHERE bico_id = ? AND status_novo = 'Finalizado'",
                [dias, id]
            );
            await banco.query(
                "UPDATE movimentacoes_carteira SET criado_em = NOW() - INTERVAL ? DAY WHERE bico_id = ? AND tipo_movimentacao = 'CREDITO'",
                [dias, id]
            );
            await banco.query(
                'UPDATE avaliacoes SET criado_em = NOW() - INTERVAL ? DAY, data_atualizacao = NOW() - INTERVAL ? DAY WHERE bico_id = ?',
                [dias, dias, id]
            );
            // Publicação, candidatura e reserva acontecem antes da finalização (ordem coerente nas telas).
            await banco.query('UPDATE bicos SET criado_em = NOW() - INTERVAL ? DAY WHERE id = ?', [dias + 4, id]);
            await banco.query(
                'UPDATE candidaturas SET criado_em = NOW() - INTERVAL ? DAY, atualizado_em = NOW() - INTERVAL ? DAY WHERE bico_id = ?',
                [dias + 3, dias + 2, id]
            );
            await banco.query(
                'UPDATE historico_candidaturas h JOIN candidaturas c ON c.id = h.candidatura_id SET h.data_alteracao = NOW() - INTERVAL ? DAY WHERE c.bico_id = ?',
                [dias + 2, id]
            );
            await banco.query(
                "UPDATE movimentacoes_carteira SET criado_em = NOW() - INTERVAL ? DAY WHERE bico_id = ? AND tipo_movimentacao = 'RESERVA'",
                [dias + 2, id]
            );
        }

        // ---- 6. Conferência rápida do cenário ------------------------------------------------------------
        const [conferencia] = await banco.query(
            `SELECT
                (SELECT COUNT(*) FROM bicos WHERE status = 'Aberto') AS abertos,
                (SELECT COUNT(*) FROM bicos WHERE status = 'Em andamento') AS andamento,
                (SELECT COUNT(*) FROM bicos WHERE status = 'Finalizado') AS finalizados,
                (SELECT COUNT(*) FROM bicos WHERE status = 'Cancelado') AS cancelados`
        );
        console.log(
            `> Cenário criado: ${conferencia.abertos} abertos, ${conferencia.andamento} em andamento, ` +
                `${conferencia.finalizados} finalizados, ${conferencia.cancelados} cancelados.`
        );
    } finally {
        await Promise.all(Object.values(ctx).map((c) => c.dispose()));
        await banco.end();
        servidor.kill();
    }

    mkdirSync(path.dirname(ARQUIVO_ROTEIRO), { recursive: true });
    writeFileSync(ARQUIVO_ROTEIRO, markdownRoteiro(), 'utf8');

    console.log(`\nSenha de todas as contas: ${SENHA}\n`);
    console.log(tabelaTerminal());
    console.log(`\nRoteiro salvo em ${path.relative(RAIZ, ARQUIVO_ROTEIRO)}.`);
    console.log('Para abrir o iBico: npm run demo   (sem internet: npm run demo:offline)');
}

main().catch((erro) => {
    console.error('\nFalha ao preparar a demonstração:', erro);
    process.exit(1);
});

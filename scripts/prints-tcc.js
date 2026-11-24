// Gera as capturas de tela do iBico para o TCC (Docs/Prints/*.png).
//
// NÃO faz parte do `npm test`. Execute manualmente com:  node scripts/prints-tcc.js
//
// O que o script faz:
//   1. Recria um banco SEPARADO (db_bico_prints) a partir do schema.sql. O banco db_bico não é tocado.
//   2. Sobe o próprio app (app.js) na porta 3100 apontando para esse banco.
//   3. Cria os dados fictícios pelas rotas reais da aplicação (cadastro, login, carteira, bicos, candidaturas, chat...).
//      O SQL direto só é usado para consultar ids e para espalhar datas/horas (aparência realista).
//   4. Abre o Chromium (1440x900, deviceScaleFactor 2) e salva os PNGs em Docs/Prints.
//
// Nenhum código da aplicação é alterado. Todos os dados (nomes, CPFs, e-mails, valores) são fictícios.
import { chromium } from '@playwright/test';
import mariadb from 'mariadb';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import {
    RAIZ,
    pausa,
    cpfValido,
    dataRelativa,
    form,
    opcoesConexao,
    recriarBanco,
    subirServidor
} from './lib/demo-comum.js';

const BANCO = 'db_bico_prints';
const PORTA = 3100;
const BASE = `http://localhost:${PORTA}`;
const PASTA_PRINTS = path.join(RAIZ, 'Docs', 'Prints');
const SENHA = 'ibico123';

// ---------------------------------------------------------------- dados fictícios
const USUARIOS = {
    carla: {
        nome: 'Carla Mendes',
        email: 'carla.mendes@exemplo.com',
        cpf: cpfValido('384729156'),
        idade: '38',
        tipo: 'contratante'
    },
    marcos: {
        nome: 'Marcos Oliveira',
        email: 'marcos.oliveira@exemplo.com',
        cpf: cpfValido('529173846'),
        idade: '45',
        tipo: 'contratante'
    },
    rafael: {
        nome: 'Rafael Souza',
        email: 'rafael.souza@exemplo.com',
        cpf: cpfValido('617284953'),
        idade: '27',
        tipo: 'trabalhador'
    },
    juliana: {
        nome: 'Juliana Lima',
        email: 'juliana.lima@exemplo.com',
        cpf: cpfValido('742915368'),
        idade: '31',
        tipo: 'trabalhador'
    },
    diego: {
        nome: 'Diego Santos',
        email: 'diego.santos@exemplo.com',
        cpf: cpfValido('853261479'),
        idade: '23',
        tipo: 'trabalhador'
    },
    beatriz: {
        nome: 'Beatriz Nogueira',
        email: 'beatriz.nogueira@exemplo.com',
        cpf: cpfValido('196348275'),
        idade: '36',
        tipo: 'contratante'
    }
};

// dono: quem publica. dias: deslocamento da data do serviço (negativo = já realizado).
const BICOS = {
    torneira: {
        dono: 'carla',
        titulo: 'Conserto de torneira',
        bairro: 'Taquaral',
        valor: '80.00',
        dias: -4,
        horario: '09:00',
        descricao:
            'Torneira da cozinha pingando e registro com vazamento. Levar vedante e chave inglesa; o material de reposição eu forneço.'
    },
    limpeza: {
        dono: 'carla',
        titulo: 'Limpeza pós-obra',
        bairro: 'Guanabara',
        valor: '220.00',
        dias: 3,
        horario: '08:00',
        descricao:
            'Limpeza completa de apartamento de 70 m² após reforma: remoção de poeira, resíduos de tinta e limpeza dos vidros.'
    },
    evento: {
        dono: 'carla',
        titulo: 'Ajudante para evento',
        bairro: 'Barão Geraldo',
        valor: '200.00',
        dias: 4,
        horario: '10:00',
        descricao:
            'Ajudante para montagem de mesas e cadeiras, apoio no buffet e organização do espaço em confraternização de família.'
    },
    guardaRoupa: {
        dono: 'carla',
        titulo: 'Montagem de guarda-roupa',
        bairro: 'Cambuí',
        valor: '150.00',
        dias: 5,
        horario: '14:00',
        descricao:
            'Montagem de guarda-roupa de 6 portas com espelho. As ferramentas básicas ficam por conta do profissional.'
    },
    chuveiro: {
        dono: 'carla',
        titulo: 'Troca de resistência do chuveiro',
        bairro: 'Nova Campinas',
        valor: '90.00',
        dias: -2,
        horario: '16:00',
        descricao:
            'Troca da resistência e revisão da fiação do chuveiro elétrico do banheiro social. Resistência já comprada.'
    },
    portao: {
        dono: 'marcos',
        titulo: 'Pintura de portão',
        bairro: 'Castelo',
        valor: '250.00',
        dias: -7,
        horario: '08:30',
        descricao:
            'Lixar e pintar portão de ferro de 3 metros com tinta esmalte preta. Tinta e pincéis por minha conta.'
    },
    jardinagem: {
        dono: 'marcos',
        titulo: 'Poda de cerca viva',
        bairro: 'Sousas',
        valor: '180.00',
        dias: 7,
        horario: '07:30',
        descricao:
            'Poda e retirada dos galhos de cerca viva com cerca de 25 metros de extensão, incluindo o descarte dos resíduos.'
    },
    prateleiras: {
        dono: 'marcos',
        titulo: 'Instalação de prateleiras',
        bairro: 'Mansões Santo Antônio',
        valor: '120.00',
        dias: 2,
        horario: '15:00',
        descricao:
            'Instalar 5 prateleiras de madeira em parede de alvenaria no escritório. Furadeira e buchas já inclusas.'
    },
    estante: {
        dono: 'marcos',
        titulo: 'Montagem de estante de escritório',
        bairro: 'Jardim Chapadão',
        valor: '130.00',
        dias: 8,
        horario: '10:30',
        descricao: 'Montagem de estante grande de escritório com 4 módulos e fixação na parede para evitar tombamento.'
    },
    calcada: {
        dono: 'marcos',
        titulo: 'Lavagem de calçada e quintal',
        bairro: 'Bosque',
        valor: '110.00',
        dias: 3,
        horario: '09:30',
        descricao:
            'Lavagem com lavadora de alta pressão da calçada e do quintal de uma casa térrea. A lavadora é fornecida.'
    },
    ventilador: {
        dono: 'marcos',
        titulo: 'Instalação de ventilador de teto',
        bairro: 'Taquaral',
        valor: '100.00',
        dias: 9,
        horario: '13:30',
        descricao:
            'Instalar dois ventiladores de teto em quarto e sala, com fixação no forro e ligação elétrica ao interruptor.'
    },
    // Finalizados pelo Marcos (Rafael): um dentro do prazo de avaliação e outro com o prazo já encerrado.
    reboco: {
        dono: 'marcos',
        titulo: 'Reparo de reboco na parede da sala',
        bairro: 'Castelo',
        valor: '140.00',
        dias: -3,
        horario: '08:00',
        descricao:
            'Remover o reboco solto de uma parede de 12 m² da sala, refazer a massa e deixar pronta para pintura.'
    },
    telhado: {
        dono: 'marcos',
        titulo: 'Troca de telhas do quintal',
        bairro: 'Sousas',
        valor: '160.00',
        dias: -10,
        horario: '07:30',
        descricao: 'Substituir 30 telhas quebradas da cobertura do quintal e vedar as emendas com manta.'
    },
    // Cancelados pelo Marcos: um ainda aberto (sem estorno) e um já aceito (com estorno).
    persiana: {
        dono: 'marcos',
        titulo: 'Instalação de persianas',
        bairro: 'Mansões Santo Antônio',
        valor: '120.00',
        dias: 6,
        horario: '09:00',
        descricao: 'Instalar três persianas de enrolar nas janelas do escritório, com fixação em parede de alvenaria.'
    },
    azulejo: {
        dono: 'marcos',
        titulo: 'Troca de azulejos da cozinha',
        bairro: 'Jardim Chapadão',
        valor: '130.00',
        dias: 5,
        horario: '13:00',
        descricao: 'Retirar o revestimento antigo da parede da pia e assentar azulejos novos, com rejunte e acabamento.'
    }
};

// ---------------------------------------------------------------- main
async function main() {
    mkdirSync(PASTA_PRINTS, { recursive: true });

    console.log(`> Recriando o banco ${BANCO}...`);
    await recriarBanco(BANCO);

    console.log(`> Subindo o app em ${BASE}...`);
    const servidor = await subirServidor({ porta: PORTA, banco: BANCO });

    const banco = mariadb.createPool({
        ...opcoesConexao(),
        database: BANCO,
        connectionLimit: 3
    });
    const browser = await chromium.launch({ headless: true });

    try {
        const ctx = {};
        const ids = { usuarios: {}, bicos: {}, candidaturas: {} };
        const novoContexto = (opcoes = {}) =>
            browser.newContext({
                viewport: { width: 1440, height: 900 },
                deviceScaleFactor: 2,
                locale: 'pt-BR',
                timezoneId: 'America/Sao_Paulo',
                ...opcoes
            });
        const esperar = async (resposta, status, rotulo) => {
            if (resposta.status() !== status) {
                throw new Error(`${rotulo}: esperado HTTP ${status}, recebido ${resposta.status()}`);
            }
        };
        const entrar = async (chave) => {
            const u = USUARIOS[chave];
            const r = await ctx[chave].request.post(
                `${BASE}/login`,
                form({ email: u.email, senha: SENHA, tipoPerfil: u.tipo })
            );
            await esperar(r, 302, `login de ${chave}`);
        };

        // ---- 1. Usuários -----------------------------------------------------------------------------------
        console.log('> Criando usuários (rotas /cadastrar e /login)...');
        for (const [chave, u] of Object.entries(USUARIOS)) {
            ctx[chave] = await novoContexto();
            const r = await ctx[chave].request.post(
                `${BASE}/cadastrar`,
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
            await esperar(r, 302, `cadastro de ${chave}`);
            await entrar(chave);
            const [linha] = await banco.query('SELECT id FROM usuarios WHERE email = ?', [u.email]);
            ids.usuarios[chave] = Number(linha.id);
        }

        // ---- 2. Saldo nas carteiras ------------------------------------------------------------------------
        console.log('> Adicionando saldo simulado...');
        for (const [chave, valor] of [
            ['carla', '500.00'],
            ['marcos', '1500.00'],
            ['carla', '300.00'],
            ['beatriz', '100.00']
        ]) {
            const r = await ctx[chave].request.post(`${BASE}/carteira/contratante/adicionar-saldo`, form({ valor }));
            await esperar(r, 302, `adicionar saldo de ${chave}`);
        }

        // ---- 3. Bicos publicados (ordem = ordem de criação) -----------------------------------------------
        console.log('> Publicando bicos...');
        const ordemPublicacao = [
            'torneira',
            'portao',
            'limpeza',
            'evento',
            'jardinagem',
            'prateleiras',
            'calcada',
            'estante',
            'ventilador',
            'chuveiro',
            'guardaRoupa',
            'reboco',
            'telhado',
            'persiana',
            'azulejo'
        ];
        for (const chave of ordemPublicacao) {
            const b = BICOS[chave];
            const r = await ctx[b.dono].request.post(
                `${BASE}/bicos/novo`,
                form({
                    titulo: b.titulo,
                    descricao: b.descricao,
                    valor: b.valor,
                    bairro: b.bairro,
                    data_servico: dataRelativa(b.dias),
                    horario: b.horario
                })
            );
            await esperar(r, 302, `publicar ${chave}`);
            const [linha] = await banco.query('SELECT id FROM bicos WHERE titulo = ? AND contratante_id = ?', [
                b.titulo,
                ids.usuarios[b.dono]
            ]);
            ids.bicos[chave] = Number(linha.id);
        }

        // ---- 4. Fluxos de candidatura ----------------------------------------------------------------------
        const candidatar = async (trabalhador, bico, mensagem) => {
            const r = await ctx[trabalhador].request.post(
                `${BASE}/bicos/candidatar`,
                form({ bico_id: String(ids.bicos[bico]), mensagem })
            );
            await esperar(r, 302, `candidatura de ${trabalhador} em ${bico}`);
            const [linha] = await banco.query('SELECT id FROM candidaturas WHERE bico_id = ? AND trabalhador_id = ?', [
                ids.bicos[bico],
                ids.usuarios[trabalhador]
            ]);
            ids.candidaturas[`${bico}:${trabalhador}`] = Number(linha.id);
        };
        const decidir = async (dono, bico, trabalhador, novoStatus) => {
            const r = await ctx[dono].request.post(
                `${BASE}/bicos/candidaturas/status`,
                form({
                    candidatura_id: String(ids.candidaturas[`${bico}:${trabalhador}`]),
                    novo_status: novoStatus
                })
            );
            await esperar(r, 302, `${novoStatus} ${trabalhador} em ${bico}`);
        };
        const finalizar = async (dono, bico) => {
            const r = await ctx[dono].request.post(`${BASE}/bicos/${ids.bicos[bico]}/finalizar`, {
                failOnStatusCode: false,
                headers: { Accept: 'application/json' }
            });
            await esperar(r, 200, `finalizar ${bico}`);
        };
        const avaliar = async (dono, bico, nota, comentario) => {
            const r = await ctx[dono].request.post(`${BASE}/bicos/${ids.bicos[bico]}/avaliacao`, {
                form: { nota: String(nota), comentario },
                failOnStatusCode: false,
                headers: { Accept: 'application/json' }
            });
            await esperar(r, 200, `avaliar ${bico}`);
        };

        console.log('> Candidaturas, aceites, finalizações e avaliações...');
        // Dois bicos finalizados e avaliados para o Rafael (avaliadores diferentes).
        await candidatar('rafael', 'torneira', 'Olá! Sou encanador autônomo há 5 anos e posso ir na quinta de manhã.');
        await decidir('carla', 'torneira', 'rafael', 'Aceito');
        await finalizar('carla', 'torneira');
        await avaliar(
            'carla',
            'torneira',
            5,
            'Rafael foi pontual, resolveu o vazamento rapidamente e deixou a cozinha limpa. Recomendo!'
        );

        await candidatar(
            'rafael',
            'portao',
            'Tenho experiência com pintura em ferro e levo o material de lixa e proteção.'
        );
        await decidir('marcos', 'portao', 'rafael', 'Aceito');
        await finalizar('marcos', 'portao');
        await avaliar(
            'marcos',
            'portao',
            4,
            'Pintura bem feita e acabamento caprichado. Atrasou um pouco no início, mas entregou no combinado.'
        );

        // Avaliações no sentido inverso: o trabalhador avalia o contratante do mesmo bico.
        await avaliar(
            'rafael',
            'torneira',
            5,
            'A Carla explicou tudo direitinho, deixou o material separado e pagou na hora. Contratante nota 10.'
        );
        await avaliar(
            'rafael',
            'portao',
            5,
            'O Marcos deixou o portão liberado e a tinta pronta. Tudo combinado foi cumprido, foi tranquilo trabalhar.'
        );

        // Terceiro bico finalizado: Juliana e Carla se avaliam (Carla fecha com média 4,5 em 2 avaliações).
        await candidatar(
            'juliana',
            'chuveiro',
            'Sou eletricista de residências e levo o multímetro para testar a fiação antes de trocar a resistência.'
        );
        await decidir('carla', 'chuveiro', 'juliana', 'Aceito');
        await finalizar('carla', 'chuveiro');
        await avaliar(
            'carla',
            'chuveiro',
            5,
            'A Juliana trocou a resistência, revisou a fiação e ainda me explicou como evitar o problema. Muito profissional.'
        );
        await avaliar(
            'juliana',
            'chuveiro',
            4,
            'A Carla foi cordial e pagou certinho. Só demorou um pouco para liberar o acesso ao banheiro.'
        );

        // Dois bicos do Marcos finalizados pelo Rafael e ainda sem avaliação de nenhum dos lados
        // (um dentro do prazo e outro, ajustado mais abaixo, com o prazo encerrado).
        for (const chave of ['reboco', 'telhado']) {
            await candidatar(
                'rafael',
                chave,
                'Tenho experiência na área e posso começar na data combinada, com material e ferramentas próprias.'
            );
            await decidir('marcos', chave, 'rafael', 'Aceito');
            await finalizar('marcos', chave);
        }

        // Cancelados pelo Marcos: um aberto (sem estorno) e um já aceito pelo Diego (com estorno da reserva).
        const cancelarBico = async (dono, chave, motivo) => {
            const r = await ctx[dono].request.post(`${BASE}/bicos/${ids.bicos[chave]}/cancelar`, {
                form: { motivo },
                failOnStatusCode: false
            });
            await esperar(r, 200, `cancelar ${chave}`);
        };
        await cancelarBico('marcos', 'persiana', 'Contratei outro profissional por indicação de um vizinho.');
        await candidatar('diego', 'azulejo', 'Faço assentamento de revestimentos há 6 anos e levo as ferramentas.');
        await decidir('marcos', 'azulejo', 'diego', 'Aceito');
        await cancelarBico(
            'marcos',
            'azulejo',
            'Mudei o projeto da cozinha e não vou mais trocar o revestimento agora.'
        );

        // Bico cancelado com estorno: aceita a Juliana (o Rafael é recusado automaticamente) e depois cancela.
        await candidatar('rafael', 'limpeza', 'Posso fazer a limpeza no dia combinado, tenho equipamento próprio.');
        await candidatar('juliana', 'limpeza', 'Trabalho com limpeza pós-obra e levo meus produtos.');
        await decidir('carla', 'limpeza', 'juliana', 'Aceito');
        const cancelamento = await ctx.carla.request.post(`${BASE}/bicos/${ids.bicos.limpeza}/cancelar`, {
            form: { motivo: 'A reforma atrasou e o apartamento ainda não está liberado.' },
            failOnStatusCode: false
        });
        await esperar(cancelamento, 200, 'cancelar limpeza');

        // Bico em andamento com conversa (também usado na tela do modal de cancelamento).
        await candidatar('rafael', 'evento', 'Já trabalhei em eventos e tenho disponibilidade no sábado inteiro.');
        await candidatar('juliana', 'evento', 'Tenho experiência com buffet e organização de salão.');
        await candidatar('diego', 'evento', 'Estou disponível e posso carregar peso sem problemas.');
        await decidir('carla', 'evento', 'rafael', 'Aceito');

        const conversa = [
            ['carla', 'Oi Rafael, aceitei sua candidatura para o evento de sábado. Você consegue chegar às 8h30?'],
            ['rafael', 'Olá, Carla! Consigo sim. Preciso levar algum equipamento?'],
            ['carla', 'Só roupa confortável e sapato fechado. Nós fornecemos luvas e almoço.'],
            ['rafael', 'Perfeito! Qual é o endereço completo?'],
            ['carla', 'Rua das Palmeiras, 245, em Barão Geraldo. O portão é azul, é só tocar a campainha.'],
            ['rafael', 'Combinado, estarei lá às 8h30. Até sábado!']
        ];
        for (const [quem, texto] of conversa) {
            const r = await ctx[quem].request.post(
                `${BASE}/bicos/candidaturas/${ids.candidaturas['evento:rafael']}/chat/mensagens`,
                {
                    form: { texto },
                    failOnStatusCode: false
                }
            );
            if (!r.ok()) throw new Error(`mensagem de ${quem}: HTTP ${r.status()}`);
        }

        // Bico aberto com 3 candidatos pendentes (tela de gerenciamento).
        await candidatar(
            'rafael',
            'guardaRoupa',
            'Monto móveis há 3 anos e levo parafusadeira própria. Posso ir no horário combinado.'
        );
        await candidatar('juliana', 'guardaRoupa', 'Tenho experiência com montagem de guarda-roupas de várias marcas.');
        await candidatar('diego', 'guardaRoupa', 'Disponível na data. Faço a montagem com cuidado e deixo tudo limpo.');

        // Outras candidaturas para o histórico do Rafael (pendente em outra vaga e uma candidatura cancelada por ele).
        await candidatar('rafael', 'ventilador', 'Faço instalação elétrica residencial e posso ir à tarde.');
        await candidatar('juliana', 'jardinagem', 'Tenho equipamento de poda e posso levar um ajudante.');
        await candidatar('rafael', 'prateleiras', 'Posso fazer a instalação com nível a laser.');
        const cancelarCand = await ctx.rafael.request.post(
            `${BASE}/bicos/candidaturas/cancelar`,
            form({ bico_id: String(ids.bicos.prateleiras) })
        );
        await esperar(cancelarCand, 302, 'cancelamento de candidatura do Rafael');

        // ---- 5. Datas/horas espalhadas (aparência realista) ------------------------------------------------
        console.log('> Ajustando carimbos de data/hora...');
        const movs = await banco.query('SELECT id FROM movimentacoes_carteira ORDER BY id');
        for (let i = 0; i < movs.length; i++) {
            const horas = (movs.length - i) * 8;
            await banco.query('UPDATE movimentacoes_carteira SET criado_em = NOW() - INTERVAL ? HOUR WHERE id = ?', [
                horas,
                movs[i].id
            ]);
        }
        for (let i = 0; i < ordemPublicacao.length; i++) {
            const horas = (ordemPublicacao.length - i) * 7 + 2;
            await banco.query('UPDATE bicos SET criado_em = NOW() - INTERVAL ? HOUR WHERE id = ?', [
                horas,
                ids.bicos[ordemPublicacao[i]]
            ]);
        }
        const msgs = await banco.query('SELECT id FROM mensagens_chat ORDER BY id');
        for (let i = 0; i < msgs.length; i++) {
            const minutos = (msgs.length - i) * 6 + 50;
            await banco.query('UPDATE mensagens_chat SET criado_em = NOW() - INTERVAL ? MINUTE WHERE id = ?', [
                minutos,
                msgs[i].id
            ]);
        }
        // Finalização e avaliações: torneira (há 2 dias) e chuveiro (há 1 dia) ainda estão dentro do prazo de 7 dias;
        // o portão (10 dias) e o telhado (9 dias) já estão com o prazo encerrado (avaliação só para leitura).
        // O reboco (2 dias) fica sem avaliação de ambos os lados: selo "Avaliar" / "Avaliar contratante".
        // A data é definida explicitamente nas duas colunas (evita o ON UPDATE sobrescrever).
        for (const [bico, dias] of [
            ['torneira', 2],
            ['chuveiro', 1],
            ['portao', 10],
            ['reboco', 2],
            ['telhado', 9]
        ]) {
            await banco.query(
                "UPDATE historico_eventos_bicos SET data_evento = NOW() - INTERVAL ? DAY WHERE bico_id = ? AND status_novo = 'Finalizado'",
                [dias, ids.bicos[bico]]
            );
            await banco.query(
                "UPDATE movimentacoes_carteira SET criado_em = NOW() - INTERVAL ? DAY WHERE bico_id = ? AND tipo_movimentacao = 'CREDITO'",
                [dias, ids.bicos[bico]]
            );
            await banco.query(
                'UPDATE avaliacoes SET criado_em = NOW() - INTERVAL ? DAY, data_atualizacao = NOW() - INTERVAL ? DAY WHERE bico_id = ?',
                [dias, dias, ids.bicos[bico]]
            );
            // Publicação, candidatura e reserva acontecem antes da finalização (ordem cronológica coerente nas telas).
            await banco.query('UPDATE bicos SET criado_em = NOW() - INTERVAL ? DAY WHERE id = ?', [
                dias + 4,
                ids.bicos[bico]
            ]);
            await banco.query(
                'UPDATE candidaturas SET criado_em = NOW() - INTERVAL ? DAY, atualizado_em = NOW() - INTERVAL ? DAY WHERE bico_id = ?',
                [dias + 3, dias + 2, ids.bicos[bico]]
            );
            await banco.query(
                'UPDATE historico_candidaturas h JOIN candidaturas c ON c.id = h.candidatura_id SET h.data_alteracao = NOW() - INTERVAL ? DAY WHERE c.bico_id = ?',
                [dias + 2, ids.bicos[bico]]
            );
            await banco.query(
                "UPDATE movimentacoes_carteira SET criado_em = NOW() - INTERVAL ? DAY WHERE bico_id = ? AND tipo_movimentacao = 'RESERVA'",
                [dias + 2, ids.bicos[bico]]
            );
        }

        // ---- 6. Capturas -----------------------------------------------------------------------------------
        console.log('> Capturando telas...');
        // Sessões novas (a sessão guarda o saldo do momento do login).
        for (const chave of Object.keys(USUARIOS)) await entrar(chave);

        const resultados = [];
        const capturar = async ({
            arquivo,
            usuario,
            url,
            preparar,
            fullPage = false,
            contexto,
            esperarSeletor,
            espera = 700,
            elemento
        }) => {
            const c = contexto || (usuario ? ctx[usuario] : await novoContexto());
            const pagina = await c.newPage();
            const problemas = [];
            pagina.on('pageerror', (e) => problemas.push(`pageerror: ${e.message}`));
            pagina.on('console', (m) => {
                if (m.type() === 'error') problemas.push(`console: ${m.text()}`);
            });
            pagina.on('response', (r) => {
                if (r.status() >= 400 && r.url().startsWith(BASE)) problemas.push(`HTTP ${r.status()} ${r.url()}`);
            });
            try {
                await pagina.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
                if (esperarSeletor) await pagina.waitForSelector(esperarSeletor, { state: 'visible' });
                if (preparar) await preparar(pagina);
                await pagina.evaluate(() => document.fonts.ready);
                await pagina.waitForLoadState('networkidle');
                await pagina.mouse.move(1, 1);
                // Espera as animações dos mascotes (pouso, curioso, triste...) terminarem: a ave sai parada no galho.
                await pausa(espera);
                const alturaConteudo = await pagina.evaluate(() => document.documentElement.scrollHeight);
                const destino = path.join(PASTA_PRINTS, arquivo);
                if (elemento) await pagina.locator(elemento).screenshot({ path: destino });
                else await pagina.screenshot({ path: destino, fullPage });
                resultados.push({ arquivo, ok: true, alturaConteudo, fullPage, problemas });
                console.log(
                    `  ok  ${arquivo}  (altura da página: ${alturaConteudo}px${fullPage ? ', página inteira' : ''})${problemas.length ? '  AVISOS: ' + problemas.join(' | ') : ''}`
                );
            } catch (erro) {
                resultados.push({ arquivo, ok: false, erro: erro.message, problemas });
                console.log(`  FALHOU  ${arquivo}: ${erro.message}`);
            } finally {
                await pagina.close();
            }
        };

        const visitante = await novoContexto();
        const idRafael = ids.usuarios.rafael;
        const idChat = ids.candidaturas['evento:rafael'];

        await capturar({ arquivo: '01-landing-page.png', contexto: visitante, url: '/', espera: 3000 });
        await capturar({ arquivo: '02a-login.png', contexto: visitante, url: '/login' });
        await capturar({ arquivo: '02b-cadastro.png', contexto: visitante, url: '/cadastrar' });
        await capturar({
            arquivo: '03-painel-contratante.png',
            usuario: 'carla',
            url: '/homeContratante',
            fullPage: true
        });
        await capturar({
            arquivo: '04a-gerenciar-bico.png',
            usuario: 'carla',
            url: `/bicos/${ids.bicos.guardaRoupa}/gerenciar`,
            fullPage: true
        });
        await capturar({
            arquivo: '04b-cancelar-bico.png',
            usuario: 'carla',
            url: `/bicos/${ids.bicos.evento}/gerenciar`,
            preparar: async (p) => {
                await p.click('#btn-cancelar-bico');
                await p.waitForSelector('#confirm-cancel-modal[open]');
                await pausa(500);
            }
        });
        await capturar({
            arquivo: '05-painel-trabalhador.png',
            usuario: 'rafael',
            url: '/hometrabalhador',
            fullPage: true
        });
        await capturar({
            arquivo: '06-chat.png',
            usuario: 'carla',
            url: `/bicos/candidaturas/${idChat}/chat`,
            esperarSeletor: '.message'
        });
        await capturar({
            arquivo: '07a-carteira-contratante.png',
            usuario: 'carla',
            url: '/carteira/contratante',
            fullPage: true
        });
        await capturar({ arquivo: '07b-carteira-trabalhador.png', usuario: 'rafael', url: '/carteira/trabalhador' });
        await capturar({ arquivo: '08-perfil-publico.png', usuario: 'carla', url: `/perfil/publico/${idRafael}` });
        await capturar({
            arquivo: '12a-avaliar-trabalhador.png',
            usuario: 'carla',
            url: `/bicos/${ids.bicos.torneira}/gerenciar`,
            fullPage: true,
            esperarSeletor: '#form-avaliacao-bico'
        });
        await capturar({
            arquivo: '12b-avaliar-contratante.png',
            usuario: 'rafael',
            url: `/bicos/${ids.bicos.torneira}`,
            fullPage: true,
            esperarSeletor: '#form-avaliacao-bico'
        });
        await capturar({
            arquivo: '12c-avaliacao-encerrada.png',
            usuario: 'marcos',
            url: `/bicos/${ids.bicos.portao}/gerenciar`,
            fullPage: true,
            esperarSeletor: '#avaliacao-somente-leitura'
        });
        await capturar({
            arquivo: '13-perfil-publico-contratante.png',
            usuario: 'rafael',
            url: `/perfil/publico/${ids.usuarios.carla}`
        });
        await capturar({
            arquivo: '09-publicar-bico.png',
            usuario: 'carla',
            url: '/bicos/novo',
            fullPage: true,
            preparar: async (p) => {
                await p.fill('input[name="titulo"]', 'Instalação de ventilador de teto');
                await p.fill(
                    'textarea[name="descricao"]',
                    'Instalar um ventilador de teto na sala, com fixação no forro e ligação ao interruptor. Ventilador já comprado.'
                );
                await p.fill('input[name="valor"]', '120');
                await p.fill('input[name="bairro"]', 'Cambuí');
                await p.fill('input[name="data_servico"]', dataRelativa(6));
                await p.fill('input[name="horario"]', '14:00');
                await p.evaluate(() => document.activeElement && document.activeElement.blur());
            }
        });
        await capturar({
            arquivo: '10-historico-trabalhador.png',
            usuario: 'rafael',
            url: '/historico',
            preparar: async (p) => {
                await p.click('#tab-concluidos');
                await p.waitForSelector('#fecharDica', { state: 'visible' });
                await p.click('#fecharDica');
                await p.waitForSelector('#dicaPopup', { state: 'hidden' });
            }
        });

        const mobile = await novoContexto({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        await mobile.request.post(
            `${BASE}/login`,
            form({ email: USUARIOS.rafael.email, senha: SENHA, tipoPerfil: 'trabalhador' })
        );
        await capturar({ arquivo: '11-mobile-painel-trabalhador.png', contexto: mobile, url: '/hometrabalhador' });

        // ---- Versão final: abas de Meus Bicos, selos, alerta, dica e comemoração -------------------------
        await capturar({
            arquivo: '14-meus-bicos-concluidos.png',
            usuario: 'marcos',
            url: '/bicos/ativos?aba=concluidos',
            fullPage: true
        });
        await capturar({
            arquivo: '15-meus-bicos-cancelados.png',
            usuario: 'marcos',
            url: '/bicos/ativos?aba=cancelados',
            fullPage: true
        });
        await capturar({
            arquivo: '16-historico-concluidos.png',
            usuario: 'rafael',
            url: '/historico?aba=concluidos',
            fullPage: true,
            preparar: async (p) => {
                await p.waitForSelector('#fecharDica', { state: 'visible' });
                await p.click('#fecharDica');
                await p.waitForSelector('#dicaPopup', { state: 'hidden' });
            }
        });
        await capturar({
            arquivo: '18-publicar-dica.png',
            usuario: 'carla',
            url: '/bicos/novo',
            preparar: async (p) => {
                await p.click('.mascot-assistant__toggle');
                await p.waitForSelector('#mascot-tip', { state: 'visible' });
            },
            espera: 1800
        });

        // Alerta de saldo insuficiente: a Beatriz (saldo R$ 100,00) tenta aceitar um candidato de um bico de R$ 200,00.
        const palco = await ctx.beatriz.request.post(
            `${BASE}/bicos/novo`,
            form({
                titulo: 'Montagem de palco para festa junina',
                descricao:
                    'Montagem de palco de madeira de 4 x 3 metros e instalação da iluminação básica para uma festa junina de bairro.',
                valor: '200.00',
                bairro: 'Cambuí',
                data_servico: dataRelativa(10),
                horario: '15:00'
            })
        );
        await esperar(palco, 302, 'publicar palco');
        const [bicoPalco] = await banco.query('SELECT id FROM bicos WHERE titulo = ? AND contratante_id = ?', [
            'Montagem de palco para festa junina',
            ids.usuarios.beatriz
        ]);
        const rPalco = await ctx.diego.request.post(
            `${BASE}/bicos/candidatar`,
            form({
                bico_id: String(bicoPalco.id),
                mensagem: 'Tenho experiência em montagem de estruturas de madeira e posso ir com um ajudante.'
            })
        );
        await esperar(rPalco, 302, 'candidatura no palco');
        await capturar({
            arquivo: '17-alerta-saldo-insuficiente.png',
            usuario: 'beatriz',
            url: `/bicos/${bicoPalco.id}/gerenciar`,
            preparar: async (p) => {
                await p.getByRole('button', { name: 'Aceitar' }).click();
                await p.waitForSelector('#alerta-sistema');
            },
            espera: 2400
        });

        // Sucesso depois de avaliar: o Marcos avalia o Rafael no bico do reboco e a araponga comemora (meio do movimento).
        await capturar({
            arquivo: '19-sucesso-avaliacao.png',
            usuario: 'marcos',
            url: `/bicos/${ids.bicos.reboco}/gerenciar`,
            esperarSeletor: '#form-avaliacao-bico',
            elemento: '.evaluation-section',
            espera: 0,
            preparar: async (p) => {
                await p.locator('label[for="nota-5"]').click();
                await p
                    .locator('#comentario-avaliacao')
                    .fill('Reboco bem acabado e parede pronta para pintar. Trabalho limpo e dentro do prazo.');
                await p.locator('#btn-salvar-avaliacao').click();
                await p.waitForSelector('#feedback-avaliacao-bico .mascote');
                await pausa(380);
            }
        });

        // Versão com reputação: o trabalhador (Diego) vê o bloco "Sobre o contratante" antes de se candidatar
        // e o Rafael confere os números reais em "Meu Perfil".
        await capturar({
            arquivo: '20-sobre-o-contratante.png',
            usuario: 'diego',
            url: `/bicos/${ids.bicos.calcada}`,
            fullPage: true,
            esperarSeletor: '#sobre-contratante'
        });
        await capturar({
            arquivo: '21-perfil-privado-trabalhador.png',
            usuario: 'rafael',
            url: '/perfil',
            fullPage: true
        });

        console.log('\n> Resumo');
        console.log(
            JSON.stringify(
                {
                    ids,
                    resultados: resultados.map(({ arquivo, ok, erro, alturaConteudo }) => ({
                        arquivo,
                        ok,
                        erro,
                        alturaConteudo
                    }))
                },
                null,
                2
            )
        );
    } finally {
        await browser.close();
        await banco.end();
        servidor.kill();
    }
}

main().catch((erro) => {
    console.error('\nFalha ao gerar os prints:', erro);
    process.exitCode = 1;
});

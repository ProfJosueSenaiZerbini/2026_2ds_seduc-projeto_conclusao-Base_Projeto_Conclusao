// Prepara o banco de DEMONSTRAÇÃO do iBico (professor no checkpoint e apresentação final).
//
// NÃO faz parte do `npm test`. Execute com:  npm run demo:preparar   (ou:  node scripts/preparar-demo.js [--sim])
//
// O que o script faz:
//   1. Recria um banco SEPARADO (db_bico_demo) a partir do schema.sql. O banco db_bico não é tocado.
//      Se o banco já existir, pede confirmação no terminal (use --sim para pular a pergunta).
//   2. Sobe o próprio app numa porta temporária (CEP_FAKE=1) só enquanto cria os dados e o derruba no fim.
//   3. Cria tudo pelas rotas reais da aplicação (cadastro, login, carteira, bicos, candidaturas, chat, avaliações,
//      fotos de perfil e notificações lidas).
//      O SQL direto só é usado para consultar ids e para envelhecer datas (serviço, finalização, avaliação, histórico).
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
    subirServidor,
    avatarPng
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
    },
    // Contas do professor: uma de cada perfil, para ele navegar sozinho.
    profContratante: {
        nome: 'Professor Contratante',
        email: 'professor.contratante@demo.com',
        cpf: cpfValido('268491537'),
        idade: '40',
        tipo: 'contratante'
    },
    profTrabalhador: {
        nome: 'Professor Trabalhador',
        email: 'professor.trabalhador@demo.com',
        cpf: cpfValido('471953628'),
        idade: '40',
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
    },
    // ---- Beatriz: um bico concluído e um cancelado, para as telas dela não ficarem vazias ----
    bz1: {
        dono: 'beatriz',
        titulo: "Limpeza de caixa d'água",
        valor: '150.00',
        dias: -6,
        horario: '08:00',
        numero: '1650',
        descricao: "Esvaziar, lavar e desinfetar a caixa d'água de 1.000 litros e conferir a boia e a tampa."
    },
    bz2: {
        dono: 'beatriz',
        titulo: 'Troca de lâmpadas da garagem',
        valor: '40.00',
        dias: 8,
        horario: '10:00',
        numero: '1660',
        descricao: 'Trocar seis lâmpadas queimadas da garagem por modelos de LED já comprados.'
    },
    // ---- Marcos: um bico em andamento e um cancelado ----
    h5: {
        dono: 'marcos',
        titulo: 'Montagem de rack na sala',
        valor: '90.00',
        dias: 2,
        horario: '14:00',
        numero: '2150',
        descricao: 'Montar rack de TV de 1,80 m e fixar na parede, com passagem organizada dos cabos.'
    },
    h6: {
        dono: 'marcos',
        titulo: 'Limpeza de calha',
        valor: '60.00',
        dias: 9,
        horario: '08:00',
        numero: '2160',
        descricao: 'Retirar folhas e sujeira das calhas da casa e testar o escoamento da água.'
    },
    // ---- Professor contratante ----
    p1: {
        dono: 'profContratante',
        titulo: 'Organização do almoxarifado',
        valor: '100.00',
        dias: -4,
        horario: '08:00',
        numero: '2200',
        descricao: 'Separar, etiquetar e organizar por categoria o material do almoxarifado da escola.'
    },
    p2: {
        dono: 'profContratante',
        titulo: 'Pintura da sala de aula',
        valor: '150.00',
        dias: 3,
        horario: '08:00',
        numero: '2210',
        descricao: 'Pintar as paredes de uma sala de aula com tinta lavável. Tinta e rolos fornecidos pela escola.'
    },
    p3: {
        dono: 'profContratante',
        titulo: 'Manutenção do portão da escola',
        valor: '120.00',
        dias: 6,
        horario: '09:00',
        numero: '2220',
        descricao: 'Lubrificar as dobradiças, ajustar a trava e repintar os pontos com ferrugem do portão principal.'
    },
    p4: {
        dono: 'profContratante',
        titulo: 'Limpeza do laboratório',
        valor: '80.00',
        dias: 10,
        horario: '13:00',
        numero: '2230',
        descricao: 'Limpeza geral do laboratório de informática: bancadas, piso e armários.'
    }
};

// Ordem de publicação (= ordem de criação dos bicos).
const ORDEM_PUBLICACAO = [
    'h1',
    'h2',
    'h3',
    'h4',
    'e',
    'd',
    'c',
    'f',
    'a',
    'b',
    'feed2',
    'feed1',
    'h5',
    'h6',
    'semSaldo',
    'bz1',
    'bz2',
    'p1',
    'p2',
    'p3',
    'p4'
];

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
                texto: 'Meu Perfil > "Ver como os outros veem meu perfil": já mostra a nota que o Diego deu no conserto de torneira; depois de ele avaliar o evento, aparece mais uma (avaliação mútua completa).',
                ct: 'CT17, CT19'
            },
            {
                texto: 'Já tem foto de perfil (avatar verde), que aparece no Meu Perfil e na barra lateral. Em Meu Perfil: Trocar foto (JPG, PNG ou WebP, até 2 MB) ou Remover foto, que volta às iniciais "CM".',
                ct: 'CT27'
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
            },
            {
                texto: 'Bicos > aba Concluídos > "Limpeza de caixa d\'água" (avaliada dos dois lados) e aba Cancelados > "Troca de lâmpadas da garagem" (cancelado aberto, sem estorno). A carteira tem o extrato de adição e pagamento, com saldo R$ 0,00.',
                ct: 'CT13, CT14, CT17'
            }
        ]
    },
    {
        conta: 'Outro contratante (Marcos Oliveira)',
        email: USUARIOS.marcos.email,
        testes: [
            {
                texto: 'Perfil público dele: avaliações recebidas do trabalhador experiente. Quem mais contratou, com vagas abertas no feed dos trabalhadores.',
                ct: 'CT17, CT19, CT23'
            },
            {
                texto: 'Bicos: "Montagem de rack na sala" e "Lavagem de calçada e quintal" Em andamento (valores reservados), "Poda de cerca viva" aberto e "Limpeza de calha" na aba Cancelados.',
                ct: 'CT08, CT14, CT15'
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
            },
            {
                texto: 'Tem foto de perfil (avatar vinho): aparece no Meu Perfil dele e no perfil público (a Carla abre pelo nome dele na lista de candidatos).',
                ct: 'CT27'
            },
            {
                texto: 'Sino sem notificações novas (os aceites antigos já foram lidos). Deixe esta conta aberta noutra janela (anônima) e clique uma vez na página: quando a Carla aceitar ou recusar em "Montagem de guarda-roupa", em até 20 s chega o aviso com som e o contador do sino.',
                ct: 'CT28'
            }
        ]
    },
    {
        conta: 'Trabalhador novo, sem avaliações (Juliana Lima)',
        email: USUARIOS.juliana.email,
        testes: [
            {
                texto: 'Perfil público com uma única avaliação (a da Beatriz na caixa d’água), sem indicadores fictícios. Candidata a bicos pelo feed (ex.: "Poda de cerca viva") e vê o endereço completo só depois de aceita.',
                ct: 'CT07, CT24, CT26'
            },
            {
                texto: 'Sem foto: o perfil mostra as iniciais "JL". Também está Pendente em "Montagem de guarda-roupa": se a Carla aceitar o Rafael, ela recebe "Vaga preenchida".',
                ct: 'CT27, CT28'
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
            },
            {
                texto: 'Sino com várias notificações não lidas (aceites da Carla, "Bico cancelado" da Instalação de prateleiras e vagas preenchidas). Abrir o painel marca como lidas; cada uma leva ao bico.',
                ct: 'CT28'
            },
            {
                texto: 'Histórico: "Ajudante para evento" Em andamento (com chat), concluídos e recusados (ex.: "Montagem de rack na sala"). Candidato Pendente em "Manutenção do portão da escola".',
                ct: 'CT12, CT17'
            }
        ]
    },
    {
        conta: 'Professor Contratante',
        email: USUARIOS.profContratante.email,
        testes: [
            {
                texto: 'Bicos > "Manutenção do portão da escola" (Aberto, 2 candidatos Pendentes: Rafael e Diego, com mensagem e nota): aceitar um (reserva de R$ 120,00 e recusa automática do outro) ou recusar.',
                ct: 'CT08, CT19, CT21'
            },
            {
                texto: 'Bicos > "Pintura da sala de aula" (Em andamento com o Professor Trabalhador): conversar no chat e Finalizar (R$ 150,00 creditados) e avaliar.',
                ct: 'CT12, CT10, CT13'
            },
            {
                texto: 'Aba Concluídos > "Organização do almoxarifado" (avaliado dos dois lados) e aba Cancelados > "Limpeza do laboratório" (cancelado aberto). Carteira com adição de R$ 1.000,00, pagamento e reserva; foto de perfil azul.',
                ct: 'CT14, CT17, CT27'
            },
            {
                texto: 'Publicar Bico com CEP (offline, 01310-100): rua, bairro, cidade e UF preenchidos sozinhos.',
                ct: 'CT05, CT25'
            }
        ]
    },
    {
        conta: 'Professor Trabalhador',
        email: USUARIOS.profTrabalhador.email,
        testes: [
            {
                texto: 'Histórico: "Pintura da sala de aula" Em andamento (chat com 3 mensagens), "Organização do almoxarifado" Concluído com notas, "Poda de cerca viva" Pendente e "Limpeza de calha" cancelado pelo contratante.',
                ct: 'CT12, CT17, CT28'
            },
            {
                texto: 'Feed: candidatar-se a um bico aberto (ex.: "Pintura de muro externo"). Sino com avisos de aceite e cancelamento. Foto de perfil laranja.',
                ct: 'CT07, CT24, CT27, CT28'
            }
        ]
    }
];

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
    const e = (chave) => `\`${USUARIOS[chave].email}\``;
    return `# Guia para conhecer o iBico

Gerado por \`scripts/preparar-demo.js\` (não edite à mão: rode o script de novo para regenerar). Todos os dados são fictícios.

## 1. Preparar

1. \`npm run demo:preparar\`: recria o banco \`db_bico_demo\` com este cenário (o \`db_bico\` não é tocado). Pede confirmação se o banco já existir; use \`npm run demo:preparar -- --sim\` para pular a pergunta.
2. \`npm run demo\`: sobe o iBico em http://localhost:3000 apontando para o \`db_bico_demo\`, com a consulta real de CEP.
3. Sem internet: \`npm run demo:offline\`. O CEP passa a ser consultado num provedor falso e só aceita \`01310-100\` (Avenida Paulista, São Paulo) e \`13690-000\` (CEP geral de Descalvado, sem rua).

**Senha de todas as contas:** \`${SENHA}\`. Na tela de login, escolha o perfil (Contratar ou Trabalhar) antes de entrar.

## 2. Suas contas, professor

| Conta | E-mail | Perfil |
| --- | --- | --- |
| **Professor Contratante** | **${e('profContratante')}** | Contratante |
| **Professor Trabalhador** | **${e('profTrabalhador')}** | Trabalhador |

**Professor Contratante** já tem:

- carteira com saldo, extrato (adição, pagamento e reserva) e foto de perfil;
- um bico concluído e avaliado dos dois lados ("Organização do almoxarifado");
- um bico Em andamento com chat ("Pintura da sala de aula");
- um bico aberto com 2 candidatos Pendentes ("Manutenção do portão da escola");
- um bico cancelado ("Limpeza do laboratório").

O que fazer: aceitar um candidato do portão (o outro é recusado automaticamente) ou recusar os dois; conversar no chat e finalizar a "Pintura da sala de aula" e avaliar o trabalhador; publicar um bico digitando um CEP (offline, \`01310-100\`).

**Professor Trabalhador** já tem:

- foto de perfil, notificações no sino e histórico com bicos Em andamento, concluído (com notas), Pendente e cancelado pelo contratante.

O que fazer: ver o feed, candidatar-se a um bico aberto e acompanhar a resposta pelo sino; abrir o chat da pintura e avaliar quando o bico for finalizado.

**Os dois lados do mesmo bico:** o contratante e o trabalhador do professor trabalham juntos em "Pintura da sala de aula". Abra uma conta numa janela comum e a outra numa janela anônima para ver cada lado (mensagens do chat, aviso no sino ao aceitar ou finalizar).

## 3. As outras contas

| Conta | E-mail | Perfil | Como está |
| --- | --- | --- | --- |
| Carla Mendes | ${e('carla')} | Contratante | Contratante principal, com bicos em todos os estados e carteira movimentada. |
| Beatriz Nogueira | ${e('beatriz')} | Contratante | Saldo zerado; o bico de R$ 200,00 não pode ser aceito. |
| Marcos Oliveira | ${e('marcos')} | Contratante | Quem mais contratou, com histórico, bicos em andamento e vagas abertas. |
| Rafael Souza | ${e('rafael')} | Trabalhador | Experiente, com várias avaliações, foto e sino sem avisos novos. |
| Juliana Lima | ${e('juliana')} | Trabalhador | Iniciante, com o primeiro bico concluído, uma avaliação e candidaturas pendentes. |
| Diego Santos | ${e('diego')} | Trabalhador | Bico em andamento com chat e várias notificações não lidas. |

## 4. Passeio como contratante (Carla)

Entre com ${e('carla')} escolhendo Contratar.

1. **Início:** confira os números do painel.
2. **Bicos:** percorra as abas Ativos, Concluídos e Cancelados.
3. **Gerenciar "Montagem de guarda-roupa":** veja os candidatos com nota e acesse o perfil de cada um.
4. **Chat do "Ajudante para evento":** abra a conversa com o trabalhador aceito.
5. **Carteira:** o extrato mostra adição, reserva e estorno.
6. **Meu Perfil** e "Ver como os outros veem meu perfil".
7. **Publicar Bico** digitando um CEP.

## 5. Passeio como trabalhador (Rafael)

Entre com ${e('rafael')} escolhendo Trabalhar.

1. **Feed:** use os filtros e os bairros.
2. **Detalhe de um bico:** o endereço aparece só com a região até a candidatura ser aceita.
3. **Sino:** abra as notificações.
4. **Histórico:** Em andamento, Concluídos (com as notas) e Recusados.
5. **Carteira:** créditos recebidos e gráfico mensal.
6. **Perfil público:** média e reputação.

## 6. O que cada outra conta mostra

- **Beatriz:** saldo zerado e alerta de "Saldo insuficiente" ao tentar aceitar o bico de R$ 200,00.
- **Marcos:** quem mais contratou; perfil público com as avaliações do Rafael.
- **Juliana:** iniciante com o primeiro bico concluído e uma única avaliação.
- **Diego:** bico em andamento com chat e várias notificações não lidas.

## 7. Faça você mesmo

Em **Cadastrar**, crie uma conta nova escolhendo o perfil. Veja o perfil novo: sem avaliações e sem números inventados, carteira e telas vazias com orientação para o primeiro passo.

## 8. Ações que mudam o banco

Aceitar, cancelar, finalizar, avaliar e trocar foto alteram o banco de demonstração. Cada ação tem o caso de teste correspondente na tabela do apêndice (CT08 aceitar, CT14 e CT15 cancelar, CT12 finalizar, CT13 avaliar, CT27 foto).

**Para voltar ao cenário inicial:** pare o \`npm run demo\` (Ctrl+C) e rode \`npm run demo:preparar -- --sim\`. Todas as contas e bicos são recriados do zero.

## Apêndice: contas x casos de teste

| Conta | E-mail | Senha | O que testar | Caso de teste |
| --- | --- | --- | --- | --- |
${tabela}
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
        // Marcos: 800 = 420 pagos no histórico + 90 (rack) e 110 (calçada) reservados + 180 que sobram.
        // Beatriz: 150 pagos na caixa d'água, fica com R$ 0,00 (o alerta de saldo continua valendo).
        // Professor contratante: 1000 = 100 pagos no almoxarifado + 150 reservados na pintura + 750 que sobram.
        console.log('> Adicionando saldo simulado...');
        for (const [chave, valor] of [
            ['carla', '500.00'],
            ['carla', '260.00'],
            ['marcos', '800.00'],
            ['beatriz', '150.00'],
            ['profContratante', '1000.00']
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
                    // A rota recusa data passada: publica com data futura e grava a real por SQL (passo 5).
                    data_servico: dataRelativa(Math.max(b.dias, 1)),
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

        const cancelar = async (dono, bico, motivo) => {
            const r = await ctx[dono].post(`${base}/bicos/${ids.bicos[bico]}/cancelar`, {
                form: { motivo },
                failOnStatusCode: false
            });
            esperar(r, 200, `cancelar ${bico}`);
        };
        const enviarMensagem = async (quem, bico, trabalhador, texto) => {
            const r = await ctx[quem].post(
                `${base}/bicos/candidaturas/${ids.candidaturas[`${bico}:${trabalhador}`]}/chat/mensagens`,
                { form: { texto }, failOnStatusCode: false }
            );
            if (!r.ok()) throw new Error(`mensagem de ${quem}: HTTP ${r.status()}`);
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
            // O Diego avalia a Carla no conserto de torneira (a Carla deixa o prazo de 7 dias passar).
            if (bico === 'e') {
                await avaliar('diego', 'e', 5, 'Carla foi muito clara no que precisava e pagou certinho.');
            }
        }

        // f) cancelado em andamento (estorno da reserva).
        await candidatar('diego', 'f', 'Instalo prateleiras com nível a laser e levo a furadeira.');
        await aceitar('carla', 'f', 'diego');
        await cancelar('carla', 'f', 'Mudei o projeto do escritório e não vou mais instalar as prateleiras agora.');

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

        // bz1) Beatriz: Juliana é aceita (Rafael recusado automaticamente), finaliza e os dois se avaliam.
        await candidatar('juliana', 'bz1', "Já lavei várias caixas d'água e levo os produtos de limpeza.");
        await candidatar('rafael', 'bz1', 'Posso fazer a limpeza no mesmo dia, com equipamento próprio.');
        await aceitar('beatriz', 'bz1', 'juliana');
        await finalizar('beatriz', 'bz1');
        await avaliar('juliana', 'bz1', 5, 'Cliente atenciosa, explicou tudo direitinho.');
        await avaliar('beatriz', 'bz1', 5, "Caixa d'água ficou impecável.");

        // bz2) Beatriz cancela aberto.
        await cancelar('beatriz', 'bz2', 'Resolvi trocar eu mesma.');

        // h5) Marcos aceita o Rafael (Diego e Juliana recusados): fica Em andamento.
        await candidatar('rafael', 'h5', 'Já montei vários racks e levo furadeira e nível.');
        await candidatar('diego', 'h5', 'Tenho disponibilidade nesse dia e experiência com montagem.');
        await candidatar('juliana', 'h5', 'Monto móveis e organizo os cabos com braçadeiras.');
        await aceitar('marcos', 'h5', 'rafael');

        // feed2) Marcos aceita a Juliana: fica Em andamento.
        await candidatar('juliana', 'feed2', 'Tenho lavadora própria e disponibilidade na parte da manhã.');
        await aceitar('marcos', 'feed2', 'juliana');

        // h6) o professor trabalhador se candidata e o Marcos cancela aberto (aparece no histórico e nas notificações).
        await candidatar('profTrabalhador', 'h6', 'Faço limpeza de calhas e levo escada e luvas.');
        await cancelar('marcos', 'h6', 'Contratei um conhecido.');

        // feed1) o professor trabalhador fica Pendente no bico do Marcos.
        await candidatar('profTrabalhador', 'feed1', 'Tenho experiência com poda e faço o descarte dos galhos.');

        // p1) professor: concluído, com avaliação dos dois lados.
        await candidatar('profTrabalhador', 'p1', 'Já organizei estoques e etiqueto tudo por categoria.');
        await aceitar('profContratante', 'p1', 'profTrabalhador');
        await finalizar('profContratante', 'p1');
        await avaliar('profContratante', 'p1', 5, 'Organizou tudo por categoria, excelente.');
        await avaliar('profTrabalhador', 'p1', 5, 'Contratante pontual e com tudo preparado.');

        // p2) professor: em andamento, com conversa no chat entre as duas contas dele.
        await candidatar('profTrabalhador', 'p2', 'Pinto salas com rolo e deixo tudo protegido e limpo.');
        await aceitar('profContratante', 'p2', 'profTrabalhador');
        for (const [quem, texto] of [
            ['profContratante', 'Olá! Aceitei sua candidatura. Podemos começar às 8h?'],
            ['profTrabalhador', 'Combinado, às 8h. Preciso levar algum material além do pincel e da fita?'],
            ['profContratante', 'A tinta e os rolos ficam na escola. Traga só a lona para proteger o piso.']
        ]) {
            await enviarMensagem(quem, 'p2', 'profTrabalhador', texto);
        }

        // p3) professor: aberto com 2 candidatos Pendentes, para aceitar ou recusar sozinho.
        await candidatar(
            'rafael',
            'p3',
            'Trabalho com serralheria leve e levo graxa, tinta anticorrosiva e ferramentas.'
        );
        await candidatar('diego', 'p3', 'Já fiz manutenção de portões e levo o material necessário.');

        // p4) professor cancela aberto.
        await cancelar('profContratante', 'p4', 'O laboratório já foi limpo pela equipe.');

        // Fotos de perfil (rota /perfil/foto): Carla, Rafael e as contas do professor têm foto; os outros aparecem
        // com as iniciais. Avatares gerados pelo próprio script (silhueta sobre fundo de cor), nenhuma foto real.
        console.log('> Fotos de perfil (rota /perfil/foto)...');
        for (const [chave, cores] of [
            ['carla', { fundo: [31, 77, 58], silhueta: [214, 232, 222] }],
            ['rafael', { fundo: [139, 23, 40], silhueta: [245, 242, 235] }],
            ['profContratante', { fundo: [33, 64, 122], silhueta: [222, 232, 248] }],
            ['profTrabalhador', { fundo: [176, 106, 24], silhueta: [252, 240, 220] }]
        ]) {
            const r = await ctx[chave].post(`${base}/perfil/foto`, {
                multipart: { foto: { name: `${chave}.png`, mimeType: 'image/png', buffer: avatarPng(cores) } },
                maxRedirects: 0,
                failOnStatusCode: false
            });
            esperar(r, 302, `foto de ${chave}`);
            const [foto] = await banco.query('SELECT tipo FROM fotos_perfil WHERE usuario_id = ?', [
                ids.usuarios[chave]
            ]);
            if (!foto) throw new Error(`foto de ${chave}: não foi gravada (veja o alerta em /perfil)`);
        }

        // Notificações: o Rafael já leu os aceites antigos do Marcos (rota /notificacoes/lidas), para o aviso ao
        // vivo do aceite na "Montagem de guarda-roupa" se destacar. O Diego fica com as dele não lidas.
        console.log('> Notificações (rotas /notificacoes e /notificacoes/lidas)...');
        const notificacoesDe = async (chave) => {
            const r = await ctx[chave].get(`${base}/notificacoes`, {
                headers: { Accept: 'application/json' },
                failOnStatusCode: false
            });
            esperar(r, 200, `notificações de ${chave}`);
            return r.json();
        };
        const doRafael = await notificacoesDe('rafael');
        if (doRafael.notificacoes.length > 0) {
            const r = await ctx.rafael.post(`${base}/notificacoes/lidas`, {
                data: { ateId: doRafael.notificacoes[0].id },
                headers: { Accept: 'application/json' },
                failOnStatusCode: false
            });
            esperar(r, 200, 'marcar notificações do Rafael como lidas');
        }
        for (const chave of ['rafael', 'juliana', 'diego']) {
            const { naoLidas } = await notificacoesDe(chave);
            console.log(`  ${USUARIOS[chave].nome}: ${naoLidas} notificação(ões) não lida(s)`);
        }

        // ---- 5. Datas envelhecidas (só SQL de datas, pelas mesmas colunas que a aplicação usa) -----------
        console.log('> Envelhecendo datas de finalização e avaliação...');
        // [bico, dias desde a finalização]. d: ontem; e: 8 dias (prazo encerrado); h1-h4: histórico antigo.
        const envelhecer = [
            ['d', 1],
            ['e', 8],
            ['h1', 18],
            ['h2', 15],
            ['h3', 12],
            ['h4', 10],
            ['bz1', 5],
            ['p1', 3]
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

        // Data real dos serviços já realizados.
        for (const [chave, b] of Object.entries(BICOS)) {
            if (b.dias >= 0) continue;
            await banco.query('UPDATE bicos SET data_servico = ? WHERE id = ?', [
                dataRelativa(b.dias),
                ids.bicos[chave]
            ]);
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

        // Saldos esperados (lança erro se o cenário não bater) e o aceite sem saldo continua impossível.
        for (const [chave, esperado] of [
            ['beatriz', '0.00'],
            ['marcos', '180.00'],
            ['profContratante', '750.00']
        ]) {
            const [linha] = await banco.query('SELECT saldo_simulado AS saldo FROM usuarios WHERE id = ?', [
                ids.usuarios[chave]
            ]);
            if (Number(linha.saldo).toFixed(2) !== esperado) {
                throw new Error(`saldo de ${chave}: esperado ${esperado}, encontrado ${linha.saldo}`);
            }
        }
        const recusa = await ctx.beatriz.post(`${base}/bicos/candidaturas/status`, {
            form: {
                candidatura_id: String(ids.candidaturas['semSaldo:juliana']),
                novo_status: 'Aceito'
            },
            failOnStatusCode: false,
            maxRedirects: 0
        });
        const [pendente] = await banco.query('SELECT status FROM candidaturas WHERE id = ?', [
            ids.candidaturas['semSaldo:juliana']
        ]);
        if (pendente.status !== 'Pendente') {
            throw new Error(
                `semSaldo: o aceite sem saldo deveria falhar (HTTP ${recusa.status()}, ${pendente.status})`
            );
        }
        console.log('> Saldos conferidos: Beatriz 0,00; Marcos 180,00; professor contratante 750,00.');
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

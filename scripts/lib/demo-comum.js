// Utilidades compartilhadas pelos scripts de apoio (prints-tcc.js, preparar-demo.js e rodar-demo.js).
// Não faz parte da aplicação: só recria bancos SEPARADOS (nunca o db_bico) e sobe o app como processo filho.
import mariadb from 'mariadb';
import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(RAIZ, '.env'), quiet: true });

export const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// CPF fictício com dígitos verificadores válidos, a partir de 9 dígitos-base.
export function cpfValido(base9) {
    const d = base9.split('').map(Number);
    const dv = (n) => {
        const soma = d.slice(0, n).reduce((s, v, i) => s + v * (n + 1 - i), 0);
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };
    d.push(dv(9));
    d.push(dv(10));
    return d.join('');
}

// Data (AAAA-MM-DD) deslocada `dias` a partir de hoje (negativo = no passado).
export function dataRelativa(dias) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().split('T')[0];
}

// Opções de POST de formulário sem seguir redirecionamentos (o script confere o status).
export const form = (campos) => ({ form: campos, maxRedirects: 0, failOnStatusCode: false });

export const opcoesConexao = () => ({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 3306)
});

// Segurança: estes scripts só podem apagar bancos que NÃO são o db_bico da aplicação.
const recusarBancoPrincipal = (nome) => {
    if (!/^db_bico_[a-z0-9_]+$/.test(nome)) {
        throw new Error(`Banco "${nome}" recusado: só bancos db_bico_<nome> podem ser recriados por estes scripts.`);
    }
};

export async function bancoExiste(nome) {
    const conexao = await mariadb.createConnection(opcoesConexao());
    try {
        const linhas = await conexao.query(
            'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
            [nome]
        );
        return linhas.length > 0;
    } finally {
        await conexao.end();
    }
}

// Apaga e recria `nome` a partir do schema.sql (que cria/usa db_bico; o nome é trocado no texto).
export async function recriarBanco(nome) {
    recusarBancoPrincipal(nome);
    const conexao = await mariadb.createConnection({ ...opcoesConexao(), multipleStatements: true });
    try {
        const schema = readFileSync(path.join(RAIZ, 'schema.sql'), 'utf8').replaceAll('db_bico', nome);
        await conexao.query(`DROP DATABASE IF EXISTS ${nome}`);
        await conexao.query(schema);
    } finally {
        await conexao.end();
    }
}

export function abrirPool(nome) {
    return mariadb.createPool({ ...opcoesConexao(), database: nome, connectionLimit: 3 });
}

// Pede uma porta livre ao sistema operacional.
export function portaLivre() {
    return new Promise((resolve, reject) => {
        const servidor = createServer();
        servidor.once('error', reject);
        servidor.listen(0, () => {
            const { port } = servidor.address();
            servidor.close(() => resolve(port));
        });
    });
}

// Sobe o app (app.js) como processo filho e espera /login responder. `env` sobrescreve o ambiente do filho.
export async function subirServidor({ porta, banco, env = {}, herdarSaida = false }) {
    const servidor = spawn(process.execPath, ['app.js'], {
        cwd: RAIZ,
        env: { ...process.env, PORT: String(porta), DB_NAME: banco, ...env },
        stdio: herdarSaida ? 'inherit' : ['ignore', 'pipe', 'pipe']
    });
    let log = '';
    if (!herdarSaida) {
        servidor.stdout.on('data', (c) => {
            log += c;
        });
        servidor.stderr.on('data', (c) => {
            log += c;
        });
    }

    const base = `http://localhost:${porta}`;
    for (let i = 0; i < 60; i++) {
        try {
            const r = await fetch(`${base}/login`);
            if (r.ok) return servidor;
        } catch {
            /* ainda subindo */
        }
        if (servidor.exitCode !== null) throw new Error(`O servidor encerrou ao iniciar:\n${log}`);
        await pausa(500);
    }
    servidor.kill();
    throw new Error(`O servidor não respondeu a tempo:\n${log}`);
}

// Sobe o iBico normalmente (porta 3000) apontando para o banco de demonstração (db_bico_demo).
//
// Execute com:  npm run demo            (consulta real de CEP: ViaCEP/BrasilAPI, precisa de internet)
//               npm run demo:offline    (--cep-fake: provedor falso, plano B se a internet cair)
//
// Antes, crie os dados com:  npm run demo:preparar
// Com --cep-fake só valem os CEPs 01310-100 (Avenida Paulista) e 13690-000 (CEP geral de Descalvado).
// Nenhum código da aplicação é alterado e o banco db_bico não é tocado.
import { spawn } from 'node:child_process';
import { RAIZ, bancoExiste } from './lib/demo-comum.js';

const BANCO = 'db_bico_demo';
const PORTA = process.env.PORT || '3000';
const cepFalso = process.argv.includes('--cep-fake');

if (!(await bancoExiste(BANCO))) {
    console.error(`O banco ${BANCO} não existe. Rode antes:  npm run demo:preparar`);
    process.exit(1);
}

console.log(`> iBico em http://localhost:${PORTA} com o banco ${BANCO}`);
console.log(
    cepFalso
        ? '> CEP: provedor FALSO (offline). Só valem 01310-100 e 13690-000.'
        : '> CEP: consulta real (ViaCEP/BrasilAPI). Sem internet, use: npm run demo:offline'
);
console.log('> Contas e roteiro: Docs/Teste/roteiro-demo.md (senha de todas: ibico123). Ctrl+C para encerrar.\n');

const env = { ...process.env, PORT: PORTA, DB_NAME: BANCO, NODE_ENV: 'development' };
if (cepFalso) env.CEP_FAKE = '1';
else delete env.CEP_FAKE;

const servidor = spawn(process.execPath, ['app.js'], { cwd: RAIZ, env, stdio: 'inherit' });
servidor.on('exit', (codigo) => process.exit(codigo ?? 0));
for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.on(sinal, () => servidor.kill());
}

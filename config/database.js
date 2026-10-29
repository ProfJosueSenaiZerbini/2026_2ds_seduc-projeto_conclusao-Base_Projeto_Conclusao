// Conexão com o mariadb
import mariadb from 'mariadb';
import dotenv from 'dotenv';

// Carrega as variaveis do ficheiro .env para a memória do node.js
dotenv.config();

// piscina de conexões(pool);
const pool = mariadb.createPool({
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 5
});

// uma função asincrona com try cath para testar a conexão
async function Testarconexão() {
    let conexão;
    try {
        conexão = await pool.getConnection();
        console.log('✅ Conexão com o mariadb concluida!!');
    } catch (erro) {
        console.error('🚫 Erro de conexão:', erro.message);
    }finally{
        if (conexão) conexão.release(); // devolve a ligação para a pool
    };
};

Testarconexão();
// exporta a piscina para ser em todo o projeto
export default pool;
// Conexão com o mariadb
import mariadb from 'mariadb';
import dotenv from 'dotenv';

// Carrega as credenciais do banco antes de criar a pool de conexoes.
dotenv.config();

// O projeto usa o driver MariaDB; a pool reutiliza as conexoes entre as consultas.
const pool = mariadb.createPool({
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 5
});

async function testarConexao() {
    let conexao;
    try {
        conexao = await pool.getConnection();
        console.log('Conexao com o MariaDB concluida.');
    } catch (erro) {
        console.error('🚫 Erro de conexão:', erro.message);
    } finally {
        // Libera a conexao de teste para que ela volte a ficar disponivel na pool.
        conexao?.release();
    }
}

testarConexao();

export default pool;
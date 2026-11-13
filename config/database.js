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

// A pool abre conexões sob demanda, quando a aplicação executa uma consulta.
export default pool;

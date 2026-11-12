const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../SRC/DATABASE/connection');

async function migrate() {
  try {
    console.log('Iniciando migração do banco...');

    // 1. Tabela de Curtidas
    await db.query(`
      CREATE TABLE IF NOT EXISTS curtidas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        post_id INT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY usuario_post_unique (usuario_id, post_id),
        FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Tabela curtidas pronta');

    // 2. Tabela de Comentários
    await db.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        usuario_id INT NOT NULL,
        texto TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Tabela comentarios pronta');

    // 3. Adicionar coluna categoria em posts caso não exista
    const [cols] = await db.query('DESCRIBE posts');
    const hasCategoria = cols.some(c => c.Field === 'categoria');
    if (!hasCategoria) {
      await db.query(`ALTER TABLE posts ADD COLUMN categoria VARCHAR(100) DEFAULT 'MODA & ESTILO'`);
      console.log('✓ Coluna categoria adicionada em posts');
    } else {
      console.log('✓ Coluna categoria já existe');
    }

    console.log('Migração concluída com sucesso!');
  } catch (err) {
    console.error('Erro na migração:', err);
  } finally {
    process.exit();
  }
}

migrate();


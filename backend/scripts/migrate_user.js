const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../SRC/DATABASE/connection');

async function migrateUser() {
  try {
    console.log('Verificando colunas da tabela usuario...');
    const [cols] = await db.query('DESCRIBE usuario');
    const colNames = cols.map(c => c.Field);
    console.log('Colunas existentes em usuario:', colNames);

    if (!colNames.includes('bio')) {
      await db.query('ALTER TABLE usuario ADD COLUMN bio TEXT');
      console.log('✓ Coluna bio adicionada');
    }
    if (!colNames.includes('headline')) {
      await db.query('ALTER TABLE usuario ADD COLUMN headline VARCHAR(255)');
      console.log('✓ Coluna headline adicionada');
    }
    if (!colNames.includes('localizacao')) {
      await db.query('ALTER TABLE usuario ADD COLUMN localizacao VARCHAR(150) DEFAULT "São Paulo, Brasil"');
      console.log('✓ Coluna localizacao adicionada');
    }
    if (!colNames.includes('foto')) {
      await db.query('ALTER TABLE usuario ADD COLUMN foto LONGTEXT');
      console.log('✓ Coluna foto adicionada');
    }
    if (!colNames.includes('capa')) {
      await db.query('ALTER TABLE usuario ADD COLUMN capa LONGTEXT');
      console.log('✓ Coluna capa adicionada');
    }
    if (!colNames.includes('status_tag')) {
      await db.query('ALTER TABLE usuario ADD COLUMN status_tag VARCHAR(100) DEFAULT "#CRIADORA ATIVA"');
      console.log('✓ Coluna status_tag adicionada');
    }
    if (!colNames.includes('interesses')) {
      await db.query('ALTER TABLE usuario ADD COLUMN interesses TEXT');
      console.log('✓ Coluna interesses adicionada');
    }

    console.log('Migração de usuário concluída com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('Erro na migração de usuario:', err);
    process.exit(1);
  }
}

migrateUser();


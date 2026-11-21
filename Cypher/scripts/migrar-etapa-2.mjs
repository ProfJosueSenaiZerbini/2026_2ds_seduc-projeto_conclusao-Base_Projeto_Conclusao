import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

const origem=path.resolve('data/cypher.sqlite');
const temporaria=fs.mkdtempSync(path.join(os.tmpdir(),'cypher-migracao-22-'));
const copia=path.join(temporaria,'cypher.sqlite');
const db=new Database(origem,{readonly:true});
const administradores=db.prepare('SELECT * FROM administradores ORDER BY usuario_id').all();
await db.backup(copia);db.close();
process.env.CYPHER_DB_PATH=copia;
const banco=await import('../dist/src/app/models/bancoDados.js');
try {
  banco.inicializarBancoCypher();banco.fecharBancoCypher();
  const teste=new Database(copia,{readonly:true});
  assert.equal(teste.pragma('user_version',{simple:true}), banco.versaoEsquema);
  assert.ok(teste.pragma('table_info(usuarios)').some(coluna=>coluna.name==='email_confirmado_em'));
  assert.deepEqual(teste.prepare('SELECT * FROM administradores ORDER BY usuario_id').all(),administradores);
  assert.deepEqual(teste.pragma('foreign_key_check'),[]);teste.close();
  console.log('OK: migração em cópia mantém integralmente as identidades administrativas.');
  if(process.argv.includes('--aplicar')) {
    process.env.CYPHER_DB_PATH=origem;
    banco.inicializarBancoCypher();banco.fecharBancoCypher();
    const real=new Database(origem,{readonly:true});
    assert.equal(real.pragma('user_version',{simple:true}), banco.versaoEsquema);
    assert.ok(real.pragma('table_info(usuarios)').some(coluna=>coluna.name==='email_confirmado_em'));
    assert.deepEqual(real.prepare('SELECT * FROM administradores ORDER BY usuario_id').all(),administradores);
    assert.deepEqual(real.pragma('foreign_key_check'),[]);real.close();
    console.log(`OK: banco local atualizado para schema ${banco.versaoEsquema}, com confirmação de e-mail e sem alterar acesso administrativo.`);
  }
} finally {banco.fecharBancoCypher();assert.equal(path.dirname(temporaria),path.resolve(os.tmpdir()));fs.rmSync(temporaria,{recursive:true,force:true});}


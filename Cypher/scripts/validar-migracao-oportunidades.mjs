import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const oficial=path.resolve(process.env.CYPHER_DB_PATH||'data/cypher.sqlite');
assert.ok(fs.existsSync(oficial));
const pasta=path.resolve('artifacts','backup-oportunidades-'+Date.now());fs.mkdirSync(pasta,{recursive:true});
const origem=new Database(oficial,{readonly:true});
const tabelas=origem.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r=>r.name);
const snapshot=db=>Object.fromEntries(tabelas.map(t=>[t,db.prepare('SELECT * FROM "'+t+'"').all()]));
const antes=snapshot(origem),versao=origem.pragma('user_version',{simple:true});
const backup=path.join(pasta,'original.sqlite'),copia=path.join(pasta,'validacao.sqlite');
await origem.backup(backup);origem.close();fs.copyFileSync(backup,copia);
function migrar(arquivo){const r=spawnSync(process.execPath,['--input-type=module','-e',"import {inicializarBancoCypher,fecharBancoCypher} from './dist/src/app/models/bancoDados.js';inicializarBancoCypher();fecharBancoCypher();"],{env:{...process.env,CYPHER_DB_PATH:arquivo},encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);const d=new Database(arquivo,{readonly:true});assert.equal(d.pragma('user_version',{simple:true}),29);assert.deepEqual(d.pragma('integrity_check'),[{integrity_check:'ok'}]);assert.deepEqual(d.pragma('foreign_key_check'),[]);assert.deepEqual(snapshot(d),antes);d.close();}
migrar(copia);migrar(oficial);
fs.writeFileSync(path.join(pasta,'resultado.json'),JSON.stringify({oficial,backup,copia,versaoAnterior:versao,versaoFinal:29,tabelasPreservadas:tabelas.length,integridade:'ok',dadosPreservados:true},null,2));
console.log(JSON.stringify({oficial,backup,versaoAnterior:versao,versaoFinal:29,integridade:'ok',dadosPreservados:true}));

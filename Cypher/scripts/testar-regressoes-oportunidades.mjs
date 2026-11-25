import { spawnSync } from 'node:child_process';
const scripts = ['testar-banco','testar-politicas-perfil','testar-catalogo-profissional','testar-questionarios-profissionais','testar-persistencia-profissional','testar-relacoes-profissionais','testar-integracao-cadastro-profissional','testar-fundacao','testar-admin-ui','testar-seguranca-http','testar-identidade-http','testar-busca-global','testar-curtidas-obras','testar-entrega-email','testar-oportunidades'];
const falhas=[];
for(const script of scripts) {
 const r=spawnSync(process.execPath,[`scripts/${script}.mjs`],{encoding:'utf8',timeout:120000});
 console.log(`${script}: ${r.status===0?'OK':'FALHOU'}\n${r.stdout??''}${r.status!==0?(r.stderr??'').slice(0,2200):''}`);
 if(r.status!==0)falhas.push(script);
}
console.log(`${scripts.length-falhas.length}/${scripts.length} suítes passaram.`);
process.exitCode=falhas.length?1:0;

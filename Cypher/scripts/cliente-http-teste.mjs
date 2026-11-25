// Cliente de testes: obtém CSRF real e mantém a sessão interna separada da artística.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export function criarClienteHttp(base, {caixaEmail}={}) {
  let csrf;
  let profissional;
  let administrador;
  const nativo = globalThis.fetch;
  const cliente = async (url, options = {}) => {
    if (!csrf) {
      const pagina = await nativo(`${base}/login`);
      csrf = pagina.headers
        .getSetCookie()
        .find(c => c.startsWith("cypher_csrf="))
        ?.split(";")[0];
      await pagina.text();
      if (!csrf) throw new Error("CSRF não emitido");
    }
    const headers = new Headers(options.headers);
    if ([`${base}/register`,`${base}/register/validate`].includes(String(url)) && options.method === "POST") {
      const json=headers.get('content-type')?.includes('application/json');
      const dados=json?JSON.parse(options.body):Object.fromEntries(new URLSearchParams(options.body));
      dados.tipoConta ??= 'profissional';
      dados.passwordConfirmation ??= dados.password;
      dados.identificador ??= `teste_${createHash('sha256').update(String(dados.email)).digest('hex').slice(0,16)}`;
      dados.nascimento ??= '1990-01-01';
      dados.aceiteTermos ??= 'sim';
      dados.versaoTermos ??= '2026-11-24';
      dados.versaoPrivacidade ??= '2026-11-24';
      options={...options,body:json?JSON.stringify(dados):new URLSearchParams(dados)};
    }
    let cookie = headers.get("cookie") ?? "";
    if (
      String(url).startsWith(`${base}/admin`) &&
      cookie === profissional &&
      administrador
    )
      cookie = administrador;
    headers.set("cookie", [cookie, csrf].filter(Boolean).join("; "));
    if (!["GET", "HEAD"].includes(options.method ?? "GET"))
      headers.set("x-csrf-token", csrf.slice("cypher_csrf=".length));
    const resposta=await nativo(url, { ...options, headers });
    if(String(url)===`${base}/register` && resposta.status===303 && caixaEmail) {
      const email=new URLSearchParams(options.body).get('email');
      const arquivos=fs.readdirSync(caixaEmail).filter(nome=>nome.endsWith('.eml')).sort().reverse();
      const mensagem=arquivos.map(nome=>fs.readFileSync(path.join(caixaEmail,nome),'utf8')).find(conteudo=>conteudo.startsWith(`To: ${email}\n`));
      const token=mensagem?.match(/token=([a-f0-9]{64})/)?.[1];
      if(!token)throw new Error('Mensagem de confirmação da fixture não encontrada.');
      const confirmada=await nativo(`${base}/confirmar-email`,{method:'POST',headers:{cookie:csrf,'x-csrf-token':csrf.slice('cypher_csrf='.length),'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token})});
      if(confirmada.status!==200)throw new Error('Não foi possível confirmar o e-mail da fixture.');
      await confirmada.text();
    }
    return resposta;
  };
  cliente.definirSessoes = (publica, interna) => {
    profissional = publica;
    administrador = interna;
  };
  return cliente;
}

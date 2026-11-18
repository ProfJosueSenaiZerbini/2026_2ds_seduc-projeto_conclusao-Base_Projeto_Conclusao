import { randomUUID } from "node:crypto";
import { conexaoInternaCypher, salvarProfissoesUsuarioCypher, salvarRespostasAtuacaoProfissaoCypher, salvarVertentesProfissionaisUsuarioCypher } from "./bancoDados.js";
import { idProfissaoPorCategoria } from "./questionarioAtuacao.js";
import { vertentesProfissionais } from "./modeloProfissionalPersistido.js";
import { exigirAdministrador } from "./administracao.js";
import { normalizarIdentificador, validarIdentificador, validarDadosIdentidade, nomePublico, iniciaisPublicas } from "../validators/validarIdentidade.js";
import { validarSelecaoProfissional } from "../validators/validarAtuacao.js";

export type DadosIdentidade = {nomeInformado:string;vulgo:string;usarVulgo:boolean;nascimento:string;tratamento:string;generoPersonalizado?:string};

export function identificadorDisponivel(valor: string, usuarioId?: string): boolean {
  if (validarIdentificador(valor)) return false;
  const db=conexaoInternaCypher();
  const handle=normalizarIdentificador(valor);
  const reservado=db.prepare("SELECT usuario_id AS id FROM identificadores_usuario WHERE identificador=? COLLATE NOCASE").get(handle) as {id:string}|undefined;
  const atual=db.prepare("SELECT usuario_id AS id FROM perfis WHERE identificador=? COLLATE NOCASE").get(handle) as {id:string}|undefined;
  return (!reservado || reservado.id===usuarioId) && (!atual || atual.id===usuarioId);
}

export function resolverPerfilPublico(handle: string): string | null {
  const registro=conexaoInternaCypher().prepare(`SELECT p.identificador FROM identificadores_usuario h
    JOIN usuarios u ON u.id=h.usuario_id JOIN perfis p ON p.usuario_id=u.id
    WHERE h.identificador=? COLLATE NOCASE AND u.tipo_conta='profissional' AND u.email_confirmado_em IS NOT NULL AND p.perfil_publico=1 AND u.demonstracao=0`).get(normalizarIdentificador(handle)) as {identificador:string}|undefined;
  return registro?.identificador ?? null;
}

export function atualizarIdentidadeUsuario(usuarioId:string,dados:DadosIdentidade) {
  const erro=validarDadosIdentidade(dados);if(erro) throw new Error(erro);
  const db=conexaoInternaCypher();
  return db.transaction(()=>{
    const atual=db.prepare(`SELECT p.nome,p.nascimento FROM perfis p JOIN usuarios u ON u.id=p.usuario_id WHERE p.usuario_id=? AND u.tipo_conta IN ('profissional','consumidor')`).get(usuarioId) as {nome:string;nascimento:string}|undefined;
    if(!atual) throw new Error("Conta não encontrada.");
    if(atual.nascimento && atual.nascimento!==dados.nascimento) throw new Error("A data de nascimento não pode ser alterada por este formulário. Solicite uma correção à equipe.");
    const publico=nomePublico(dados.nomeInformado,dados.vulgo,dados.usarVulgo);
    db.prepare(`UPDATE perfis SET nome=?,nome_informado=?,vulgo=?,usar_vulgo=?,nascimento=?,tratamento=?,genero_personalizado=?,identidade_revisada=1,iniciais=?,atualizado_em=CURRENT_TIMESTAMP WHERE usuario_id=?`).run(publico,dados.nomeInformado.trim(),dados.vulgo.trim(),Number(dados.usarVulgo),dados.nascimento,dados.tratamento,dados.tratamento === "outro" ? dados.generoPersonalizado?.trim() ?? "" : "",iniciaisPublicas(publico),usuarioId);
    db.prepare("UPDATE creditos SET nome_creditado=? WHERE usuario_creditado_id=?").run(publico,usuarioId);
    db.prepare("UPDATE eventos SET organizador=? WHERE proprietario_id=? AND organizador=?").run(publico,usuarioId,atual.nome);
  })();
}

export function estadoAlteracaoIdentificador(usuarioId:string, intervaloDias:number) {
  const registro=conexaoInternaCypher().prepare(`SELECT datetime(identificador_alterado_em, '+' || ? || ' days') AS proxima,
    COALESCE(datetime(identificador_alterado_em, '+' || ? || ' days') > datetime('now'),0) AS bloqueada
    FROM perfis WHERE usuario_id=?`).get(intervaloDias,intervaloDias,usuarioId) as {proxima:string|null;bloqueada:number}|undefined;
  return {bloqueada:Boolean(registro?.bloqueada),proxima:registro?.proxima ?? null};
}

export function alterarIdentificadorUsuario(usuarioId:string, novo:string, intervaloDias:number, excecao?:{autorId:string;motivo:string}) {
  const erro=validarIdentificador(novo);if(erro) throw new Error(erro);
  if(!Number.isInteger(intervaloDias) || intervaloDias<1) throw new Error("Intervalo de alteração não definido.");
  const db=conexaoInternaCypher();
  return db.transaction(()=>{
    if(excecao) {exigirAdministrador(excecao.autorId,"excecoes");if(excecao.motivo.trim().length<10 || excecao.motivo.length>500) throw new Error("Informe uma justificativa de 10 a 500 caracteres.");}
    const atual=db.prepare("SELECT identificador FROM perfis WHERE usuario_id=?").get(usuarioId) as {identificador:string}|undefined;
    if(!atual) throw new Error("Conta não encontrada.");
    const handle=normalizarIdentificador(novo);
    if(handle===atual.identificador) return;
    if(!identificadorDisponivel(handle,usuarioId)) throw new Error("Este identificador já está em uso ou reservado a outra conta.");
    const estado=estadoAlteracaoIdentificador(usuarioId,intervaloDias);
    if(estado.bloqueada && !excecao) throw new Error(`A próxima alteração do identificador estará disponível em ${estado.proxima}.`);
    db.prepare("INSERT INTO identificadores_usuario (identificador,usuario_id) VALUES (?,?) ON CONFLICT DO NOTHING").run(atual.identificador,usuarioId);
    db.prepare("INSERT INTO identificadores_usuario (identificador,usuario_id) VALUES (?,?) ON CONFLICT DO NOTHING").run(handle,usuarioId);
    db.prepare("UPDATE perfis SET identificador=?,identificador_alterado_em=CURRENT_TIMESTAMP,atualizado_em=CURRENT_TIMESTAMP WHERE usuario_id=?").run(handle,usuarioId);
    db.prepare("INSERT INTO alteracoes_identificador (id,usuario_id,anterior,novo,autor_id,motivo) VALUES (?,?,?,?,?,?)").run(randomUUID(),usuarioId,atual.identificador,handle,excecao?.autorId ?? usuarioId,excecao?.motivo.trim() ?? "Alteração pelo titular");
    if(excecao) db.prepare("INSERT INTO auditoria_administrativa (id,autor_id,acao,alvo_id,detalhe) VALUES (?,?,?,?,?)").run(randomUUID(),excecao.autorId,"identificador_alterado_excepcionalmente",usuarioId,excecao.motivo.trim());
  })();
}

export function atualizarApresentacaoConsumidor(usuarioId:string,cidade:string,biografia:string) {
  if(cidade.length>100 || biografia.length>500) throw new Error("Confira os limites da cidade e da biografia.");
  const resultado=conexaoInternaCypher().prepare(`UPDATE perfis SET cidade=?,biografia=?,atualizado_em=CURRENT_TIMESTAMP
    WHERE usuario_id=? AND EXISTS (SELECT 1 FROM usuarios u WHERE u.id=perfis.usuario_id AND u.tipo_conta='consumidor')`).run(cidade.trim(),biografia.trim(),usuarioId);
  if(resultado.changes!==1) throw new Error("Conta de consumidor não encontrada.");
}

export function profissionalizarUsuario(usuarioId:string,categorias:string[],respostas:unknown,visibilidades:unknown,vertentes:string[],confirmacao:boolean) {
  if(!confirmacao) throw new Error("Confirme a ativação irreversível do perfil profissional.");
  const selecao=validarSelecaoProfissional(categorias,respostas,visibilidades,vertentes);
  const db=conexaoInternaCypher();
  return db.transaction(()=>{
    const mudanca=db.prepare("UPDATE usuarios SET tipo_conta='profissional',atualizado_em=CURRENT_TIMESTAMP WHERE id=? AND tipo_conta='consumidor'").run(usuarioId);
    if(mudanca.changes!==1) throw new Error("A conta já é profissional ou não pode ser convertida.");
    db.prepare("UPDATE perfis SET categorias_json=?,funcao=?,perfil_publico=1,ultima_alteracao_categorias_em=CURRENT_TIMESTAMP WHERE usuario_id=?").run(JSON.stringify(categorias),categorias.join(" · "),usuarioId);
    salvarProfissoesUsuarioCypher(usuarioId,categorias.map(categoria=>({profissaoId:idProfissaoPorCategoria(categoria),valorOriginal:categoria,origem:"catalogo"})));
    const salvar=db.prepare(`INSERT INTO respostas_atuacao_categoria (usuario_id,categoria,respostas_json,visibilidades_json) VALUES (?,?,?,?)`);
    for(const atuacao of selecao.atuacoes) {
      salvar.run(usuarioId,atuacao.categoria,JSON.stringify(atuacao.respostas),JSON.stringify(atuacao.visibilidades));
      salvarRespostasAtuacaoProfissaoCypher(usuarioId,idProfissaoPorCategoria(atuacao.categoria),atuacao.respostas,atuacao.visibilidades);
    }
    salvarVertentesProfissionaisUsuarioCypher(usuarioId,vertentes);
    db.prepare("INSERT INTO ativacoes_profissionais (usuario_id,categorias_json) VALUES (?,?)").run(usuarioId,JSON.stringify(categorias));
  })();
}

export const generosInteresse=["Rap",...vertentesProfissionais];
export function obterPreferenciasUsuario(usuarioId:string) {
  const r=conexaoInternaCypher().prepare("SELECT regiao,generos_json AS generosJson,tema FROM preferencias_usuario WHERE usuario_id=?").get(usuarioId) as {regiao:string;generosJson:string;tema:string}|undefined;
  return {regiao:r?.regiao ?? "",generos:r?JSON.parse(r.generosJson) as string[]:[],tema:r?.tema ?? "light"};
}
export function salvarPreferenciasUsuario(usuarioId:string, regiao:string, generos:string[], tema:string) {
  if(regiao.length>100 || !["light","dark"].includes(tema) || generos.some(item=>!generosInteresse.includes(item as typeof generosInteresse[number]))) throw new Error("Confira suas preferências.");
  conexaoInternaCypher().prepare(`INSERT INTO preferencias_usuario (usuario_id,regiao,generos_json,tema) VALUES (?,?,?,?)
    ON CONFLICT(usuario_id) DO UPDATE SET regiao=excluded.regiao,generos_json=excluded.generos_json,tema=excluded.tema`).run(usuarioId,regiao.trim(),JSON.stringify([...new Set(generos)]),tema);
}

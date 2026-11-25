import { createHash, randomBytes } from "node:crypto";
import { conexaoInternaCypher } from "./bancoDados.js";
import { gerarHashSenha, verificarSenha } from "./autenticacaoCypher.js";
import { configurarEmail, entregarEmail } from "./entregaEmail.js";
import { validarSenha } from "../validators/validarAutenticacao.js";
import { contaEncerrada } from "./protecoesConta.js";

export const duracaoRecuperacaoMs = 30 * 60 * 1000;
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const erroLink = () =>
  new Error("Link inválido ou expirado. Solicite uma nova recuperação.");
type Credenciais = { id: string; email: string; senha_hash: string };
function contaAtiva(id: string): Credenciais {
  const db = conexaoInternaCypher();
  const conta = db
    .prepare(
      "SELECT id,email,senha_hash FROM usuarios WHERE id=? AND tipo_conta IN('consumidor','profissional') AND demonstracao=0 AND email_confirmado_em IS NOT NULL"
    )
    .get(id) as Credenciais | undefined;
  if (!conta || contaEncerrada(db, id))
    throw new Error("Acesso indisponível para esta conta.");
  return conta;
}
async function avisarSenha(email: string) {
  try {
    await entregarEmail(
      email,
      "Senha alterada na Cypher",
      "A senha de acesso à sua conta foi alterada e todas as sessões anteriores foram encerradas. Se você não reconhece esta ação, solicite uma recuperação de acesso e procure o suporte da Cypher."
    );
  } catch {
    console.error("Não foi possível entregar o aviso de alteração de senha.");
  }
}
function salvarSenha(id: string, hash: string) {
  const db = conexaoInternaCypher();
  db.prepare(
    "UPDATE usuarios SET senha_hash=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?"
  ).run(hash, id);
  db.prepare("DELETE FROM sessoes WHERE usuario_id=?").run(id);
  db.prepare(
    "UPDATE tokens_recuperacao_senha SET usado_em=? WHERE usuario_id=? AND usado_em IS NULL"
  ).run(Date.now(), id);
  db.prepare(
    "UPDATE tokens_confirmacao_email SET usado_em=? WHERE usuario_id=? AND finalidade='alteracao' AND usado_em IS NULL"
  ).run(Date.now(), id);
}

export async function alterarSenhaConta(
  id: string,
  atual: string,
  nova: string
) {
  const erro = validarSenha(nova);
  if (erro) throw new Error(erro);
  const conta = contaAtiva(id);
  if (
    !atual ||
    atual.length > 128 ||
    !(await verificarSenha(atual, conta.senha_hash))
  )
    throw new Error("Confira sua senha atual.");
  const hash = await gerarHashSenha(nova);
  conexaoInternaCypher().transaction(() => {
    const vigente = contaAtiva(id);
    if (vigente.senha_hash !== conta.senha_hash)
      throw new Error("Seu acesso foi alterado. Entre novamente.");
    salvarSenha(id, hash);
  })();
  await avisarSenha(conta.email);
}

// A resposta pública é sempre igual, inclusive quando não existe conta ou o limite impede emissão.
export async function solicitarRecuperacaoSenha(email: string) {
  const db = conexaoInternaCypher();
  const conta = db
    .prepare(
      "SELECT id,email FROM usuarios WHERE email=? COLLATE NOCASE AND tipo_conta IN('consumidor','profissional') AND demonstracao=0 AND email_confirmado_em IS NOT NULL"
    )
    .get(email) as { id: string; email: string } | undefined;
  if (!conta || contaEncerrada(db, conta.id)) return;
  const agora = Date.now();
  const limite = db
    .prepare(
      "SELECT count(*) total,max(criado_em) ultimo FROM tokens_recuperacao_senha WHERE usuario_id=? AND criado_em>?"
    )
    .get(conta.id, agora - 60 * 60 * 1000) as {
    total: number;
    ultimo: number | null;
  };
  if (
    limite.total >= 5 ||
    (limite.ultimo !== null && agora - limite.ultimo < 60_000)
  )
    return;
  configurarEmail();
  const token = randomBytes(32).toString("hex");
  const url = new URL(
    "/redefinir-senha",
    process.env.CYPHER_PUBLIC_ORIGIN ??
      `http://localhost:${process.env.PORT ?? 3000}`
  );
  url.searchParams.set("token", token);
  db.transaction(() => {
    db.prepare(
      "UPDATE tokens_recuperacao_senha SET usado_em=? WHERE usuario_id=? AND usado_em IS NULL"
    ).run(agora, conta.id);
    db.prepare(
      "INSERT INTO tokens_recuperacao_senha(token_hash,usuario_id,email_destino,criado_em,expira_em) VALUES(?,?,?,?,?)"
    ).run(
      hashToken(token),
      conta.id,
      conta.email.toLowerCase(),
      agora,
      agora + duracaoRecuperacaoMs
    );
  })();
  try {
    await entregarEmail(
      conta.email,
      "Recupere seu acesso à Cypher",
      `Crie uma nova senha pelo link abaixo. Ele vale por 30 minutos e pode ser usado uma única vez.\n\n${url.href}\n\nSe você não solicitou, ignore esta mensagem: sua senha continua a mesma.`
    );
  } catch {
    db.prepare(
      "UPDATE tokens_recuperacao_senha SET usado_em=? WHERE token_hash=?"
    ).run(Date.now(), hashToken(token));
    throw new Error("Não foi possível solicitar a recuperação agora.");
  }
}

export function recuperacaoDisponivel(token: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  return Boolean(
    conexaoInternaCypher()
      .prepare(
        `SELECT 1 FROM tokens_recuperacao_senha t JOIN usuarios u ON u.id=t.usuario_id
    WHERE t.token_hash=? AND t.usado_em IS NULL AND t.expira_em>? AND lower(t.email_destino)=lower(u.email)
    AND u.email_confirmado_em IS NOT NULL AND u.tipo_conta IN('consumidor','profissional')
    AND NOT EXISTS(SELECT 1 FROM encerramentos_conta e WHERE e.usuario_id=u.id)`
      )
      .get(hashToken(token), Date.now())
  );
}

export async function redefinirSenhaConta(token: string, nova: string) {
  const erro = validarSenha(nova);
  if (erro) throw new Error(erro);
  if (!recuperacaoDisponivel(token)) throw erroLink();
  const hash = await gerarHashSenha(nova);
  const db = conexaoInternaCypher();
  const email = db.transaction(() => {
    if (!recuperacaoDisponivel(token)) throw erroLink();
    const registro = db
      .prepare(
        "SELECT usuario_id,email_destino FROM tokens_recuperacao_senha WHERE token_hash=?"
      )
      .get(hashToken(token)) as { usuario_id: string; email_destino: string };
    contaAtiva(registro.usuario_id);
    salvarSenha(registro.usuario_id, hash);
    return registro.email_destino;
  })();
  await avisarSenha(email);
}

export async function encerrarConta(id: string, senha: string) {
  const conta = contaAtiva(id);
  if (
    !senha ||
    senha.length > 128 ||
    !(await verificarSenha(senha, conta.senha_hash))
  )
    throw new Error("Confira sua senha atual.");
  const db = conexaoInternaCypher();
  db.transaction(() => {
    const vigente = contaAtiva(id);
    if (vigente.senha_hash !== conta.senha_hash)
      throw new Error("Seu acesso foi alterado. Entre novamente.");
    db.prepare(
      "INSERT INTO encerramentos_conta(usuario_id,encerrada_em,motivo_preservacao) VALUES(?,?,?)"
    ).run(
      id,
      Date.now(),
      "Identificador e registros compartilhados preservados para integridade de créditos, direitos, acordos, compras e auditoria. Perfil desativado; dados pessoais de apresentação e acesso removidos."
    );
    db.prepare("DELETE FROM sessoes WHERE usuario_id=?").run(id);
    db.prepare("DELETE FROM tokens_recuperacao_senha WHERE usuario_id=?").run(
      id
    );
    db.prepare("DELETE FROM tokens_confirmacao_email WHERE usuario_id=?").run(
      id
    );
    db.prepare(
      "UPDATE usuarios SET email=NULL,senha_hash=NULL,email_confirmado_em=NULL,atualizado_em=CURRENT_TIMESTAMP WHERE id=?"
    ).run(id);
    db.prepare(
      `UPDATE perfis SET nome='Conta encerrada',nome_informado='',nome_publico=0,competencias_json='[]',competencias_publicas=0,vulgo='',nascimento='',tratamento='',genero_personalizado='',cidade='',biografia='',contato='',equipamentos_json='[]',generos_json='[]',perfil_publico=0,localizacao_publica=0,contato_publico=0,atualizado_em=CURRENT_TIMESTAMP WHERE usuario_id=?`
    ).run(id);
    db.prepare("DELETE FROM preferencias_usuario WHERE usuario_id=?").run(id);
    db.prepare("DELETE FROM atividade_perfis WHERE usuario_id=?").run(id);
    db.prepare(
      "DELETE FROM respostas_atuacao_categoria WHERE usuario_id=?"
    ).run(id);
    db.prepare(
      "DELETE FROM respostas_atuacao_profissao WHERE usuario_id=?"
    ).run(id);
    db.prepare("DELETE FROM curtidas_obras WHERE usuario_id=?").run(id);
    db.prepare("DELETE FROM interacoes_conteudo WHERE usuario_id=? OR (objeto_tipo='perfil' AND objeto_id=?)").run(id, id);
    db.prepare("DELETE FROM profissionais_seguidos WHERE seguidor_id=? OR profissional_id=?").run(id, id);
    db.prepare("UPDATE comentarios_conteudo SET texto='', excluido_em=? WHERE autor_id=? AND excluido_em IS NULL").run(Date.now(), id);
    db.prepare(
      "UPDATE preferencias_contato SET profissionais=0,consumidores=0 WHERE usuario_id=?"
    ).run(id);
    db.prepare("UPDATE portfolio_config SET visivel=0 WHERE usuario_id=?").run(
      id
    );
    db.prepare("UPDATE projetos_trabalho SET publico=0 WHERE autor_id=?").run(
      id
    );
    db.prepare("UPDATE obras SET publicada=0 WHERE proprietario_id=?").run(id);
    db.prepare(
      "UPDATE oportunidades_profissionais SET estado='encerrada',revisao=revisao+1 WHERE autor_id=? AND estado IN('rascunho','aberta','pausada')"
    ).run(id);
  })();
  try {
    await entregarEmail(
      conta.email,
      "Conta encerrada na Cypher",
      "O encerramento solicitado foi concluído: seu acesso foi revogado, seu perfil foi desativado e os dados pessoais de apresentação foram removidos. Registros compartilhados necessários à proteção de créditos, acordos, compras e direitos de terceiros são preservados com acesso restrito. Seu identificador permanece reservado."
    );
  } catch {
    console.error("Não foi possível entregar o comprovante de encerramento.");
  }
}

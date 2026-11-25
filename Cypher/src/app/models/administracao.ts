import { randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { conexaoInternaCypher } from "./bancoDados.js";
import { gerarHashSenha } from "./autenticacaoCypher.js";
import {
  validarEmail,
  validarNomeCadastro,
  validarSenha,
} from "../validators/validarAutenticacao.js";
import type { PapelAdministrativo } from "./permissoes.js";

export const papeisAdministrativos: readonly PapelAdministrativo[] = [
  "super_admin",
  "moderador",
  "editor",
];

export function exigirAdministrador(
  autorId: string,
  acao: "equipe" | "taxonomia" | "excecoes" | "editorial" | "auditoria" | "reputacao" | "moderacao"
) {
  const db = conexaoInternaCypher();
  const autor = db
    .prepare(
      `SELECT a.papel FROM administradores a JOIN usuarios u ON u.id = a.usuario_id
    WHERE a.usuario_id = ? AND a.ativo = 1 AND u.tipo_conta = 'administrativo'`
    )
    .get(autorId) as { papel: PapelAdministrativo } | undefined;
  if (
    !autor ||
    !(
      autor.papel === "super_admin" ||
      (autor.papel === "moderador" && ["excecoes", "reputacao", "moderacao"].includes(acao)) ||
      (autor.papel === "editor" && acao === "editorial")
    )
  )
    throw new Error("ACESSO_ADMINISTRATIVO_NEGADO");
}

export async function criarAdministrador(
  dados: {
    nome: string;
    email: string;
    senha: string;
    papel: PapelAdministrativo;
  },
  autorId?: string
) {
  const email = dados.email.trim().toLowerCase();
  if (
    validarEmail(email) ||
    validarNomeCadastro(dados.nome.trim()) ||
    validarSenha(dados.senha) ||
    !papeisAdministrativos.includes(dados.papel)
  )
    throw new Error("DADOS_ADMINISTRATIVOS_INVALIDOS");
  if (autorId) exigirAdministrador(autorId, "equipe");
  const hash = await gerarHashSenha(dados.senha);
  const db = conexaoInternaCypher();
  return db.transaction(() => {
    if (autorId) exigirAdministrador(autorId, "equipe");
    else {
      const total = db
        .prepare("SELECT count(*) AS total FROM administradores")
        .get() as { total: number };
      if (total.total !== 0 || dados.papel !== "super_admin")
        throw new Error("PROVISIONAMENTO_INICIAL_ENCERRADO");
    }
    const id = randomUUID();
    db.prepare(
      `INSERT INTO usuarios (id,email,senha_hash,tipo_conta) VALUES (?,?,?,'administrativo')`
    ).run(id, email, hash);
    db.prepare(
      "INSERT INTO administradores (usuario_id,nome,papel) VALUES (?,?,?)"
    ).run(id, dados.nome.trim(), dados.papel);
    db.prepare(
      "INSERT INTO auditoria_administrativa (id,autor_id,acao,alvo_id,detalhe) VALUES (?,?,?,?,?)"
    ).run(
      randomUUID(),
      autorId ?? id,
      autorId ? "administrador_criado" : "super_admin_inicial",
      id,
      dados.papel
    );
    return id;
  })();
}

export function listarAdministradores(autorId: string) {
  exigirAdministrador(autorId, "equipe");
  return conexaoInternaCypher()
    .prepare(
      `SELECT a.usuario_id AS id,a.nome,u.email,a.papel,a.ativo FROM administradores a JOIN usuarios u ON u.id=a.usuario_id ORDER BY a.criado_em,a.usuario_id`
    )
    .all();
}

export function atualizarAdministrador(
  autorId: string,
  alvoId: string,
  papel: PapelAdministrativo,
  ativo: boolean
) {
  const db = conexaoInternaCypher();
  return db.transaction(() => {
    exigirAdministrador(autorId, "equipe");
    if (alvoId === autorId || !papeisAdministrativos.includes(papel))
      throw new Error("ALTERACAO_ADMINISTRATIVA_INVALIDA");
    const alvo = db
      .prepare("SELECT papel,ativo FROM administradores WHERE usuario_id=?")
      .get(alvoId) as { papel: string; ativo: number } | undefined;
    if (!alvo) throw new Error("ADMINISTRADOR_NAO_ENCONTRADO");
    if (
      alvo.papel === "super_admin" &&
      alvo.ativo &&
      (!ativo || papel !== "super_admin")
    ) {
      const superiores = db
        .prepare(
          "SELECT count(*) AS total FROM administradores WHERE papel='super_admin' AND ativo=1"
        )
        .get() as { total: number };
      if (superiores.total <= 1) throw new Error("ULTIMO_SUPER_ADMIN");
    }
    db.prepare(
      "UPDATE administradores SET papel=?,ativo=? WHERE usuario_id=?"
    ).run(papel, Number(ativo), alvoId);
    db.prepare("DELETE FROM sessoes WHERE usuario_id=?").run(alvoId);
    db.prepare(
      "INSERT INTO auditoria_administrativa (id,autor_id,acao,alvo_id,detalhe) VALUES (?,?,?,?,?)"
    ).run(
      randomUUID(),
      autorId,
      "administrador_atualizado",
      alvoId,
      JSON.stringify({ antes: alvo, depois: { papel, ativo } })
    );
  })();
}

export function listarAuditoria(autorId: string) {
  exigirAdministrador(autorId, "auditoria");
  return conexaoInternaCypher()
    .prepare(
      `SELECT l.acao,l.detalhe,l.criada_em AS data,a.nome AS autor,b.nome AS alvo
    FROM auditoria_administrativa l LEFT JOIN administradores a ON a.usuario_id=l.autor_id
    LEFT JOIN administradores b ON b.usuario_id=l.alvo_id ORDER BY l.rowid DESC LIMIT 100`
    )
    .all();
}

export async function prepararSuperAdminLocal() {
  if (process.env.NODE_ENV === "test") return;
  const db = conexaoInternaCypher();
  const total = db
    .prepare("SELECT count(*) AS total FROM administradores")
    .get() as { total: number };
  if (total.total) return; // Não emitir credenciais novas para uma conta já existente.
  const arquivo = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(arquivo)) {
    fs.writeFileSync(
      arquivo,
      `# Acesso administrativo local privado. Não versionar nem publicar.\nCYPHER_SUPER_ADMIN_EMAIL=admin@cypher.local\nCYPHER_SUPER_ADMIN_PASSWORD=${randomBytes(24).toString("base64url")}\n`,
      { flag: "wx", mode: 0o600 }
    );
  }
  process.loadEnvFile(arquivo);
  const email = process.env.CYPHER_SUPER_ADMIN_EMAIL;
  const senha = process.env.CYPHER_SUPER_ADMIN_PASSWORD;
  if (!email || !senha)
    throw new Error("Configure o acesso inicial em .env.local.");
  await criarAdministrador({
    nome: "Administrador Geral",
    email,
    senha,
    papel: "super_admin",
  });
}

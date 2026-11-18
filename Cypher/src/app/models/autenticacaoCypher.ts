import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import {
  buscarCredenciaisCypher,
  criarContaCypher,
  criarSessaoCypher,
  obterUsuarioDaSessaoCypher,
  revogarSessaoCypher,
  type UsuarioDaSessao,
} from "./bancoDados.js";

const parametrosScrypt = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const tamanhoChave = 64;
export const duracaoSessaoMs = 24 * 60 * 60 * 1000;

function derivarChave(
  senha: string,
  sal: Buffer,
  N: number,
  r: number,
  p: number,
  tamanho = tamanhoChave
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      senha,
      sal,
      tamanho,
      { N, r, p, maxmem: 64 * 1024 * 1024 },
      (erro, chave) => {
        if (erro) reject(erro);
        else resolve(chave);
      }
    );
  });
}

export async function gerarHashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const chave = await derivarChave(
    senha,
    sal,
    parametrosScrypt.N,
    parametrosScrypt.r,
    parametrosScrypt.p
  );

  return [
    "scrypt",
    parametrosScrypt.N,
    parametrosScrypt.r,
    parametrosScrypt.p,
    sal.toString("base64url"),
    chave.toString("base64url"),
  ].join("$");
}

export async function verificarSenha(
  senha: string,
  hashArmazenado: string
): Promise<boolean> {
  const [algoritmo, textoN, textoR, textoP, salCodificado, chaveCodificada] =
    hashArmazenado.split("$");
  const N = Number(textoN);
  const r = Number(textoR);
  const p = Number(textoP);
  const sal = Buffer.from(salCodificado ?? "", "base64url");
  const chaveEsperada = Buffer.from(chaveCodificada ?? "", "base64url");

  if (
    algoritmo !== "scrypt" ||
    !Number.isInteger(N) ||
    N < 4_096 ||
    N > 32_768 ||
    (N & (N - 1)) !== 0 ||
    !Number.isInteger(r) ||
    r < 1 ||
    r > 16 ||
    !Number.isInteger(p) ||
    p < 1 ||
    p > 4 ||
    sal.length < 16 ||
    chaveEsperada.length !== tamanhoChave
  ) {
    return false;
  }

  const chaveRecebida = await derivarChave(
    senha,
    sal,
    N,
    r,
    p,
    chaveEsperada.length
  );
  return timingSafeEqual(chaveEsperada, chaveRecebida);
}

export async function autenticarUsuario(
  email: string,
  senha: string
): Promise<string | undefined> {
  const credenciais = buscarCredenciaisCypher(email);
  if (!credenciais) return undefined;

  const senhaValida = await verificarSenha(senha, credenciais.senhaHash);
  return senhaValida && (credenciais.tipoConta === "administrativo" || credenciais.emailConfirmado) ? credenciais.id : undefined;
}

export async function cadastrarUsuario(dados: {
  nome: string;
  identificador?: string;
  vulgo?: string;
  generoPersonalizado?: string;
  nascimento?: string;
  tratamento?: string;
  vertentes?: string[];
  email: string;
  senha: string;
  tipoConta?: "profissional" | "consumidor";
  categorias: string[];
  outraCategoria: string;
  atuacoes?: import("./bancoDados.js").AtuacaoProfissionalPersistida[];
}): Promise<void> {
  if (buscarCredenciaisCypher(dados.email)) {
    throw new Error("EMAIL_DUPLICADO");
  }

  const id = randomUUID();
  const senhaHash = await gerarHashSenha(dados.senha);
  const identificadorNome = dados.nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const identificador = `@${identificadorNome || "artista"}-${id.slice(0, 6)}`;
  const iniciaisBase = dados.nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte[0]?.toLocaleUpperCase("pt-BR") ?? "")
    .join("");
  const iniciais = iniciaisBase
    ? (iniciaisBase + (iniciaisBase[1] ?? iniciaisBase[0])).slice(0, 2)
    : "AA";
  const funcao = dados.categorias.join(" · ");

  try {
    criarContaCypher({
      id,
      email: dados.email,
      senhaHash,
      tipoConta: dados.tipoConta ?? "profissional",
      nome: dados.nome.trim(),
      nomeInformado:dados.nome,vulgo:dados.vulgo,usarVulgo:false,generoPersonalizado:dados.generoPersonalizado,nascimento:dados.nascimento,tratamento:dados.tratamento,vertentes:dados.vertentes,
      funcao,
      identificador: dados.identificador ?? identificador,
      iniciais,
      cTag: `CYP-${id.replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      categorias: dados.categorias,
      outraCategoria: dados.outraCategoria,
      atuacoes: dados.atuacoes,
    });
  } catch (erro) {
    if (
      erro instanceof Error &&
      erro.message.includes("UNIQUE constraint failed: usuarios.email")
    ) {
      throw new Error("EMAIL_DUPLICADO");
    }
    throw erro;
  }
}

export function iniciarSessao(usuarioId: string): string {
  const token = randomBytes(32).toString("base64url");
  const agora = Date.now();
  const expiraEm = agora + duracaoSessaoMs;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  criarSessaoCypher(usuarioId, tokenHash, expiraEm, agora);
  return token;
}

export function usuarioDaSessao(token: string): UsuarioDaSessao | undefined {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) return undefined;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return obterUsuarioDaSessaoCypher(tokenHash, Date.now());
}

export function encerrarSessao(token: string): void {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) return;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  revogarSessaoCypher(tokenHash);
}

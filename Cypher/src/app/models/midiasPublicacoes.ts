import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { caminhoBancoCypher, conexaoInternaCypher } from "./bancoDados.js";
import { detectarMidia } from "./projetosTrabalho.js";
import { objetoDisponivel, objetoSobMedida } from "./politicasModeracao.js";
import { exigirContaInteracao, ErroInteracao } from "./interacoesConteudo.js";

const db = conexaoInternaCypher;
const fontes: Record<string, string> = {
  perfil: "SELECT usuario_id dono FROM perfis WHERE usuario_id=?",
  obra: "SELECT proprietario_id dono FROM obras WHERE id=?",
  beat: "SELECT produtor_id dono FROM beats WHERE id=?",
  evento: "SELECT proprietario_id dono FROM eventos WHERE id=?",
  projeto: "SELECT autor_id dono FROM projetos_trabalho WHERE id=?",
};
export type MidiaPublicacao = {
  id: string;
  autor_id: string;
  objeto_tipo: string;
  objeto_id: string;
  finalidade: string;
  posicao: string;
  nome: string;
  mime: string;
  bytes: number;
};
export function donoMidia(tipo: string, id: string) {
  if (!Object.hasOwn(fontes, tipo))
    throw new ErroInteracao("Publicação inválida.", 404);
  const r = db().prepare(fontes[tipo]).get(id) as { dono: string } | undefined;
  if (!r) throw new ErroInteracao("Publicação indisponível.", 404);
  return r.dono;
}
export function gerirMidias(ator: string, tipo: string, id: string) {
  exigirContaInteracao(ator);
  if (donoMidia(tipo, id) !== ator)
    throw new ErroInteracao(
      "Somente o responsável pode gerenciar esta mídia.",
      403
    );
  if (tipo !== "perfil" && !objetoDisponivel(db(), tipo, id, ator))
    throw new ErroInteracao("Publicação indisponível.", 404);
}
export const pastaMidiasPublicacoes = () =>
  path.join(path.dirname(caminhoBancoCypher()), "midias-publicacoes");
export function listarMidiasPublicacoes(
  ator: string,
  tipo: string,
  id: string
) {
  const proprio = donoMidia(tipo, id) === ator;
  if (
    !proprio &&
    tipo === "perfil" &&
    !db()
      .prepare(
        "SELECT 1 FROM usuarios WHERE id=? AND tipo_conta='profissional' AND (demonstracao=1 OR email_confirmado_em IS NOT NULL)"
      )
      .get(id)
  )
    return [];
  if (tipo !== "perfil" && !objetoDisponivel(db(), tipo, id, ator)) return [];
  if (!proprio && tipo === "perfil" && !objetoDisponivel(db(), tipo, id, ator))
    return [];
  if (
    !proprio &&
    tipo === "obra" &&
    !db().prepare("SELECT 1 FROM obras WHERE id=? AND publicada=1").get(id)
  )
    return [];
  if (
    !proprio &&
    tipo === "projeto" &&
    !db()
      .prepare("SELECT 1 FROM projetos_trabalho WHERE id=? AND publico=1")
      .get(id)
  )
    return [];
  return (
    db()
      .prepare(
        "SELECT * FROM midias_publicacoes WHERE objeto_tipo=? AND objeto_id=? AND retirada_em IS NULL ORDER BY criado_em"
      )
      .all(tipo, id) as MidiaPublicacao[]
  ).filter(m => !objetoSobMedida(db(), "midia_publicacao", m.id));
}
export function capaPublicacao(ator: string, tipo: string, id: string) {
  return listarMidiasPublicacoes(ator, tipo, id).find(
    m => m.finalidade === "imagem" && m.posicao === "principal"
  )?.id;
}
export function salvarMidiaPublicacao(
  ator: string,
  tipo: string,
  id: string,
  finalidade: string,
  nome: string,
  arquivo: Buffer
) {
  gerirMidias(ator, tipo, id);
  const posicao = tipo === "perfil" && finalidade === "capa" ? "capa" : "principal";
  if (posicao === "capa") finalidade = "imagem";
  const permitidas =
    tipo === "obra" || tipo === "projeto"
      ? ["imagem", "audio", "video", "texto"]
      : ["imagem"];
  if (!permitidas.includes(finalidade))
    throw new ErroInteracao(
      tipo === "beat"
        ? "Use a área de arquivos do beat para prévias e entregas. Esta seção recebe imagens."
        : "Este registro recebe apenas imagens PNG ou JPEG."
    );
  if (
    !Buffer.isBuffer(arquivo) ||
    !arquivo.length ||
    arquivo.length > 25 * 1024 * 1024
  )
    throw new ErroInteracao("Envie um arquivo de até 25 MB.");
  let mime: string;
  if (finalidade === "texto") {
    if (arquivo.length > 256 * 1024)
      throw new ErroInteracao("O texto pode ter até 256 KB.");
    const texto = new TextDecoder("utf-8", { fatal: true });
    try {
      if (texto.decode(arquivo).includes("\0")) throw Error();
    } catch {
      throw new ErroInteracao("Envie um arquivo TXT em UTF-8.");
    }
    if (!/\.txt$/i.test(nome)) throw new ErroInteracao("Envie um arquivo TXT.");
    mime = "text/plain";
  } else {
    try {
      mime = detectarMidia(arquivo);
    } catch {
      throw new ErroInteracao(
        "Formato inválido. Use PNG, JPEG, MP3, WAV, OGG, MP4 ou WebM."
      );
    }
    const prefixo = finalidade === "imagem" ? "image/" : finalidade + "/";
    if (!mime.startsWith(prefixo))
      throw new ErroInteracao(
        "O arquivo não corresponde à finalidade selecionada."
      );
    if (finalidade === "imagem" && arquivo.length > 8 * 1024 * 1024)
      throw new ErroInteracao("Imagens podem ter até 8 MB.");
  }
  const seguro = nome.replace(/[\x00-\x1f\x7f/\\]/g, "_").slice(0, 160);
  if (!seguro) throw new ErroInteracao("Informe o nome do arquivo.");
  const mid = randomUUID(),
    pasta = pastaMidiasPublicacoes();
  fs.mkdirSync(pasta, { recursive: true });
  db()
    .transaction(() => {
      const total = db()
        .prepare(
          "SELECT coalesce(sum(bytes),0) total FROM midias_publicacoes WHERE autor_id=?"
        )
        .get(ator) as { total: number };
      if (total.total + arquivo.length > 250 * 1024 * 1024)
        throw new ErroInteracao("Seu limite de 250 MB de mídias foi atingido.");
      fs.writeFileSync(path.join(pasta, mid), arquivo, { flag: "wx" });
      try {
        db()
          .prepare(
            "UPDATE midias_publicacoes SET retirada_em=? WHERE objeto_tipo=? AND objeto_id=? AND finalidade=? AND posicao=? AND retirada_em IS NULL"
          )
          .run(Date.now(), tipo, id, finalidade, posicao);
        db()
          .prepare(
            "INSERT INTO midias_publicacoes(id,autor_id,objeto_tipo,objeto_id,finalidade,nome,mime,bytes,criado_em,posicao) VALUES(?,?,?,?,?,?,?,?,?,?)"
          )
          .run(
            mid,
            ator,
            tipo,
            id,
            finalidade,
            seguro,
            mime,
            arquivo.length,
            Date.now(),
            posicao
          );
      } catch (e) {
        fs.rmSync(path.join(pasta, mid), { force: true });
        throw e;
      }
    })
    .immediate();
  return mid;
}
export function arquivoPublicacao(ator: string, id: string) {
  exigirContaInteracao(ator);
  const m = db()
    .prepare(
      "SELECT * FROM midias_publicacoes WHERE id=? AND retirada_em IS NULL"
    )
    .get(id) as MidiaPublicacao | undefined;
  if (
    !m ||
    !listarMidiasPublicacoes(ator, m.objeto_tipo, m.objeto_id).some(
      a => a.id === id
    )
  )
    throw new ErroInteracao("Arquivo indisponível.", 404);
  return m;
}
export function retirarMidiaPublicacao(ator: string, id: string) {
  const m = arquivoPublicacao(ator, id);
  gerirMidias(ator, m.objeto_tipo, m.objeto_id);
  db()
    .prepare("UPDATE midias_publicacoes SET retirada_em=? WHERE id=?")
    .run(Date.now(), id);
}

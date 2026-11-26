import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { dataAtualCadastro } from "../validators/validarIdentidade.js";
import { objetoDisponivel, objetoSobMedida } from "./politicasModeracao.js";

type Banco = Database.Database;
export const formatosLancamento = ["Single", "EP", "Álbum", "Mixtape"];
const tiposComposicao = ["Obra", "Composição", "Instrumental"];
const tiposFonograma = ["Música", "Fonograma"];

export const esquemaAcervoMusical = `
CREATE TABLE IF NOT EXISTS composicoes (
 id TEXT PRIMARY KEY REFERENCES obras(id) ON DELETE CASCADE, iswc TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS letras_musicais (
 id TEXT PRIMARY KEY REFERENCES obras(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS fonogramas (
 id TEXT PRIMARY KEY, obra_id TEXT NOT NULL UNIQUE REFERENCES obras(id) ON DELETE CASCADE,
 isrc TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS fonogramas_composicoes (
 fonograma_id TEXT NOT NULL REFERENCES fonogramas(id) ON DELETE CASCADE,
 composicao_id TEXT NOT NULL REFERENCES composicoes(id) ON DELETE RESTRICT,
 PRIMARY KEY(fonograma_id, composicao_id)
);
CREATE INDEX IF NOT EXISTS composicoes_por_fonograma ON fonogramas_composicoes(composicao_id);
CREATE TABLE IF NOT EXISTS lancamentos (
 id TEXT PRIMARY KEY REFERENCES obras(id) ON DELETE CASCADE,
 formato TEXT NOT NULL CHECK(formato IN('Single','EP','Álbum','Mixtape'))
);
CREATE TABLE IF NOT EXISTS faixas_lancamento (
 id TEXT PRIMARY KEY, lancamento_id TEXT NOT NULL REFERENCES lancamentos(id) ON DELETE CASCADE,
 fonograma_id TEXT NOT NULL REFERENCES fonogramas(id) ON DELETE RESTRICT,
 ordem INTEGER NOT NULL CHECK(ordem > 0),
 UNIQUE(lancamento_id, ordem), UNIQUE(lancamento_id, fonograma_id)
);
CREATE INDEX IF NOT EXISTS lancamentos_agregados ON faixas_lancamento(fonograma_id);
CREATE TABLE IF NOT EXISTS evidencias_lancamento (
 id TEXT PRIMARY KEY, lancamento_id TEXT NOT NULL REFERENCES lancamentos(id) ON DELETE CASCADE,
 tipo TEXT NOT NULL CHECK(tipo IN('audio','externa')), data_factual TEXT NOT NULL,
 url TEXT NOT NULL DEFAULT '', assinatura TEXT NOT NULL,
 estado TEXT NOT NULL CHECK(estado IN('pendente','confirmada','recusada')),
 revisor_id TEXT REFERENCES usuarios(id), revisada_em TEXT, retirada_em TEXT,
 criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS evidencia_lancamento_ativa ON evidencias_lancamento(lancamento_id) WHERE retirada_em IS NULL;
CREATE TABLE IF NOT EXISTS historico_lancamentos (
 id INTEGER PRIMARY KEY, lancamento_id TEXT NOT NULL, autor_id TEXT NOT NULL,
 acao TEXT NOT NULL, dados_json TEXT NOT NULL, criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS historico_por_lancamento ON historico_lancamentos(lancamento_id,id);
`;

type Obra = {
  id: string;
  proprietario_id: string;
  titulo: string;
  tipo: string;
  metadados: string;
  publicada: number;
  isrc: string;
  iswc: string;
  data_lancamento: string;
  link_escuta: string;
};
type Vinculo = { id: string; obraId: string; titulo: string };
type Evidencia = {
  id: string;
  tipo: "audio" | "externa";
  data_factual: string;
  url: string;
  assinatura: string;
  estado: "pendente" | "confirmada" | "recusada";
};
export type EdicaoAcervo = {
  composicoes: string[];
  faixas: string[];
};
export class ErroAcervo extends Error {}

function auditar(
  db: Banco,
  id: string,
  ator: string,
  acao: string,
  dados: unknown
) {
  db.prepare(
    "INSERT INTO historico_lancamentos(lancamento_id,autor_id,acao,dados_json) VALUES(?,?,?,?)"
  ).run(id, ator, acao, JSON.stringify(dados));
}

export function faixasDoLancamento(db: Banco, id: string) {
  return db
    .prepare(
      `
    SELECT f.id, f.fonograma_id AS fonogramaId, g.obra_id AS obraId, o.titulo, f.ordem
    FROM faixas_lancamento f JOIN fonogramas g ON g.id=f.fonograma_id JOIN obras o ON o.id=g.obra_id
    WHERE f.lancamento_id=? ORDER BY f.ordem
  `
    )
    .all(id) as (Vinculo & { fonogramaId: string; ordem: number })[];
}

function vinculadosDaGravacao(db: Banco, obraId: string) {
  return db
    .prepare(
      `
    SELECT o.id, o.titulo FROM fonogramas g
    JOIN fonogramas_composicoes v ON v.fonograma_id=g.id
    JOIN obras o ON o.id=v.composicao_id WHERE g.obra_id=? ORDER BY o.titulo,o.id
  `
    )
    .all(obraId) as { id: string; titulo: string }[];
}

function registroMusical(db: Banco, obra: Obra, legado: boolean) {
  const { id, tipo, isrc, iswc } = obra;
  if (tiposComposicao.includes(tipo) || (legado && iswc && tipo !== "Letra"))
    db.prepare(
      "INSERT INTO composicoes VALUES (?,?) ON CONFLICT(id) DO UPDATE SET iswc=excluded.iswc"
    ).run(id, iswc);
  if (tipo === "Letra")
    db.prepare("INSERT OR IGNORE INTO letras_musicais VALUES (?)").run(id);
  if (tiposFonograma.includes(tipo) || (legado && tipo === "Single")) {
    db.prepare(
      "INSERT INTO fonogramas VALUES (?,?,?) ON CONFLICT(obra_id) DO UPDATE SET isrc=excluded.isrc"
    ).run(randomUUID(), id, isrc);
    if (legado && iswc)
      db.prepare(
        "INSERT OR IGNORE INTO fonogramas_composicoes SELECT id,obra_id FROM fonogramas WHERE obra_id=?"
      ).run(id);
  }
  if (formatosLancamento.includes(tipo))
    db.prepare(
      "INSERT INTO lancamentos VALUES (?,?) ON CONFLICT(id) DO UPDATE SET formato=excluded.formato"
    ).run(id, tipo);
}

function salvarFaixas(db: Banco, id: string, fonogramas: string[]) {
  const anteriores = new Map(
    faixasDoLancamento(db, id).map(f => [f.fonogramaId, f.id])
  );
  db.prepare("DELETE FROM faixas_lancamento WHERE lancamento_id=?").run(id);
  const inserir = db.prepare("INSERT INTO faixas_lancamento VALUES (?,?,?,?)");
  fonogramas.forEach((fonograma, i) =>
    inserir.run(anteriores.get(fonograma) ?? randomUUID(), id, fonograma, i + 1)
  );
}

export function migrarAcervoMusical(db: Banco, ids?: string[]) {
  const obras = (
    ids
      ? db
          .prepare(
            "SELECT * FROM obras WHERE id IN (SELECT value FROM json_each(?)) ORDER BY id"
          )
          .all(JSON.stringify(ids))
      : db.prepare("SELECT * FROM obras ORDER BY id").all()
  ) as Obra[];
  const jaMigrado = db.prepare("SELECT 1 FROM lancamentos WHERE id=?");
  const lancamentosNovos = obras.filter(
    o => formatosLancamento.includes(o.tipo) && !jaMigrado.get(o.id)
  );
  for (const obra of obras) registroMusical(db, obra, true);
  const fonogramas = new Map(
    (
      db.prepare("SELECT id,obra_id FROM fonogramas").all() as {
        id: string;
        obra_id: string;
      }[]
    ).map(g => [g.obra_id, g.id])
  );
  const donos = new Map(obras.map(o => [o.id, o.proprietario_id]));
  for (const obra of lancamentosNovos) {
    const meta = JSON.parse(
      db
        .prepare("SELECT CASE WHEN json_valid(?) THEN ? ELSE '{}' END AS meta")
        .pluck()
        .get(obra.metadados, obra.metadados) as string
    );
    const origens = Array.isArray(meta?.faixas) ? meta.faixas : [];
    const ids = [
      ...new Set<string>(
        origens.flatMap((id: string) =>
          donos.get(id) === obra.proprietario_id && fonogramas.has(id)
            ? [fonogramas.get(id)!]
            : []
        )
      ),
    ];
    if (!ids.length && obra.tipo === "Single")
      ids.push(fonogramas.get(obra.id)!);
    salvarFaixas(db, obra.id, ids);
    auditar(db, obra.id, obra.proprietario_id, "migrado", {
      dataInformada: obra.data_lancamento,
      link: obra.link_escuta,
      faixasOriginais: origens,
      faixas: ids,
    });
  }
}

export function tipoAcervo(tipo: string) {
  if (tiposComposicao.includes(tipo)) return "composicao";
  if (tiposFonograma.includes(tipo)) return "fonograma";
  if (formatosLancamento.includes(tipo)) return "lancamento";
  return tipo === "Letra" ? "letra" : "";
}

export function opcoesAcervo(db: Banco, ator: string) {
  const listar = (sql: string) =>
    (db.prepare(sql).all(ator) as Vinculo[]).filter(o =>
      objetoDisponivel(db, "obra", o.obraId, ator)
    );
  return {
    composicoes:
      listar(`SELECT c.id, o.id obraId, o.titulo FROM composicoes c JOIN obras o ON o.id=c.id
      WHERE o.proprietario_id=? AND o.demonstracao=0 AND o.tipo IN('Obra','Composição','Instrumental') ORDER BY o.titulo`),
    fonogramas:
      listar(`SELECT g.id, o.id obraId, o.titulo FROM fonogramas g JOIN obras o ON o.id=g.obra_id
      WHERE o.proprietario_id=? AND o.demonstracao=0 ORDER BY o.titulo`),
  };
}

export function valoresAcervo(db: Banco, id: string): EdicaoAcervo {
  return {
    composicoes: vinculadosDaGravacao(db, id)
      .filter(c => c.id !== id)
      .map(c => c.id),
    faixas: faixasDoLancamento(db, id).map(f => f.fonogramaId),
  };
}

export function guardarAcervo(
  db: Banco,
  id: string,
  dados?: EdicaoAcervo,
  anterior?: Obra
) {
  const obra = db.prepare("SELECT * FROM obras WHERE id=?").get(id) as Obra;
  const antes = tipoAcervo(anterior?.tipo ?? "");
  const classe = tipoAcervo(obra.tipo);
  if (anterior && antes !== classe && (antes || dados))
    throw new ErroAcervo(
      "O tipo do registro é permanente. Cadastre um novo item para usar outro tipo musical."
    );
  const legado =
    !dados ||
    Boolean(
      anterior &&
      db
        .prepare(
          "SELECT 1 FROM fonogramas WHERE obra_id=? AND (EXISTS (SELECT 1 FROM lancamentos WHERE id=?) OR EXISTS (SELECT 1 FROM composicoes WHERE id=?))"
        )
        .get(id, id, id)
    );
  registroMusical(
    db,
    legado && dados && anterior
      ? {
          ...obra,
          isrc: classe === "fonograma" ? obra.isrc : anterior.isrc,
          iswc: classe === "composicao" ? obra.iswc : anterior.iswc,
        }
      : obra,
    legado
  );
  const antigas = valoresAcervo(db, id);
  const ator = obra.proprietario_id;
  if (dados && classe === "fonograma") {
    const disponiveis = new Set(
      opcoesAcervo(db, ator).composicoes.map(c => c.id)
    );
    if (
      dados.composicoes.length > 20 ||
      new Set(dados.composicoes).size !== dados.composicoes.length ||
      dados.composicoes.some(c => !disponiveis.has(c))
    )
      throw new ErroAcervo(
        "Selecione até 20 composições próprias e disponíveis."
      );
    const g = db
      .prepare("SELECT id FROM fonogramas WHERE obra_id=?")
      .pluck()
      .get(id);
    db.prepare(
      "DELETE FROM fonogramas_composicoes WHERE fonograma_id=? AND composicao_id<>?"
    ).run(g, id);
    const inserir = db.prepare(
      "INSERT INTO fonogramas_composicoes VALUES (?,?)"
    );
    for (const c of dados.composicoes) inserir.run(g, c);
  }
  if (classe !== "lancamento") return;
  if (dados) {
    const disponiveis = new Set(
      opcoesAcervo(db, ator).fonogramas.map(f => f.id)
    );
    const faixas = dados.faixas;
    if (
      (!faixas.length && (!anterior || antigas.faixas.length)) ||
      faixas.length > 50 ||
      (obra.tipo === "Single" && faixas.length > 1) ||
      new Set(faixas).size !== faixas.length ||
      faixas.some(f => !disponiveis.has(f))
    )
      throw new ErroAcervo(
        "Selecione gravações próprias e disponíveis, sem repetição. Singles aceitam uma faixa e os demais formatos, até 50."
      );
    if (JSON.stringify(antigas.faixas) !== JSON.stringify(faixas)) {
      salvarFaixas(db, id, faixas);
      db.prepare(
        "UPDATE evidencias_lancamento SET retirada_em=CURRENT_TIMESTAMP WHERE lancamento_id=? AND retirada_em IS NULL"
      ).run(id);
    } else if (
      anterior &&
      (anterior.tipo !== obra.tipo || anterior.titulo !== obra.titulo)
    ) {
      db.prepare(
        "UPDATE evidencias_lancamento SET retirada_em=CURRENT_TIMESTAMP WHERE lancamento_id=? AND retirada_em IS NULL AND tipo='externa'"
      ).run(id);
    }
  } else if (!anterior && obra.tipo === "Single") {
    const g = db
      .prepare("SELECT id FROM fonogramas WHERE obra_id=?")
      .pluck()
      .get(id) as string;
    salvarFaixas(db, id, [g]);
  }
  auditar(db, id, ator, anterior ? "editado" : "criado", {
    antes: anterior
      ? {
          titulo: anterior.titulo,
          formato: anterior.tipo,
          faixas: antigas.faixas,
          visibilidade: anterior.publicada,
        }
      : null,
    depois: {
      titulo: obra.titulo,
      formato: obra.tipo,
      faixas: valoresAcervo(db, id).faixas,
      visibilidade: obra.publicada,
    },
  });
}

export function impedirExclusaoVinculada(db: Banco, id: string) {
  return Boolean(
    db
      .prepare(
        `
    SELECT 1 FROM faixas_lancamento f JOIN fonogramas g ON g.id=f.fonograma_id
    WHERE g.obra_id=? AND f.lancamento_id<>?
    UNION ALL SELECT 1 FROM fonogramas_composicoes v JOIN fonogramas g ON g.id=v.fonograma_id
    WHERE v.composicao_id=? AND g.obra_id<>?
  `
      )
      .get(id, id, id, id)
  );
}

function audioDisponivel(db: Banco, pasta: string, obrId: string) {
  const midia = db
    .prepare(
      `
    SELECT id, bytes FROM midias_publicacoes WHERE objeto_tipo='obra' AND objeto_id=?
    AND finalidade='audio' AND mime LIKE 'audio/%' AND retirada_em IS NULL
  `
    )
    .get(obrId) as { id: string; bytes: number } | undefined;
  if (!midia || objetoSobMedida(db, "midia_publicacao", midia.id)) return "";
  const arquivo = fs.statSync(
    path.join(pasta, "midias-publicacoes", midia.id),
    { throwIfNoEntry: false }
  );
  return arquivo?.isFile() && arquivo.size === midia.bytes ? midia.id : "";
}

function evidenciaAtiva(db: Banco, id: string) {
  return db
    .prepare(
      "SELECT * FROM evidencias_lancamento WHERE lancamento_id=? AND retirada_em IS NULL"
    )
    .get(id) as Evidencia | undefined;
}

function assinaturaAudio(db: Banco, pasta: string, id: string) {
  const faixas = faixasDoLancamento(db, id);
  const midias = faixas.map(f =>
    disponivel(db, f.obraId, "") ? audioDisponivel(db, pasta, f.obraId) : ""
  );
  return midias.length && midias.every(Boolean) ? JSON.stringify(midias) : "";
}

function disponivel(db: Banco, id: string, visitante: string) {
  const o = db
    .prepare("SELECT publicada,proprietario_id FROM obras WHERE id=?")
    .get(id) as Obra | undefined;
  return Boolean(
    o &&
    (o.publicada || o.proprietario_id === visitante) &&
    objetoDisponivel(db, "obra", id, visitante)
  );
}

export function enviarEvidencia(
  db: Banco,
  pasta: string,
  id: string,
  ator: string,
  tipo: string,
  data: string,
  link: string,
  autorizado: boolean
) {
  return db.transaction(() => {
    const obra = db
      .prepare(
        "SELECT o.* FROM obras o JOIN lancamentos l ON l.id=o.id WHERE o.id=? AND o.proprietario_id=? AND o.demonstracao=0"
      )
      .get(id, ator) as Obra | undefined;
    if (!obra || !disponivel(db, id, ator))
      throw new ErroAcervo("Lançamento indisponível.");
    if (!autorizado)
      throw new ErroAcervo(
        "Confirme que tem autorização para divulgar o lançamento e suas faixas."
      );
    const parsed = new Date(data + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== data ||
      data > dataAtualCadastro()
    )
      throw new ErroAcervo(
        "Informe a data em que o lançamento foi disponibilizado."
      );
    const url = URL.parse(link);
    let assinatura: string;
    if (tipo === "audio") {
      assinatura = assinaturaAudio(db, pasta, id);
      if (!assinatura || !disponivel(db, id, ""))
        throw new ErroAcervo(
          "Disponibilize o lançamento e o áudio de cada faixa aos usuários autenticados."
        );
    } else if (
      tipo === "externa" &&
      url?.protocol === "https:" &&
      !url.username &&
      !url.password &&
      link.length <= 500 &&
      faixasDoLancamento(db, id).length
    ) {
      assinatura = JSON.stringify(valoresAcervo(db, id).faixas);
    } else {
      throw new ErroAcervo(
        "Informe uma URL HTTPS da publicação externa e associe as faixas do lançamento."
      );
    }
    const href = tipo === "externa" ? url!.href : "";
    const anterior = evidenciaAtiva(db, id);
    if (
      anterior?.data_factual === data &&
      anterior.tipo === tipo &&
      anterior.url === href &&
      anterior.assinatura === assinatura &&
      anterior.estado !== "recusada"
    )
      return;
    const evidencia = randomUUID();
    db.prepare(
      "UPDATE evidencias_lancamento SET retirada_em=CURRENT_TIMESTAMP WHERE lancamento_id=? AND retirada_em IS NULL"
    ).run(id);
    db.prepare(
      "INSERT INTO evidencias_lancamento(id,lancamento_id,tipo,data_factual,url,assinatura,estado) VALUES (?,?,?,?,?,?,?)"
    ).run(
      evidencia,
      id,
      tipo,
      data,
      href,
      assinatura,
      tipo === "audio" ? "confirmada" : "pendente"
    );
    auditar(db, id, ator, "evidencia_enviada", { evidencia, tipo, data });
  })();
}

export function filaEvidencias(db: Banco) {
  return db
    .prepare(
      `
    SELECT e.id, e.data_factual, e.url, o.titulo, l.formato, p.nome, o.id AS obraId
    FROM evidencias_lancamento e JOIN lancamentos l ON l.id=e.lancamento_id
    JOIN obras o ON o.id=l.id JOIN perfis p ON p.usuario_id=o.proprietario_id
    WHERE e.estado='pendente' AND e.retirada_em IS NULL ORDER BY e.criada_em,e.id LIMIT 100
  `
    )
    .all()
    .map(item => {
      const linha = item as Evidencia & {
        titulo: string;
        formato: string;
        nome: string;
        obraId: string;
      };
      return { ...linha, faixas: faixasDoLancamento(db, linha.obraId) };
    });
}

export function revisarEvidencia(
  db: Banco,
  evidencia: string,
  ator: string,
  decisao: string
) {
  if (!["confirmada", "recusada"].includes(decisao)) return false;
  return db.transaction(() => {
    const id = db
      .prepare(
        `
      UPDATE evidencias_lancamento SET estado=?,revisor_id=?,revisada_em=CURRENT_TIMESTAMP
      WHERE id=? AND tipo='externa' AND estado='pendente' AND retirada_em IS NULL RETURNING lancamento_id
    `
      )
      .pluck()
      .get(decisao, ator, evidencia) as string | undefined;
    if (!id) return false;
    auditar(db, id, ator, "evidencia_revisada", { evidencia, decisao });
    return true;
  })();
}

export function fichaAcervo(
  db: Banco,
  pasta: string,
  id: string,
  visitante: string
) {
  if (!disponivel(db, id, visitante)) return null;
  const faixa = db
    .prepare("SELECT isrc FROM fonogramas WHERE obra_id=?")
    .get(id) as { isrc: string } | undefined;
  const composicao = db
    .prepare("SELECT iswc FROM composicoes WHERE id=?")
    .get(id) as { iswc: string } | undefined;
  const lancamento = Boolean(
    db.prepare("SELECT 1 FROM lancamentos WHERE id=?").get(id)
  );
  const faixas = faixasDoLancamento(db, id)
    .filter(f => disponivel(db, f.obraId, visitante))
    .map(f => ({ ...f, propriaFicha: f.obraId === id }));
  const composicoes = vinculadosDaGravacao(db, id).filter(
    c => c.id !== id && disponivel(db, c.id, visitante)
  );
  const evidencia = evidenciaAtiva(db, id);
  const estado =
    evidencia?.tipo === "audio" &&
    evidencia.assinatura !== assinaturaAudio(db, pasta, id)
      ? "indisponivel"
      : evidencia?.estado;
  return {
    isrc: faixa?.isrc,
    iswc: composicao?.iswc,
    faixas,
    composicoes,
    lancamento,
    estado,
    data: estado === "confirmada" ? evidencia?.data_factual : "",
    url: estado === "confirmada" ? evidencia?.url : "",
  };
}

export function historicoLancamento(db: Banco, id: string) {
  return db
    .prepare(
      "SELECT acao,criado_em FROM historico_lancamentos WHERE lancamento_id=? ORDER BY id DESC LIMIT 30"
    )
    .all(id) as { acao: string; criado_em: string }[];
}

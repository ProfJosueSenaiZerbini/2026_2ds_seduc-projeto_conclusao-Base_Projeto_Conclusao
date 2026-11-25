import { randomUUID } from "node:crypto";
import {
  conexaoInternaCypher,
  listarAtuacoesUsuarioCypher,
  sincronizarNomePublicoCypher,
  salvarProfissoesUsuarioCypher,
  salvarRespostasAtuacaoProfissaoCypher,
  salvarVertentesProfissionaisUsuarioCypher,
  type UsuarioDaSessao,
} from "./bancoDados.js";
import {
  perguntasCadastroProfissao,
  idProfissaoPorCategoria,
} from "./questionarioAtuacao.js";
import { vertentesProfissionais } from "./modeloProfissionalPersistido.js";
import { exigirAdministrador } from "./administracao.js";
import {
  normalizarIdentificador,
  validarIdentificador,
  validarDadosIdentidade,
} from "../validators/validarIdentidade.js";
import { validarSelecaoProfissional } from "../validators/validarAtuacao.js";
import { menorProtegido } from "./protecoesConta.js";
import { profissoesComEstilosMusicais } from "./modeloPerfil.js";
import { capaPublicacao } from "./midiasPublicacoes.js";
import {
  configuracaoPortfolio,
  candidatosPortfolio,
  ErroPortfolio,
} from "./portfolio.js";
import { ErroOportunidade } from "../validators/validarOportunidade.js";
import { seloPerfil } from "./seloPerfil.js";

export type DadosIdentidade = {
  nomeInformado: string;
  vulgo: string;
  nomePublico?: boolean;
  nascimento: string;
  tratamento: string;
  generoPersonalizado?: string;
};

export type SugestaoPerfil = {
  id: string;
  rotulo: string;
  url: string;
};

const unidadesFederativas = new Set(
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(
    " "
  )
);

function localizacaoCompleta(cidade: string) {
  const partes = cidade
    .trim()
    .match(/^(.+?)\s*(?:,|\/|\s[-–]\s)\s*([A-Za-z]{2})$/);
  return Boolean(
    partes &&
    /\p{L}/u.test(partes[1]) &&
    unidadesFederativas.has(partes[2].toUpperCase())
  );
}

function portfolioDesenvolvido(id: string) {
  try {
    const { modo } = configuracaoPortfolio(id);
    return candidatosPortfolio(id).some(
      item =>
        !item.oculto &&
        (item.selecionado || (modo === "inteligente" && item.publicavel))
    );
  } catch (erro) {
    if (erro instanceof ErroPortfolio || erro instanceof ErroOportunidade)
      return false;
    throw erro;
  }
}

export function calcularCompletudePerfil(
  usuario: UsuarioDaSessao,
  atuacoes: Array<{
    categoria: string;
    respostas: Record<string, unknown>;
  }> = [],
  conteudo: { foto?: boolean; portfolio?: boolean; selo?: boolean } = {}
) {
  const itens: Array<SugestaoPerfil & { preenchido: boolean }> = [];
  const sugestoes: SugestaoPerfil[] = [];
  if (usuario.tipoConta === "administrativo" || usuario.demonstracao)
    return { pendencias: [], percentual: 100, sugestoes };

  const profissional = usuario.tipoConta === "profissional";
  const pessoal = profissional
    ? "/profile?editar=1&secao=pessoal#editar-perfil"
    : "/profile";
  const atuacao = "/profile?editar=1&secao=profissional";
  const adicionar = (
    id: string,
    rotulo: string,
    preenchido: boolean,
    url: string
  ) => itens.push({ id, rotulo, preenchido, url });

  adicionar(
    "foto",
    "Adicione uma foto de perfil",
    Boolean(conteudo.foto),
    "/publicacoes/perfil/" + encodeURIComponent(usuario.id) + "/midias"
  );
  adicionar(
    "biografia",
    "Adicione uma biografia",
    Boolean(usuario.biography.trim()),
    profissional ? pessoal : "/profile?editar=apresentacao#perfil-biografia"
  );
  adicionar(
    "cidade",
    "Informe sua cidade e estado",
    localizacaoCompleta(usuario.city),
    profissional ? pessoal : "/profile?editar=apresentacao#perfil-localizacao"
  );

  if (profissional) {
    adicionar(
      "profissoes",
      "Selecione suas profissões",
      usuario.categories.length > 0,
      atuacao + "#profile-profissoes"
    );
    for (const categoria of usuario.categories) {
      const pergunta = perguntasCadastroProfissao(categoria)[0];
      if (!pergunta) continue;
      const tempo = atuacoes.find(item => item.categoria === categoria)
        ?.respostas.tempoAtuacao;
      adicionar(
        "tempo:" + categoria,
        "Informe o tempo de atuação em " + categoria,
        typeof tempo === "string" && pergunta.opcoes.includes(tempo),
        atuacao + "#atuacao-" + pergunta.profissaoId
      );
    }
    adicionar(
      "competencias",
      "Adicione suas competências",
      Boolean(usuario.skills?.some(item => item.trim())),
      atuacao + "#profile-competencias"
    );
    adicionar(
      "contato",
      "Facilite o contato profissional",
      Boolean(usuario.contact.trim()),
      "/profile?editar=1&secao=privacidade#profile-contato"
    );
    if (
      usuario.categories.some(categoria =>
        profissoesComEstilosMusicais.has(categoria)
      )
    ) {
      adicionar(
        "estilos",
        "Informe seus gêneros e estilos musicais",
        usuario.genres.some(item => item.trim()),
        atuacao + "#profile-estilos"
      );
    }
    if (!conteudo.portfolio)
      sugestoes.push({
        id: "portfolio",
        rotulo: "Construa seu portfólio",
        url: "/portfolio/edit",
      });
    if (!conteudo.selo)
      sugestoes.push({
        id: "selo",
        rotulo: "Personalize seu selo profissional",
        url: "/profile?editar=1&secao=identidade#profile-editor-selo",
      });
  }

  const pendencias = itens.filter(item => !item.preenchido);
  const percentual = Math.floor(
    (100 * (itens.length - pendencias.length)) / itens.length
  );
  return { pendencias, percentual, sugestoes };
}

export function completudePerfil(
  usuario: UsuarioDaSessao,
  incluirSugestoes = false
) {
  if (usuario.tipoConta === "administrativo" || usuario.demonstracao)
    return calcularCompletudePerfil(usuario);
  const profissional = usuario.tipoConta === "profissional";
  return calcularCompletudePerfil(
    usuario,
    profissional ? listarAtuacoesUsuarioCypher(usuario.id) : [],
    {
      foto: Boolean(capaPublicacao(usuario.id, "perfil", usuario.id)),
      portfolio:
        profissional && incluirSugestoes && portfolioDesenvolvido(usuario.id),
      selo: profissional && incluirSugestoes && Boolean(seloPerfil(usuario.id)),
    }
  );
}

export function identificadorDisponivel(
  valor: string,
  usuarioId?: string
): boolean {
  if (validarIdentificador(valor)) return false;
  const db = conexaoInternaCypher();
  const handle = normalizarIdentificador(valor);
  const reservado = db
    .prepare(
      "SELECT usuario_id AS id FROM identificadores_usuario WHERE identificador=? COLLATE NOCASE"
    )
    .get(handle) as { id: string } | undefined;
  const atual = db
    .prepare(
      "SELECT usuario_id AS id FROM perfis WHERE identificador=? COLLATE NOCASE"
    )
    .get(handle) as { id: string } | undefined;
  return (
    (!reservado || reservado.id === usuarioId) &&
    (!atual || atual.id === usuarioId)
  );
}

export function resolverPerfilPublico(handle: string): string | null {
  const registro = conexaoInternaCypher()
    .prepare(
      `SELECT p.identificador FROM identificadores_usuario h
    JOIN usuarios u ON u.id=h.usuario_id JOIN perfis p ON p.usuario_id=u.id
    WHERE h.identificador=? COLLATE NOCASE AND u.tipo_conta='profissional' AND u.email_confirmado_em IS NOT NULL AND p.perfil_publico=1 AND u.demonstracao=0`
    )
    .get(normalizarIdentificador(handle)) as
    { identificador: string } | undefined;
  return registro?.identificador ?? null;
}

export function atualizarIdentidadeUsuario(
  usuarioId: string,
  dados: DadosIdentidade
) {
  const erro = validarDadosIdentidade(dados);
  if (erro) throw new Error(erro);
  const db = conexaoInternaCypher();
  return db.transaction(() => {
    const atual = db
      .prepare(
        `SELECT p.nascimento, p.nome_publico AS nomePublico FROM perfis p JOIN usuarios u ON u.id=p.usuario_id WHERE p.usuario_id=? AND u.tipo_conta IN ('profissional','consumidor')`
      )
      .get(usuarioId) as
      { nascimento: string; nomePublico: number } | undefined;
    if (!atual) throw new Error("Conta não encontrada.");
    if (atual.nascimento && atual.nascimento !== dados.nascimento)
      throw new Error(
        "A data de nascimento não pode ser alterada por este formulário. Solicite uma correção à equipe."
      );
    db.prepare(
      `UPDATE perfis SET nome_informado=?,nome_publico=?,vulgo=?,nascimento=?,tratamento=?,genero_personalizado=?,atualizado_em=CURRENT_TIMESTAMP WHERE usuario_id=?`
    ).run(
      dados.nomeInformado.trim(),
      menorProtegido(db, usuarioId)
        ? 0
        : Number(dados.nomePublico ?? Boolean(atual.nomePublico)),
      dados.vulgo.trim(),
      dados.nascimento,
      dados.tratamento,
      dados.tratamento === "outro"
        ? (dados.generoPersonalizado?.trim() ?? "")
        : "",
      usuarioId
    );
    sincronizarNomePublicoCypher(db, usuarioId);
  })();
}

export function estadoAlteracaoIdentificador(
  usuarioId: string,
  intervaloDias: number
) {
  const registro = conexaoInternaCypher()
    .prepare(
      `SELECT datetime(identificador_alterado_em, '+' || ? || ' days') AS proxima,
    COALESCE(datetime(identificador_alterado_em, '+' || ? || ' days') > datetime('now'),0) AS bloqueada
    FROM perfis WHERE usuario_id=?`
    )
    .get(intervaloDias, intervaloDias, usuarioId) as
    { proxima: string | null; bloqueada: number } | undefined;
  return {
    bloqueada: Boolean(registro?.bloqueada),
    proxima: registro?.proxima ?? null,
  };
}

export function alterarIdentificadorUsuario(
  usuarioId: string,
  novo: string,
  intervaloDias: number,
  excecao?: { autorId: string; motivo: string }
) {
  const erro = validarIdentificador(novo);
  if (erro) throw new Error(erro);
  if (!Number.isInteger(intervaloDias) || intervaloDias < 1)
    throw new Error("Intervalo de alteração não definido.");
  const db = conexaoInternaCypher();
  return db.transaction(() => {
    if (excecao) {
      exigirAdministrador(excecao.autorId, "excecoes");
      if (excecao.motivo.trim().length < 10 || excecao.motivo.length > 500)
        throw new Error("Informe uma justificativa de 10 a 500 caracteres.");
    }
    const atual = db
      .prepare("SELECT identificador FROM perfis WHERE usuario_id=?")
      .get(usuarioId) as { identificador: string } | undefined;
    if (!atual) throw new Error("Conta não encontrada.");
    const handle = normalizarIdentificador(novo);
    if (handle === atual.identificador) return;
    if (!identificadorDisponivel(handle, usuarioId))
      throw new Error(
        "Este identificador já está em uso ou reservado a outra conta."
      );
    const estado = estadoAlteracaoIdentificador(usuarioId, intervaloDias);
    if (estado.bloqueada && !excecao)
      throw new Error(
        `A próxima alteração do identificador estará disponível em ${estado.proxima}.`
      );
    db.prepare(
      "INSERT INTO identificadores_usuario (identificador,usuario_id) VALUES (?,?) ON CONFLICT DO NOTHING"
    ).run(atual.identificador, usuarioId);
    db.prepare(
      "INSERT INTO identificadores_usuario (identificador,usuario_id) VALUES (?,?) ON CONFLICT DO NOTHING"
    ).run(handle, usuarioId);
    db.prepare(
      "UPDATE perfis SET identificador=?,identificador_alterado_em=CURRENT_TIMESTAMP,atualizado_em=CURRENT_TIMESTAMP WHERE usuario_id=?"
    ).run(handle, usuarioId);
    sincronizarNomePublicoCypher(db, usuarioId);
    db.prepare(
      "INSERT INTO alteracoes_identificador (id,usuario_id,anterior,novo,autor_id,motivo) VALUES (?,?,?,?,?,?)"
    ).run(
      randomUUID(),
      usuarioId,
      atual.identificador,
      handle,
      excecao?.autorId ?? usuarioId,
      excecao?.motivo.trim() ?? "Alteração pelo titular"
    );
    if (excecao)
      db.prepare(
        "INSERT INTO auditoria_administrativa (id,autor_id,acao,alvo_id,detalhe) VALUES (?,?,?,?,?)"
      ).run(
        randomUUID(),
        excecao.autorId,
        "identificador_alterado_excepcionalmente",
        usuarioId,
        excecao.motivo.trim()
      );
  })();
}

export function profissionalizarUsuario(
  usuarioId: string,
  selecao: ReturnType<typeof validarSelecaoProfissional>,
  confirmacao: boolean
) {
  if (!confirmacao)
    throw new Error("Confirme a ativação irreversível do perfil profissional.");
  const { categorias, vertentes } = selecao;
  const db = conexaoInternaCypher();
  return db.transaction(() => {
    const mudanca = db
      .prepare(
        "UPDATE usuarios SET tipo_conta='profissional',atualizado_em=CURRENT_TIMESTAMP WHERE id=? AND tipo_conta='consumidor'"
      )
      .run(usuarioId);
    if (mudanca.changes !== 1)
      throw new Error("A conta já é profissional ou não pode ser convertida.");
    db.prepare(
      "UPDATE perfis SET categorias_json=?,funcao=?,perfil_publico=?,ultima_alteracao_categorias_em=CURRENT_TIMESTAMP WHERE usuario_id=?"
    ).run(
      JSON.stringify(categorias),
      categorias.join(" · "),
      Number(!menorProtegido(db, usuarioId)),
      usuarioId
    );
    salvarProfissoesUsuarioCypher(
      usuarioId,
      categorias.map(categoria => ({
        profissaoId: idProfissaoPorCategoria(categoria),
        valorOriginal: categoria,
        origem: "catalogo",
      }))
    );
    const salvar = db.prepare(
      `INSERT INTO respostas_atuacao_categoria (usuario_id,categoria,respostas_json,visibilidades_json) VALUES (?,?,?,?)`
    );
    for (const atuacao of selecao.atuacoes) {
      salvar.run(
        usuarioId,
        atuacao.categoria,
        JSON.stringify(atuacao.respostas),
        JSON.stringify(atuacao.visibilidades)
      );
      salvarRespostasAtuacaoProfissaoCypher(
        usuarioId,
        idProfissaoPorCategoria(atuacao.categoria),
        atuacao.respostas,
        atuacao.visibilidades
      );
    }
    salvarVertentesProfissionaisUsuarioCypher(usuarioId, vertentes);
    db.prepare(
      "INSERT INTO ativacoes_profissionais (usuario_id,categorias_json) VALUES (?,?)"
    ).run(usuarioId, JSON.stringify(categorias));
  })();
}

export const generosInteresse = ["Rap", ...vertentesProfissionais];
export function obterPreferenciasUsuario(
  usuarioId: string,
  temaPadrao = "light"
) {
  const r = conexaoInternaCypher()
    .prepare(
      "SELECT regiao,generos_json AS generosJson,tema FROM preferencias_usuario WHERE usuario_id=?"
    )
    .get(usuarioId) as
    { regiao: string; generosJson: string; tema: string } | undefined;
  return {
    regiao: r?.regiao ?? "",
    generos: r ? (JSON.parse(r.generosJson) as string[]) : [],
    tema: r?.tema ?? temaPadrao,
  };
}
export function salvarPreferenciasUsuario(
  usuarioId: string,
  regiao: string,
  generos: string[],
  tema: string
) {
  if (
    regiao.length > 100 ||
    !["light", "dark"].includes(tema) ||
    generos.some(
      item =>
        !generosInteresse.includes(item as (typeof generosInteresse)[number])
    )
  )
    throw new Error("Confira suas preferências.");
  conexaoInternaCypher()
    .prepare(
      `INSERT INTO preferencias_usuario (usuario_id,regiao,generos_json,tema) VALUES (?,?,?,?)
    ON CONFLICT(usuario_id) DO UPDATE SET regiao=excluded.regiao,generos_json=excluded.generos_json,tema=excluded.tema`
    )
    .run(usuarioId, regiao.trim(), JSON.stringify([...new Set(generos)]), tema);
}

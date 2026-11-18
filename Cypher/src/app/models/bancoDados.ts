// @ts-nocheck
import Database from "better-sqlite3";
import { rotuloProfissional } from "./tratamentoProfissional.js";
import { randomUUID } from "node:crypto";
import { normalizarIdentificador, nomePublico, iniciaisPublicas, validarDadosIdentidade, validarIdentificador } from "../validators/validarIdentidade.js";
import fs from "node:fs";
import path from "node:path";
import { podePublicar, type TipoConta, type PapelAdministrativo } from "./permissoes.js";
import { categoriasGerais } from "./modeloPerfil.js";
import {
  catalogoPerguntasPorCategoria,
  idProfissaoPorCategoria,
  validarRespostasAtuacao,
} from "./questionarioAtuacao.js";
import { obterProfissaoCatalogo } from "./modeloPerfil.js";
import {
  profissoesElegiveisParaVertentes,
  vertenteProfissionalPermitida,
} from "./modeloProfissionalPersistido.js";
export type RespostasAtuacao = Record<string, string | string[] | boolean>;
export type VisibilidadesAtuacao = Record<
  string,
  "publico" | "colaboradores" | "privado"
>;
export type AtuacaoProfissionalPersistida = {
  categoria: string;
  respostas: RespostasAtuacao;
  visibilidades: VisibilidadesAtuacao;
};
export type DadosNovaConta = {
  id: string;
  email: string;
  senhaHash: string;
  tipoConta: TipoConta;
  nome: string;
  nomeInformado?: string;
  vulgo?: string;
  usarVulgo?: boolean;
  nascimento?: string;
  tratamento?: string;
  generoPersonalizado?: string;
  vertentes?: string[];
  funcao: string;
  identificador: string;
  iniciais: string;
  cTag: string;
  categorias: string[];
  outraCategoria: string;
  atuacoes?: AtuacaoProfissionalPersistida[];
};
export type CredenciaisUsuario = {
  id: string;
  email: string;
  senhaHash: string;
  tipoConta: TipoConta;
  emailConfirmado: string | null;
};
export type UsuarioDaSessao = {
  id: string;
  email: string | null;
  publicCode: string;
  tipoConta: TipoConta;
  papelAdministrativo?: PapelAdministrativo | null;
  demonstracao: boolean;
  name: string;
  nomeInformado?: string;
  vulgo?: string;
  usarVulgo?: boolean;
  nascimento?: string;
  tratamento?: string;
  generoPersonalizado?: string;
  identidadeRevisada?: boolean;
  identificadorAlteradoEm?: string | null;
  emailConfirmado?: string | null;
  role: string;
  city: string;
  handle: string;
  initials: string;
  cTag: string;
  reputation: number;
  genres: string[];
  categories: string[];
  otherCategory: string;
  biography: string;
  contact: string;
  availability: string;
  equipment: string[];
  profilePublic: boolean;
  locationPublic: boolean;
  contactPublic: boolean;
  createdAt: string;
};
export type DadosAtualizacaoPerfil = {
  id: string;
  name: string;
  role: string;
  city: string;
  biography: string;
  contact: string;
  availability: string;
  genres: string[];
  propostaGenero?: string;
  categories: string[];
  atuacoes?: AtuacaoProfissionalPersistida[];
  vertentes?: string[];
  otherCategory: string;
  equipment: string[];
  initials: string;
  tipoConta: TipoConta;
};
export type PerfilPublico = {
  rotulosCategorias: Record<string,string>;
  name: string;
  role: string;
  city: string;
  handle: string;
  publicCode: string;
  initials: string;
  cTag: string;
  biography: string;
  contact: string;
  availability: string;
  genres: string[];
  categories: string[];
  atuacoes: Array<{ categoria: string; respostas: RespostasAtuacao }>;
  equipment: string[];
  createdAt: string;
};
export type ObraPublicaPerfil = {
  title: string;
  type: string;
  typeDetail: string;
  genre: string;
  genreDetail: string;
  role: string;
  roleDetail: string;
  releaseDate: string;
  listenLink: string;
  lyrics: string;
};
export type FiltrosBuscaPerfisPublicos = {
  q: string;
  categoria: string;
  genero: string;
  localizacao: string;
};
export type PerfilBuscaPublico = {
  rotulosCategorias: Record<string,string>;
  name: string;
  role: string;
  city: string;
  handle: string;
  initials: string;
  availability: string;
  genres: string[];
  categories: string[];
  otherCategory: string;
  tone: string;
};
export type ResultadoBuscaPerfisPublicos = {
  pessoas: PerfilBuscaPublico[];
  filtros: FiltrosBuscaPerfisPublicos;
  opcoes: { categorias: string[]; generos: string[]; localizacoes: string[] };
};
export type ResultadoExclusaoConta = {
  excluida: boolean;
  obras: number;
  eventos: number;
  beats: number;
};
export type NotificacaoPersistida = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  url: string;
  entidadeTipo: string;
  entidadeId: string;
  lida: boolean;
  criadaEm: string;
};
export type EstadoAlteracaoCategorias = {
  bloqueada: boolean;
  proximaAlteracao: string | null;
  excecaoDisponivel: boolean;
};
export type PropostaGeneroPersistida = {
  id: string;
  usuarioId: string;
  nome: string;
  handle: string;
  genero: string;
  criadaEm: string;
};
export type PropostaCategoriaPersistida = {
  id: string;
  usuarioId: string;
  nome: string;
  handle: string;
  categoria: string;
  criadaEm: string;
};
export type PerfilParaExcecaoCategoria = {
  usuarioId: string;
  nome: string;
  email: string;
  categoriasJson: string;
  alteradaEm: string | null;
  proximaAlteracao: string | null;
  excecaoPendente: boolean;
  solicitacaoPendente: boolean;
};
export type SolicitacaoExcecaoCategoriaPersistida = any;
export type EstadoSolicitacaoExcecaoCategoria = any;
export type ResultadoAtualizacaoPerfil = {
  atualizado: boolean;
  categoriasBloqueadas: boolean;
  proximaAlteracao: string | null;
  propostaGeneroRegistrada: boolean;
};
export type EntradaProfissaoUsuario = {
  profissaoId: string | null;
  valorOriginal: string;
  origem: OrigemProfissaoPersistida;
};

export type StatusInteresseEvento =
  "interessado" | "inscrito" | "confirmado" | "rejeitado" | "cancelado";
export type FiltrosEventos = {
  categoria: string;
  localizacao: string;
  formato: string;
  periodo: "todos" | "proximos" | "passados";
  ordem: "recentes" | "data" | "titulo";
};
export type EventoContaPersistido = {
  id: string;
  proprietarioId: string;
  title: string;
  category: string;
  categoryDetail: string;
  date: string;
  time: string;
  location: string;
  org: string;
  status: string;
  color: string;
  description: string;
  format: string;
  registration: string;
  prize: string;
  tags: string[];
  participationType: "aberta" | "aprovacao";
  demonstracao: boolean;
  criadoEm: string;
  owned: boolean;
  interesseStatus: StatusInteresseEvento | null;
  totalInteressados: number;
  interessados: InteresseEventoPersistido[];
};
export type InteresseEventoPersistido = {
  id: string;
  eventoId: string;
  usuarioId: string;
  nome: string;
  handle: string;
  status: StatusInteresseEvento;
  criadoEm: string;
  atualizadoEm: string;
};
export type DadosEventoCypher = Omit<
  EventoContaPersistido,
  | "id"
  | "proprietarioId"
  | "demonstracao"
  | "criadoEm"
  | "owned"
  | "interesseStatus"
  | "totalInteressados"
  | "interessados"
>;
export type OfertaBeatPersistida = {
  id: string;
  beatId: string;
  compradorId: string;
  compradorNome: string;
  valor: number;
  mensagem: string;
  ativa: boolean;
  criadaEm: string;
};
export type DadosOfertaBeat = {
  compradorId: string;
  valor: number;
  mensagem: string;
};
export type BeatPersistido = {
  id: string;
  produtorId: string;
  title: string;
  producer: string;
  bpm: number;
  key: string;
  genre: string;
  license: string;
  duration: string;
  color: string;
  description: string;
  usage: string;
  vendaExclusiva: boolean;
};
export type BeatContaPersistido = BeatPersistido & {
  demonstracao: boolean;
  owned: boolean;
  criadoEm: string;
  ofertas: OfertaBeatPersistida[];
};
export type DadosBeatCypher = {
  title: string;
  bpm: number;
  key: string;
  genre: string;
  license: string;
  duration: string;
  description: string;
  usage: string;
  vendaExclusiva: boolean;
  ofertas: DadosOfertaBeat[];
};
export type FiltrosCatalogoObras = {
  status: string;
  type: string;
  genre: string;
  role: string;
  order: "recentes" | "antigas" | "titulo" | "lancamento" | "status";
};
export type CreditoObraEntrada = {
  usuarioId?: string;
  nome: string;
  handle?: string;
  funcao: string;
  participacao: string;
};
export type CreditoObraPersistido = {
  id: string;
  obraId: string;
  usuarioCreditadoId: string | null;
  nomeCreditado: string;
  handle: string | null;
  funcao: string;
  participacao: string;
  verified: boolean;
};
export type PerfilParaCredito = { name: string; handle: string };
export type ObraPersistida = {
  id: string;
  title: string;
  type: string;
  status: string;
  meta: string;
  role: string;
  roleDetail: string;
  credits: number;
  description: string;
  bpm: number | null;
  isrc: string;
  iswc: string;
  published: boolean;
};
export type DadosObraCypher = {
  title: string;
  type: string;
  typeDetail: string;
  genre: string;
  genreDetail: string;
  status: string;
  description: string;
  lyrics: string;
  bpm: number | null;
  role: string;
  roleDetail: string;
  isrc: string;
  iswc: string;
  releaseDate: string;
  listenLink: string;
};
export type ObraContaPersistida = ObraPersistida & {
  proprietarioId: string;
  meta: string;
  published: boolean;
  owned: boolean;
  creditDetails: CreditoObraPersistido[];
  demonstracao: boolean;
  criadoEm: string;
};

let banco;
export const versaoEsquema = 24;
function iniciaisPublicas(nome) {
  const partes = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const iniciais = partes
    .slice(0, 2)
    .map(parte => parte[0]?.toUpperCase() ?? "")
    .join("");
  if (!iniciais) return "AA";
  if (iniciais.length === 1) return `${iniciais}${iniciais}`;
  return iniciais.slice(0, 2);
}
function codigoPublicoReal(iniciais, numero) {
  const normalizadas = iniciais
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/gi, "")
    .toUpperCase();
  const prefixo = normalizadas
    ? (normalizadas + (normalizadas[1] ?? normalizadas[0])).slice(0, 2)
    : "AA";
  return `CYP-${prefixo}${String(numero).padStart(7, "0")}`;
}
const esquema = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    email TEXT,
    senha_hash TEXT,
    email_confirmado_em TEXT,
    tipo_conta TEXT NOT NULL DEFAULT 'profissional'
      CHECK (tipo_conta IN ('consumidor', 'profissional', 'administrativo')),
    demonstracao INTEGER NOT NULL DEFAULT 0 CHECK (demonstracao IN (0, 1)),
    codigo_publico TEXT NOT NULL UNIQUE,
    numero_sequencial INTEGER UNIQUE,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS indice_email_usuario_real
    ON usuarios(email COLLATE NOCASE)
    WHERE email IS NOT NULL AND demonstracao = 0;

  CREATE TABLE IF NOT EXISTS perfis (
    usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    c_tag TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    nome_informado TEXT NOT NULL DEFAULT '',
    vulgo TEXT NOT NULL DEFAULT '',
    usar_vulgo INTEGER NOT NULL DEFAULT 0 CHECK (usar_vulgo IN (0,1)),
    nascimento TEXT NOT NULL DEFAULT '',
    tratamento TEXT NOT NULL DEFAULT '',
    genero_personalizado TEXT NOT NULL DEFAULT '',
    identidade_revisada INTEGER NOT NULL DEFAULT 0 CHECK (identidade_revisada IN (0,1)),
    identificador_alterado_em TEXT,
    funcao TEXT NOT NULL,
    cidade TEXT NOT NULL DEFAULT '',
    identificador TEXT NOT NULL,
    iniciais TEXT NOT NULL DEFAULT '',
    reputacao INTEGER NOT NULL DEFAULT 0,
    generos_json TEXT NOT NULL DEFAULT '[]',
    categorias_json TEXT NOT NULL DEFAULT '[]',
    outra_categoria TEXT NOT NULL DEFAULT '',
    ultima_alteracao_categorias_em TEXT,
    etiqueta TEXT NOT NULL DEFAULT '',
    tom TEXT NOT NULL DEFAULT 'yellow',
    ordem_demo INTEGER NOT NULL DEFAULT 0,
    biografia TEXT NOT NULL DEFAULT '',
    contato TEXT NOT NULL DEFAULT '',
    disponibilidade TEXT NOT NULL DEFAULT '',
    equipamentos_json TEXT NOT NULL DEFAULT '[]',
    perfil_publico INTEGER NOT NULL DEFAULT 0 CHECK (perfil_publico IN (0, 1)),
    localizacao_publica INTEGER NOT NULL DEFAULT 0 CHECK (localizacao_publica IN (0, 1)),
    contato_publico INTEGER NOT NULL DEFAULT 0 CHECK (contato_publico IN (0, 1)),
    demonstracao INTEGER NOT NULL DEFAULT 0 CHECK (demonstracao IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS obras (
    id TEXT PRIMARY KEY,
    proprietario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    tipo_detalhe TEXT NOT NULL DEFAULT '',
    situacao TEXT NOT NULL,
    metadados TEXT NOT NULL DEFAULT '',
    funcao_principal TEXT NOT NULL DEFAULT '',
    funcao_detalhe TEXT NOT NULL DEFAULT '',
    quantidade_creditos INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_creditos >= 0),
    descricao TEXT NOT NULL DEFAULT '',
    genero TEXT NOT NULL DEFAULT '',
    genero_detalhe TEXT NOT NULL DEFAULT '',
    letra TEXT NOT NULL DEFAULT '',
    bpm TEXT NOT NULL DEFAULT '',
    isrc TEXT NOT NULL DEFAULT '',
    iswc TEXT NOT NULL DEFAULT '',
    data_lancamento TEXT NOT NULL DEFAULT '',
    link_escuta TEXT NOT NULL DEFAULT '',
    publicada INTEGER NOT NULL DEFAULT 0 CHECK (publicada IN (0, 1)),
    ordem_demo INTEGER NOT NULL DEFAULT 0,
    demonstracao INTEGER NOT NULL DEFAULT 0 CHECK (demonstracao IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS indice_obras_proprietario
    ON obras(proprietario_id, criado_em);

  CREATE TABLE IF NOT EXISTS creditos (
    id TEXT PRIMARY KEY,
    obra_id TEXT NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
    usuario_creditado_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    nome_creditado TEXT NOT NULL,
    funcao TEXT NOT NULL,
    participacao TEXT NOT NULL DEFAULT '',
    verificado INTEGER NOT NULL DEFAULT 0 CHECK (verificado IN (0, 1)),
    demonstracao INTEGER NOT NULL DEFAULT 0 CHECK (demonstracao IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS indice_creditos_obra ON creditos(obra_id);
  CREATE INDEX IF NOT EXISTS indice_creditos_usuario ON creditos(usuario_creditado_id);

  CREATE TABLE IF NOT EXISTS eventos (
    id TEXT PRIMARY KEY,
    proprietario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    categoria_detalhe TEXT NOT NULL DEFAULT '',
    data_texto TEXT NOT NULL DEFAULT '',
    horario TEXT NOT NULL DEFAULT '',
    local TEXT NOT NULL DEFAULT '',
    organizador TEXT NOT NULL DEFAULT '',
    situacao TEXT NOT NULL DEFAULT '',
    cor TEXT NOT NULL DEFAULT 'yellow',
    descricao TEXT NOT NULL DEFAULT '',
    formato TEXT NOT NULL DEFAULT '',
    inscricao TEXT NOT NULL DEFAULT '',
    premio TEXT NOT NULL DEFAULT '',
    etiquetas_json TEXT NOT NULL DEFAULT '[]',
    tipo_participacao TEXT NOT NULL DEFAULT 'aberta'
      CHECK (tipo_participacao IN ('aberta', 'aprovacao')),
    ordem_demo INTEGER NOT NULL DEFAULT 0,
    demonstracao INTEGER NOT NULL DEFAULT 0 CHECK (demonstracao IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS indice_eventos_proprietario
    ON eventos(proprietario_id, criado_em);

  CREATE TABLE IF NOT EXISTS interesses_eventos (
    id TEXT PRIMARY KEY,
    evento_id TEXT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'interessado'
      CHECK (status IN ('interessado', 'inscrito', 'confirmado', 'rejeitado', 'cancelado')),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (evento_id, usuario_id)
  );

  CREATE INDEX IF NOT EXISTS indice_interesses_evento
    ON interesses_eventos(evento_id, status, criado_em);
  CREATE INDEX IF NOT EXISTS indice_interesses_usuario
    ON interesses_eventos(usuario_id, status, atualizado_em);

  CREATE TABLE IF NOT EXISTS beats (
    id TEXT PRIMARY KEY,
    produtor_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    titulo TEXT NOT NULL,
    bpm TEXT NOT NULL DEFAULT '',
    tom_musical TEXT NOT NULL DEFAULT '',
    genero TEXT NOT NULL DEFAULT '',
    licenca TEXT NOT NULL DEFAULT '',
    duracao TEXT NOT NULL DEFAULT '',
    cor TEXT NOT NULL DEFAULT 'yellow',
    descricao TEXT NOT NULL DEFAULT '',
    condicoes_uso TEXT NOT NULL DEFAULT '',
    venda_exclusiva INTEGER NOT NULL DEFAULT 0 CHECK (venda_exclusiva IN (0, 1)),
    ordem_demo INTEGER NOT NULL DEFAULT 0,
    demonstracao INTEGER NOT NULL DEFAULT 0 CHECK (demonstracao IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS indice_beats_produtor ON beats(produtor_id);

  CREATE TABLE IF NOT EXISTS ofertas_beats (
    id TEXT PRIMARY KEY,
    beat_id TEXT NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    preco_centavos INTEGER,
    descricao TEXT NOT NULL DEFAULT '',
    ativa INTEGER NOT NULL DEFAULT 1 CHECK (ativa IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS indice_ofertas_beat
    ON ofertas_beats(beat_id, ativa);

  CREATE TABLE IF NOT EXISTS sessoes (
    token_hash TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_em INTEGER NOT NULL,
    criada_em INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS indice_sessoes_expiracao ON sessoes(expira_em);

  CREATE TABLE IF NOT EXISTS notificacoes (
    id TEXT PRIMARY KEY,
    usuario_destino_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    entidade_tipo TEXT NOT NULL DEFAULT '',
    entidade_id TEXT NOT NULL DEFAULT '',
    lida INTEGER NOT NULL DEFAULT 0 CHECK (lida IN (0, 1)),
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lida_em TEXT,
    chave_origem TEXT UNIQUE
  );

  CREATE INDEX IF NOT EXISTS indice_notificacoes_usuario_data
    ON notificacoes(usuario_destino_id, criada_em);
  CREATE INDEX IF NOT EXISTS indice_notificacoes_usuario_lida
    ON notificacoes(usuario_destino_id, lida, criada_em);

  CREATE TABLE IF NOT EXISTS sequencias (
    nome TEXT PRIMARY KEY,
    proximo_numero INTEGER NOT NULL CHECK (proximo_numero > 0)
  );

  CREATE TABLE IF NOT EXISTS propostas_generos (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    genero TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente'
      CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revisada_em TEXT,
    revisor_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo_revisao TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS indice_propostas_generos_status
    ON propostas_generos(status, criada_em);
  CREATE UNIQUE INDEX IF NOT EXISTS indice_proposta_genero_pendente_usuario
    ON propostas_generos(usuario_id, genero COLLATE NOCASE)
    WHERE status = 'pendente';

  CREATE TABLE IF NOT EXISTS propostas_categorias (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente'
      CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revisada_em TEXT,
    revisor_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    revisor_email TEXT NOT NULL DEFAULT '',
    motivo_revisao TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS indice_propostas_categorias_status
    ON propostas_categorias(status, criada_em);
  CREATE UNIQUE INDEX IF NOT EXISTS indice_proposta_categoria_pendente
    ON propostas_categorias(categoria COLLATE NOCASE)
    WHERE status = 'pendente';
  CREATE UNIQUE INDEX IF NOT EXISTS indice_proposta_categoria_aprovada
    ON propostas_categorias(categoria COLLATE NOCASE)
    WHERE status = 'aprovado';

  CREATE TABLE IF NOT EXISTS categorias_profissionais_aprovadas (
    categoria TEXT PRIMARY KEY COLLATE NOCASE,
    aprovada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revisor_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    revisor_email TEXT NOT NULL DEFAULT '',
    motivo_aprovacao TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS excecoes_categorias (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    administrador_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    administrador_email TEXT NOT NULL,
    motivo TEXT NOT NULL,
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usada_em TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS indice_excecao_categoria_pendente_usuario
    ON excecoes_categorias(usuario_id) WHERE usada_em IS NULL;

  CREATE TABLE IF NOT EXISTS solicitacoes_excecao_categorias (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente'
      CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revisada_em TEXT,
    revisor_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    revisor_email TEXT NOT NULL DEFAULT '',
    motivo_revisao TEXT NOT NULL DEFAULT '',
    excecao_id TEXT REFERENCES excecoes_categorias(id) ON DELETE SET NULL,
    categorias_antes_json TEXT NOT NULL DEFAULT '[]',
    categorias_solicitadas_json TEXT NOT NULL DEFAULT '[]',
    respostas_solicitadas_json TEXT NOT NULL DEFAULT '{}',
    visibilidades_solicitadas_json TEXT NOT NULL DEFAULT '{}',
    motivo_codigo TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS indice_solicitacoes_excecao_status_data
    ON solicitacoes_excecao_categorias(status, criada_em);
  CREATE UNIQUE INDEX IF NOT EXISTS indice_solicitacao_excecao_pendente_usuario
    ON solicitacoes_excecao_categorias(usuario_id) WHERE status = 'pendente';

  CREATE TABLE IF NOT EXISTS historico_solicitacoes_categorias (
    id TEXT PRIMARY KEY,
    solicitacao_id TEXT NOT NULL REFERENCES solicitacoes_excecao_categorias(id) ON DELETE CASCADE,
    autor_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    autor_tipo TEXT NOT NULL CHECK (autor_tipo IN ('usuario', 'administrador')),
    mensagem TEXT NOT NULL,
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS indice_historico_solicitacoes_categoria
    ON historico_solicitacoes_categorias(solicitacao_id, criada_em, id);

  CREATE TABLE IF NOT EXISTS auditoria_categorias (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    administrador_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    excecao_id TEXT REFERENCES excecoes_categorias(id) ON DELETE SET NULL,
    categorias_antes_json TEXT NOT NULL,
    categorias_depois_json TEXT NOT NULL,
    motivo TEXT NOT NULL DEFAULT '',
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS indice_auditoria_categorias_usuario
    ON auditoria_categorias(usuario_id, criada_em DESC);

  CREATE TABLE IF NOT EXISTS respostas_atuacao_categoria (
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    respostas_json TEXT NOT NULL DEFAULT '{}',
    visibilidades_json TEXT NOT NULL DEFAULT '{}',
    versao_questionario INTEGER NOT NULL DEFAULT 1 CHECK (versao_questionario > 0),
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, categoria)
  );

  CREATE INDEX IF NOT EXISTS indice_respostas_atuacao_categoria
    ON respostas_atuacao_categoria(categoria, usuario_id);

  CREATE TABLE IF NOT EXISTS respostas_atuacao_profissao (
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    profissao_id TEXT NOT NULL,
    respostas_json TEXT NOT NULL DEFAULT '{}',
    visibilidades_json TEXT NOT NULL DEFAULT '{}',
    versao_questionario INTEGER NOT NULL DEFAULT 1 CHECK (versao_questionario > 0),
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, profissao_id)
  );

  CREATE INDEX IF NOT EXISTS indice_respostas_atuacao_profissao
    ON respostas_atuacao_profissao(profissao_id, usuario_id);

  CREATE TABLE IF NOT EXISTS profissoes_usuario (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    profissao_id TEXT,
    valor_original TEXT NOT NULL,
    origem TEXT NOT NULL DEFAULT 'catalogo'
      CHECK (origem IN ('catalogo', 'legado', 'personalizado')),
    estado TEXT NOT NULL DEFAULT 'ativa'
      CHECK (estado IN ('ativa', 'inativa', 'pendente')),
    selecionada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desativada_em TEXT,
    atualizada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS indice_profissoes_usuario
    ON profissoes_usuario(usuario_id, estado, selecionada_em);
  CREATE INDEX IF NOT EXISTS indice_profissoes_id
    ON profissoes_usuario(profissao_id, estado);
  CREATE UNIQUE INDEX IF NOT EXISTS indice_profissao_ativa_usuario
    ON profissoes_usuario(usuario_id, profissao_id)
    WHERE estado = 'ativa' AND profissao_id IS NOT NULL;

  CREATE TABLE IF NOT EXISTS vertentes_profissionais_usuario (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    vertente_id TEXT NOT NULL,
    ativa INTEGER NOT NULL DEFAULT 1 CHECK (ativa IN (0, 1)),
    associacao_ativa INTEGER NOT NULL DEFAULT 1 CHECK (associacao_ativa IN (0, 1)),
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desativada_em TEXT,
    atualizada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (usuario_id, vertente_id)
  );

  CREATE INDEX IF NOT EXISTS indice_vertentes_profissionais_usuario
    ON vertentes_profissionais_usuario(usuario_id, associacao_ativa, ativa);
  CREATE INDEX IF NOT EXISTS indice_vertentes_profissionais_id
    ON vertentes_profissionais_usuario(vertente_id, associacao_ativa, ativa);
`;
function bancoAtivo() {
  if (!banco) {
    throw new Error(
      "O banco Cypher não foi inicializado. Inicialize-o antes de consultar os Models."
    );
  }
  return banco;
}
function exigirUsuarioReal(db, usuarioId) {
  const usuario = db
    .prepare(
      "SELECT 1 AS presente FROM usuarios WHERE id = ? AND demonstracao = 0"
    )
    .get(usuarioId);
  if (!usuario) throw new Error("USUARIO_NAO_ENCONTRADO");
}
function mapearLinhaProfissao(linha) {
  return { ...linha };
}
function mapearLinhaVertente(linha) {
  return {
    ...linha,
    ativa: linha.ativa === 1,
    associacaoAtiva: linha.associacaoAtiva === 1,
  };
}
function validarEntradasProfissionais(entradas) {
  const chaves = new Set();
  for (const entrada of entradas) {
    if (!entrada.valorOriginal.trim()) {
      throw new Error("O valor original da profissão não pode ser vazio.");
    }
    if (!entrada.profissaoId || !obterProfissaoCatalogo(entrada.profissaoId) || obterProfissaoCatalogo(entrada.profissaoId).rotulo !== entrada.valorOriginal || entrada.origem !== "catalogo") {
      throw new Error(
        `Profissão não pertence ao catálogo: ${entrada.profissaoId}`
      );
    }
    const chave = entrada.profissaoId
      ? `id:${entrada.profissaoId}`
      : `valor:${entrada.valorOriginal}`;
    if (chaves.has(chave)) {
      throw new Error(
        `Profissão duplicada na seleção: ${entrada.valorOriginal}`
      );
    }
    chaves.add(chave);
  }
}
function entradasProfissionaisDasCategorias(categorias) {
  return categorias.map(valorOriginal => ({ profissaoId: idProfissaoPorCategoria(valorOriginal), valorOriginal, origem: "catalogo" }));
}
function vertentesElegiveisAtivas(db, usuarioId) {
  const placeholders = profissoesElegiveisParaVertentes
    .map(() => "?")
    .join(", ");
  const linha = db
    .prepare(
      `SELECT 1 AS elegivel
       FROM profissoes_usuario
       WHERE usuario_id = ?
         AND estado = 'ativa'
         AND profissao_id IN (${placeholders})
       LIMIT 1`
    )
    .get(usuarioId, ...profissoesElegiveisParaVertentes);
  return Boolean(linha);
}
function sincronizarAssociacaoVertentes(db, usuarioId) {
  const associacaoAtiva = vertentesElegiveisAtivas(db, usuarioId) ? 1 : 0;
  db.prepare(
    `UPDATE vertentes_profissionais_usuario
     SET associacao_ativa = ?, atualizada_em = CURRENT_TIMESTAMP
     WHERE usuario_id = ?`
  ).run(associacaoAtiva, usuarioId);
  return associacaoAtiva === 1;
}
export function listarProfissoesUsuarioCypher(usuarioId, opcoes = {}) {
  const db = bancoAtivo();
  const filtro = opcoes.incluirInativas ? "" : "WHERE estado = 'ativa'";
  return db
    .prepare(
      `SELECT id, usuario_id AS usuarioId, profissao_id AS profissaoId,
              valor_original AS valorOriginal, origem, estado,
              selecionada_em AS selecionadaEm, desativada_em AS desativadaEm,
              atualizada_em AS atualizadaEm
       FROM profissoes_usuario
       ${filtro ? `${filtro} AND` : "WHERE"} usuario_id = ?
       ORDER BY datetime(selecionada_em), id`
    )
    .all(usuarioId)
    .map(linha => mapearLinhaProfissao(linha));
}
export function salvarProfissoesUsuarioCypher(usuarioId, entradas) {
  const natureza = bancoAtivo().prepare("SELECT tipo_conta FROM usuarios WHERE id=?").get(usuarioId)?.tipo_conta;
  if (natureza === 'administrativo' || (natureza === 'consumidor' && entradas.length)) throw new Error("ACAO_PROFISSIONAL_NAO_PERMITIDA");
  validarEntradasProfissionais(entradas);
  const db = bancoAtivo();
  exigirUsuarioReal(db, usuarioId);
  const salvar = db.transaction(() => {
    const existentes = db
      .prepare(
        `SELECT id, usuario_id AS usuarioId, profissao_id AS profissaoId,
                valor_original AS valorOriginal, origem, estado,
                selecionada_em AS selecionadaEm, desativada_em AS desativadaEm,
                atualizada_em AS atualizadaEm
         FROM profissoes_usuario WHERE usuario_id = ?`
      )
      .all(usuarioId);
    const porChave = new Map(
      existentes.map(linha => [
        linha.profissaoId
          ? `id:${linha.profissaoId}`
          : `valor:${linha.valorOriginal}`,
        linha,
      ])
    );
    const selecionadas = new Set();
    const reativar = db.prepare(`UPDATE profissoes_usuario
       SET valor_original = ?, origem = ?, estado = 'ativa',
           desativada_em = NULL, atualizada_em = CURRENT_TIMESTAMP
       WHERE id = ?`);
    const inserir = db.prepare(`INSERT INTO profissoes_usuario
       (id, usuario_id, profissao_id, valor_original, origem, estado)
       VALUES (?, ?, ?, ?, ?, 'ativa')`);
    for (const entrada of entradas) {
      const chave = entrada.profissaoId
        ? `id:${entrada.profissaoId}`
        : `valor:${entrada.valorOriginal}`;
      selecionadas.add(chave);
      const existente = porChave.get(chave);
      if (existente) {
        reativar.run(entrada.valorOriginal, entrada.origem, existente.id);
      } else {
        inserir.run(
          randomUUID(),
          usuarioId,
          entrada.profissaoId,
          entrada.valorOriginal,
          entrada.origem
        );
      }
    }
    const inativar = db.prepare(`UPDATE profissoes_usuario
       SET estado = 'inativa', desativada_em = CURRENT_TIMESTAMP,
           atualizada_em = CURRENT_TIMESTAMP
       WHERE id = ? AND estado = 'ativa'`);
    for (const existente of existentes) {
      const chave = existente.profissaoId
        ? `id:${existente.profissaoId}`
        : `valor:${existente.valorOriginal}`;
      if (!selecionadas.has(chave)) inativar.run(existente.id);
    }
    sincronizarAssociacaoVertentes(db, usuarioId);
  });
  salvar();
}
export function listarVertentesProfissionaisUsuarioCypher(
  usuarioId,
  opcoes = {}
) {
  const db = bancoAtivo();
  const filtro = opcoes.incluirInativas
    ? ""
    : "AND ativa = 1 AND associacao_ativa = 1";
  return db
    .prepare(
      `SELECT id, usuario_id AS usuarioId, vertente_id AS vertenteId,
              ativa, associacao_ativa AS associacaoAtiva,
              criada_em AS criadaEm, desativada_em AS desativadaEm,
              atualizada_em AS atualizadaEm
       FROM vertentes_profissionais_usuario
       WHERE usuario_id = ? ${filtro}
       ORDER BY vertente_id`
    )
    .all(usuarioId)
    .map(linha => mapearLinhaVertente(linha));
}
export function salvarVertentesProfissionaisUsuarioCypher(
  usuarioId,
  vertentes
) {
  const unicas = [...new Set(vertentes)];
  for (const vertente of unicas) {
    if (!vertenteProfissionalPermitida(vertente)) {
      throw new Error(`Vertente profissional não permitida: ${vertente}`);
    }
  }
  const db = bancoAtivo();
  exigirUsuarioReal(db, usuarioId);
  const salvar = db.transaction(() => {
    const associacaoAtiva = sincronizarAssociacaoVertentes(db, usuarioId);
    if (!associacaoAtiva) {
      if (unicas.length > 0) {
        throw new Error(
          "Somente Rapper pode selecionar vertentes profissionais."
        );
      }
      return;
    }
    const existentes = db
      .prepare(
        `SELECT id, usuario_id AS usuarioId, vertente_id AS vertenteId,
                ativa, associacao_ativa AS associacaoAtiva,
                criada_em AS criadaEm, desativada_em AS desativadaEm,
                atualizada_em AS atualizadaEm
         FROM vertentes_profissionais_usuario WHERE usuario_id = ?`
      )
      .all(usuarioId);
    const porVertente = new Map(
      existentes.map(linha => [linha.vertenteId, linha])
    );
    const selecionadas = new Set(unicas);
    const ativar = db.prepare(`UPDATE vertentes_profissionais_usuario
       SET ativa = 1, associacao_ativa = 1, desativada_em = NULL,
           atualizada_em = CURRENT_TIMESTAMP
       WHERE id = ?`);
    const inserir = db.prepare(`INSERT INTO vertentes_profissionais_usuario
       (id, usuario_id, vertente_id, ativa, associacao_ativa)
       VALUES (?, ?, ?, 1, 1)`);
    for (const vertente of unicas) {
      const existente = porVertente.get(vertente);
      if (existente) ativar.run(existente.id);
      else inserir.run(randomUUID(), usuarioId, vertente);
    }
    const desativar = db.prepare(`UPDATE vertentes_profissionais_usuario
       SET ativa = 0, associacao_ativa = 1, desativada_em = CURRENT_TIMESTAMP,
           atualizada_em = CURRENT_TIMESTAMP
       WHERE id = ?`);
    for (const existente of existentes) {
      if (!selecionadas.has(existente.vertenteId)) desativar.run(existente.id);
    }
  });
  salvar();
}
export function sincronizarVertentesProfissionaisUsuarioCypher(usuarioId) {
  const db = bancoAtivo();
  const sincronizar = db.transaction(() =>
    sincronizarAssociacaoVertentes(db, usuarioId)
  );
  return sincronizar();
}
function normalizarCategoria(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}
function inserirPropostaCategoria(db, usuarioId, valorRecebido) {
  const categoria = valorRecebido.trim().replace(/\s+/g, " ");
  if (categoria.length < 2 || categoria.length > 60) return "invalida";
  const normalizada = normalizarCategoria(categoria);
  if (
    categoriasGerais.some(
      existente => normalizarCategoria(existente) === normalizada
    )
  ) {
    return "categoria_base";
  }
  const aprovadas = db
    .prepare("SELECT categoria FROM categorias_profissionais_aprovadas")
    .all();
  if (
    aprovadas.some(item => normalizarCategoria(item.categoria) === normalizada)
  ) {
    return "ja_aprovada";
  }
  const pendentes = db
    .prepare(
      "SELECT categoria FROM propostas_categorias WHERE status = 'pendente'"
    )
    .all();
  const existente = pendentes.find(
    item => normalizarCategoria(item.categoria) === normalizada
  );
  if (existente) return "ja_pendente";
  const resultado = db
    .prepare(
      `INSERT INTO propostas_categorias (id, usuario_id, categoria)
       VALUES (?, ?, ?) ON CONFLICT DO NOTHING`
    )
    .run(randomUUID(), usuarioId, categoria);
  return resultado.changes === 1 ? "criada" : "ja_pendente";
}
export function listarCategoriasProfissionaisCypher() {
  return [...categoriasGerais];
}
export function solicitarCategoriaProfissionalCypher(usuarioId, categoria) {
  const db = bancoAtivo();
  const solicitar = db.transaction(() => {
    const conta = db
      .prepare("SELECT 1 FROM usuarios WHERE id = ? AND demonstracao = 0")
      .get(usuarioId);
    if (!conta) return "nao_encontrada";
    return inserirPropostaCategoria(db, usuarioId, categoria);
  });
  return solicitar();
}
export function listarPropostasCategoriasPendentesCypher() {
  return bancoAtivo()
    .prepare(
      `SELECT c.id, c.usuario_id AS usuarioId, p.nome,
              p.identificador AS handle, c.categoria,
              c.criada_em AS criadaEm
       FROM propostas_categorias c
       JOIN perfis p ON p.usuario_id = c.usuario_id
       JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.status = 'pendente' AND u.demonstracao = 0
       ORDER BY datetime(c.criada_em), c.id`
    )
    .all();
}
export function criarNotificacaoCypher(dados) {
  bancoAtivo()
    .prepare(
      `
      INSERT INTO notificacoes (
        id, usuario_destino_id, tipo, titulo, mensagem, url,
        entidade_tipo, entidade_id, chave_origem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(chave_origem) DO NOTHING
      `
    )
    .run(
      randomUUID(),
      dados.usuarioDestinoId,
      dados.tipo,
      dados.titulo,
      dados.mensagem,
      dados.url,
      dados.entidadeTipo ?? "",
      dados.entidadeId ?? "",
      dados.chaveOrigem ?? null
    );
}
function linhaNotificacao(linha) {
  return {
    id: String(linha.id),
    tipo: String(linha.tipo),
    titulo: String(linha.titulo),
    mensagem: String(linha.mensagem),
    url: String(linha.url),
    entidadeTipo: String(linha.entidadeTipo),
    entidadeId: String(linha.entidadeId),
    lida: Boolean(linha.lida),
    criadaEm: String(linha.criadaEm),
  };
}
export function listarNotificacoesCypher(usuarioId, limite = 8) {
  return bancoAtivo()
    .prepare(
      `
      SELECT id, tipo, titulo, mensagem, url,
             entidade_tipo AS entidadeTipo,
             entidade_id AS entidadeId,
             lida, criada_em AS criadaEm
      FROM notificacoes
      WHERE usuario_destino_id = ?
      ORDER BY datetime(criada_em) DESC, id DESC
      LIMIT ?
      `
    )
    .all(usuarioId, Math.max(1, Math.min(50, limite)))
    .map(linha => linhaNotificacao(linha));
}
export function contarNotificacoesNaoLidasCypher(usuarioId) {
  return bancoAtivo()
    .prepare(
      "SELECT COUNT(*) AS total FROM notificacoes WHERE usuario_destino_id = ? AND lida = 0"
    )
    .get(usuarioId).total;
}
export function marcarNotificacaoLidaCypher(notificacaoId, usuarioId) {
  const resultado = bancoAtivo()
    .prepare(
      `
      UPDATE notificacoes
      SET lida = 1, lida_em = CURRENT_TIMESTAMP
      WHERE id = ? AND usuario_destino_id = ? AND lida = 0
      `
    )
    .run(notificacaoId, usuarioId);
  return resultado.changes > 0;
}
export function marcarTodasNotificacoesLidasCypher(usuarioId) {
  const resultado = bancoAtivo()
    .prepare(
      `
      UPDATE notificacoes
      SET lida = 1, lida_em = CURRENT_TIMESTAMP
      WHERE usuario_destino_id = ? AND lida = 0
      `
    )
    .run(usuarioId);
  return resultado.changes;
}
function ofertasDoBeat(beatId) {
  return bancoAtivo()
    .prepare(
      `
      SELECT
        id,
        tipo,
        preco_centavos AS precoCentavos,
        descricao,
        ativa
      FROM ofertas_beats
      WHERE beat_id = ? AND ativa = 1
      ORDER BY criado_em, id
      `
    )
    .all(beatId)
    .map(linha => {
      const oferta = linha;
      return { ...oferta, ativa: Boolean(oferta.ativa) };
    });
}
function precoEmCentavos(valor) {
  if (!valor.trim()) return null;
  const normalizado = valor.replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) && numero >= 0
    ? Math.round(numero * 100)
    : null;
}
function substituirOfertasBeat(db, beatId, ofertas, vendaExclusiva) {
  db.prepare("DELETE FROM ofertas_beats WHERE beat_id = ?").run(beatId);
  const inserir = db.prepare(`
    INSERT INTO ofertas_beats (id, beat_id, tipo, preco_centavos, descricao)
    VALUES (?, ?, ?, ?, ?)
    `);
  const ofertasParaSalvar = vendaExclusiva
    ? ofertas.filter(oferta => oferta.tipo === "Exclusiva").slice(0, 1)
    : ofertas;
  for (const oferta of ofertasParaSalvar) {
    inserir.run(
      randomUUID(),
      beatId,
      oferta.tipo,
      precoEmCentavos(oferta.preco),
      oferta.descricao
    );
  }
}
export function caminhoBancoCypher() {
  const configurado = process.env.CYPHER_DB_PATH;
  return path.resolve(
    configurado || path.join(process.cwd(), "data", "cypher.sqlite")
  );
}
function limparDadosDemonstrativos(conexao) {
  conexao.exec(`
    DELETE FROM interesses_eventos WHERE evento_id IN (SELECT id FROM eventos WHERE demonstracao = 1) OR usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM creditos WHERE obra_id IN (SELECT id FROM obras WHERE demonstracao = 1) OR usuario_creditado_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM ofertas_beats WHERE beat_id IN (SELECT id FROM beats WHERE demonstracao = 1);
    DELETE FROM obras WHERE demonstracao = 1;
    DELETE FROM eventos WHERE demonstracao = 1;
    DELETE FROM beats WHERE demonstracao = 1;
    DELETE FROM notificacoes WHERE usuario_destino_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM sessoes WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM respostas_atuacao_categoria WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM respostas_atuacao_profissao WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM profissoes_usuario WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM vertentes_profissionais_usuario WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM propostas_generos WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM propostas_categorias WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM excecoes_categorias WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM solicitacoes_excecao_categorias WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM auditoria_categorias WHERE usuario_id IN (SELECT id FROM usuarios WHERE demonstracao = 1);
    DELETE FROM perfis WHERE demonstracao = 1;
    DELETE FROM usuarios WHERE demonstracao = 1;
  `);
}

function exigirPapelAdministrativo(usuarioId, acao) {
  const conta = bancoAtivo().prepare(`SELECT a.papel FROM administradores a JOIN usuarios u ON u.id=a.usuario_id
    WHERE a.usuario_id=? AND a.ativo=1 AND u.tipo_conta='administrativo'`).get(usuarioId);
  if (!conta || !(conta.papel === 'super_admin' || (conta.papel === 'moderador' && acao === 'excecoes'))) throw new Error("ACESSO_ADMINISTRATIVO_NEGADO");
}
function exigirProfissional(usuarioId) {
  const conta = bancoAtivo().prepare("SELECT tipo_conta FROM usuarios WHERE id=? AND demonstracao=0").get(usuarioId);
  if (conta?.tipo_conta !== 'profissional') throw new Error("ACAO_PROFISSIONAL_NAO_PERMITIDA");
}
export function conexaoInternaCypher() { return bancoAtivo(); }
export function inicializarBancoCypher() {
  if (banco) return;
  const caminho = caminhoBancoCypher();
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  const conexao = new Database(caminho);
  conexao.pragma("foreign_keys = ON");
  conexao.pragma("busy_timeout = 5000");
  try {
    conexao.transaction(() => {
      const versao = conexao.pragma("user_version", { simple: true });
      if (versao > versaoEsquema) throw new Error("O banco usa uma versão de esquema mais recente que a suportada.");
      if (versao !== 0 && versao !== 21 && versao !== 22 && versao !== 23 && versao !== versaoEsquema) throw new Error("Banco de desenvolvimento anterior ao schema 21. Recrie a base de desenvolvimento antes de iniciar.");
      if (versao === 0 && conexao.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'usuarios'").get()) throw new Error("Banco sem versão já contém usuários; recriação explícita necessária.");
      if (versao === 21) {
        conexao.exec(`ALTER TABLE perfis ADD COLUMN nome_informado TEXT NOT NULL DEFAULT '';
          ALTER TABLE perfis ADD COLUMN vulgo TEXT NOT NULL DEFAULT '';
          ALTER TABLE perfis ADD COLUMN usar_vulgo INTEGER NOT NULL DEFAULT 0 CHECK (usar_vulgo IN (0,1));
          ALTER TABLE perfis ADD COLUMN nascimento TEXT NOT NULL DEFAULT '';
          ALTER TABLE perfis ADD COLUMN tratamento TEXT NOT NULL DEFAULT '';
          ALTER TABLE perfis ADD COLUMN identificador_alterado_em TEXT;
          UPDATE perfis SET nome_informado=nome;
        `);
      }
      if (versao === 21 || versao === 22) {
        conexao.exec(`ALTER TABLE perfis ADD COLUMN genero_personalizado TEXT NOT NULL DEFAULT '';
          ALTER TABLE perfis ADD COLUMN identidade_revisada INTEGER NOT NULL DEFAULT 0 CHECK (identidade_revisada IN (0,1));
          UPDATE perfis SET identidade_revisada=1 WHERE usar_vulgo=1;`);
      }
      const colunasUsuarios = versao === 0
        ? []
        : conexao.pragma("table_info(usuarios)");
      if (versao !== 0 && !colunasUsuarios.some(coluna => coluna.name === "email_confirmado_em")) {
        conexao.exec("ALTER TABLE usuarios ADD COLUMN email_confirmado_em TEXT");
      }
      conexao.exec(esquema);
      conexao.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS indice_usuarios_codigo_publico ON usuarios(codigo_publico);
        CREATE UNIQUE INDEX IF NOT EXISTS indice_usuarios_numero_sequencial_real ON usuarios(numero_sequencial) WHERE demonstracao = 0 AND numero_sequencial IS NOT NULL;
        CREATE TABLE IF NOT EXISTS administradores (
          usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
          nome TEXT NOT NULL,
          papel TEXT NOT NULL CHECK (papel IN ('super_admin','moderador','editor')),
          ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
          criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS auditoria_administrativa (
          id TEXT PRIMARY KEY, autor_id TEXT REFERENCES usuarios(id),
          acao TEXT NOT NULL, alvo_id TEXT REFERENCES usuarios(id),
          detalhe TEXT NOT NULL DEFAULT '', criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS identificadores_usuario (
          identificador TEXT PRIMARY KEY COLLATE NOCASE,
          usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          reservado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS alteracoes_identificador (
          id TEXT PRIMARY KEY, usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          anterior TEXT NOT NULL, novo TEXT NOT NULL, autor_id TEXT REFERENCES usuarios(id),
          motivo TEXT NOT NULL DEFAULT '', criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tokens_confirmacao_email (
          token_hash TEXT PRIMARY KEY, usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          email_destino TEXT NOT NULL, finalidade TEXT NOT NULL CHECK (finalidade IN ('cadastro','alteracao')),
          expira_em INTEGER NOT NULL, criado_em INTEGER NOT NULL, usado_em INTEGER
        );
        CREATE INDEX IF NOT EXISTS indice_tokens_email_usuario ON tokens_confirmacao_email(usuario_id,criado_em);
        CREATE TABLE IF NOT EXISTS ativacoes_profissionais (
          usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
          categorias_json TEXT NOT NULL, criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS preferencias_usuario (
          usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
          regiao TEXT NOT NULL DEFAULT '', generos_json TEXT NOT NULL DEFAULT '[]',
          tema TEXT NOT NULL DEFAULT 'light' CHECK (tema IN ('light','dark'))
        );
        CREATE UNIQUE INDEX IF NOT EXISTS indice_perfis_identificador ON perfis(identificador COLLATE NOCASE);
        INSERT INTO identificadores_usuario (identificador,usuario_id) SELECT identificador,usuario_id FROM perfis WHERE 1 ON CONFLICT DO NOTHING;
        CREATE TRIGGER IF NOT EXISTS impedir_perfil_administrativo
        BEFORE INSERT ON perfis WHEN (SELECT tipo_conta FROM usuarios WHERE id = NEW.usuario_id) = 'administrativo'
        BEGIN SELECT RAISE(ABORT, 'ADMINISTRADOR_NAO_POSSUI_PERFIL'); END;
        CREATE TRIGGER IF NOT EXISTS auditar_proposta_genero AFTER UPDATE OF status ON propostas_generos
        WHEN OLD.status <> NEW.status BEGIN
          INSERT INTO auditoria_administrativa (id,autor_id,acao,alvo_id,detalhe)
          VALUES (lower(hex(randomblob(16))),NEW.revisor_id,'genero_' || NEW.status,NEW.usuario_id,NEW.motivo_revisao);
        END;
        CREATE TRIGGER IF NOT EXISTS auditar_proposta_categoria AFTER UPDATE OF status ON propostas_categorias
        WHEN OLD.status <> NEW.status BEGIN
          INSERT INTO auditoria_administrativa (id,autor_id,acao,alvo_id,detalhe)
          VALUES (lower(hex(randomblob(16))),NEW.revisor_id,'categoria_' || NEW.status,NEW.usuario_id,NEW.motivo_revisao);
        END;
        CREATE TRIGGER IF NOT EXISTS auditar_excecao AFTER INSERT ON excecoes_categorias BEGIN
          INSERT INTO auditoria_administrativa (id,autor_id,acao,alvo_id,detalhe)
          VALUES (lower(hex(randomblob(16))),NEW.administrador_id,'excecao_concedida',NEW.usuario_id,NEW.motivo);
        END;
        CREATE TRIGGER IF NOT EXISTS auditar_solicitacao_excecao AFTER UPDATE OF status ON solicitacoes_excecao_categorias
        WHEN OLD.status <> NEW.status BEGIN
          INSERT INTO auditoria_administrativa (id,autor_id,acao,alvo_id,detalhe)
          VALUES (lower(hex(randomblob(16))),NEW.revisor_id,'solicitacao_' || NEW.status,NEW.usuario_id,NEW.motivo_revisao);
        END;
        INSERT INTO sequencias (nome, proximo_numero) VALUES ('usuarios_reais', 1) ON CONFLICT DO NOTHING;
      `);
      if (conexao.pragma("foreign_key_check").length) throw new Error("Integridade referencial inválida.");
      conexao.pragma(`user_version = ${versaoEsquema}`);
    })();
    banco = conexao;
  } catch (erro) { conexao.close(); throw erro; }
}
export function listarEventosCypher(filtros, usuarioId) {
  const filtrosSql = [];
  const parametros = { usuarioId };
  if (filtros.categoria) {
    filtrosSql.push("e.categoria = @categoria");
    parametros.categoria = filtros.categoria;
  }
  if (filtros.localizacao) {
    filtrosSql.push("LOWER(e.local) LIKE LOWER(@localizacao)");
    parametros.localizacao = `%${filtros.localizacao}%`;
  }
  if (filtros.formato) {
    filtrosSql.push("e.formato = @formato");
    parametros.formato = filtros.formato;
  }
  if (filtros.periodo === "proximos") {
    filtrosSql.push("(e.data_texto = '' OR e.data_texto >= date('now'))");
  } else if (filtros.periodo === "passados") {
    filtrosSql.push("e.data_texto <> '' AND e.data_texto < date('now')");
  }
  const ordenacao = {
    recentes: "e.criado_em DESC, e.id DESC",
    data: "CASE WHEN e.data_texto = '' THEN 1 ELSE 0 END, e.data_texto ASC, e.horario ASC, e.id ASC",
    titulo: "e.titulo COLLATE NOCASE ASC, e.id ASC",
  }[filtros.ordem];
  const linhas = bancoAtivo()
    .prepare(
      `
      SELECT
        e.id,
        e.proprietario_id AS proprietarioId,
        e.titulo AS title,
        e.categoria AS category,
        e.categoria_detalhe AS categoryDetail,
        e.data_texto AS date,
        e.horario AS time,
        e.local AS location,
        e.organizador AS org,
        e.situacao AS status,
        e.cor AS color,
        e.descricao AS description,
        e.formato AS format,
        e.inscricao AS registration,
        e.premio AS prize,
        e.etiquetas_json AS tagsJson,
        e.tipo_participacao AS participationType,
        e.demonstracao,
        e.criado_em AS criadoEm,
        CASE WHEN e.proprietario_id = @usuarioId AND e.demonstracao = 0 THEN 1 ELSE 0 END AS owned,
        (
          SELECT ie.status
          FROM interesses_eventos ie
          WHERE ie.evento_id = e.id AND ie.usuario_id = @usuarioId
        ) AS interesseStatus,
        (
          SELECT COUNT(*)
          FROM interesses_eventos ie
          WHERE ie.evento_id = e.id
            AND e.demonstracao = 0
            AND ie.status IN ('interessado', 'inscrito', 'confirmado')
        ) AS totalInteressados
      FROM eventos e
      WHERE ${filtrosSql.length ? filtrosSql.join(" AND ") : "1 = 1"}
      ORDER BY ${ordenacao}
      `
    )
    .all(parametros);
  return linhas.map(
    ({
      tagsJson,
      demonstracao,
      owned,
      totalInteressados,
      interessados = [],
      ...evento
    }) => ({
      ...evento,
      tags: JSON.parse(tagsJson),
      demonstracao: Boolean(demonstracao),
      owned: Boolean(owned),
      totalInteressados: Number(totalInteressados),
      interessados: owned
        ? listarInteressesEventoCypher(evento.id)
        : interessados,
    })
  );
}
export function obterEventoCypher(id, usuarioId) {
  const linha = bancoAtivo()
    .prepare(
      `
      SELECT
        e.id,
        e.proprietario_id AS proprietarioId,
        e.titulo AS title,
        e.categoria AS category,
        e.categoria_detalhe AS categoryDetail,
        e.data_texto AS date,
        e.horario AS time,
        e.local AS location,
        e.organizador AS org,
        e.situacao AS status,
        e.cor AS color,
        e.descricao AS description,
        e.formato AS format,
        e.inscricao AS registration,
        e.premio AS prize,
        e.etiquetas_json AS tagsJson,
        e.tipo_participacao AS participationType,
        e.demonstracao,
        e.criado_em AS criadoEm,
        CASE WHEN e.proprietario_id = ? AND e.demonstracao = 0 THEN 1 ELSE 0 END AS owned,
        (
          SELECT ie.status
          FROM interesses_eventos ie
          WHERE ie.evento_id = e.id AND ie.usuario_id = ?
        ) AS interesseStatus,
        (
          SELECT COUNT(*)
          FROM interesses_eventos ie
          WHERE ie.evento_id = e.id
            AND e.demonstracao = 0
            AND ie.status IN ('interessado', 'inscrito', 'confirmado')
        ) AS totalInteressados
      FROM eventos e
      WHERE e.id = ?
      `
    )
    .get(usuarioId, usuarioId, id);
  if (!linha) return undefined;
  const { tagsJson, demonstracao, owned, totalInteressados, ...evento } = linha;
  return {
    ...evento,
    tags: JSON.parse(tagsJson),
    demonstracao: Boolean(demonstracao),
    owned: Boolean(owned),
    totalInteressados: Number(totalInteressados),
    interessados: owned ? listarInteressesEventoCypher(evento.id) : [],
  };
}
export function listarInteressesEventoCypher(eventoId) {
  return bancoAtivo()
    .prepare(
      `
      SELECT
        ie.id,
        ie.evento_id AS eventoId,
        ie.usuario_id AS usuarioId,
        p.nome AS nome,
        p.identificador AS handle,
        ie.status,
        ie.criado_em AS criadoEm,
        ie.atualizado_em AS atualizadoEm
      FROM interesses_eventos ie
      JOIN perfis p ON p.usuario_id = ie.usuario_id
      WHERE ie.evento_id = ?
        AND ie.status <> 'cancelado'
      ORDER BY
        CASE ie.status
          WHEN 'interessado' THEN 1
          WHEN 'inscrito' THEN 2
          WHEN 'confirmado' THEN 3
          WHEN 'rejeitado' THEN 4
          ELSE 5
        END,
        ie.criado_em ASC,
        ie.id ASC
      `
    )
    .all(eventoId);
}
export function demonstrarInteresseEventoCypher(eventoId, usuarioId) {
  const db = bancoAtivo();
  const evento = db
    .prepare(
      `
      SELECT e.id, e.tipo_participacao AS participationType
      FROM eventos e
      JOIN usuarios u ON u.id = ?
      WHERE e.id = ?
        AND e.demonstracao = 0
        AND e.situacao <> 'Encerrado'
        AND u.demonstracao = 0
        AND e.proprietario_id <> ?
      `
    )
    .get(usuarioId, eventoId, usuarioId);
  if (!evento) return null;
  db.prepare(
    `
    INSERT INTO interesses_eventos (id, evento_id, usuario_id, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(evento_id, usuario_id) DO UPDATE SET
      status = excluded.status,
      atualizado_em = CURRENT_TIMESTAMP
    `
  ).run(
    randomUUID(),
    eventoId,
    usuarioId,
    evento.participationType === "aprovacao" ? "inscrito" : "interessado"
  );
  return evento.participationType === "aprovacao" ? "inscrito" : "interessado";
}
export function cancelarInteresseEventoCypher(eventoId, usuarioId) {
  const resultado = bancoAtivo()
    .prepare(
      `
      UPDATE interesses_eventos
      SET status = 'cancelado', atualizado_em = CURRENT_TIMESTAMP
      WHERE evento_id = ? AND usuario_id = ? AND status <> 'cancelado'
      `
    )
    .run(eventoId, usuarioId);
  return resultado.changes > 0;
}
export function atualizarStatusInteresseEventoCypher(
  eventoId,
  organizadorId,
  usuarioInteressadoId,
  status
) {
  const db = bancoAtivo();
  const atual = db
    .prepare(
      `
      SELECT ie.status
      FROM interesses_eventos ie
      JOIN eventos e ON e.id = ie.evento_id
      WHERE ie.evento_id = ?
        AND ie.usuario_id = ?
        AND e.proprietario_id = ?
        AND e.demonstracao = 0
        AND e.situacao <> 'Encerrado'
      `
    )
    .get(eventoId, usuarioInteressadoId, organizadorId);
  if (!atual || atual.status === "cancelado") return false;
  const transicoes = {
    interessado: ["interessado", "inscrito", "rejeitado"],
    inscrito: ["interessado", "inscrito", "confirmado", "rejeitado"],
    confirmado: ["confirmado"],
    rejeitado: ["interessado", "rejeitado"],
  };
  if (!transicoes[atual.status].includes(status)) return false;
  const resultado = db
    .prepare(
      `
      UPDATE interesses_eventos
      SET status = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE evento_id = ?
        AND usuario_id = ?
        AND status <> 'cancelado'
        AND EXISTS (
          SELECT 1 FROM eventos e
          WHERE e.id = interesses_eventos.evento_id
            AND e.proprietario_id = ?
            AND e.demonstracao = 0
            AND e.situacao <> 'Encerrado'
        )
      `
    )
    .run(status, eventoId, usuarioInteressadoId, organizadorId);
  return resultado.changes > 0;
}
function exigirPublicacao(usuarioId, modalidade, tipo) {
  const conta = bancoAtivo().prepare(`SELECT u.tipo_conta AS tipoConta, u.email_confirmado_em AS confirmado, p.categorias_json AS categorias FROM usuarios u
    LEFT JOIN perfis p ON p.usuario_id = u.id WHERE u.id = ? AND u.demonstracao = 0`).get(usuarioId);
  if (!conta || !conta.confirmado || !podePublicar({ tipoConta: conta.tipoConta, categories: JSON.parse(conta.categorias || '[]') }, modalidade, tipo)) throw new Error("PUBLICACAO_NAO_PERMITIDA");
}
export function criarEventoCypher(proprietarioId, dados) {
  exigirPublicacao(proprietarioId, "evento");
  const id = randomUUID();
  bancoAtivo()
    .prepare(
      `
      INSERT INTO eventos (
        id, proprietario_id, titulo, categoria, categoria_detalhe, data_texto, horario, local,
        organizador, situacao, cor, descricao, formato, inscricao, premio,
        etiquetas_json, tipo_participacao, demonstracao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `
    )
    .run(
      id,
      proprietarioId,
      dados.title,
      dados.category,
      dados.categoryDetail,
      dados.date,
      dados.time,
      dados.location,
      dados.org,
      dados.status,
      dados.color,
      dados.description,
      dados.format,
      dados.registration,
      dados.prize,
      JSON.stringify(dados.tags),
      dados.participationType
    );
  return id;
}
export function atualizarEventoCypher(id, proprietarioId, dados) {
  exigirProfissional(proprietarioId);
  const resultado = bancoAtivo()
    .prepare(
      `
      UPDATE eventos
      SET titulo = ?, categoria = ?, categoria_detalhe = ?, data_texto = ?, horario = ?, local = ?,
          organizador = ?, situacao = ?, cor = ?, descricao = ?, formato = ?,
          inscricao = ?, premio = ?, etiquetas_json = ?, tipo_participacao = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ? AND proprietario_id = ? AND demonstracao = 0
      `
    )
    .run(
      dados.title,
      dados.category,
      dados.categoryDetail,
      dados.date,
      dados.time,
      dados.location,
      dados.org,
      dados.status,
      dados.color,
      dados.description,
      dados.format,
      dados.registration,
      dados.prize,
      JSON.stringify(dados.tags),
      dados.participationType,
      id,
      proprietarioId
    );
  return resultado.changes > 0;
}
export function excluirEventoCypher(id, proprietarioId) {
  exigirProfissional(proprietarioId);
  const resultado = bancoAtivo()
    .prepare(
      "DELETE FROM eventos WHERE id = ? AND proprietario_id = ? AND demonstracao = 0"
    )
    .run(id, proprietarioId);
  return resultado.changes > 0;
}
export function listarBeatsCypher(usuarioId) {
  const linhas = bancoAtivo()
    .prepare(
      `
      SELECT
        b.id,
        b.produtor_id AS produtorId,
        b.titulo AS title,
        p.nome AS producer,
        b.bpm AS bpm,
        b.tom_musical AS key,
        b.genero AS genre,
        b.licenca AS license,
        b.duracao AS duration,
        b.cor AS color,
        b.descricao AS description,
        b.condicoes_uso AS usage,
        b.venda_exclusiva AS vendaExclusiva,
        b.demonstracao AS demonstracao,
        (b.demonstracao = 0 AND b.produtor_id = ?) AS owned,
        b.criado_em AS criadoEm
      FROM beats b
      JOIN perfis p ON p.usuario_id = b.produtor_id
      WHERE b.demonstracao IN (0, 1)
      ORDER BY b.demonstracao DESC, datetime(b.criado_em) DESC, b.ordem_demo
      `
    )
    .all(usuarioId ?? "");
  return linhas.map(linha => ({
    ...linha,
    vendaExclusiva: Boolean(linha.vendaExclusiva),
    demonstracao: Boolean(linha.demonstracao),
    owned: Boolean(linha.owned),
    ofertas: ofertasDoBeat(linha.id),
  }));
}
export function criarBeatCypher(produtorId, dados) {
  exigirPublicacao(produtorId, "beat");
  const id = randomUUID();
  const db = bancoAtivo();
  db.transaction(() => {
    db.prepare(
      `
      INSERT INTO beats (
        id, produtor_id, titulo, bpm, tom_musical, genero, licenca,
        duracao, cor, descricao, condicoes_uso, demonstracao, venda_exclusiva
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'yellow', ?, ?, 0, ?)
      `
    ).run(
      id,
      produtorId,
      dados.title,
      dados.bpm,
      dados.key,
      dados.genre,
      dados.license,
      dados.duration,
      dados.description,
      dados.usage,
      dados.vendaExclusiva ? 1 : 0
    );
    substituirOfertasBeat(db, id, dados.ofertas, dados.vendaExclusiva);
  })();
  return id;
}
export function obterBeatCypher(id, produtorId) {
  const linha = bancoAtivo()
    .prepare(
      `
      SELECT
        b.id,
        b.produtor_id AS produtorId,
        b.titulo AS title,
        p.nome AS producer,
        b.bpm AS bpm,
        b.tom_musical AS key,
        b.genero AS genre,
        b.licenca AS license,
        b.duracao AS duration,
        b.cor AS color,
        b.descricao AS description,
        b.condicoes_uso AS usage,
        b.venda_exclusiva AS vendaExclusiva,
        b.demonstracao AS demonstracao,
        1 AS owned,
        b.criado_em AS criadoEm
      FROM beats b
      JOIN perfis p ON p.usuario_id = b.produtor_id
      WHERE b.id = ? AND b.produtor_id = ? AND b.demonstracao = 0
      `
    )
    .get(id, produtorId);
  if (!linha) return undefined;
  return {
    ...linha,
    vendaExclusiva: Boolean(linha.vendaExclusiva),
    demonstracao: false,
    owned: true,
    ofertas: ofertasDoBeat(id),
  };
}
export function atualizarBeatCypher(id, produtorId, dados) {
  exigirProfissional(produtorId);
  const db = bancoAtivo();
  const resultado = db.transaction(() => {
    const atualizacao = db
      .prepare(
        `
        UPDATE beats
        SET titulo = ?, bpm = ?, tom_musical = ?, genero = ?, licenca = ?,
            duracao = ?, descricao = ?, condicoes_uso = ?,
            venda_exclusiva = ?, atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ? AND produtor_id = ? AND demonstracao = 0
        `
      )
      .run(
        dados.title,
        dados.bpm,
        dados.key,
        dados.genre,
        dados.license,
        dados.duration,
        dados.description,
        dados.usage,
        dados.vendaExclusiva ? 1 : 0,
        id,
        produtorId
      );
    if (atualizacao.changes > 0) {
      substituirOfertasBeat(db, id, dados.ofertas, dados.vendaExclusiva);
    }
    return atualizacao;
  })();
  return resultado.changes > 0;
}
export function excluirBeatCypher(id, produtorId) {
  exigirProfissional(produtorId);
  const resultado = bancoAtivo()
    .prepare(
      "DELETE FROM beats WHERE id = ? AND produtor_id = ? AND demonstracao = 0"
    )
    .run(id, produtorId);
  return resultado.changes > 0;
}
function salvarAtuacoesCategoria(db, usuarioId, categoriasAtivas, atuacoes) {
  const permitidas = new Set(categoriasAtivas);
  const existentes = db
    .prepare(
      "SELECT categoria FROM respostas_atuacao_categoria WHERE usuario_id = ?"
    )
    .all(usuarioId);
  const remover = db.prepare(
    "DELETE FROM respostas_atuacao_categoria WHERE usuario_id = ? AND categoria = ?"
  );
  for (const item of existentes) {
    if (!permitidas.has(item.categoria)) remover.run(usuarioId, item.categoria);
  }
  const salvar = db.prepare(`
    INSERT INTO respostas_atuacao_categoria (
      usuario_id, categoria, respostas_json, visibilidades_json,
      versao_questionario, atualizado_em
    ) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(usuario_id, categoria) DO UPDATE SET
      respostas_json = excluded.respostas_json,
      visibilidades_json = excluded.visibilidades_json,
      versao_questionario = excluded.versao_questionario,
      atualizado_em = CURRENT_TIMESTAMP
  `);
  const salvarPorProfissao = db.prepare(`
    INSERT INTO respostas_atuacao_profissao (
      usuario_id, profissao_id, respostas_json, visibilidades_json,
      versao_questionario, atualizado_em
    ) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(usuario_id, profissao_id) DO UPDATE SET
      respostas_json = excluded.respostas_json,
      visibilidades_json = excluded.visibilidades_json,
      versao_questionario = excluded.versao_questionario,
      atualizado_em = CURRENT_TIMESTAMP
  `);
  for (const atuacao of atuacoes) {
    if (!permitidas.has(atuacao.categoria)) {
      throw new Error("ATUACAO_NAO_SELECIONADA");
    }
    const visibilidades = Object.fromEntries(
      Object.entries(atuacao.visibilidades).filter(([, valor]) =>
        ["publico", "colaboradores", "privado"].includes(valor)
      )
    );
    salvar.run(
      usuarioId,
      atuacao.categoria,
      JSON.stringify(atuacao.respostas),
      JSON.stringify(visibilidades)
    );
    const profissaoId = idProfissaoPorCategoria(atuacao.categoria);
    if (profissaoId) {
      const validacao = validarRespostasAtuacao(
        profissaoId,
        atuacao.respostas,
        false
      );
      if (!validacao.valido) throw new Error("RESPOSTAS_ATUACAO_INVALIDAS");
      salvarPorProfissao.run(
        usuarioId,
        profissaoId,
        JSON.stringify(atuacao.respostas),
        JSON.stringify(visibilidades)
      );
    }
  }
}

export function listarRespostasAtuacaoProfissaoCypher(usuarioId, opcoes = {}) {
  exigirUsuarioReal(bancoAtivo(), usuarioId);
  const linhas = bancoAtivo()
    .prepare(
      `SELECT profissao_id AS profissaoId,
              respostas_json AS respostasJson,
              visibilidades_json AS visibilidadesJson,
              versao_questionario AS versaoQuestionario,
              atualizado_em AS atualizadoEm
       FROM respostas_atuacao_profissao
       WHERE usuario_id = ?
       ORDER BY profissao_id`
    )
    .all(usuarioId);
  return linhas
    .filter(linha =>
      opcoes.profissaoId ? linha.profissaoId === opcoes.profissaoId : true
    )
    .map(linha => ({
      profissaoId: linha.profissaoId,
      respostas: JSON.parse(linha.respostasJson),
      visibilidades: JSON.parse(linha.visibilidadesJson),
      versaoQuestionario: linha.versaoQuestionario,
      atualizadoEm: linha.atualizadoEm,
    }));
}

export function salvarRespostasAtuacaoProfissaoCypher(
  usuarioId,
  profissaoId,
  respostas,
  visibilidades = {}
) {
  exigirUsuarioReal(bancoAtivo(), usuarioId);
  if (!obterProfissaoCatalogo(profissaoId)) {
    throw new Error("PROFISSAO_NAO_ENCONTRADA");
  }
  const validacao = validarRespostasAtuacao(profissaoId, respostas, true);
  if (!validacao.valido) throw new Error("RESPOSTAS_ATUACAO_INVALIDAS");
  const visibilidadesSeguras = Object.fromEntries(
    Object.entries(visibilidades).filter(([, valor]) =>
      ["publico", "colaboradores", "privado"].includes(valor)
    )
  );
  bancoAtivo()
    .prepare(
      `INSERT INTO respostas_atuacao_profissao (
         usuario_id, profissao_id, respostas_json, visibilidades_json,
         versao_questionario, atualizado_em
       ) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(usuario_id, profissao_id) DO UPDATE SET
         respostas_json = excluded.respostas_json,
         visibilidades_json = excluded.visibilidades_json,
         versao_questionario = excluded.versao_questionario,
         atualizado_em = CURRENT_TIMESTAMP`
    )
    .run(
      usuarioId,
      profissaoId,
      JSON.stringify(respostas),
      JSON.stringify(visibilidadesSeguras)
    );
}
export function criarContaCypher(conta) {
  if (conta.nomeInformado !== undefined) {
    const erro = validarDadosIdentidade({nomeInformado:conta.nomeInformado,vulgo:conta.vulgo ?? "",usarVulgo:Boolean(conta.usarVulgo),nascimento:conta.nascimento ?? "",tratamento:conta.tratamento ?? "",generoPersonalizado:conta.generoPersonalizado}) || validarIdentificador(conta.identificador);
    if (erro) throw new Error(erro);
  }
  if (!["profissional", "consumidor"].includes(conta.tipoConta)) throw new Error("TIPO_CONTA_INVALIDO");
  if (!Array.isArray(conta.categorias) || new Set(conta.categorias).size !== conta.categorias.length ||
      conta.categorias.some(categoria => !categoriasGerais.includes(categoria)) ||
      (conta.tipoConta === "profissional" && conta.categorias.length === 0) ||
      (conta.tipoConta === "consumidor" && conta.categorias.length !== 0)) throw new Error("CATEGORIA_PROFISSIONAL_INVALIDA");
  const publico = nomePublico(conta.nomeInformado ?? conta.nome, conta.vulgo ?? "", Boolean(conta.usarVulgo));
  conta = {...conta,nome:publico,identificador:normalizarIdentificador(conta.identificador),iniciais:iniciaisPublicas(publico)};
  const db = bancoAtivo();
  const salvar = db.transaction(() => {
    const sequencia = db
      .prepare(
        "SELECT proximo_numero AS numero FROM sequencias WHERE nome = 'usuarios_reais'"
      )
      .get();
    if (!sequencia) throw new Error("SEQUENCIA_USUARIOS_NAO_INICIALIZADA");
    db.prepare(
      "UPDATE sequencias SET proximo_numero = proximo_numero + 1 WHERE nome = 'usuarios_reais'"
    ).run();
    const codigoPublico = codigoPublicoReal(conta.iniciais, sequencia.numero);
    db.prepare(
      `
      INSERT INTO usuarios (
        id, email, senha_hash, tipo_conta, demonstracao, codigo_publico,
        numero_sequencial
      ) VALUES (
        @id, @email, @senhaHash, @tipoConta, 0, @codigoPublico,
        @numeroSequencial
      )
    `
    ).run({
      id: conta.id,
      email: conta.email,
      senhaHash: conta.senhaHash,
      tipoConta: conta.tipoConta,
      codigoPublico,
      numeroSequencial: sequencia.numero,
    });
    db.prepare(
      `
      INSERT INTO perfis (
        usuario_id, c_tag, identificador_alterado_em, nome, nome_informado, vulgo, usar_vulgo, nascimento, tratamento, genero_personalizado, funcao, identificador, iniciais,
        categorias_json, outra_categoria, generos_json,
        ultima_alteracao_categorias_em, perfil_publico,
        localizacao_publica, contato_publico, demonstracao
      ) VALUES (
        @id, @cTag, CURRENT_TIMESTAMP, @nome, @nomeInformado, @vulgo, @usarVulgo, @nascimento, @tratamento, @generoPersonalizado, @funcao, @identificador, @iniciais,
        @categoriasJson, '', '[]', CURRENT_TIMESTAMP, @perfilPublico, 0, 0, 0
      )
    `
    ).run({
      id: conta.id,
      cTag: conta.cTag,
      nome: conta.nome,
      nomeInformado: conta.nomeInformado ?? conta.nome,
      vulgo: conta.vulgo ?? "", usarVulgo: Number(Boolean(conta.usarVulgo)), nascimento: conta.nascimento ?? "", tratamento: conta.tratamento ?? "",
      generoPersonalizado: conta.tratamento === "outro" ? conta.generoPersonalizado?.trim() ?? "" : "",
      perfilPublico: Number(conta.tipoConta === "profissional"),
      funcao: conta.funcao,
      identificador: conta.identificador,
      iniciais: conta.iniciais,
      categoriasJson: JSON.stringify(conta.categorias),
    });
    db.prepare("INSERT INTO identificadores_usuario (identificador,usuario_id) VALUES (?,?)").run(conta.identificador,conta.id);
    if (conta.atuacoes) {
      salvarAtuacoesCategoria(db, conta.id, conta.categorias, conta.atuacoes);
    }
    salvarProfissoesUsuarioCypher(conta.id, entradasProfissionaisDasCategorias(conta.categorias));
    if (conta.vertentes) salvarVertentesProfissionaisUsuarioCypher(conta.id,conta.vertentes);
  });
  salvar();
}

export function buscarCredenciaisCypher(email) {
  return bancoAtivo()
    .prepare(
      `
      SELECT id, email, senha_hash AS senhaHash, tipo_conta AS tipoConta, email_confirmado_em AS emailConfirmado
      FROM usuarios
      WHERE email = ? COLLATE NOCASE AND demonstracao = 0
    `
    )
    .get(email);
}
export function criarSessaoCypher(usuarioId, tokenHash, expiraEm, agora) {
  const db = bancoAtivo();
  const criar = db.transaction(() => {
    db.prepare("DELETE FROM sessoes WHERE expira_em <= ?").run(agora);
    db.prepare(
      `
      INSERT INTO sessoes (token_hash, usuario_id, expira_em, criada_em)
      VALUES (?, ?, ?, ?)
    `
    ).run(tokenHash, usuarioId, expiraEm, agora);
  });
  criar();
}
export function obterUsuarioDaSessaoCypher(tokenHash, agora) {
  const db = bancoAtivo();
  const sessao = db
    .prepare("SELECT usuario_id, expira_em FROM sessoes WHERE token_hash = ?")
    .get(tokenHash);
  if (!sessao) return undefined;
  if (sessao.expira_em <= agora) {
    db.prepare("DELETE FROM sessoes WHERE token_hash = ?").run(tokenHash);
    return undefined;
  }
  const interno = db.prepare(`SELECT u.id, u.email, u.tipo_conta AS tipoConta, a.nome AS name, a.papel AS papelAdministrativo, a.ativo
    FROM usuarios u JOIN administradores a ON a.usuario_id = u.id WHERE u.id = ? AND u.tipo_conta = 'administrativo'`).get(sessao.usuario_id);
  if (interno) {
    if (!interno.ativo) { db.prepare("DELETE FROM sessoes WHERE token_hash = ?").run(tokenHash); return undefined; }
    return { ...interno, publicCode: "", demonstracao: false, role: interno.papelAdministrativo, city: "", handle: "", initials: "AD", cTag: "", reputation: 0,
      genres: [], categories: [], otherCategory: "", biography: "", contact: "", availability: "", equipment: [], profilePublic: false, locationPublic: false, contactPublic: false };
  }
  const perfil = db
    .prepare(
      `
      SELECT
        u.id,
        u.email,
        u.codigo_publico AS publicCode,
        u.tipo_conta AS tipoConta,
        u.email_confirmado_em AS emailConfirmado,
        u.demonstracao AS demonstracao,
        p.nome AS name,
        p.nome_informado AS nomeInformado, p.vulgo, p.usar_vulgo AS usarVulgo,
        p.nascimento, p.tratamento, p.genero_personalizado AS generoPersonalizado, p.identidade_revisada AS identidadeRevisada, p.identificador_alterado_em AS identificadorAlteradoEm,
        p.funcao AS role,
        p.cidade AS city,
        p.identificador AS handle,
        p.iniciais AS initials,
        p.c_tag AS cTag,
        p.reputacao AS reputation,
        p.generos_json AS genresJson,
        p.categorias_json AS categoriesJson,
        p.outra_categoria AS otherCategory,
        p.biografia AS biography,
        p.contato AS contact,
        p.disponibilidade AS availability,
        p.equipamentos_json AS equipmentJson,
        p.perfil_publico AS profilePublic,
        p.localizacao_publica AS locationPublic,
        p.contato_publico AS contactPublic,
        p.criado_em AS createdAt
      FROM usuarios u
      JOIN perfis p ON p.usuario_id = u.id
      WHERE u.id = ?
    `
    )
    .get(sessao.usuario_id);
  if (!perfil || !perfil.emailConfirmado) {
    db.prepare("DELETE FROM sessoes WHERE token_hash = ?").run(tokenHash);
    return undefined;
  }
  const categories = JSON.parse(perfil.categoriesJson) as string[];
  return {
    ...perfil,
    role: perfil.tipoConta === "consumidor" ? "Público" : categories.map(categoria => rotuloProfissional(categoria, perfil.tratamento)).join(" · ") || perfil.role,
    identidadeRevisada: Boolean(perfil.identidadeRevisada),
    usarVulgo: Boolean(perfil.usarVulgo),
    demonstracao: Boolean(perfil.demonstracao),
    genres: JSON.parse(perfil.genresJson),
    categories,
    equipment: JSON.parse(perfil.equipmentJson),
    profilePublic: Boolean(perfil.profilePublic),
    locationPublic: Boolean(perfil.locationPublic),
    contactPublic: Boolean(perfil.contactPublic),
  };
}
export function atualizarPerfilCypher(dados) {
  exigirProfissional(dados.id);
  const db = bancoAtivo();
  const salvar = db.transaction(() => {
    const atual = db
      .prepare(
        `SELECT categorias_json AS categoriasJson, nome, vulgo, usar_vulgo AS usarVulgo,
                ultima_alteracao_categorias_em AS alteradaEm
         FROM perfis WHERE usuario_id = ? AND demonstracao = 0`
      )
      .get(dados.id);
    if (!atual) return false;
    const antes = JSON.parse(atual.categoriasJson);
    const categoriasPermitidas = new Set(listarCategoriasProfissionaisCypher());
    if (
      dados.categories.length === 0 ||
      new Set(dados.categories).size !== dados.categories.length ||
      dados.categories.some(categoria => !categoriasPermitidas.has(categoria))
    ) {
      throw new Error("CATEGORIA_PROFISSIONAL_INVALIDA");
    }
    const ordenarCategorias = lista => [...new Set(lista)].sort();
    const antesJson = JSON.stringify(ordenarCategorias(antes));
    const depoisJson = JSON.stringify(ordenarCategorias(dados.categories));
    const categoriasMudaram = antesJson !== depoisJson;
    let excecao;
    let proximaAlteracao = null;
    if (categoriasMudaram) {
      const possuiAlteracaoAnterior = Boolean(
        db
          .prepare(
            "SELECT EXISTS (SELECT 1 FROM auditoria_categorias WHERE usuario_id = ?) AS alterou"
          )
          .get(dados.id).alterou
      );
      if (possuiAlteracaoAnterior && atual.alteradaEm) {
        const prazo = db
          .prepare(
            "SELECT datetime(?, '+60 days') AS proxima, datetime(?, '+60 days') > datetime('now') AS bloqueada"
          )
          .get(atual.alteradaEm, atual.alteradaEm);
        proximaAlteracao = prazo.proxima;
        if (prazo.bloqueada) {
          excecao = db
            .prepare(
              `SELECT id, administrador_id AS administradorId, motivo
               FROM excecoes_categorias
               WHERE usuario_id = ? AND usada_em IS NULL
               ORDER BY criada_em, id LIMIT 1`
            )
            .get(dados.id);
          if (!excecao) {
            throw new Error(`CATEGORIAS_BLOQUEADAS:${proximaAlteracao ?? ""}`);
          }
          const consumida = db
            .prepare(
              "UPDATE excecoes_categorias SET usada_em = CURRENT_TIMESTAMP WHERE id = ? AND usada_em IS NULL"
            )
            .run(excecao.id);
          if (consumida.changes !== 1) {
            throw new Error(`CATEGORIAS_BLOQUEADAS:${proximaAlteracao ?? ""}`);
          }
        }
      }
      db.prepare(
        `INSERT INTO auditoria_categorias (
           id, usuario_id, administrador_id, excecao_id,
           categorias_antes_json, categorias_depois_json, motivo
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        randomUUID(),
        dados.id,
        excecao?.administradorId ?? null,
        excecao?.id ?? null,
        antesJson,
        depoisJson,
        excecao?.motivo ?? ""
      );
    }
    const atualizado = db
      .prepare(
        `
        UPDATE perfis SET
          nome = @name,
          nome_informado = @nomeInformado,
          funcao = @role,
          cidade = @city,
          biografia = @biography,
          contato = @contact,
          disponibilidade = @availability,
          generos_json = @genresJson,
          categorias_json = @categoriesJson,
          ultima_alteracao_categorias_em = CASE
            WHEN @categoriasMudaram = 1 THEN CURRENT_TIMESTAMP
            ELSE ultima_alteracao_categorias_em
          END,
          outra_categoria = @otherCategory,
          equipamentos_json = @equipmentJson,
          iniciais = @initials,
          atualizado_em = CURRENT_TIMESTAMP
        WHERE usuario_id = @id AND demonstracao = 0
      `
      )
      .run({
        id: dados.id,
        name: nomePublico(dados.name,atual.vulgo,Boolean(atual.usarVulgo)),
        nomeInformado: dados.name,
        role: dados.role,
        city: dados.city,
        biography: dados.biography,
        contact: dados.contact,
        availability: dados.availability,
        genresJson: JSON.stringify(dados.genres),
        categoriesJson: depoisJson,
        categoriasMudaram: Number(categoriasMudaram),
        otherCategory: dados.otherCategory,
        equipmentJson: JSON.stringify(dados.equipment),
        initials: iniciaisPublicas(nomePublico(dados.name,atual.vulgo,Boolean(atual.usarVulgo))),
      });
    if (atualizado.changes !== 1) return false;
    db.prepare(
      `
      UPDATE usuarios SET atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ? AND demonstracao = 0
    `
    ).run(dados.id);
    const propostaGenero = dados.propostaGenero?.trim();
    if (dados.atuacoes) {
      salvarAtuacoesCategoria(db, dados.id, dados.categories, dados.atuacoes);
    }
    if (propostaGenero) {
      db.prepare(
        `INSERT INTO propostas_generos (id, usuario_id, genero)
         VALUES (?, ?, ?) ON CONFLICT DO NOTHING`
      ).run(randomUUID(), dados.id, propostaGenero);
    }
    salvarProfissoesUsuarioCypher(dados.id, entradasProfissionaisDasCategorias(dados.categories));
    if (dados.vertentes !== undefined) salvarVertentesProfissionaisUsuarioCypher(dados.id,dados.vertentes);
    return true;
  });
  return salvar();
}
export function atualizarPrivacidadeCypher(id, preferencias) {
  const conta = bancoAtivo().prepare("SELECT tipo_conta FROM usuarios WHERE id=?").get(id);
  if (conta?.tipo_conta === "consumidor") preferencias = {profilePublic:false,locationPublic:false,contactPublic:false};
  const resultado = bancoAtivo()
    .prepare(
      `
      UPDATE perfis SET
        perfil_publico = ?,
        localizacao_publica = ?,
        contato_publico = ?,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE usuario_id = ? AND demonstracao = 0
    `
    )
    .run(
      Number(preferencias.profilePublic),
      Number(preferencias.locationPublic),
      Number(preferencias.contactPublic),
      id
    );
  return resultado.changes === 1;
}
export function estadoAlteracaoCategoriasCypher(usuarioId) {
  const linha = bancoAtivo()
    .prepare(
      `
      SELECT
        CASE WHEN EXISTS (
               SELECT 1 FROM auditoria_categorias a
               WHERE a.usuario_id = p.usuario_id
             )
             THEN datetime(p.ultima_alteracao_categorias_em, '+60 days')
             ELSE NULL END AS proximaAlteracao,
        CASE WHEN EXISTS (
               SELECT 1 FROM auditoria_categorias a
               WHERE a.usuario_id = p.usuario_id
             )
              AND p.ultima_alteracao_categorias_em IS NOT NULL
              AND datetime(p.ultima_alteracao_categorias_em, '+60 days') > datetime('now')
             THEN 1 ELSE 0 END AS dentroDoPrazo,
        EXISTS (SELECT 1 FROM excecoes_categorias e
                WHERE e.usuario_id = p.usuario_id AND e.usada_em IS NULL) AS excecaoDisponivel
      FROM perfis p WHERE p.usuario_id = ? AND p.demonstracao = 0
      `
    )
    .get(usuarioId);
  const excecaoDisponivel = Boolean(linha?.excecaoDisponivel);
  return {
    bloqueada: Boolean(linha?.dentroDoPrazo) && !excecaoDisponivel,
    proximaAlteracao: linha?.proximaAlteracao ?? null,
    excecaoDisponivel,
  };
}
export function listarPropostasGenerosPendentesCypher() {
  return bancoAtivo()
    .prepare(
      `
      SELECT g.id, g.usuario_id AS usuarioId, p.nome, p.identificador AS handle,
             g.genero, g.criada_em AS criadaEm
      FROM propostas_generos g
      JOIN perfis p ON p.usuario_id = g.usuario_id
      JOIN usuarios u ON u.id = g.usuario_id
      WHERE g.status = 'pendente' AND u.demonstracao = 0
      ORDER BY datetime(g.criada_em), g.id
      `
    )
    .all();
}
export function listarPerfisParaExcecaoCategoriaCypher(consulta = "", limite) {
  const db = bancoAtivo();
  const termo = consulta.trim();
  const filtro = termo
    ? "AND (lower(p.nome) LIKE lower(?) OR lower(u.email) LIKE lower(?) OR lower(p.categorias_json) LIKE lower(?))"
    : "";
  const parametros = termo ? [`%${termo}%`, `%${termo}%`, `%${termo}%`] : [];
  const limiteSql =
    limite === undefined
      ? ""
      : (parametros.push(Math.max(0, limite)), "LIMIT ?");
  return db
    .prepare(
      `
      SELECT u.id AS usuarioId, p.nome, u.email,
             p.categorias_json AS categoriasJson,
             p.ultima_alteracao_categorias_em AS alteradaEm,
             datetime(p.ultima_alteracao_categorias_em, '+60 days') AS proximaAlteracao,
             EXISTS (SELECT 1 FROM excecoes_categorias e
                     WHERE e.usuario_id = u.id AND e.usada_em IS NULL) AS excecaoPendente,
             EXISTS (SELECT 1 FROM solicitacoes_excecao_categorias s
                     WHERE s.usuario_id = u.id AND s.status = 'pendente') AS solicitacaoPendente
      FROM usuarios u JOIN perfis p ON p.usuario_id = u.id
      WHERE u.demonstracao = 0 ${filtro}
      ORDER BY p.nome COLLATE NOCASE
      ${limiteSql}
      `
    )
    .all(...parametros)
    .map(linha => {
      const perfil = linha;
      return {
        ...perfil,
        excecaoPendente: Boolean(perfil.excecaoPendente),
        solicitacaoPendente: Boolean(perfil.solicitacaoPendente),
      };
    });
}
export function obterEstadoSolicitacaoExcecaoCategoriaCypher(usuarioId) {
  const db = bancoAtivo();
  const linha = db
    .prepare(
      `SELECT id, status, motivo, motivo_codigo AS motivoCodigo,
              motivo_revisao AS motivoRevisao,
              categorias_antes_json AS categoriasAntesJson,
              categorias_solicitadas_json AS categoriasSolicitadasJson,
              respostas_solicitadas_json AS respostasSolicitadasJson,
              visibilidades_solicitadas_json AS visibilidadesSolicitadasJson,
              criada_em AS criadaEm
       FROM solicitacoes_excecao_categorias
       WHERE usuario_id = ? ORDER BY rowid DESC LIMIT 1`
    )
    .get(usuarioId);
  if (!linha) return null;
  return {
    id: linha.id,
    status: linha.status,
    motivo: linha.motivo,
    motivoCodigo: linha.motivoCodigo,
    motivoRevisao: linha.motivoRevisao,
    categoriasAntes: jsonLista(linha.categoriasAntesJson),
    categoriasSolicitadas: jsonLista(linha.categoriasSolicitadasJson),
    respostasSolicitadas: jsonObjeto(linha.respostasSolicitadasJson),
    visibilidadesSolicitadas: jsonObjeto(linha.visibilidadesSolicitadasJson),
    historico: historicoSolicitacao(db, linha.id),
    criadaEm: linha.criadaEm,
  };
}
export function listarSolicitacoesExcecaoCategoriaPendentesCypher(
  visitanteId,
  status = "pendente"
) {
  const db = bancoAtivo();
  const filtroStatus =
    status === "pendente"
      ? "s.status = 'pendente'"
      : "s.status IN ('aprovado', 'rejeitado')";
  const linhas = db
    .prepare(
      `SELECT s.id, s.usuario_id AS usuarioId, p.nome, u.email,
              p.identificador AS handle, s.status, s.motivo,
              s.motivo_revisao AS motivoRevisao,
              s.revisada_em AS revisadaEm,
              s.categorias_antes_json AS categoriasAntesJson,
              s.categorias_solicitadas_json AS categoriasSolicitadasJson,
              s.respostas_solicitadas_json AS respostasSolicitadasJson,
              s.visibilidades_solicitadas_json AS visibilidadesSolicitadasJson,
              s.motivo_codigo AS motivoCodigo, s.criada_em AS criadaEm
       FROM solicitacoes_excecao_categorias s
       JOIN usuarios u ON u.id = s.usuario_id
       JOIN perfis p ON p.usuario_id = u.id
       WHERE ${filtroStatus} AND u.demonstracao = 0
       ORDER BY datetime(COALESCE(s.revisada_em, s.criada_em)) DESC, s.id DESC`
    )
    .all();
  return linhas.map(linha => {
    const respostas = jsonObjeto(linha.respostasSolicitadasJson);
    const visibilidades = jsonObjeto(linha.visibilidadesSolicitadasJson);
    const colaborador = Boolean(
      visitanteId && ehColaboradorDaConta(db, linha.usuarioId, visitanteId)
    );
    const respostasVisiveis = Object.fromEntries(
      Object.entries(respostas).map(([categoria, dados]) => {
        const visibilidade = visibilidades[categoria] ?? {};
        const podeVerCategoria =
          (visibilidade[chaveVisibilidadeCategoria] ?? "publico") ===
            "publico" ||
          (visibilidade[chaveVisibilidadeCategoria] === "colaboradores" &&
            colaborador);
        if (!podeVerCategoria) return [categoria, {}];
        return [
          categoria,
          Object.fromEntries(
            Object.entries(dados).filter(([campo]) => {
              const nivel = visibilidade[campo] ?? "privado";
              return (
                nivel === "publico" ||
                (nivel === "colaboradores" && colaborador)
              );
            })
          ),
        ];
      })
    );
    return {
      ...linha,
      categoriasAntes: jsonLista(linha.categoriasAntesJson),
      categoriasSolicitadas: jsonLista(linha.categoriasSolicitadasJson),
      respostasSolicitadas: respostasVisiveis,
      visibilidadesSolicitadas: visibilidades,
      historico: historicoSolicitacao(db, linha.id),
    };
  });
}
export function listarSolicitacoesExcecaoCategoriaDecididasCypher(visitanteId) {
  return listarSolicitacoesExcecaoCategoriaPendentesCypher(
    visitanteId,
    "decididas"
  );
}
export function solicitarExcecaoCategoriaCypher(usuarioId, motivo, detalhes) {
  const db = bancoAtivo();
  const executar = db.transaction(() => {
    const perfil = db
      .prepare(
        `SELECT ultima_alteracao_categorias_em AS alteradaEm,
                categorias_json AS categoriasJson
         FROM perfis WHERE usuario_id = ? AND demonstracao = 0`
      )
      .get(usuarioId);
    if (!perfil) return "nao_encontrada";
    const pendente = db
      .prepare(
        `SELECT 1 FROM solicitacoes_excecao_categorias
         WHERE usuario_id = ? AND status = 'pendente' LIMIT 1`
      )
      .get(usuarioId);
    if (pendente) return "ja_pendente";
    const excecao = db
      .prepare(
        `SELECT 1 FROM excecoes_categorias
         WHERE usuario_id = ? AND usada_em IS NULL LIMIT 1`
      )
      .get(usuarioId);
    if (excecao) return "excecao_disponivel";
    const possuiAlteracaoAnterior = Boolean(
      db
        .prepare(
          "SELECT EXISTS (SELECT 1 FROM auditoria_categorias WHERE usuario_id = ?) AS alterou"
        )
        .get(usuarioId).alterou
    );
    if (!possuiAlteracaoAnterior || !perfil.alteradaEm) return "nao_bloqueada";
    const prazo = db
      .prepare("SELECT datetime(?, '+60 days') > datetime('now') AS bloqueada")
      .get(perfil.alteradaEm);
    if (!prazo.bloqueada) return "nao_bloqueada";
    const categoriasAntes = jsonLista(perfil.categoriasJson);
    const categoriasSolicitadas = detalhes?.categoriasSolicitadas ?? [];
    if (
      detalhes &&
      categoriasAntes.slice().sort().join("\u0000") ===
        categoriasSolicitadas.slice().sort().join("\u0000")
    ) {
      return "categorias_iguais";
    }
    if (detalhes) {
      const permitidas = new Set(listarCategoriasProfissionaisCypher());
      const respostas = detalhes.respostasSolicitadas;
      const visibilidades = detalhes.visibilidadesSolicitadas;
      const niveisVisibilidade = new Set([
        "publico",
        "colaboradores",
        "privado",
      ]);
      if (
        categoriasSolicitadas.length === 0 ||
        new Set(categoriasSolicitadas).size !== categoriasSolicitadas.length ||
        categoriasSolicitadas.some(categoria => !permitidas.has(categoria)) ||
        Object.keys(respostas).some(
          categoria => !categoriasSolicitadas.includes(categoria)
        ) ||
        Object.keys(visibilidades).some(
          categoria => !categoriasSolicitadas.includes(categoria)
        )
      ) {
        return "snapshot_invalido";
      }
      for (const categoria of categoriasSolicitadas) {
        const resposta = respostas[categoria] ?? {};
        if (
          !validarRespostasAtuacao(
            categoria,
            resposta,
            !categoriasAntes.includes(categoria)
          ).valido
        ) {
          return "snapshot_invalido";
        }
        const perguntas = new Set(
          catalogoPerguntasPorCategoria(categoria).map(
            pergunta => pergunta.campo
          )
        );
        const niveis = visibilidades[categoria] ?? {};
        if (
          Object.entries(niveis).some(
            ([campo, nivel]) =>
              (campo !== chaveVisibilidadeCategoria && !perguntas.has(campo)) ||
              !niveisVisibilidade.has(nivel)
          )
        ) {
          return "snapshot_invalido";
        }
      }
    }
    const solicitacaoId = randomUUID();
    const insercao = db
      .prepare(
        `INSERT INTO solicitacoes_excecao_categorias (
           id, usuario_id, motivo, motivo_codigo, categorias_antes_json,
           categorias_solicitadas_json, respostas_solicitadas_json,
           visibilidades_solicitadas_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`
      )
      .run(
        solicitacaoId,
        usuarioId,
        motivo,
        detalhes?.motivoCodigo ?? "",
        JSON.stringify(categoriasAntes),
        JSON.stringify(categoriasSolicitadas),
        JSON.stringify(detalhes?.respostasSolicitadas ?? {}),
        JSON.stringify(detalhes?.visibilidadesSolicitadas ?? {})
      );
    if (insercao.changes !== 1) return "ja_pendente";
    db.prepare(
      `INSERT INTO historico_solicitacoes_categorias (
         id, solicitacao_id, autor_id, autor_tipo, mensagem
       ) VALUES (?, ?, ?, 'usuario', ?)`
    ).run(randomUUID(), solicitacaoId, usuarioId, motivo);
    return "criada";
  });
  return executar();
}
export function revisarSolicitacaoExcecaoCategoriaCypher(
  solicitacaoId,
  administradorId,
  administradorEmail,
  aprovada,
  motivoRevisao
) {
  exigirPapelAdministrativo(administradorId, "excecoes");
  const db = bancoAtivo();
  const executar = db.transaction(() => {
    const solicitacao = db
      .prepare(
        `SELECT usuario_id AS usuarioId,
                categorias_antes_json AS categoriasAntesJson,
                categorias_solicitadas_json AS categoriasSolicitadasJson,
                respostas_solicitadas_json AS respostasSolicitadasJson,
                visibilidades_solicitadas_json AS visibilidadesSolicitadasJson
         FROM solicitacoes_excecao_categorias
         WHERE id = ? AND status = 'pendente'`
      )
      .get(solicitacaoId);
    if (!solicitacao) {
      const existe = db
        .prepare("SELECT 1 FROM solicitacoes_excecao_categorias WHERE id = ?")
        .get(solicitacaoId);
      return existe ? "nao_pendente" : "nao_encontrada";
    }
    const ultimaMensagem = db
      .prepare(
        `SELECT autor_tipo AS autorTipo FROM historico_solicitacoes_categorias
         WHERE solicitacao_id = ? ORDER BY datetime(criada_em) DESC, rowid DESC LIMIT 1`
      )
      .get(solicitacaoId);
    if (ultimaMensagem?.autorTipo === "administrador")
      return "aguarda_resposta";
    let excecaoId = null;
    if (aprovada) {
      const perfil = db
        .prepare(
          `SELECT p.ultima_alteracao_categorias_em AS alteradaEm,
                  p.categorias_json AS categoriasJson
           FROM perfis p JOIN usuarios u ON u.id = p.usuario_id
           WHERE u.id = ? AND u.demonstracao = 0`
        )
        .get(solicitacao.usuarioId);
      if (!perfil) return "nao_encontrada";
      const possuiAlteracaoAnterior = Boolean(
        db
          .prepare(
            "SELECT EXISTS (SELECT 1 FROM auditoria_categorias WHERE usuario_id = ?) AS alterou"
          )
          .get(solicitacao.usuarioId).alterou
      );
      if (!possuiAlteracaoAnterior || !perfil.alteradaEm)
        return "nao_bloqueada";
      const prazo = db
        .prepare(
          "SELECT datetime(?, '+60 days') > datetime('now') AS bloqueada"
        )
        .get(perfil.alteradaEm);
      if (!prazo.bloqueada) return "nao_bloqueada";
      const categoriasAntes = jsonLista(perfil.categoriasJson);
      const categoriasSnapshot = jsonLista(solicitacao.categoriasAntesJson);
      if (
        categoriasAntes.slice().sort().join("\u0000") !==
        categoriasSnapshot.slice().sort().join("\u0000")
      ) {
        return "conflito";
      }
      const categoriasSolicitadas = jsonLista(
        solicitacao.categoriasSolicitadasJson
      );
      const alteracaoDeCategorias = categoriasSolicitadas.length > 0;
      excecaoId = randomUUID();
      db.prepare(
        `INSERT INTO excecoes_categorias (
           id, usuario_id, administrador_id, administrador_email, motivo, usada_em
         ) VALUES (?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)`
      ).run(
        excecaoId,
        solicitacao.usuarioId,
        administradorId,
        administradorEmail,
        motivoRevisao,
        Number(alteracaoDeCategorias)
      );
      if (alteracaoDeCategorias) {
        db.prepare(
          `UPDATE perfis SET categorias_json = ?, funcao = ?,
             ultima_alteracao_categorias_em = CURRENT_TIMESTAMP,
             atualizado_em = CURRENT_TIMESTAMP
           WHERE usuario_id = ? AND demonstracao = 0`
        ).run(
          JSON.stringify(categoriasSolicitadas),
          categoriasSolicitadas.join(", "),
          solicitacao.usuarioId
        );
        const respostas = jsonObjeto(solicitacao.respostasSolicitadasJson);
        const visibilidades = jsonObjeto(
          solicitacao.visibilidadesSolicitadasJson
        );
        salvarAtuacoesCategoria(
          db,
          solicitacao.usuarioId,
          categoriasSolicitadas,
          Object.entries(respostas).map(([categoria, resposta]) => ({
            categoria,
            respostas: resposta,
            visibilidades: visibilidades[categoria] ?? {},
          }))
        );
        db.prepare(
          `INSERT INTO auditoria_categorias (
             id, usuario_id, administrador_id, excecao_id,
             categorias_antes_json, categorias_depois_json, motivo
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          randomUUID(),
          solicitacao.usuarioId,
          administradorId,
          excecaoId,
          JSON.stringify(categoriasAntes),
          JSON.stringify(categoriasSolicitadas),
          motivoRevisao
        );
      }
    }
    const status = aprovada ? "aprovado" : "rejeitado";
    const atualizado = db
      .prepare(
        `UPDATE solicitacoes_excecao_categorias
         SET status = ?, revisada_em = CURRENT_TIMESTAMP,
             revisor_id = ?, revisor_email = ?, motivo_revisao = ?, excecao_id = ?
         WHERE id = ? AND status = 'pendente'`
      )
      .run(
        status,
        administradorId,
        administradorEmail,
        motivoRevisao,
        excecaoId,
        solicitacaoId
      );
    if (atualizado.changes !== 1) return "nao_pendente";
    db.prepare(
      `INSERT INTO historico_solicitacoes_categorias (
         id, solicitacao_id, autor_id, autor_tipo, mensagem
       ) VALUES (?, ?, ?, 'administrador', ?)`
    ).run(randomUUID(), solicitacaoId, administradorId, motivoRevisao);
    return aprovada ? "aprovada" : "rejeitada";
  });
  return executar();
}
export function solicitarInformacaoSolicitacaoCategoriaCypher(
  solicitacaoId,
  administradorId,
  mensagem
) {
  exigirPapelAdministrativo(administradorId, "excecoes");
  const db = bancoAtivo();
  const executar = db.transaction(() => {
    const pendente = db
      .prepare(
        `SELECT 1 FROM solicitacoes_excecao_categorias
         WHERE id = ? AND status = 'pendente'`
      )
      .get(solicitacaoId);
    if (!pendente) return false;
    const ultima = db
      .prepare(
        `SELECT autor_tipo AS autorTipo FROM historico_solicitacoes_categorias
         WHERE solicitacao_id = ? ORDER BY datetime(criada_em) DESC, rowid DESC LIMIT 1`
      )
      .get(solicitacaoId);
    if (ultima?.autorTipo === "administrador") return false;
    db.prepare(
      `INSERT INTO historico_solicitacoes_categorias (
         id, solicitacao_id, autor_id, autor_tipo, mensagem
       ) VALUES (?, ?, ?, 'administrador', ?)`
    ).run(randomUUID(), solicitacaoId, administradorId, mensagem);
    return true;
  });
  return executar();
}
export function responderSolicitacaoCategoriaCypher(
  solicitacaoId,
  usuarioId,
  mensagem
) {
  const db = bancoAtivo();
  const executar = db.transaction(() => {
    const pendente = db
      .prepare(
        `SELECT 1 FROM solicitacoes_excecao_categorias
         WHERE id = ? AND usuario_id = ? AND status = 'pendente'`
      )
      .get(solicitacaoId, usuarioId);
    if (!pendente) return false;
    const ultima = db
      .prepare(
        `SELECT autor_tipo AS autorTipo FROM historico_solicitacoes_categorias
         WHERE solicitacao_id = ? ORDER BY datetime(criada_em) DESC, rowid DESC LIMIT 1`
      )
      .get(solicitacaoId);
    if (ultima?.autorTipo !== "administrador") return false;
    db.prepare(
      `INSERT INTO historico_solicitacoes_categorias (
         id, solicitacao_id, autor_id, autor_tipo, mensagem
       ) VALUES (?, ?, ?, 'usuario', ?)`
    ).run(randomUUID(), solicitacaoId, usuarioId, mensagem);
    return true;
  });
  return executar();
}
export function contarPerfisParaExcecaoCategoriaCypher(consulta = "") {
  const termo = consulta.trim();
  const linha = termo
    ? bancoAtivo()
        .prepare(
          `SELECT COUNT(*) AS total FROM usuarios u
           JOIN perfis p ON p.usuario_id = u.id
           WHERE u.demonstracao = 0
             AND (lower(p.nome) LIKE lower(?) OR lower(u.email) LIKE lower(?) OR lower(p.categorias_json) LIKE lower(?))`
        )
        .get(`%${termo}%`, `%${termo}%`, `%${termo}%`)
    : bancoAtivo()
        .prepare(
          `SELECT COUNT(*) AS total FROM usuarios u
           JOIN perfis p ON p.usuario_id = u.id
           WHERE u.demonstracao = 0`
        )
        .get();
  return linha.total;
}
export function concederExcecaoCategoriaCypher(
  usuarioId,
  administradorId,
  administradorEmail,
  motivo
) {
  exigirPapelAdministrativo(administradorId, "excecoes");
  const db = bancoAtivo();
  const executar = db.transaction(() => {
    const perfil = db
      .prepare(
        `SELECT p.ultima_alteracao_categorias_em AS alteradaEm
         FROM perfis p JOIN usuarios u ON u.id = p.usuario_id
         WHERE u.id = ? AND u.demonstracao = 0`
      )
      .get(usuarioId);
    if (!perfil) return "nao_encontrada";
    const solicitacaoPendente = db
      .prepare(
        `SELECT 1 FROM solicitacoes_excecao_categorias
         WHERE usuario_id = ? AND status = 'pendente' LIMIT 1`
      )
      .get(usuarioId);
    if (solicitacaoPendente) return "solicitacao_pendente";
    if (!perfil.alteradaEm) return "nao_bloqueada";
    const prazo = db
      .prepare("SELECT datetime(?, '+60 days') > datetime('now') AS bloqueada")
      .get(perfil.alteradaEm);
    if (!prazo.bloqueada) return "nao_bloqueada";
    const insercao = db
      .prepare(
        `INSERT INTO excecoes_categorias (
           id, usuario_id, administrador_id, administrador_email, motivo
         ) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`
      )
      .run(
        randomUUID(),
        usuarioId,
        administradorId,
        administradorEmail,
        motivo
      );
    return insercao.changes === 1 ? "concedida" : "ja_pendente";
  });
  return executar();
}
export function revisarPropostaGeneroCypher(
  propostaId,
  revisorId,
  aprovada,
  motivo
) {
  exigirPapelAdministrativo(revisorId, "taxonomia");
  const db = bancoAtivo();
  const revisar = db.transaction(() => {
    const proposta = db
      .prepare(
        `SELECT usuario_id AS usuarioId, genero FROM propostas_generos
         WHERE id = ? AND status = 'pendente'`
      )
      .get(propostaId);
    if (!proposta) return false;
    if (aprovada) {
      const linha = db
        .prepare(
          "SELECT generos_json AS generosJson FROM perfis WHERE usuario_id = ?"
        )
        .get(proposta.usuarioId);
      if (!linha) return false;
      const generos = JSON.parse(linha.generosJson);
      const normalizar = valor => valor.trim().toLocaleLowerCase("pt-BR");
      if (
        !generos.some(
          genero => normalizar(genero) === normalizar(proposta.genero)
        )
      ) {
        generos.push(proposta.genero);
        db.prepare(
          "UPDATE perfis SET generos_json = ?, atualizado_em = CURRENT_TIMESTAMP WHERE usuario_id = ?"
        ).run(JSON.stringify(generos), proposta.usuarioId);
      }
    }
    const resultado = db
      .prepare(
        `UPDATE propostas_generos
         SET status = ?, revisada_em = CURRENT_TIMESTAMP,
             revisor_id = ?, motivo_revisao = ?
         WHERE id = ? AND status = 'pendente'`
      )
      .run(aprovada ? "aprovado" : "rejeitado", revisorId, motivo, propostaId);
    return resultado.changes === 1;
  });
  return revisar();
}
export function revisarPropostaCategoriaCypher(
  propostaId,
  revisorId,
  revisorEmail,
  aprovada,
  motivo
) {
  exigirPapelAdministrativo(revisorId, "taxonomia");
  const db = bancoAtivo();
  const revisar = db.transaction(() => {
    const proposta = db
      .prepare(
        "SELECT categoria FROM propostas_categorias WHERE id = ? AND status = 'pendente'"
      )
      .get(propostaId);
    if (!proposta) return false;
    if (aprovada && !categoriasGerais.includes(proposta.categoria)) return false;
    if (aprovada) {
      const chave = normalizarCategoria(proposta.categoria);
      const jaAtiva =
        categoriasGerais.some(
          categoria => normalizarCategoria(categoria) === chave
        ) ||
        db
          .prepare("SELECT categoria FROM categorias_profissionais_aprovadas")
          .all()
          .some(item => normalizarCategoria(item.categoria) === chave);
      if (jaAtiva) return false;
    }
    const resultado = db
      .prepare(
        `UPDATE propostas_categorias
       SET status = ?, revisada_em = CURRENT_TIMESTAMP,
           revisor_id = ?, revisor_email = ?, motivo_revisao = ?
       WHERE id = ? AND status = 'pendente'`
      )
      .run(
        aprovada ? "aprovado" : "rejeitado",
        revisorId,
        revisorEmail,
        motivo,
        propostaId
      );
    if (resultado.changes !== 1) return false;
    if (aprovada) {
      db.prepare(
        `INSERT INTO categorias_profissionais_aprovadas (
           categoria, revisor_id, revisor_email, motivo_aprovacao
         ) VALUES (?, ?, ?, ?)`
      ).run(proposta.categoria, revisorId, revisorEmail, motivo);
    }
    return true;
  });
  return revisar();
}
const chaveVisibilidadeCategoria = "__categoria__";
function jsonObjeto(texto) {
  try {
    const valor = JSON.parse(texto);
    return valor && typeof valor === "object" && !Array.isArray(valor)
      ? valor
      : {};
  } catch {
    return {};
  }
}
function jsonLista(texto) {
  try {
    const valor = JSON.parse(texto);
    return Array.isArray(valor)
      ? valor.filter(item => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
function historicoSolicitacao(db, solicitacaoId) {
  return db
    .prepare(
      `SELECT autor_tipo AS autorTipo, mensagem, criada_em AS criadaEm
       FROM historico_solicitacoes_categorias
       WHERE solicitacao_id = ? ORDER BY datetime(criada_em), rowid`
    )
    .all(solicitacaoId);
}
export function listarAtuacoesUsuarioCypher(usuarioId) {
  return bancoAtivo()
    .prepare(
      `SELECT categoria, respostas_json AS respostasJson,
              visibilidades_json AS visibilidadesJson
       FROM respostas_atuacao_categoria WHERE usuario_id = ?
       ORDER BY categoria COLLATE NOCASE`
    )
    .all(usuarioId)
    .map(linha => {
      const item = linha;
      return {
        categoria: item.categoria,
        respostas: jsonObjeto(item.respostasJson),
        visibilidades: jsonObjeto(item.visibilidadesJson),
      };
    });
}
function ehColaboradorDaConta(db, titularId, visitanteId) {
  return Boolean(
    db
      .prepare(
        `SELECT EXISTS (
             SELECT 1 FROM obras o
             JOIN creditos c ON c.obra_id = o.id
             WHERE o.proprietario_id = ? AND c.usuario_creditado_id = ?
               AND o.demonstracao = 0 AND c.demonstracao = 0
               AND o.publicada = 1 AND o.situacao = 'Lançado' AND c.verificado = 1
           ) AS colaborador`
      )
      .get(titularId, visitanteId).colaborador
  );
}
function atuacoesVisiveis(
  db,
  titularId,
  categorias,
  visitanteId,
  perfilPublico
) {
  const titular = visitanteId === titularId;
  if (!titular && !perfilPublico) return [];
  const colaborador = Boolean(
    visitanteId &&
    visitanteId !== titularId &&
    ehColaboradorDaConta(db, titularId, visitanteId)
  );
  const registros = new Map(
    listarAtuacoesUsuarioCypher(titularId).map(item => [item.categoria, item])
  );
  return categorias.flatMap(categoria => {
    const registro = registros.get(categoria);
    const visibilidades = registro?.visibilidades ?? {};
    const visibilidadeCategoria =
      visibilidades[chaveVisibilidadeCategoria] ?? "publico";
    const podeVerCategoria =
      titular ||
      visibilidadeCategoria === "publico" ||
      (visibilidadeCategoria === "colaboradores" && colaborador);
    if (!podeVerCategoria) return [];
    const respostas = Object.fromEntries(
      Object.entries(registro?.respostas ?? {}).filter(([campo]) => {
        const visibilidade = visibilidades[campo] ?? "privado";
        return (
          titular ||
          visibilidade === "publico" ||
          (visibilidade === "colaboradores" && colaborador)
        );
      })
    );
    return [{ categoria, respostas }];
  });
}
export function obterPerfilPublicoCypher(identificador, visitanteId) {
  const db = bancoAtivo();
  const resultado = db
    .prepare(
      `
      SELECT
        u.id AS userId,
        p.nome AS name, p.tratamento,
        p.funcao AS role,
        CASE WHEN p.localizacao_publica = 1 THEN p.cidade ELSE '' END AS city,
        p.identificador AS handle,
        u.codigo_publico AS publicCode,
        p.iniciais AS initials,
        p.c_tag AS cTag,
        p.biografia AS biography,
        CASE WHEN p.contato_publico = 1 THEN p.contato ELSE '' END AS contact,
        p.disponibilidade AS availability,
        p.generos_json AS genresJson,
        p.categorias_json AS categoriesJson,
        p.equipamentos_json AS equipmentJson,
        p.criado_em AS createdAt
      FROM usuarios u
      JOIN perfis p ON p.usuario_id = u.id
      WHERE u.demonstracao = 0
        AND p.perfil_publico = 1
        AND u.tipo_conta = 'profissional' AND u.email_confirmado_em IS NOT NULL
        AND p.identificador = ? COLLATE NOCASE
    `
    )
    .get(identificador);
  if (!resultado) return undefined;
  const categorias = JSON.parse(resultado.categoriesJson);
  const atuacoes = atuacoesVisiveis(
    db,
    resultado.userId,
    categorias,
    visitanteId,
    true
  );
  const categories = atuacoes.map(atuacao => atuacao.categoria);
  return {
    ...Object.fromEntries(Object.entries(resultado).filter(([campo])=>campo!=="tratamento")),
    rotulosCategorias: Object.fromEntries(categories.map(categoria=>[categoria,rotuloProfissional(categoria,resultado.tratamento)])),
    role: categories.map(categoria=>rotuloProfissional(categoria,resultado.tratamento)).join(" · ") || "Atuação profissional",
    genres: JSON.parse(resultado.genresJson),
    categories,
    atuacoes,
    equipment: JSON.parse(resultado.equipmentJson),
  };
}
function normalizarTextoBusca(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
function opcoesUnicasBusca(valores) {
  const unicas = new Map();
  for (const valor of valores) {
    const texto = valor.trim();
    const chave = normalizarTextoBusca(texto);
    if (chave && !unicas.has(chave)) unicas.set(chave, texto);
  }
  return [...unicas.values()].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );
}
export function buscarPerfisPublicosCypher(filtrosRecebidos, usuarioId) {
  const db = bancoAtivo();
  const linhas = db
    .prepare(
      `
      SELECT
        u.id AS userId,
        p.nome AS name, p.tratamento,
        p.funcao AS role,
        p.cidade AS city,
        p.localizacao_publica AS locationPublic,
        p.identificador AS handle,
        p.iniciais AS initials,
        p.disponibilidade AS availability,
        p.generos_json AS genresJson,
        p.categorias_json AS categoriesJson,
        p.outra_categoria AS otherCategory,
        p.tom AS tone
      FROM usuarios u
      JOIN perfis p ON p.usuario_id = u.id
      WHERE u.demonstracao = 0
        AND p.demonstracao = 0
        AND p.perfil_publico = 1
        AND u.tipo_conta = 'profissional' AND u.email_confirmado_em IS NOT NULL
        AND u.id <> ?
      ORDER BY p.nome COLLATE NOCASE ASC
    `
    )
    .all(usuarioId);
  const tonsPermitidos = new Set(["yellow", "green", "black", "cream"]);
  const perfis = linhas.map(linha => {
    const categories = atuacoesVisiveis(
      db,
      linha.userId,
      JSON.parse(linha.categoriesJson),
      usuarioId,
      true
    ).map(atuacao => atuacao.categoria);
    return {
      name: linha.name,
      rotulosCategorias: Object.fromEntries(categories.map(categoria => [categoria, rotuloProfissional(categoria, linha.tratamento)])),
      role: categories.map(categoria => rotuloProfissional(categoria, linha.tratamento)).join(" · ") || "Atuação profissional",
      city: linha.locationPublic ? linha.city : "",
      handle: linha.handle,
      initials: linha.initials,
      availability: linha.availability,
      genres: JSON.parse(linha.genresJson),
      categories,
      otherCategory: categories.includes("Outros") ? linha.otherCategory : "",
      tone: tonsPermitidos.has(linha.tone) ? linha.tone : "yellow",
    };
  });
  const opcoes = {
    categorias: opcoesUnicasBusca(
      perfis.flatMap(perfil => [
        ...perfil.categories,
        ...(perfil.categories.includes("Outros") && perfil.otherCategory
          ? [perfil.otherCategory]
          : []),
      ])
    ),
    generos: opcoesUnicasBusca(perfis.flatMap(perfil => perfil.genres)),
    localizacoes: opcoesUnicasBusca(
      perfis.map(perfil => perfil.city).filter(Boolean)
    ),
  };
  const selecionarOpcao = (valores, recebido) =>
    valores.find(
      valor => normalizarTextoBusca(valor) === normalizarTextoBusca(recebido)
    ) ?? "";
  const filtros = {
    q: filtrosRecebidos.q.trim().slice(0, 100),
    categoria: selecionarOpcao(opcoes.categorias, filtrosRecebidos.categoria),
    genero: selecionarOpcao(opcoes.generos, filtrosRecebidos.genero),
    localizacao: selecionarOpcao(
      opcoes.localizacoes,
      filtrosRecebidos.localizacao
    ),
  };
  const termos = normalizarTextoBusca(filtros.q).split(/\s+/).filter(Boolean);
  const pessoas = perfis.filter(perfil => {
    const categorias = [
      ...perfil.categories,
      ...(perfil.categories.includes("Outros") && perfil.otherCategory
        ? [perfil.otherCategory]
        : []),
    ];
    const camposBusca = normalizarTextoBusca(
      [
        perfil.name,
        perfil.role,
        perfil.city,
        perfil.handle,
        ...categorias,
        ...perfil.genres,
      ].join(" ")
    );
    return (
      termos.every(termo => camposBusca.includes(termo)) &&
      (!filtros.categoria ||
        categorias.some(
          categoria =>
            normalizarTextoBusca(categoria) ===
            normalizarTextoBusca(filtros.categoria)
        )) &&
      (!filtros.genero ||
        perfil.genres.some(
          genero =>
            normalizarTextoBusca(genero) ===
            normalizarTextoBusca(filtros.genero)
        )) &&
      (!filtros.localizacao ||
        normalizarTextoBusca(perfil.city) ===
          normalizarTextoBusca(filtros.localizacao))
    );
  });
  return { pessoas, filtros, opcoes };
}
export function listarObrasProprietarioCypher(proprietarioId) {
  const linhas = bancoAtivo()
    .prepare(
      `
      SELECT
        id,
        titulo AS title,
        tipo AS type,
        tipo_detalhe AS typeDetail,
        situacao AS status,
        metadados AS meta,
        funcao_principal AS role,
        funcao_detalhe AS roleDetail,
        quantidade_creditos AS credits,
        descricao AS description,
        bpm,
        isrc,
        iswc,
        publicada AS published
      FROM obras
      WHERE proprietario_id = ?
        AND demonstracao = 0
      ORDER BY criado_em DESC, ordem_demo ASC
      LIMIT 5
    `
    )
    .all(proprietarioId);
  return linhas.map(obra => ({ ...obra, published: Boolean(obra.published) }));
}
export function listarObrasPublicasPerfilCypher(identificador) {
  return bancoAtivo()
    .prepare(
      `
      SELECT
        o.titulo AS title,
        o.tipo AS type,
        o.tipo_detalhe AS typeDetail,
        o.genero AS genre,
        o.genero_detalhe AS genreDetail,
        o.funcao_principal AS role,
        o.funcao_detalhe AS roleDetail,
        o.data_lancamento AS releaseDate,
        o.link_escuta AS listenLink,
        o.letra AS lyrics
      FROM obras o
      JOIN usuarios u ON u.id = o.proprietario_id
      JOIN perfis p ON p.usuario_id = u.id
      WHERE u.demonstracao = 0
        AND p.demonstracao = 0
        AND p.perfil_publico = 1
        AND u.tipo_conta = 'profissional' AND u.email_confirmado_em IS NOT NULL
        AND p.identificador = ? COLLATE NOCASE
        AND o.demonstracao = 0
        AND o.publicada = 1
        AND o.situacao = 'Lançado'
      ORDER BY
        CASE WHEN o.data_lancamento = '' THEN 1 ELSE 0 END,
        o.data_lancamento DESC,
        o.criado_em DESC,
        o.id DESC
      `
    )
    .all(identificador);
}
function creditosDasObras(ids) {
  if (ids.length === 0) return new Map();
  const db = bancoAtivo();
  const marcadores = ids.map(() => "?").join(", ");
  const linhas = db
    .prepare(
      `
      SELECT
        c.id,
        c.obra_id AS obraId,
        c.usuario_creditado_id AS userId,
        p.identificador AS handle,
        COALESCE(p.nome,c.nome_creditado) AS name,
        c.funcao AS role,
        c.participacao AS participation,
        c.verificado AS verified
      FROM creditos c
      LEFT JOIN perfis p ON p.usuario_id = c.usuario_creditado_id
      WHERE c.demonstracao = 0
        AND c.obra_id IN (${marcadores})
      ORDER BY c.criado_em ASC, c.id ASC
    `
    )
    .all(...ids);
  const resultado = new Map();
  for (const linha of linhas) {
    const creditos = resultado.get(linha.obraId) ?? [];
    const { obraId, ...credito } = linha;
    creditos.push({ ...credito, verified: Boolean(credito.verified) });
    resultado.set(obraId, creditos);
  }
  return resultado;
}
export function listarObrasContaCypher(proprietarioId, filtros) {
  const filtro = filtros ?? {
    status: "",
    type: "",
    genre: "",
    role: "",
    order: "recentes",
  };
  const ordenacao = {
    recentes: "o.criado_em DESC, o.id DESC",
    antigas: "o.criado_em ASC, o.id ASC",
    titulo: "o.titulo COLLATE NOCASE ASC, o.id ASC",
    lancamento:
      "CASE WHEN o.data_lancamento = '' THEN 1 ELSE 0 END, o.data_lancamento DESC, o.id DESC",
    status:
      "CASE o.situacao WHEN 'Rascunho' THEN 1 WHEN 'Em produção' THEN 2 WHEN 'Lançado' THEN 3 ELSE 4 END, o.titulo COLLATE NOCASE ASC",
  }[filtro.order];
  const linhas = bancoAtivo()
    .prepare(
      `
      SELECT
        o.id,
        o.titulo AS title,
        o.tipo AS type,
        o.tipo_detalhe AS typeDetail,
        o.situacao AS status,
        o.metadados AS meta,
        o.funcao_principal AS role,
        o.funcao_detalhe AS roleDetail,
        (SELECT COUNT(*) FROM creditos c
          WHERE c.obra_id = o.id AND c.demonstracao = 0) AS credits,
        o.descricao AS description,
        o.genero AS genre,
        o.genero_detalhe AS genreDetail,
        o.letra AS lyrics,
        o.bpm,
        o.isrc,
        o.iswc,
        o.data_lancamento AS releaseDate,
        o.link_escuta AS listenLink,
        o.publicada AS published,
        o.proprietario_id = @proprietarioId AS owned,
        COALESCE(
          (SELECT c.funcao FROM creditos c
           WHERE c.obra_id = o.id
             AND c.usuario_creditado_id = @proprietarioId
             AND c.demonstracao = 0
           ORDER BY c.criado_em ASC, c.id ASC LIMIT 1),
          ''
        ) AS participationRole
      FROM obras o
      WHERE o.demonstracao = 0
        AND (
          o.proprietario_id = @proprietarioId
          OR EXISTS (
            SELECT 1 FROM creditos c
            WHERE c.obra_id = o.id
              AND c.usuario_creditado_id = @proprietarioId
              AND c.demonstracao = 0
          )
        )
        AND (@status = '' OR o.situacao = @status)
        AND (@type = '' OR o.tipo = @type)
        AND (@genre = '' OR o.genero = @genre)
        AND (
          @role = ''
          OR o.funcao_principal = @role
          OR EXISTS (
            SELECT 1 FROM creditos c
            WHERE c.obra_id = o.id
              AND c.usuario_creditado_id = @proprietarioId
              AND c.funcao = @role
              AND c.demonstracao = 0
          )
        )
      ORDER BY ${ordenacao}
      `
    )
    .all({
      proprietarioId,
      status: filtro.status,
      type: filtro.type,
      genre: filtro.genre,
      role: filtro.role,
    });
  const creditos = creditosDasObras(linhas.map(obra => obra.id));
  return linhas.map(obra => ({
    ...obra,
    role: obra.owned ? obra.role : obra.participationRole,
    published: Boolean(obra.published),
    owned: Boolean(obra.owned),
    creditDetails: creditos.get(obra.id) ?? [],
  }));
}
export function obterObraContaCypher(id, proprietarioId) {
  return listarObrasContaCypher(proprietarioId).find(
    obra => obra.id === id && obra.owned
  );
}
export function listarPerfisParaCreditoCypher(usuarioAtualId) {
  return bancoAtivo()
    .prepare(
      `
      SELECT p.nome AS name, p.identificador AS handle
      FROM usuarios u
      JOIN perfis p ON p.usuario_id = u.id
      WHERE u.demonstracao = 0
        AND p.demonstracao = 0
        AND p.perfil_publico = 1
        AND u.tipo_conta = 'profissional' AND u.email_confirmado_em IS NOT NULL
        AND u.id <> ?
      ORDER BY p.nome COLLATE NOCASE, p.identificador COLLATE NOCASE
      `
    )
    .all(usuarioAtualId);
}
function metadadosObra(dados) {
  const data = dados.releaseDate
    ? dados.releaseDate.split("-").reverse().join("/")
    : "";
  const genero = dados.genreDetail
    ? `${dados.genre} · ${dados.genreDetail}`
    : dados.genre;
  return [genero, data].filter(Boolean).join(" · ");
}
function salvarCreditosObra(db, obraId, proprietarioId, creditos) {
  const obterPerfil = db.prepare(`
    SELECT u.id, p.nome AS name
    FROM usuarios u
    JOIN perfis p ON p.usuario_id = u.id
    WHERE lower(p.identificador) = lower(?)
      AND u.tipo_conta = 'profissional' AND u.email_confirmado_em IS NOT NULL
      AND u.demonstracao = 0
      AND p.demonstracao = 0
    `);
  const inserir = db.prepare(`
    INSERT INTO creditos (
      id, obra_id, usuario_creditado_id, nome_creditado, funcao,
      participacao, verificado, demonstracao
    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)
  `);
  const creditosVistos = new Set();
  for (const credito of creditos) {
    let usuarioCreditadoId = null;
    let nome = credito.name.trim();
    let chave;
    if (credito.handle) {
      const perfil = obterPerfil.get(credito.handle);
      if (!perfil) throw new Error("CREDITO_PERFIL_NAO_ENCONTRADO");
      if (perfil.id === proprietarioId) throw new Error("CREDITO_PROPRIO");
      usuarioCreditadoId = perfil.id;
      nome = perfil.name;
      chave = `usuario:${perfil.id}`;
    } else {
      chave = `mencao:${nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")}`;
    }
    if (creditosVistos.has(chave)) throw new Error("CREDITOS_DUPLICADOS");
    creditosVistos.add(chave);
    inserir.run(
      randomUUID(),
      obraId,
      usuarioCreditadoId,
      nome,
      credito.role.trim(),
      credito.participation.trim()
    );
  }
}
export function criarObraCypher(proprietarioId, dados, creditos) {
  exigirPublicacao(proprietarioId, "obra", dados.type);
  const db = bancoAtivo();
  const salvar = db.transaction(() => {
    const id = randomUUID();
    db.prepare(
      `
      INSERT INTO obras (
        id, proprietario_id, titulo, tipo, tipo_detalhe, situacao, metadados,
        funcao_principal, funcao_detalhe, quantidade_creditos, descricao, genero, genero_detalhe, letra,
        bpm, isrc, iswc, data_lancamento, link_escuta, publicada,
        ordem_demo, demonstracao
      ) VALUES (
        @id, @proprietarioId, @title, @type, @typeDetail, @status, @meta,
        @role, @roleDetail, @credits, @description, @genre, @genreDetail, @lyrics,
        @bpm, @isrc, @iswc, @releaseDate, @listenLink, @published,
        0, 0
      )
      `
    ).run({
      id,
      proprietarioId,
      title: dados.title,
      type: dados.type,
      typeDetail: dados.typeDetail,
      status: dados.status,
      meta: metadadosObra(dados),
      role: dados.role,
      roleDetail: dados.roleDetail,
      credits: creditos.length,
      description: dados.description,
      genre: dados.genre,
      genreDetail: dados.genreDetail,
      lyrics: dados.lyrics,
      bpm: dados.bpm,
      isrc: dados.isrc,
      iswc: dados.iswc,
      releaseDate: dados.releaseDate,
      listenLink: dados.listenLink,
      published: Number(dados.status === "Lançado"),
    });
    salvarCreditosObra(db, id, proprietarioId, creditos);
    if (dados.propostaGenero?.trim()) {
      db.prepare(
        `INSERT INTO propostas_generos (id, usuario_id, genero)
         VALUES (?, ?, ?) ON CONFLICT DO NOTHING`
      ).run(randomUUID(), proprietarioId, dados.propostaGenero.trim());
    }
    return id;
  });
  return salvar();
}
export function atualizarObraCypher(id, proprietarioId, dados, creditos) {
  exigirProfissional(proprietarioId);
  const anterior = obterObraContaCypher(id, proprietarioId);
  if (!anterior || !anterior.owned) return false;
  if (anterior.type !== dados.type) exigirPublicacao(proprietarioId,"obra",dados.type);
  const db = bancoAtivo();
  const salvar = db.transaction(() => {
    const resultado = db
      .prepare(
        `
        UPDATE obras SET
          titulo = @title,
          tipo = @type,
          tipo_detalhe = @typeDetail,
          situacao = @status,
          metadados = @meta,
          funcao_principal = @role,
          funcao_detalhe = @roleDetail,
          quantidade_creditos = @credits,
          descricao = @description,
          genero = @genre,
          genero_detalhe = @genreDetail,
          letra = @lyrics,
          bpm = @bpm,
          isrc = @isrc,
          iswc = @iswc,
          data_lancamento = @releaseDate,
          link_escuta = @listenLink,
          publicada = @published,
          atualizado_em = CURRENT_TIMESTAMP
        WHERE id = @id
          AND proprietario_id = @proprietarioId
          AND demonstracao = 0
        `
      )
      .run({
        id,
        proprietarioId,
        title: dados.title,
        type: dados.type,
        typeDetail: dados.typeDetail,
        status: dados.status,
        meta: metadadosObra(dados),
        role: dados.role,
        roleDetail: dados.roleDetail,
        credits: creditos.length,
        description: dados.description,
        genre: dados.genre,
        genreDetail: dados.genreDetail,
        lyrics: dados.lyrics,
        bpm: dados.bpm,
        isrc: dados.isrc,
        iswc: dados.iswc,
        releaseDate: dados.releaseDate,
        listenLink: dados.listenLink,
        published: Number(dados.status === "Lançado"),
      });
    if (resultado.changes !== 1) return false;
    db.prepare(
      "DELETE FROM creditos WHERE obra_id = ? AND demonstracao = 0"
    ).run(id);
    salvarCreditosObra(db, id, proprietarioId, creditos);
    if (dados.propostaGenero?.trim()) {
      db.prepare(
        `INSERT INTO propostas_generos (id, usuario_id, genero)
         VALUES (?, ?, ?) ON CONFLICT DO NOTHING`
      ).run(randomUUID(), proprietarioId, dados.propostaGenero.trim());
    }
    return true;
  });
  return salvar();
}
export function excluirObraCypher(id, proprietarioId) {
  exigirProfissional(proprietarioId);
  const resultado = bancoAtivo()
    .prepare(
      `
      DELETE FROM obras
      WHERE id = ? AND proprietario_id = ? AND demonstracao = 0
      `
    )
    .run(id, proprietarioId);
  return resultado.changes === 1;
}
export function estatisticasObrasUsuarioCypher(proprietarioId) {
  return bancoAtivo()
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN publicada = 1 AND funcao_principal = 'Artista principal' THEN 1 ELSE 0 END), 0) AS publicadasComoArtista,
        COALESCE(SUM(CASE WHEN publicada = 1 AND funcao_principal = 'Participação como feat' THEN 1 ELSE 0 END), 0) AS participacoesComoFeat,
        COALESCE(SUM(CASE WHEN situacao = 'Em produção' THEN 1 ELSE 0 END), 0) AS emAndamento
      FROM obras
      WHERE proprietario_id = ? AND demonstracao = 0
      `
    )
    .get(proprietarioId);
}
export function excluirContaCypher(id) {
  const db = bancoAtivo();
  const excluir = db.transaction(() => {
    const obras = db
      .prepare("SELECT COUNT(*) AS total FROM obras WHERE proprietario_id = ?")
      .get(id);
    const eventos = db
      .prepare(
        "SELECT COUNT(*) AS total FROM eventos WHERE proprietario_id = ?"
      )
      .get(id);
    const beats = db
      .prepare("SELECT COUNT(*) AS total FROM beats WHERE produtor_id = ?")
      .get(id);
    if (obras.total || eventos.total || beats.total) {
      return {
        excluida: false,
        obras: obras.total,
        eventos: eventos.total,
        beats: beats.total,
      };
    }
    const removido = db
      .prepare("DELETE FROM usuarios WHERE id = ? AND demonstracao = 0")
      .run(id);
    return {
      excluida: removido.changes === 1,
      obras: 0,
      eventos: 0,
      beats: 0,
    };
  });
  return excluir();
}
export function revogarSessaoCypher(tokenHash) {
  bancoAtivo()
    .prepare("DELETE FROM sessoes WHERE token_hash = ?")
    .run(tokenHash);
}
export function fecharBancoCypher() {
  banco?.close();
  banco = undefined;
}

import {
  atualizarObraCypher,
  buscarPerfisPublicosCypher,
  criarObraCypher,
  estatisticasObrasUsuarioCypher,
  excluirObraCypher,
  listarObrasContaCypher,
  listarPerfisParaCreditoCypher,
  inicializarBancoCypher,
  atualizarBeatCypher,
  criarBeatCypher,
  excluirBeatCypher,
  listarBeatsCypher,
  obterBeatCypher,
  listarEventosCypher,
  demonstrarInteresseEventoCypher,
  cancelarInteresseEventoCypher,
  atualizarStatusInteresseEventoCypher,
  criarEventoCypher,
  atualizarEventoCypher,
  excluirEventoCypher,
  obterEventoCypher,
  criarNotificacaoCypher,
  listarNotificacoesCypher,
  contarNotificacoesNaoLidasCypher,
  marcarNotificacaoLidaCypher,
  marcarTodasNotificacoesLidasCypher,
  obterObraContaCypher,
  type CreditoObraEntrada,
  type DadosObraCypher,
  type DadosEventoCypher,
  type DadosBeatCypher,
  type FiltrosEventos,
  type EventoContaPersistido,
  type StatusInteresseEvento,
  type BeatContaPersistido,
  type FiltrosBuscaPerfisPublicos,
  type FiltrosCatalogoObras,
  type ObraContaPersistida,
} from "./bancoDados.js";

export const tiposObra = [
  "Obra",
  "Instrumental",
  "Música",
  "Beat",
  "Single",
  "EP",
  "Álbum",
  "Mixtape",
  "Outro",
];
export const generosObra = ["Rap", "Boom bap", "Trap", "R&B", "Lo-fi", "Outro"];
export const statusObra = ["Em produção", "Rascunho", "Lançado"];
export const papeisObra = [
  "Artista principal",
  "Composição",
  "Produção musical",
  "Instrumentação",
  "Participação como feat",
  "Outro crédito",
];

export type { CreditoObraEntrada, DadosObraCypher, ObraContaPersistida };
export type { DadosEventoCypher, FiltrosEventos, EventoContaPersistido };
export type { DadosBeatCypher, BeatContaPersistido };

/** Inicializa somente o banco estrutural; nenhuma fixture ou conta é criada. */
export function inicializarAplicacaoCypher(): void {
  inicializarBancoCypher();
}

export const CypherModel = {
  usuario: () => null,
  buscarPessoasPublicas: (
    filtros: FiltrosBuscaPerfisPublicos,
    usuarioId: string
  ) => buscarPerfisPublicosCypher(filtros, usuarioId),
  eventos: () => [],
  eventosDisponiveis: (filtros: FiltrosEventos, usuarioId: string) =>
    listarEventosCypher(filtros, usuarioId),
  evento: (id: string, usuarioId: string) => obterEventoCypher(id, usuarioId),
  demonstrarInteresseEvento: (eventoId: string, usuarioId: string) =>
    demonstrarInteresseEventoCypher(eventoId, usuarioId),
  cancelarInteresseEvento: (eventoId: string, usuarioId: string) =>
    cancelarInteresseEventoCypher(eventoId, usuarioId),
  atualizarStatusInteresseEvento: (
    eventoId: string,
    organizadorId: string,
    usuarioInteressadoId: string,
    status: Extract<
      StatusInteresseEvento,
      "interessado" | "inscrito" | "confirmado" | "rejeitado"
    >
  ) =>
    atualizarStatusInteresseEventoCypher(
      eventoId,
      organizadorId,
      usuarioInteressadoId,
      status
    ),
  criarEvento: (usuarioId: string, dados: DadosEventoCypher) =>
    criarEventoCypher(usuarioId, dados),
  atualizarEvento: (id: string, usuarioId: string, dados: DadosEventoCypher) =>
    atualizarEventoCypher(id, usuarioId, dados),
  excluirEvento: (id: string, usuarioId: string) =>
    excluirEventoCypher(id, usuarioId),
  criarNotificacao: criarNotificacaoCypher,
  notificacoes: (usuarioId: string, limite?: number) =>
    listarNotificacoesCypher(usuarioId, limite),
  notificacoesNaoLidas: (usuarioId: string) =>
    contarNotificacoesNaoLidasCypher(usuarioId),
  marcarNotificacaoLida: marcarNotificacaoLidaCypher,
  marcarTodasNotificacoesLidas: marcarTodasNotificacoesLidasCypher,
  beats: (usuarioId?: string) => listarBeatsCypher(usuarioId),
  criarBeat: (produtorId: string, dados: DadosBeatCypher) =>
    criarBeatCypher(produtorId, dados),
  obterBeat: (id: string, produtorId: string) =>
    obterBeatCypher(id, produtorId),
  atualizarBeat: (id: string, produtorId: string, dados: DadosBeatCypher) =>
    atualizarBeatCypher(id, produtorId, dados),
  excluirBeat: (id: string, produtorId: string) =>
    excluirBeatCypher(id, produtorId),
  obras: () => [],
  obrasDoUsuario: (usuarioId: string, filtros?: FiltrosCatalogoObras) =>
    listarObrasContaCypher(usuarioId, filtros),
  obraDoUsuario: (id: string, usuarioId: string) =>
    obterObraContaCypher(id, usuarioId),
  perfisParaCredito: (usuarioId: string) =>
    listarPerfisParaCreditoCypher(usuarioId),
  criarObra: (
    usuarioId: string,
    dados: DadosObraCypher,
    creditos: CreditoObraEntrada[]
  ) => criarObraCypher(usuarioId, dados, creditos),
  atualizarObra: (
    id: string,
    usuarioId: string,
    dados: DadosObraCypher,
    creditos: CreditoObraEntrada[]
  ) => atualizarObraCypher(id, usuarioId, dados, creditos),
  excluirObra: (id: string, usuarioId: string) =>
    excluirObraCypher(id, usuarioId),
  estatisticasObrasDoUsuario: (usuarioId: string) =>
    estatisticasObrasUsuarioCypher(usuarioId),
  faqs: () => [
    {
      q: "O que é ISRC?",
      a: "É um código usado para identificar gravações musicais. No Cypher, você pode guardar essa informação junto da obra e dos créditos.",
    },
    {
      q: "O que é ISWC?",
      a: "É um identificador internacional de obras musicais. Registre o código quando já tiver essa informação para manter seu histórico organizado.",
    },
    {
      q: "Como conseguir shows?",
      a: "Acompanhe oportunidades e eventos na plataforma. Mantenha o perfil profissional atualizado e registre suas participações.",
    },
    {
      q: "Como funciona a reputação?",
      a: "A reputação é uma informação profissional baseada em participação, avaliações e profissionalismo dentro da plataforma.",
    },
  ],
};

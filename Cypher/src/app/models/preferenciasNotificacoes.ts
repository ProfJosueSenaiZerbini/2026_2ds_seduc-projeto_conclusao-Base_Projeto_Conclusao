export const categoriasNotificacoes = [
  {
    id: "interacoes",
    titulo: "Interações",
    descricao: "Avisos de comentários em suas publicações.",
    tipos: ["comentario_publicacao"],
  },
  {
    id: "mensagens",
    titulo: "Mensagens",
    descricao: "Avisos de novas mensagens na Cypher.",
    tipos: ["mensagem"],
  },
  {
    id: "publicacoes",
    titulo: "Minhas publicações",
    descricao: "Confirmações de criação e edição de obras, beats e eventos.",
    tipos: [
      "obra_criada",
      "obra_atualizada",
      "beat_criado",
      "beat_atualizado",
      "evento_criado",
      "evento_atualizado",
    ],
  },
  {
    id: "lembretes",
    titulo: "Lembretes de eventos",
    descricao: "Avisos de horário para eventos que você acompanha.",
    tipos: ["evento_lembrete"],
  },
] as const;

// A política vale também para os fluxos que inserem avisos no banco dentro de suas próprias transações.
export const esquemaPreferenciasNotificacoes = `
  CREATE TRIGGER IF NOT EXISTS aplicar_preferencias_notificacoes
  BEFORE INSERT ON notificacoes
  WHEN EXISTS (
    SELECT 1 FROM preferencias_usuario p, json_each(p.avisos_desativados_json) d
    WHERE p.usuario_id = NEW.usuario_destino_id AND (
      ${categoriasNotificacoes.map(c => `(d.value = '${c.id}' AND NEW.tipo IN (${c.tipos.map(t => `'${t}'`).join(",")}))`).join(" OR ")}
    )
  )
  BEGIN
    SELECT RAISE(IGNORE);
  END;
`;

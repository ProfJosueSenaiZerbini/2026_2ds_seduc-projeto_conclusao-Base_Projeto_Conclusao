import { enderecoObra } from "./enderecosPerfil.js";
import type Database from "better-sqlite3";
import {
  objetoDisponivel,
  objetoSobMedida,
  situacaoContaModeracao,
} from "./politicasModeracao.js";
import { contaEncerrada, menorProtegido } from "./protecoesConta.js";

type Banco = Database.Database;
const fontes = {
  perfil:
    "SELECT p.usuario_id dono, p.nome titulo, p.identificador, u.demonstracao FROM perfis p JOIN usuarios u ON u.id=p.usuario_id WHERE p.usuario_id=? AND p.perfil_publico=1 AND u.tipo_conta='profissional' AND (u.email_confirmado_em IS NOT NULL OR u.demonstracao=1)",
  obra: "SELECT o.proprietario_id dono, o.titulo, p.identificador, o.demonstracao FROM obras o JOIN perfis p ON p.usuario_id=o.proprietario_id WHERE o.id=? AND o.publicada=1",
  beat: "SELECT produtor_id dono, titulo, demonstracao FROM beats WHERE id=?",
  evento:
    "SELECT e.proprietario_id dono, e.titulo, e.demonstracao FROM eventos e LEFT JOIN eventos_configuracoes c ON c.evento_id=e.id WHERE e.id=? AND coalesce(c.estado,'ativo')<>'cancelado' AND e.situacao<>'Cancelado'",
  projeto:
    "SELECT p.autor_id dono, p.titulo FROM projetos_trabalho p LEFT JOIN detalhes_projetos d ON d.projeto_id=p.id WHERE p.id=? AND p.publico=1 AND coalesce(d.retirado,0)=0",
  oportunidade:
    "SELECT autor_id dono, titulo FROM oportunidades_profissionais WHERE id=? AND estado IN('aberta','encerrada','expirada')",
};
export type TipoInteracao = keyof typeof fontes;
export const nomesInteracoes: Record<TipoInteracao, string> = {
  perfil: "Perfil",
  obra: "Obra",
  beat: "Beat",
  evento: "Evento",
  projeto: "Projeto ou galeria",
  oportunidade: "Oportunidade",
};
export function tipoInteracao(tipo: string): tipo is TipoInteracao {
  return Object.hasOwn(fontes, tipo);
}

export function alvoInteracao(
  db: Banco,
  visitante: string,
  tipo: string,
  id: string
) {
  if (!tipoInteracao(tipo) || !id || !objetoDisponivel(db, tipo, id, visitante))
    return null;
  const item = db.prepare(fontes[tipo]).get(id) as
    | {
        dono: string;
        titulo: string;
        identificador?: string;
        demonstracao?: number;
      }
    | undefined;
  if (!item) return null;
  const chave = encodeURIComponent(id);
  const perfil =
    "/p/" + encodeURIComponent((item.identificador ?? "").replace(/^@/, ""));
  const links = {
    perfil,
    obra: enderecoObra(item.identificador ?? "", id),
    beat: item.demonstracao ? "/beats#beat-" + chave : "/beats/" + chave,
    evento: item.demonstracao ? "/events#evento-" + chave : "/events/" + chave,
    projeto: "/work-projects/" + chave,
    oportunidade: "/opportunities/" + chave,
  };
  return { ...item, id, tipo, rotulo: nomesInteracoes[tipo], url: links[tipo] };
}

export function comentarioVisivel(
  db: Banco,
  visitante: string,
  comentario: {
    id: string;
    autor_id: string;
    objeto_tipo: string;
    objeto_id: string;
    excluido_em: number | null;
  },
  alvo = alvoInteracao(
    db,
    visitante,
    comentario.objeto_tipo,
    comentario.objeto_id
  )
) {
  if (
    !alvo ||
    comentario.excluido_em !== null ||
    objetoSobMedida(db, "comentario", comentario.id)
  )
    return false;
  const autor = comentario.autor_id;
  if (contaEncerrada(db, autor) || situacaoContaModeracao(db, autor).restrita || objetoSobMedida(db, "perfil", autor))
    return false;
  if (autor !== visitante && menorProtegido(db, autor)) return false;
  return !db
    .prepare(
      `
    SELECT 1 FROM bloqueios_usuarios
    WHERE (autor_id=? AND alvo_id IN(?,?)) OR (alvo_id=? AND autor_id IN(?,?))
  `
    )
    .get(autor, visitante, alvo.dono, autor, visitante, alvo.dono);
}

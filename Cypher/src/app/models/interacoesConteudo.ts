import { randomUUID } from "node:crypto";
import { imagemPerfilDemo } from "./catalogoDemonstrativo.js";
import { conexaoInternaCypher, criarNotificacaoCypher } from "./bancoDados.js";
import { alvoInteracao, comentarioVisivel } from "./politicasInteracoes.js";
import { situacaoContaModeracao } from "./politicasModeracao.js";
import { contaEncerrada, menorProtegido } from "./protecoesConta.js";

const db = conexaoInternaCypher;
type Alvo = NonNullable<ReturnType<typeof alvoInteracao>>;
type Comentario = {
  id: string;
  autor_id: string;
  objeto_tipo: string;
  objeto_id: string;
  texto: string;
  criado_em: number;
  editado_em: number | null;
  excluido_em: number | null;
  versao: number;
  autor: string;
  tipoConta: string;
  identificador: string;
  perfilPublico: number;
};
export class ErroInteracao extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}

export function exigirContaInteracao(id: string) {
  const convencional = db()
    .prepare(
      `
    SELECT 1 FROM usuarios WHERE id=? AND tipo_conta IN('consumidor','profissional')
      AND demonstracao=0 AND email_confirmado_em IS NOT NULL
  `
    )
    .get(id);
  if (
    !convencional ||
    contaEncerrada(db(), id) ||
    situacaoContaModeracao(db(), id).restrita
  )
    throw new ErroInteracao(
      "Entre com uma conta ativa e confirmada para interagir.",
      403
    );
}

export function exigirAlvoInteracao(ator: string, tipo: string, id: string) {
  exigirContaInteracao(ator);
  const alvo = alvoInteracao(db(), ator, tipo, id);
  if (!alvo) throw new ErroInteracao("Este registro não está disponível.", 404);
  return alvo;
}

function estado(ator: string, alvo: Alvo) {
  const { tipo, id, dono } = alvo;
  const acoes = db()
    .prepare(
      "SELECT acao FROM interacoes_conteudo WHERE usuario_id=? AND objeto_tipo=? AND objeto_id=?"
    )
    .all(ator, tipo, id) as { acao: string }[];
  const salvo =
    tipo === "evento"
      ? db()
          .prepare(
            "SELECT 1 FROM eventos_acompanhamentos WHERE usuario_id=? AND evento_id=? AND salvo=1"
          )
          .get(ator, id)
      : acoes.some(a => a.acao === "salvar");
  const curtida = (
    tipo === "obra"
      ? db()
          .prepare(
            "SELECT COUNT(*) total, MAX(usuario_id=?) ativa FROM curtidas_obras WHERE obra_id=?"
          )
          .get(ator, id)
      : db()
          .prepare(
            "SELECT COUNT(*) total, MAX(usuario_id=?) ativa FROM interacoes_conteudo WHERE objeto_tipo=? AND objeto_id=? AND acao='curtir'"
          )
          .get(ator, tipo, id)
  ) as { total: number; ativa: number | null };
  return {
    alvo,
    salvo: Boolean(salvo),
    curtido: Boolean(curtida.ativa),
    curtidas: curtida.total,
    segue:
      tipo === "perfil" &&
      Boolean(
        db()
          .prepare(
            "SELECT 1 FROM profissionais_seguidos WHERE seguidor_id=? AND profissional_id=?"
          )
          .get(ator, id)
      ),
    podeSeguir:
      tipo === "perfil" &&
      id !== ator &&
      !situacaoContaModeracao(db(), dono).contatoRestrito &&
      !situacaoContaModeracao(db(), ator).contatoRestrito,
  };
}

export function estadoInteracao(ator: string, tipo: string, id: string) {
  const alvo = alvoInteracao(db(), ator, tipo, id);
  return alvo ? estado(ator, alvo) : null;
}

export function alterarInteracao(
  ator: string,
  tipo: string,
  id: string,
  acao: string,
  ativo: boolean
) {
  return db()
    .transaction(() => {
      exigirContaInteracao(ator);
      const alvo = ativo
        ? exigirAlvoInteracao(ator, tipo, id)
        : alvoInteracao(db(), ator, tipo, id);
      if (acao === "seguir" && tipo === "perfil") {
        if (ativo && (!alvo || !estado(ator, alvo).podeSeguir))
          throw new ErroInteracao(
            "Este acompanhamento não está disponível.",
            403
          );
        if (ativo)
          db()
            .prepare(
              "INSERT INTO profissionais_seguidos(seguidor_id,profissional_id) VALUES (?,?) ON CONFLICT DO NOTHING"
            )
            .run(ator, id);
        else
          db()
            .prepare(
              "DELETE FROM profissionais_seguidos WHERE seguidor_id=? AND profissional_id=?"
            )
            .run(ator, id);
      } else if (acao === "salvar" && tipo === "evento") {
        if (ativo)
          db()
            .prepare(
              `
        INSERT INTO eventos_acompanhamentos(usuario_id,evento_id,salvo,criada_em,lembrar24,lembrar_dia)
        VALUES(?,?,1,?,?,?) ON CONFLICT(usuario_id,evento_id) DO UPDATE SET salvo=1
      `
            )
            .run(
              ator,
              id,
              Date.now(),
              Number(alvo?.dono !== ator),
              Number(alvo?.dono !== ator)
            );
        else
          db()
            .prepare(
              "UPDATE eventos_acompanhamentos SET salvo=0 WHERE usuario_id=? AND evento_id=?"
            )
            .run(ator, id);
      } else if (acao === "curtir" && tipo === "obra") {
        if (ativo)
          db()
            .prepare(
              "INSERT INTO curtidas_obras(usuario_id,obra_id) VALUES (?,?) ON CONFLICT DO NOTHING"
            )
            .run(ator, id);
        else
          db()
            .prepare(
              "DELETE FROM curtidas_obras WHERE usuario_id=? AND obra_id=?"
            )
            .run(ator, id);
      } else if (
        (acao === "salvar" && tipo !== "perfil") ||
        acao === "curtir"
      ) {
        if (ativo)
          db()
            .prepare(
              "INSERT INTO interacoes_conteudo(usuario_id,acao,objeto_tipo,objeto_id) VALUES (?,?,?,?) ON CONFLICT DO NOTHING"
            )
            .run(ator, acao, tipo, id);
        else
          db()
            .prepare(
              "DELETE FROM interacoes_conteudo WHERE usuario_id=? AND acao=? AND objeto_tipo=? AND objeto_id=?"
            )
            .run(ator, acao, tipo, id);
      } else {
        throw new ErroInteracao("Esta interação não está disponível.");
      }
      return alvo ? estado(ator, alvo) : null;
    })
    .immediate();
}

export function colecoesPessoais(ator: string, aba: "salvos" | "seguindo") {
  exigirContaInteracao(ator);
  const sql =
    aba === "salvos"
      ? `
    SELECT objeto_tipo tipo, objeto_id id, unixepoch(criado_em)*1000 instante
    FROM interacoes_conteudo WHERE usuario_id=@ator AND acao='salvar'
    UNION ALL
    SELECT 'evento', evento_id, criada_em FROM eventos_acompanhamentos WHERE usuario_id=@ator AND salvo=1
    ORDER BY instante DESC, id
  `
      : "SELECT 'perfil' tipo, profissional_id id FROM profissionais_seguidos WHERE seguidor_id=@ator ORDER BY criado_em DESC, profissional_id";
  const linhas = db().prepare(sql).all({ ator }) as {
    tipo: string;
    id: string;
  }[];
  return linhas.flatMap(({ tipo, id }) => {
    const alvo = alvoInteracao(db(), ator, tipo, id);
    return alvo ? [alvo] : [];
  });
}

export function listarComentarios(ator: string, alvo: Alvo) {
  return (
    db()
      .prepare(
        `
    SELECT c.*,p.nome autor,u.tipo_conta tipoConta,p.identificador,p.perfil_publico perfilPublico
    FROM comentarios_conteudo c JOIN usuarios u ON u.id=c.autor_id JOIN perfis p ON p.usuario_id=c.autor_id
    WHERE c.objeto_tipo=? AND c.objeto_id=? AND c.excluido_em IS NULL
    ORDER BY c.criado_em DESC,c.id DESC
  `
      )
      .all(alvo.tipo, alvo.id) as Comentario[]
  )
    .filter(c => comentarioVisivel(db(), ator, c, alvo))
    .map(c => {
      const profissional =
        c.tipoConta === "profissional" &&
        c.perfilPublico &&
        !menorProtegido(db(), c.autor_id) &&
        Boolean(alvoInteracao(db(), ator, "perfil", c.autor_id));
      return {
        id: c.id,
        texto: c.texto,
        criadoEm: c.criado_em,
        editado: c.editado_em !== null,
        versao: c.versao,
        proprio: c.autor_id === ator,
        autor:
          c.autor_id === ator
            ? "Você"
            : profissional
              ? c.autor
              : "Participante",
        perfil: profissional
          ? "/p/" + encodeURIComponent(c.identificador.replace(/^@/, ""))
          : "",
        foto: profissional ? imagemPerfilDemo(c.identificador) || "" : "",
        iniciais: profissional
          ? c.autor
              .split(/\s+/)
              .slice(0, 2)
              .map(v => v[0])
              .join("")
              .toUpperCase()
          : c.autor_id === ator
            ? "EU"
            : "P",
      };
    });
}

function validarTexto(valor: unknown) {
  const texto = typeof valor === "string" ? valor.trim() : "";
  if (!texto || texto.length > 1500)
    throw new ErroInteracao("Escreva um comentário de até 1.500 caracteres.");
  return texto;
}
export function publicarComentario(
  ator: string,
  tipo: string,
  id: string,
  valor: unknown,
  chave: unknown
) {
  if (typeof chave !== "string" || !/^[a-zA-Z0-9-]{16,100}$/.test(chave))
    throw new ErroInteracao("Atualize a página para enviar o comentário.");
  const texto = validarTexto(valor);
  return db()
    .transaction(() => {
      const alvo = exigirAlvoInteracao(ator, tipo, id);
      if (tipo === "perfil")
        throw new ErroInteracao(
          "Comentários estão disponíveis nas publicações."
        );
      if (situacaoContaModeracao(db(), ator).contatoRestrito)
        throw new ErroInteracao(
          "Sua conta está com restrição de contato.",
          403
        );
      const anterior = db()
        .prepare(
          "SELECT id,objeto_tipo,objeto_id FROM comentarios_conteudo WHERE autor_id=? AND chave_envio=?"
        )
        .get(ator, chave) as Comentario | undefined;
      if (anterior) {
        if (anterior.objeto_tipo !== tipo || anterior.objeto_id !== id)
          throw new ErroInteracao("Atualize a página antes de enviar.", 409);
        return anterior.id;
      }
      const agora = Date.now();
      const recentes = db()
        .prepare(
          "SELECT COUNT(*) total FROM comentarios_conteudo WHERE autor_id=? AND criado_em>?"
        )
        .get(ator, agora - 3600000) as { total: number };
      if (recentes.total >= 30)
        throw new ErroInteracao(
          "Você atingiu o limite de comentários desta hora.",
          429
        );
      const cid = randomUUID();
      db()
        .prepare(
          "INSERT INTO comentarios_conteudo(id,autor_id,objeto_tipo,objeto_id,texto,criado_em,chave_envio) VALUES(?,?,?,?,?,?,?)"
        )
        .run(cid, ator, tipo, id, texto, agora, chave);
      if (
        !alvo.demonstracao &&
        alvo.dono !== ator &&
        !menorProtegido(db(), ator)
      ) {
        criarNotificacaoCypher({
          usuarioDestinoId: alvo.dono,
          tipo: "comentario_publicacao",
          titulo: "Novo comentário na sua publicação",
          mensagem: "",
          url: urlInteracao(tipo, id) + "#comentario-" + cid,
          entidadeTipo: "comentario",
          entidadeId: cid,
          chaveOrigem: "comentario:" + cid,
        });
      }
      return cid;
    })
    .immediate();
}

export function alterarComentario(
  ator: string,
  tipo: string,
  id: string,
  cid: string,
  versao: unknown,
  excluir: boolean,
  valor?: unknown
) {
  return db()
    .transaction(() => {
      exigirContaInteracao(ator);
      const comentario = db()
        .prepare(
          "SELECT * FROM comentarios_conteudo WHERE id=? AND autor_id=? AND objeto_tipo=? AND objeto_id=? AND excluido_em IS NULL"
        )
        .get(cid, ator, tipo, id) as Comentario | undefined;
      if (!comentario) throw new ErroInteracao("Comentário indisponível.", 404);
      if (String(comentario.versao) !== versao)
        throw new ErroInteracao(
          "O comentário mudou. Atualize a página antes de continuar.",
          409
        );
      if (excluir) {
        db()
          .prepare(
            "UPDATE comentarios_conteudo SET texto='',excluido_em=?,versao=versao+1 WHERE id=?"
          )
          .run(Date.now(), cid);
        return;
      }
      const alvo = exigirAlvoInteracao(ator, tipo, id);
      if (!comentarioVisivel(db(), ator, comentario, alvo))
        throw new ErroInteracao("Comentário indisponível.", 404);
      if (situacaoContaModeracao(db(), ator).contatoRestrito)
        throw new ErroInteracao(
          "Sua conta está com restrição de contato.",
          403
        );
      db()
        .prepare(
          "UPDATE comentarios_conteudo SET texto=?,editado_em=?,versao=versao+1 WHERE id=?"
        )
        .run(validarTexto(valor), Date.now(), cid);
    })
    .immediate();
}

export const urlInteracao = (tipo: string, id: string) =>
  "/interacoes/" + encodeURIComponent(tipo) + "/" + encodeURIComponent(id);

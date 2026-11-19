import { NextResponse } from "next/server";
import { db } from "@/app/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const titulo = searchParams.get("titulo")?.trim() || "";
    const genero = searchParams.get("genero")?.trim() || "";
    const copias = searchParams.get("copias")?.trim() || "";
    const autor = searchParams.get("autor")?.trim() || "";
    const ano = searchParams.get("ano")?.trim() || "";

    const pagina = Math.max(
      1,
      Number(searchParams.get("page")) || 1,
    );

    const limite = Math.max(
      1,
      Number(searchParams.get("limit")) || 20,
    );

    const offset = (pagina - 1) * limite;

    /*
     * Todas as condições usam o alias "l",
     * que é declarado em FROM livro l.
     */
    const condicoes = ["l.inativo_livro = false"];

    const valores: (string | number)[] = [];

    if (titulo) {
      valores.push(titulo);

      condicoes.push(
        `unaccent(l.titulo_livro) ILIKE '%' || unaccent($${valores.length}) || '%'`,
      );
    }

    if (genero) {
      valores.push(genero);

      condicoes.push(
        `unaccent(l.genero_livro) ILIKE '%' || unaccent($${valores.length}) || '%'`,
      );
    }

    if (copias === "com") {
      condicoes.push(`
        EXISTS (
          SELECT 1
          FROM exemplar e
          WHERE e.fk_livro_id_livro = l.id_livro
            AND e.inativo_exemplar = false
            AND NOT EXISTS (
              SELECT 1
              FROM emprestimo em
              WHERE em.fk_exemplar_id_exemplar = e.id_exemplar
                AND em.inativo_emprestimo = false
                AND em.dta_devolucao_real IS NULL
            )
        )
      `);
    } else if (copias === "sem") {
      condicoes.push(`
        NOT EXISTS (
          SELECT 1
          FROM exemplar e
          WHERE e.fk_livro_id_livro = l.id_livro
            AND e.inativo_exemplar = false
            AND NOT EXISTS (
              SELECT 1
              FROM emprestimo em
              WHERE em.fk_exemplar_id_exemplar = e.id_exemplar
                AND em.inativo_emprestimo = false
                AND em.dta_devolucao_real IS NULL
            )
        )
      `);
    }

    if (autor) {
      valores.push(autor);

      condicoes.push(
        `unaccent(l.autor_livro) ILIKE '%' || unaccent($${valores.length}) || '%'`,
      );
    }

    if (ano) {
      valores.push(Number(ano));

      condicoes.push(
        `l.anopub_livro = $${valores.length}`,
      );
    }

    /*
     * Consulta base utilizada tanto pelo COUNT
     * quanto pela consulta principal dos livros.
     */
    const consultaBase = `
      FROM livro l
      WHERE ${condicoes.join(" AND ")}
    `;

    /*
     * Conta quantos livros existem com os filtros aplicados.
     */
    const consultaTotal = `
      SELECT COUNT(*)::int AS total
      ${consultaBase}
    `;

    const resultadoTotal = await db.$queryRawUnsafe<
      { total: number }[]
    >(
      consultaTotal,
      ...valores,
    );

    const total = resultadoTotal[0]?.total ?? 0;

    const totalPaginas = Math.max(
      1,
      Math.ceil(total / limite),
    );

    /*
     * Parâmetros da paginação.
     */
    const valoresComPaginacao = [
      ...valores,
      limite,
      offset,
    ];

    const consultaLivros = `
      SELECT
        l.id_livro,
        l.isbn,
        l.titulo_livro,
        l.autor_livro,
        l.sinopse_livro,
        l.editora_livro,
        l.anopub_livro,
        l.imgcapa_livro,
        l.genero_livro,
        l.inativo_livro,
        l.localizacao_livro,

        EXISTS (
          SELECT 1
          FROM exemplar e
          WHERE e.fk_livro_id_livro = l.id_livro
            AND e.inativo_exemplar = false

            AND NOT EXISTS (
              SELECT 1
              FROM emprestimo em
              WHERE em.fk_exemplar_id_exemplar = e.id_exemplar
                AND em.inativo_emprestimo = false
                AND em.dta_devolucao_real IS NULL
            )
        ) AS possui_exemplar_disponivel

      ${consultaBase}

      ORDER BY l.titulo_livro ASC

      LIMIT $${valores.length + 1}
      OFFSET $${valores.length + 2}
    `;

    const livros = await db.$queryRawUnsafe(
      consultaLivros,
      ...valoresComPaginacao,
    );

    return NextResponse.json(
      {
        livros,
        total,
        pagina,
        limite,
        totalPaginas,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao buscar livros:", error);

    return NextResponse.json(
      { erro: "Erro interno ao buscar livros." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      isbn,
      titulo_livro,
      autor_livro,
      editora_livro,
      anopub_livro,
      genero_livro,
      localizacao_livro,
      imgcapa_livro,
      sinopse_livro,
      fk_bibliotecario_id_bibliotecario,
    } = body;

    if (!isbn || !titulo_livro) {
      return NextResponse.json(
        {
          erro: "O ISBN e o Título do livro são obrigatórios.",
        },
        { status: 400 },
      );
    }

    const valorOuNull = (val: any) =>
      val && String(val).trim() !== ""
        ? String(val).trim()
        : null;

    const novoLivro = await db.livro.create({
      data: {
        isbn: String(isbn).trim(),

        titulo_livro: String(titulo_livro).trim(),

        autor_livro:
          valorOuNull(autor_livro) ??
          "Autor Não Informado",

        editora_livro:
          valorOuNull(editora_livro) ??
          "Editora Não Informada",

        anopub_livro:
          Number(anopub_livro) ||
          new Date().getFullYear(),

        genero_livro:
          valorOuNull(genero_livro) ??
          "Geral",

        localizacao_livro:
          valorOuNull(localizacao_livro),

        imgcapa_livro:
          valorOuNull(imgcapa_livro),

        sinopse_livro:
          valorOuNull(sinopse_livro),

        ...(fk_bibliotecario_id_bibliotecario && {
          fk_bibliotecario_id_bibliotecario:
            Number(fk_bibliotecario_id_bibliotecario),
        }),
      },
    });

    return NextResponse.json(
      {
        mensagem: "Livro cadastrado com sucesso!",
        livro: novoLivro,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Erro ao cadastrar livro:",
      error,
    );

    return NextResponse.json(
      {
        erro:
          "Erro interno no servidor ao tentar salvar o livro.",
      },
      { status: 500 },
    );
  }
}
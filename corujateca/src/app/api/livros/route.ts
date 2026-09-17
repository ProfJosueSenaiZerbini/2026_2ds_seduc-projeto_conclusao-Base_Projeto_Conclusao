import { NextResponse } from "next/server";

import { db } from "@/app/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const titulo = searchParams.get("titulo")?.trim() || "";
    const genero = searchParams.get("genero")?.trim() || "";
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

    const condicoes = ["inativo_livro = false"];

    const valores: (string | number)[] = [];

    if (titulo) {
      valores.push(titulo);

      condicoes.push(
        `unaccent(titulo_livro) ILIKE '%' || unaccent($${valores.length}) || '%'`,
      );
    }

    if (genero) {
      valores.push(genero);

      condicoes.push(
        `unaccent(genero_livro) ILIKE '%' || unaccent($${valores.length}) || '%'`,
      );
    }

    if (autor) {
      valores.push(autor);

      condicoes.push(
        `unaccent(autor_livro) ILIKE '%' || unaccent($${valores.length}) || '%'`,
      );
    }

    if (ano) {
      valores.push(Number(ano));

      condicoes.push(
        `anopub_livro = $${valores.length}`,
      );
    }

    const consultaBase = `
      FROM livro
      WHERE ${condicoes.join(" AND ")}
    `;

    const consultaTotal = `
      SELECT COUNT(*)::int AS total
      ${consultaBase}
    `;

    const resultadoTotal = await db.$queryRawUnsafe<
      { total: number }[]
    >(consultaTotal, ...valores);

    const total = resultadoTotal[0]?.total ?? 0;

    const totalPaginas = Math.max(
      1,
      Math.ceil(total / limite),
    );

    const valoresComPaginacao = [
      ...valores,
      limite,
      offset,
    ];

    const consultaLivros = `
      SELECT
        id_livro,
        isbn,
        titulo_livro,
        autor_livro,
        sinopse_livro,
        editora_livro,
        anopub_livro,
        imgcapa_livro,
        genero_livro,
        inativo_livro,
        localizacao_livro
      ${consultaBase}
      ORDER BY titulo_livro ASC
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
    } = body;

    if (!isbn || !titulo_livro) {
      return NextResponse.json(
        {
          erro:
            "O ISBN e o Título do livro são obrigatórios.",
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
          valorOuNull(genero_livro) ?? "Geral",
        localizacao_livro:
          valorOuNull(localizacao_livro),
        imgcapa_livro:
          valorOuNull(imgcapa_livro),
        sinopse_livro:
          valorOuNull(sinopse_livro),
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
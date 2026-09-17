import { NextResponse } from "next/server";

import { db } from "@/app/db";

export async function GET() {
  try {
    const livrosInativos = await db.livro.findMany({
      where: {
        inativo_livro: true,
      },
      select: {
        id_livro: true,
        isbn: true,
        titulo_livro: true,
        autor_livro: true,
      },
      orderBy: {
        titulo_livro: "asc",
      },
    });

    return NextResponse.json(livrosInativos, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar livros inativos:", error);

    return NextResponse.json(
      { erro: "Erro ao buscar livros inativos." },
      { status: 500 },
    );
  }
}
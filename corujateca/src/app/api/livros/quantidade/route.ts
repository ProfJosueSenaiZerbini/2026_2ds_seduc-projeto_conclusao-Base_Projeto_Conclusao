import { NextResponse } from "next/server";

import { db } from "@/app/db";

export async function GET() {
  try {
    const quantidadeTitulos = await db.livro.count({
      where: {
        inativo_livro: false,
      },
    });

    const quantidadeExemplares = await db.exemplar.count({
      where: {
        inativo_exemplar: false,
        livro: {
          inativo_livro: false,
        },
      },
    });

    const quantidadeTotal =
      quantidadeTitulos + quantidadeExemplares;

    return NextResponse.json(
      {
        quantidadeTitulos,
        quantidadeExemplares,
        quantidadeTotal,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao buscar quantidade do acervo:", error);

    return NextResponse.json(
      { erro: "Erro ao buscar quantidade do acervo." },
      { status: 500 },
    );
  }
}
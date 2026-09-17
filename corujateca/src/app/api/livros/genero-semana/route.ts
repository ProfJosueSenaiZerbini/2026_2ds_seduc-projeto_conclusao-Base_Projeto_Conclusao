import { NextResponse } from "next/server";
import { db } from "@/app/db";

const generos = [
  "Romance",
  "Religião e Mitologia",
  "Ficção Científica",
  "Arte e Cultura",
  "Fantasia",
  "Biografias e Memórias",
  "Thriller e Mistério",
  "Quadrinhos e Mangá",
  "Terror",
  "Infantojuvenil",
  "Aventura",
  "Ciência e Conhecimento",
  "Poesia e Crônicas",
  "História",
  "Guia, Manual e Gastronomia",
  "Política",
  "Autoajuda e Desenvolvimento Pessoal",
  "Economia",
  "Literatura",
];

function obterDomingoDaSemana() {
  const agora = new Date();

  const diaDaSemana = agora.getDay();

  const domingo = new Date(agora);

  domingo.setDate(agora.getDate() - diaDaSemana);

  domingo.setHours(0, 0, 0, 0);

  return domingo;
}

function sortearGenero(domingo: Date) {
  const dataSemana = domingo.toISOString().split("T")[0];

  let numero = 0;

  for (let i = 0; i < dataSemana.length; i++) {
    numero =
      (numero * 31 + dataSemana.charCodeAt(i)) %
      generos.length;
  }

  return generos[numero];
}

export async function GET() {
  try {
    const domingo = obterDomingoDaSemana();

    const generoSemana = sortearGenero(domingo);

    const livros = await db.livro.findMany({
      where: {
        inativo_livro: false,
        genero_livro: {
          equals: generoSemana,
          mode: "insensitive",
        },
      },
    });

    return NextResponse.json(
      {
        genero: generoSemana,
        livros,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao buscar gênero da semana:", error);

    return NextResponse.json(
      { erro: "Erro interno ao buscar gênero da semana." },
      { status: 500 },
    );
  }
}
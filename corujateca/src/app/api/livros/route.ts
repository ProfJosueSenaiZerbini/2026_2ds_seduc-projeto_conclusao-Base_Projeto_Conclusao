import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const titulo = searchParams.get('titulo')?.trim();
    const autor = searchParams.get('autor')?.trim();
    const genero = searchParams.get('genero')?.trim();
    const ano = searchParams.get('ano')?.trim();

    let anoNumerico: number | undefined = undefined;

    if (ano) {
      anoNumerico = Number(ano);

      if (!Number.isInteger(anoNumerico)) {
        return NextResponse.json(
          {
            erro: 'O parâmetro ano deve ser um número inteiro.',
          },
          { status: 400 }
        );
      }
    }

    const livros = await db.livro.findMany({
      where: {
        inativo_livro: false,

        ...(titulo && {
          titulo_livro: {
            contains: titulo,
            mode: 'insensitive',
          },
        }),

        ...(autor && {
          autor_livro: {
            contains: autor,
            mode: 'insensitive',
          },
        }),

        ...(genero && {
          genero_livro: {
            contains: genero,
            mode: 'insensitive',
          },
        }),

        ...(anoNumerico !== undefined && {
          anopub_livro: anoNumerico,
        }),
      },

      select: {
        id_livro: true,
        isbn: true,
        titulo_livro: true,
        autor_livro: true,
        editora_livro: true,
        anopub_livro: true,
        imgcapa_livro: true,
        genero_livro: true,
        localizacao_livro: true,
      },

      orderBy: {
        titulo_livro: 'asc',
      },
    });

    return NextResponse.json({
      livros,
    });
  } catch (error) {

    console.error('Erro ao buscar livros:', error);

    return NextResponse.json(
      {
        erro: 'Erro interno ao buscar livros.',
      },
      { status: 500 }
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
          erro: 'O ISBN e o Título do livro são obrigatórios.',
        },
        { status: 400 }
      );
    }


    const valorOuNull = (valor: unknown) =>
      valor && String(valor).trim() !== ''
        ? String(valor).trim()
        : null;


    const novoLivro = await db.livro.create({
      data: {
        isbn: String(isbn).trim(),

        titulo_livro: String(titulo_livro).trim(),

        autor_livro:
          valorOuNull(autor_livro) ?? 'Autor Não Informado',

        editora_livro:
          valorOuNull(editora_livro) ?? 'Editora Não Informada',

        anopub_livro:
          Number(anopub_livro) || new Date().getFullYear(),

        genero_livro:
          valorOuNull(genero_livro) ?? 'Geral',

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
        mensagem: 'Livro cadastrado com sucesso!',
        livro: novoLivro,
      },
      { status: 201 }
    );
  } catch (error) {

    console.error('Erro ao cadastrar livro:', error);

    return NextResponse.json(
      {
        erro: 'Erro interno no servidor ao tentar salvar o livro.',
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function GET() {
  try {
    const livros = await db.livro.findMany({
      where: { inativo_livro: false },
      include: {
        exemplar: true, // Já traz a lista de exemplares/cópias atrelados
      },
    });

    return NextResponse.json(livros, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao buscar livros no banco de dados.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (
      !isbn ||
      !titulo_livro ||
      !autor_livro ||
      !editora_livro ||
      !anopub_livro ||
      !genero_livro ||
      !localizacao_livro ||
      !imgcapa_livro
    ) {
      return NextResponse.json(
        {
          erro: 'Campos obrigatórios ausentes. Verifique: isbn, titulo_livro, autor_livro, editora_livro, anopub_livro, genero_livro, localizacao_livro e imgcapa_livro.',
        },
        { status: 400 }
      );
    }

    const livroExistente = await db.livro.findUnique({
      where: { isbn },
    });

    if (livroExistente) {
      return NextResponse.json(
        { erro: 'Já existe um livro cadastrado com este ISBN.' },
        { status: 409 }
      );
    }

    const novoLivro = await db.livro.create({
      data: {
        isbn,
        titulo_livro,
        autor_livro,
        editora_livro,
        anopub_livro: Number(anopub_livro),
        genero_livro,
        localizacao_livro,
        imgcapa_livro,
        sinopse_livro: sinopse_livro || null,
        inativo_livro: false,
      },
    });

    return NextResponse.json(
      { mensagem: 'Livro cadastrado com sucesso!', livro: novoLivro },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar livro:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao salvar o livro no banco de dados.' },
      { status: 500 }
    );
  }
}
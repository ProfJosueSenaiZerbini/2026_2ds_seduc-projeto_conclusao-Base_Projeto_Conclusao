import { NextResponse } from 'next/server';
import { db } from '@/app/db';

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

    // Apenas os campos realmente essenciais continuam obrigatórios
    if (!isbn || !titulo_livro) {
      return NextResponse.json(
        { erro: 'O ISBN e o Título do livro são obrigatórios.' },
        { status: 400 }
      );
    }

    // Converte textos vazios em null para salvar adequadamente no banco
    const valorOuNull = (val: any) =>
      val && String(val).trim() !== '' ? String(val).trim() : null;

    const novoLivro = await db.livro.create({
      data: {
        isbn: String(isbn).trim(),
        titulo_livro: String(titulo_livro).trim(),
        autor_livro: valorOuNull(autor_livro) ?? 'Autor Não Informado',
        editora_livro: valorOuNull(editora_livro) ?? 'Editora Não Informada',
        anopub_livro: Number(anopub_livro) || new Date().getFullYear(),
        genero_livro: valorOuNull(genero_livro) ?? 'Geral',
        localizacao_livro: valorOuNull(localizacao_livro),
        imgcapa_livro: valorOuNull(imgcapa_livro), 
        sinopse_livro: valorOuNull(sinopse_livro),
      },
    });

    return NextResponse.json(
      { mensagem: 'Livro cadastrado com sucesso!', livro: novoLivro },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar livro:', error);
    return NextResponse.json(
      { erro: 'Erro interno no servidor ao tentar salvar o livro.' },
      { status: 500 }
    );
  }
}
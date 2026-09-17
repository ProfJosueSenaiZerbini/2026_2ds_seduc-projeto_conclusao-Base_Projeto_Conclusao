import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_livro: string }> }
) {
  try {
    const { id_livro } = await params;

    const livroAtualizado = await db.livro.update({
      where: {
        id_livro: Number(id_livro),
      },
      data: {
        inativo_livro: false,
      },
    });

    return NextResponse.json({
      mensagem: 'Livro reativado com sucesso!',
      livro: livroAtualizado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: 'Erro ao reativar o livro.' },
      { status: 500 }
    );
  }
}
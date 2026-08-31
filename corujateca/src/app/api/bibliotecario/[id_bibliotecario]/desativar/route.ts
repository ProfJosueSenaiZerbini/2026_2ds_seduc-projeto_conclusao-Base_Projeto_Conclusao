import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_bibliotecario: string }> }
) {
  try {
    const { id_bibliotecario } = await params;

    const bibliotecarioAtualizado = await db.bibliotecario.update({
      where: {
        id_bibliotecario: Number(id_bibliotecario),
      },
      data: {
        inativo_bibliotecario: true,
      },
    });

    return NextResponse.json({
      mensagem: 'Bibliotecario desativado com sucesso!',
      bibliotecario: bibliotecarioAtualizado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: 'Erro ao desativar o bibliotecario.' },
      { status: 500 }
    );
  }
}
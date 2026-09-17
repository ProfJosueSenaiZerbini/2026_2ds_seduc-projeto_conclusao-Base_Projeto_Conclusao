import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_exemplar: string }> }
) {
  try {
    const { id_exemplar } = await params;

    const exemplarAtualizado = await db.exemplar.update({
      where: {
        id_exemplar: Number(id_exemplar),
      },
      data: {
        inativo_exemplar: false,
      },
    });

    return NextResponse.json({
      mensagem: 'Exemplar reativado com sucesso!',
      exemplar: exemplarAtualizado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: 'Erro ao reativar o exemplar.' },
      { status: 500 }
    );
  }
}
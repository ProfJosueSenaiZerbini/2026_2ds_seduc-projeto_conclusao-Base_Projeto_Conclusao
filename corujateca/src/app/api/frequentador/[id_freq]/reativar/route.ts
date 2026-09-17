import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_freq: string }> }
) {
  try {
    const { id_freq } = await params;

    const frequentadorAtualizado = await db.frequentador.update({
      where: {
        id_freq: Number(id_freq),
      },
      data: {
        inativo_freq: false,
      },
    });

    return NextResponse.json({
      mensagem: 'Frequentador reativado com sucesso!',
      frequentador: frequentadorAtualizado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: 'Erro ao reativar o frequentador.' },
      { status: 500 }
    );
  }
}
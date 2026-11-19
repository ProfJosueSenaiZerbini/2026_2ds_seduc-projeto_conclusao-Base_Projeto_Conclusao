import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_exemplar?: string; id?: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams.id_exemplar || resolvedParams.id;
    const idExemplar = Number(rawId);

    if (!rawId || Number.isNaN(idExemplar)) {
      return NextResponse.json({ erro: 'ID inválido.' }, { status: 400 });
    }

    const exemplarAtualizado = await db.exemplar.update({
      where: {
        id_exemplar: idExemplar,
      },
      data: {
        inativo_exemplar: false,
        status_exemplar: 'Dispon_vel', // Garante que o exemplar volte a ficar disponível para empréstimo
      },
    });

    return NextResponse.json({
      mensagem: 'Exemplar reativado com sucesso!',
      exemplar: exemplarAtualizado,
    });
  } catch (error) {
    console.error('Erro ao reativar exemplar:', error);

    return NextResponse.json(
      { erro: 'Erro ao reativar o exemplar.' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_exemplar: string }> }
) {
  try {
    const { id_exemplar } = await params;
    const idExemplar = Number(id_exemplar);

    if (!id_exemplar || Number.isNaN(idExemplar)) {
      return NextResponse.json({ erro: 'ID inválido.' }, { status: 400 });
    }

    // Busca o exemplar no banco para verificar o status atual
    const exemplar = await db.exemplar.findUnique({
      where: {
        id_exemplar: idExemplar,
      },
    });

    if (!exemplar) {
      return NextResponse.json({ erro: 'Exemplar não encontrado.' }, { status: 404 });
    }

    // Regra de negócio: Não permitir desativar se estiver emprestado (Em_posse)
    if (exemplar.status_exemplar === 'Em_posse') {
      return NextResponse.json(
        { erro: 'Não é permitido desativar exemplares que estão atualmente emprestados.' },
        { status: 400 }
      );
    }

    const exemplarAtualizado = await db.exemplar.update({
      where: {
        id_exemplar: idExemplar,
      },
      data: {
        inativo_exemplar: true,
      },
    });

    return NextResponse.json({
      mensagem: 'Exemplar desativado com sucesso!',
      exemplar: exemplarAtualizado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: 'Erro ao desativar o exemplar.' },
      { status: 500 }
    );
  }
}
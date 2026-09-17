import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_emprestimo: string }> }
) {
  try {
    const { id_emprestimo } = await params;

    const emprestimoAtualizado = await db.emprestimo.update({
      where: {
        id_emprestimo: Number(id_emprestimo),
      },
      data: {
        inativo_emprestimo: true,
      },
    });

    await db.exemplar.update({
      where: {
        id_exemplar: emprestimoAtualizado.fk_exemplar_id_exemplar,
      },
      data: {
        status_exemplar: "Dispon_vel",
      },
    });

    return NextResponse.json({
      mensagem: 'Empréstimo desativado/cancelado com sucesso!',
      emprestimo: emprestimoAtualizado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: 'Erro ao desativar/cancelar o empréstimo.' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id_freq: string }> }
) {
  try {
    const { id_freq } = await params;
    const idFreq = Number(id_freq);

    if (!id_freq || Number.isNaN(idFreq)) {
      return NextResponse.json({ erro: 'ID inválido.' }, { status: 400 });
    }

    // Regra de negócio: não permitir a exclusão (desativação) do
    // frequentador caso ele possua empréstimo ativo.
    const emprestimosAtivos = await db.emprestimo.count({
      where: {
        fk_frequentador_id_freq: idFreq,
        inativo_emprestimo: false,
      },
    });

    if (emprestimosAtivos > 0) {
      return NextResponse.json(
        {
          erro:
            'Não é possível desativar este frequentador: ele possui empréstimo(s) ativo(s).',
        },
        { status: 409 }
      );
    }

    // Regra de negócio: não permitir a exclusão (desativação) do
    // frequentador caso ele possua multa ativa.
    const multasAtivas = await db.multa.count({
      where: {
        fk_frequentador_id_frequentador: idFreq,
        inativo_multa: false,
      },
    });

    if (multasAtivas > 0) {
      return NextResponse.json(
        {
          erro:
            'Não é possível desativar este frequentador: ele possui multa(s) ativa(s).',
        },
        { status: 409 }
      );
    }

    const frequentadorAtualizado = await db.frequentador.update({
      where: {
        id_freq: idFreq,
      },
      data: {
        inativo_freq: true,
      },
    });

    return NextResponse.json({
      mensagem: 'Frequentador desativado com sucesso!',
      frequentador: frequentadorAtualizado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: 'Erro ao desativar o frequentador.' },
      { status: 500 }
    );
  }
}

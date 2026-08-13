import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function GET() {
  try {
    const exemplares = await db.exemplar.findMany({
      where: { inativo_exemplar: false },
      include: {
        livro: true, // Traz os dados do livro associado ao exemplar
      },
    });

    return NextResponse.json(exemplares, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar exemplares:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao buscar exemplares no banco de dados.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fk_livro_id_livro, status_exemplar } = body;

    if (!fk_livro_id_livro) {
      return NextResponse.json(
        { erro: 'O ID do livro (fk_livro_id_livro) é obrigatório.' },
        { status: 400 }
      );
    }

    // 1. Verifica se o livro existe no banco
    const livroExistente = await db.livro.findUnique({
      where: { id_livro: Number(fk_livro_id_livro) },
    });

    if (!livroExistente) {
      return NextResponse.json(
        { erro: 'Livro não encontrado para associar o exemplar.' },
        { status: 404 }
      );
    }

    // 2. Cria o novo exemplar
    const novoExemplar = await db.exemplar.create({
      data: {
        fk_livro_id_livro: Number(fk_livro_id_livro),
        status_exemplar: status_exemplar || 'Dispon_vel',
        inativo_exemplar: false,
      },
    });

    return NextResponse.json(
      { mensagem: 'Exemplar cadastrado com sucesso!', exemplar: novoExemplar },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar exemplar:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao cadastrar o exemplar.' },
      { status: 500 }
    );
  }
}

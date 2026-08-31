import { NextResponse } from 'next/server';
import { db } from '@/app/db';

export async function POST(request: Request) {
  try {
    // Tratamento para evitar erro se o body vier vazio
    const text = await request.text();
    if (!text) {
      return NextResponse.json(
        { erro: 'O corpo da requisição está vazio. Envie um JSON válido.' },
        { status: 400 }
      );
    }

    const body = JSON.parse(text);

    const {
      dta_inicio_multa,
      dta_termino_multa,
      tipomulta,
      fk_bibliotecario_id_bibliotecario,
      fk_frequentador_id_frequentador,
    } = body;

    if (
      !dta_inicio_multa ||
      !dta_termino_multa ||
      !fk_bibliotecario_id_bibliotecario ||
      !fk_frequentador_id_frequentador
    ) {
      return NextResponse.json(
        { erro: 'Todos os campos obrigatórios devem ser preenchidos.' },
        { status: 400 }
      );
    }

    const [novaMulta] = await db.$transaction([
      db.multa.create({
        data: {
          dta_inicio_multa: new Date(dta_inicio_multa),
          dta_termino_multa: new Date(dta_termino_multa),
          tipomulta: String(tipomulta || 'ATRASO').trim(),
          fk_bibliotecario_id_bibliotecario: Number(fk_bibliotecario_id_bibliotecario),
          fk_frequentador_id_frequentador: Number(fk_frequentador_id_frequentador),
        },
      }),
      db.frequentador.update({
        where: { id_freq: Number(fk_frequentador_id_frequentador) },
        data: { suspensao_freq: true },
      }),
    ]);

    return NextResponse.json(
      { mensagem: 'Multa aplicada e frequentador suspenso com sucesso!', multa: novaMulta },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao cadastrar multa:', error);
    return NextResponse.json(
      { erro: 'Erro no servidor', detalhe: error?.message || String(error) },
      { status: 500 }
    );
  }
}
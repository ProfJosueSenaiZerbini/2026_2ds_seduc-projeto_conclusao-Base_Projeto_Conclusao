import { NextResponse } from "next/server";

import { db } from "@/app/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id_freq: string }> }
) {
  try {
    const { id_freq } = await params;
    const idFreq = Number(id_freq);

    if (!Number.isInteger(idFreq) || idFreq <= 0) {
      return NextResponse.json({ erro: "ID inválido." }, { status: 400 });
    }

    const frequentador = await db.frequentador.findUnique({
      where: { id_freq: idFreq },
      include: { tel_freq: true },
    });

    if (!frequentador) {
      return NextResponse.json(
        { erro: "Frequentador não encontrado." },
        { status: 404 }
      );
    }

    const [totalEmprestimos, totalMultas] = await Promise.all([
      db.emprestimo.count({
        where: {
          fk_frequentador_id_freq: idFreq,
          inativo_emprestimo: false,
        },
      }),
      db.multa.count({
        where: {
          fk_frequentador_id_frequentador: idFreq,
          inativo_multa: false,
        },
      }),
    ]);

    const primeiroTelefone = frequentador.tel_freq[0];

    return NextResponse.json(
      {
        id: frequentador.id_freq,
        nome: frequentador.nome_freq,
        inativo: frequentador.inativo_freq,
        suspenso: frequentador.suspensao_freq,
        ddd: primeiroTelefone?.ddd_freq || "",
        telefone: primeiroTelefone?.numtel_freq || "",
        totalEmprestimos,
        totalMultas,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao buscar detalhes do frequentador:", error.message || error);
    return NextResponse.json(
      { erro: "Erro ao buscar os detalhes do frequentador." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id_freq: string }> }
) {
  try {
    const { id_freq } = await params;
    const idFreq = Number(id_freq);

    if (!Number.isInteger(idFreq) || idFreq <= 0) {
      return NextResponse.json({ erro: "ID inválido." }, { status: 400 });
    }

    const body = await request.json();
    const { nome, ddd, telefone } = body;

    if (!nome || !String(nome).trim()) {
      return NextResponse.json(
        { erro: "O nome é obrigatório." },
        { status: 400 }
      );
    }

    await db.frequentador.update({
      where: { id_freq: idFreq },
      data: { nome_freq: String(nome).trim() },
    });

    if (ddd !== undefined && telefone !== undefined && ddd !== "" && telefone !== "") {
      const dddLimpo = String(ddd).replace(/\D/g, "");
      const telLimpo = String(telefone).replace(/\D/g, "");
      const telefoneAtual = await db.tel_freq.findFirst({
        where: { fk_frequentador_id_freq: idFreq },
      });

      if (telefoneAtual) {
        await db.tel_freq.update({
          where: { id_tel_freq: telefoneAtual.id_tel_freq },
          data: {
            ddd_freq: dddLimpo,
            numtel_freq: telLimpo,
          },
        });
      } else {
        await db.tel_freq.create({
          data: {
            ddd_freq: dddLimpo,
            numtel_freq: telLimpo,
            fk_frequentador_id_freq: idFreq,
          },
        });
      }
    }

    return NextResponse.json(
      { mensagem: "Frequentador atualizado com sucesso!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("ERRO DETALHADO DO BANCO:", error.message || error);

    return NextResponse.json(
      { erro: `Erro ao atualizar no banco: ${error.message || "Erro desconhecido"}` },
      { status: 500 }
    );
  }
}

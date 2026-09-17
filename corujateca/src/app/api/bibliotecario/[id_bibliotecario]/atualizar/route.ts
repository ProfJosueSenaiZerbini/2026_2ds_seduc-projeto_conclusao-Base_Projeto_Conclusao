import { NextResponse } from "next/server";

import { db } from "@/app/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id_bibliotecario: string }> }
) {
  const { id_bibliotecario } = await params;

  try {
    const body = await request.json();
    const { nome, ddd, telefone } = body;

    if (!id_bibliotecario || isNaN(Number(id_bibliotecario))) {
      return NextResponse.json(
        { erro: "ID do bibliotecário inválido." },
        { status: 400 }
      );
    }

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json(
        { erro: "O nome do bibliotecário é obrigatório." },
        { status: 400 }
      );
    }

    const id = Number(id_bibliotecario);
    const bibliotecario = await db.bibliotecario.update({
      where: { id_bibliotecario: id, inativo_bibliotecario: false },
      data: { nome_bibliotecario: nome.trim() },
    });

    const dddLimpo = ddd ? String(ddd).replace(/\D/g, "") : "";
    const telLimpo = telefone ? String(telefone).replace(/\D/g, "") : "";

    if (dddLimpo && telLimpo) {
      const telefoneAtual = await db.tel_bibliotecario.findFirst({
        where: { fk_bibliotecario_id_bibliotecario: id },
      });

      if (telefoneAtual) {
        await db.tel_bibliotecario.update({
          where: { id_tel_bibliotecario: telefoneAtual.id_tel_bibliotecario },
          data: {
            ddd_bibliotecario: dddLimpo,
            numtel_bibliotecario: telLimpo,
          },
        });
      } else {
        await db.tel_bibliotecario.create({
          data: {
            ddd_bibliotecario: dddLimpo,
            numtel_bibliotecario: telLimpo,
            fk_bibliotecario_id_bibliotecario: id,
          },
        });
      }
    }

    return NextResponse.json(
      {
        mensagem: "Bibliotecário atualizado com sucesso!",
        bibliotecario,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro no servidor:", error?.message || error);
    return NextResponse.json(
      { erro: `Erro no banco de dados: ${error?.message || "Consulte o log do servidor"}` },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id_bibliotecario: string }> }
) {
  return PUT(request, context);
}
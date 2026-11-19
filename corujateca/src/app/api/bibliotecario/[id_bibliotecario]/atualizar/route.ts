import { NextResponse } from "next/server";

import { db } from "@/app/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id_bibliotecario: string }> }
) {
  try {
    const { id_bibliotecario } = await params;

    const id = Number(id_bibliotecario);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { erro: "ID do bibliotecário inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const nome =
      typeof body?.nome === "string"
        ? body.nome.trim()
        : "";

    const ddd =
      typeof body?.ddd === "string"
        ? body.ddd.replace(/\D/g, "")
        : "";

    const telefone =
      typeof body?.telefone === "string"
        ? body.telefone.replace(/\D/g, "")
        : "";

    console.log("Dados recebidos para atualização:", {
      id,
      nome,
      ddd,
      telefone,
    });

    if (!nome) {
      return NextResponse.json(
        { erro: "O nome do bibliotecário é obrigatório." },
        { status: 400 }
      );
    }

    if (!ddd) {
      return NextResponse.json(
        { erro: "O DDD é obrigatório." },
        { status: 400 }
      );
    }

    if (!telefone) {
      return NextResponse.json(
        { erro: "O telefone é obrigatório." },
        { status: 400 }
      );
    }

    if (ddd.length !== 2) {
      return NextResponse.json(
        { erro: "O DDD deve possuir 2 dígitos." },
        { status: 400 }
      );
    }

    if (telefone.length !== 8 && telefone.length !== 9) {
      return NextResponse.json(
        { erro: "O telefone deve possuir 8 ou 9 dígitos." },
        { status: 400 }
      );
    }

    const bibliotecario = await db.bibliotecario.findUnique({
      where: {
        id_bibliotecario: id,
      },
    });

    if (!bibliotecario) {
      return NextResponse.json(
        { erro: "Bibliotecário não encontrado." },
        { status: 404 }
      );
    }

    if (bibliotecario.inativo_bibliotecario) {
      return NextResponse.json(
        { erro: "Este bibliotecário está inativo." },
        { status: 400 }
      );
    }

    /*
     * Atualiza o nome do bibliotecário.
     */
    const bibliotecarioAtualizado =
      await db.bibliotecario.update({
        where: {
          id_bibliotecario: id,
        },
        data: {
          nome_bibliotecario: nome,
        },
      });

    /*
     * Procura o telefone atual do bibliotecário.
     */
    const telefoneAtual =
      await db.tel_bibliotecario.findFirst({
        where: {
          fk_bibliotecario_id_bibliotecario: id,
        },
      });

    /*
     * Se já existe telefone, atualiza.
     * Caso contrário, cria um novo.
     */
    if (telefoneAtual) {
      await db.tel_bibliotecario.update({
        where: {
          id_tel_bibliotecario:
            telefoneAtual.id_tel_bibliotecario,
        },
        data: {
          ddd_bibliotecario: ddd,
          numtel_bibliotecario: telefone,
        },
      });
    } else {
      await db.tel_bibliotecario.create({
        data: {
          ddd_bibliotecario: ddd,
          numtel_bibliotecario: telefone,
          fk_bibliotecario_id_bibliotecario: id,
        },
      });
    }

    console.log("Bibliotecário atualizado com sucesso.");

    return NextResponse.json(
      {
        mensagem:
          "Bibliotecário atualizado com sucesso!",
        nome: bibliotecarioAtualizado.nome_bibliotecario,
        ddd,
        telefone,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar bibliotecário:",
      error
    );

    return NextResponse.json(
      {
        erro: "Não foi possível atualizar o bibliotecário.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id_bibliotecario: string }>;
  }
) {
  return PUT(request, context);
}

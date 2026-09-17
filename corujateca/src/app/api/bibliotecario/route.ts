import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { db } from "@/app/db";

export async function GET() {
  try {
    const bibliotecarios = await db.bibliotecario.findMany({
      where: { inativo_bibliotecario: false },
      orderBy: { nome_bibliotecario: "asc" },
    });

    return NextResponse.json(bibliotecarios, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar bibliotecários:", error);
    return NextResponse.json(
      { erro: "Erro ao buscar bibliotecários no banco de dados." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senhaMaster, nome, senha, ddd, telefone } = body;
    const senhaMasterConfigurada = process.env.MASTER_SECRET;

    if (!senhaMasterConfigurada) {
      console.error("MASTER_SECRET não foi configurada.");
      return NextResponse.json(
        { erro: "A senha master não está configurada no servidor." },
        { status: 500 }
      );
    }

    if (senhaMaster !== senhaMasterConfigurada) {
      return NextResponse.json(
        { erro: "Senha master incorreta." },
        { status: 401 }
      );
    }

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json(
        { erro: "O nome do bibliotecário é obrigatório." },
        { status: 400 }
      );
    }

    if (!senha || typeof senha !== "string") {
      return NextResponse.json(
        { erro: "A senha do bibliotecário é obrigatória." },
        { status: 400 }
      );
    }

    const senhaTratada = senha.trim();
    if (senhaTratada.length < 8) {
      return NextResponse.json(
        { erro: "A senha deve ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(senhaTratada, 10);
    const dddLimpo = ddd ? String(ddd).replace(/\D/g, "") : "";
    const telefoneLimpo = telefone ? String(telefone).replace(/\D/g, "") : "";

    const novoBibliotecario = await db.bibliotecario.create({
      data: {
        nome_bibliotecario: nome.trim(),
        senha_bibliotecario: senhaHash,
        ...(dddLimpo && telefoneLimpo
          ? {
              tel_bibliotecario: {
                create: {
                  ddd_bibliotecario: dddLimpo,
                  numtel_bibliotecario: telefoneLimpo,
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json(
      {
        id: novoBibliotecario.id_bibliotecario,
        nome: novoBibliotecario.nome_bibliotecario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao cadastrar bibliotecário:", error);
    return NextResponse.json(
      { erro: "Erro ao cadastrar bibliotecário no banco de dados." },
      { status: 500 }
    );
  }
}

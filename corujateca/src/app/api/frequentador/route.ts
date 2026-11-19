import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { db } from "@/app/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const buscarInativos = searchParams.get("inativos") === "true";
    const buscarTodos = searchParams.get("todos") === "true";

    const where = buscarTodos
      ? {}
      : { inativo_freq: buscarInativos ? true : false };

    const frequentadores = await db.frequentador.findMany({
      where,
      include: { tel_freq: true },
      orderBy: { nome_freq: "asc" },
    });

    const usuariosFormatados = frequentadores.map((usuario) => ({
      id: usuario.id_freq,
      nome: usuario.nome_freq,
      inativo: usuario.inativo_freq,
      suspenso: usuario.suspensao_freq,
      ddd: usuario.tel_freq[0]?.ddd_freq || "",
      telefone: usuario.tel_freq[0]?.numtel_freq || "",
    }));

    return NextResponse.json(usuariosFormatados, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar frequentadores:", error);

    return NextResponse.json(
      {
        erro: "Erro ao buscar a lista de frequentadores no banco de dados.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, senha, ddd, telefone } = body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json(
        { erro: "O nome é obrigatório." },
        { status: 400 }
      );
    }

    if (!senha || typeof senha !== "string") {
      return NextResponse.json(
        { erro: "A senha é obrigatória." },
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
    const telLimpo = telefone ? String(telefone).replace(/\D/g, "") : "";

    const novoUsuario = await db.frequentador.create({
      data: {
        nome_freq: nome.trim(),
        senha_freq: senhaHash,
        ...(dddLimpo && telLimpo
          ? {
              tel_freq: {
                create: {
                  ddd_freq: dddLimpo,
                  numtel_freq: telLimpo,
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json(
      { id: novoUsuario.id_freq, nome: novoUsuario.nome_freq },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao cadastrar frequentador:", error);
    return NextResponse.json(
      { erro: "Erro ao cadastrar frequentador no banco de dados." },
      { status: 500 }
    );
  }
}


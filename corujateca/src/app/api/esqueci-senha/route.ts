import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { db } from "@/app/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senhaMaster, codigoIdentificacaoUsuario, novaSenhaUsuario } = body;

    if (!senhaMaster) {
      return NextResponse.json(
        { erro: "A senha master é obrigatória." },
        { status: 400 }
      );
    }

    const senhaMasterEnv = process.env.MASTER_SECRET;

    if (!senhaMasterEnv) {
      console.error("ERRO: A variável MASTER_SECRET não está configurada no arquivo .env");
      return NextResponse.json(
        { erro: "Configuração do servidor pendente. Contate o administrador." },
        { status: 500 }
      );
    }

    if (senhaMaster !== senhaMasterEnv) {
      return NextResponse.json(
        { erro: "Senha master incorreta." },
        { status: 401 }
      );
    }

    if (!codigoIdentificacaoUsuario || isNaN(Number(codigoIdentificacaoUsuario))) {
      return NextResponse.json(
        { erro: "Código de identificação (ID) inválido." },
        { status: 400 }
      );
    }

    if (!novaSenhaUsuario || novaSenhaUsuario.trim().length < 6) {
      return NextResponse.json(
        { erro: "A nova senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const idBibliotecario = Number(codigoIdentificacaoUsuario);
    const novaSenhaHash = await bcrypt.hash(novaSenhaUsuario.trim(), 10);

    const bibliotecario = await db.bibliotecario.update({
      where: {
        id_bibliotecario: idBibliotecario,
        inativo_bibliotecario: false,
      },
      data: {
        senha_bibliotecario: novaSenhaHash,
      },
    });

    return NextResponse.json(
      { mensagem: "Senha redefinida com sucesso!", bibliotecarioId: bibliotecario.id_bibliotecario },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error?.message || error);
    return NextResponse.json(
      { erro: `Erro no servidor: ${error?.message || "Consulte os logs"}` },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { db } from "@/app/db";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";

export async function DELETE() {
  try {
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { erro: "Usuário não autenticado." },
        { status: 401 },
      );
    }

    const session = decodeSession(sessionCookie);

    if (!session) {
      return NextResponse.json({ erro: "Sessão inválida." }, { status: 401 });
    }

    if (session.role === "frequentador") {
      await db.frequentador.update({
        where: {
          id_freq: session.id,
        },
        data: {
          inativo_freq: true,
        },
      });
    } else {
      await db.bibliotecario.update({
        where: {
          id_bibliotecario: session.id,
        },
        data: {
          inativo_bibliotecario: true,
        },
      });
    }

    const response = NextResponse.json({
      mensagem: "Conta excluída com sucesso.",
    });

    response.cookies.delete(SESSION_COOKIE);

    return response;
  } catch (error) {
    console.error("Erro ao excluir conta:", error);

    return NextResponse.json(
      { erro: "Não foi possível excluir a conta." },
      { status: 500 },
    );
  }
}

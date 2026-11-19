import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/app/db";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 },
      );
    }

    const session = decodeSession(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { error: "Sessão inválida." },
        { status: 401 },
      );
    }

    if (session.role !== "frequentador") {
      return NextResponse.json(
        {
          error:
            "Apenas frequentadores podem consultar este resumo.",
        },
        { status: 403 },
      );
    }

    const [emprestimosEmAndamento, multasPendentes] =
      await Promise.all([
        db.emprestimo.count({
          where: {
            fk_frequentador_id_freq: session.id,
            inativo_emprestimo: false,
            dta_devolucao_real: null,
          },
        }),

        db.multa.count({
          where: {
            fk_frequentador_id_frequentador: session.id,
            inativo_multa: false,
          },
        }),
      ]);

    return NextResponse.json({
      emprestimosEmAndamento,
      multasPendentes,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar resumo do frequentador:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar o resumo do frequentador.",
      },
      { status: 500 },
    );
  }
}
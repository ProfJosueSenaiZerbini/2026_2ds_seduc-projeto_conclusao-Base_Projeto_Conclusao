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

    if (session.role !== "bibliotecario") {
      return NextResponse.json(
        {
          error:
            "Apenas bibliotecários podem consultar este resumo.",
        },
        { status: 403 },
      );
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [livrosEmprestados, multasAtivas] = await Promise.all([
      db.emprestimo.count({
        where: {
          inativo_emprestimo: false,
          dta_devolucao_real: null,
        },
      }),

      db.multa.count({
        where: {
          inativo_multa: false,
          dta_termino_multa: {
            gte: hoje,
          },
        },
      }),
    ]);

    return NextResponse.json({
      livrosEmprestados,
      multasAtivas,
    });
  } catch (error) {
    console.error("Erro ao buscar resumo do bibliotecário:", error);

    return NextResponse.json(
      {
        error: "Não foi possível carregar o resumo do bibliotecário.",
      },
      { status: 500 },
    );
  }
}
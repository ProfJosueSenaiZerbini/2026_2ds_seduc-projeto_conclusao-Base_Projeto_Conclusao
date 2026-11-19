import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/app/db";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";

function formatarData(data: Date) {
    return data.toLocaleDateString("pt-BR", {
        timeZone: "UTC",
    });
}

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
                        "Apenas frequentadores podem consultar estes empréstimos.",
                },
                { status: 403 },
            );
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        const emprestimos = await db.emprestimo.findMany({
            where: {
                fk_frequentador_id_freq: session.id,
                inativo_emprestimo: false,
                dta_devolucao_real: null,
                dta_devolucao: {
                    gte: hoje,
                    lt: amanha,
                },
            },
            include: {
                exemplar: {
                    include: {
                        livro: true,
                    },
                },
            },
            orderBy: {
                dta_devolucao: "asc",
            },
        });

        const emprestimosFormatados = emprestimos.map((emprestimo) => ({
            id: emprestimo.id_emprestimo,
            titulo: emprestimo.exemplar.livro.titulo_livro,
            autor: emprestimo.exemplar.livro.autor_livro,
            dataEmprestimo: formatarData(emprestimo.dta_emprestimo),
            dataDevolucao: formatarData(emprestimo.dta_devolucao),
        }));

        return NextResponse.json({
            emprestimos: emprestimosFormatados,
        });
    } catch (error) {
        console.error(
            "Erro ao buscar empréstimos que vencem hoje:",
            error,
        );

        return NextResponse.json(
            {
                error:
                    "Não foi possível buscar os empréstimos que vencem hoje.",
            },
            { status: 500 },
        );
    }
}
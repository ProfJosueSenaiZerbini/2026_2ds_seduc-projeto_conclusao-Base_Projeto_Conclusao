import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { db } from "@/app/db";





export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id_emprestimo: string }> },
) {
  try {
    const { id_emprestimo } = await params;
    const idEmprestimo = Number(id_emprestimo);

    if (!idEmprestimo) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const emprestimo = await db.emprestimo.findUnique({
      where: { id_emprestimo: idEmprestimo },
      include: { exemplar: true },
    });

    if (!emprestimo) {
      return NextResponse.json(
        { error: "Empréstimo não encontrado." },
        { status: 404 },
      );
    }

    const [emprestimoAtualizado] = await db.$transaction([
      db.emprestimo.update({
        where: { id_emprestimo: idEmprestimo },
        data: {
          dta_devolucao_real: new Date(),
          inativo_emprestimo: true,
        },
      }),
      db.exemplar.update({
        where: { id_exemplar: emprestimo.fk_exemplar_id_exemplar },
        data: { status_exemplar: "Dispon_vel" },
      }),
    ]);

    revalidatePath("/bibliotecario/emprestimos");

    return NextResponse.json({ emprestimo: emprestimoAtualizado });
  } catch (error) {
    console.error("Erro ao concluir empréstimo:", error);
    return NextResponse.json(
      { error: "Erro interno ao concluir empréstimo." },
      { status: 500 },
    );
  }
}

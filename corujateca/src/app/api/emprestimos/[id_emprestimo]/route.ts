import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { db } from "@/app/db";

function obterDataSemHorario(data: Date) {
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
  );
}

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

    const resultado = await db.$transaction(async (tx) => {
      const emprestimo = await tx.emprestimo.findUnique({
        where: { id_emprestimo: idEmprestimo },
        include: { exemplar: true },
      });

      if (!emprestimo) {
        return { tipo: "nao-encontrado" as const };
      }

      if (emprestimo.dta_devolucao_real || emprestimo.inativo_emprestimo) {
        return { tipo: "ja-concluido" as const };
      }

      const dataDevolucaoReal = new Date();
      const houveAtraso =
        obterDataSemHorario(dataDevolucaoReal).getTime() >
        obterDataSemHorario(emprestimo.dta_devolucao).getTime();

      const emprestimoAtualizado = await tx.emprestimo.update({
        where: { id_emprestimo: idEmprestimo },
        data: {
          dta_devolucao_real: dataDevolucaoReal,
          inativo_emprestimo: true,
        },
      });

      await tx.exemplar.update({
        where: { id_exemplar: emprestimo.fk_exemplar_id_exemplar },
        data: { status_exemplar: "Dispon_vel" },
      });

      let multa = null;
      if (houveAtraso) {
        const inicioMulta = obterDataSemHorario(dataDevolucaoReal);
        const dataDevolucaoPrevista = obterDataSemHorario(
          emprestimo.dta_devolucao,
        );
        const diasAtraso = Math.ceil(
          (inicioMulta.getTime() - dataDevolucaoPrevista.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const terminoMulta = new Date(inicioMulta);
        terminoMulta.setUTCDate(terminoMulta.getUTCDate() + diasAtraso);

        multa = await tx.multa.create({
          data: {
            dta_inicio_multa: inicioMulta,
            dta_termino_multa: terminoMulta,
            tipomulta: "ATRASO",
            fk_bibliotecario_id_bibliotecario:
              emprestimo.fk_bibliotecario_id_bibliotecario,
            fk_frequentador_id_frequentador:
              emprestimo.fk_frequentador_id_freq,
          },
        });

        await tx.frequentador.update({
          where: { id_freq: emprestimo.fk_frequentador_id_freq },
          data: { suspensao_freq: true },
        });
      }

      return { tipo: "concluido" as const, emprestimoAtualizado, multa };
    });

    if (resultado.tipo === "nao-encontrado") {
      return NextResponse.json(
        { error: "Empréstimo não encontrado." },
        { status: 404 },
      );
    }

    if (resultado.tipo === "ja-concluido") {
      return NextResponse.json(
        { error: "Este empréstimo já foi concluído." },
        { status: 409 },
      );
    }

    revalidatePath("/bibliotecario/emprestimos");
    revalidatePath("/bibliotecario/multas");

    return NextResponse.json({
      emprestimo: resultado.emprestimoAtualizado,
      multa: resultado.multa,
    });
  } catch (error) {
    console.error("Erro ao concluir empréstimo:", error);
    return NextResponse.json(
      { error: "Erro interno ao concluir empréstimo." },
      { status: 500 },
    );
  }
}

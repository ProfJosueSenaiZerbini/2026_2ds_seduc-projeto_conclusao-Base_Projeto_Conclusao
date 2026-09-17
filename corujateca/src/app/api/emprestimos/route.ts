import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { db } from "@/app/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fkFrequentador = Number(body.fk_frequentador_id_freq);
    const idEnviado = Number(body.fk_exemplar_id_exemplar); // ID do livro ou do exemplar
    const prazoDias = Number(body.prazo_dias) || 7;
    const senhaInformada = body.senha;

    if (!fkFrequentador || !idEnviado || !senhaInformada) {
      return NextResponse.json(
        { error: "Frequentador, exemplar e senha são obrigatórios." },
        { status: 400 },
      );
    }

    const frequentador = await db.frequentador.findUnique({
      where: { id_freq: fkFrequentador },
    });

    if (!frequentador) {
      return NextResponse.json(
        { error: "Frequentador não encontrado." },
        { status: 404 },
      );
    }

    // Validação da senha criptografada (ajuste 'senha_freq' se no seu Prisma o campo tiver outro nome, ex: 'senha')
    const senhaValida = await bcrypt.compare(senhaInformada, frequentador.senha_freq);

    if (!senhaValida) {
      return NextResponse.json(
        { error: "Senha incorreta." },
        { status: 401 },
      );
    }

    // Tenta encontrar como exemplar direto
    let exemplar = await db.exemplar.findFirst({
      where: {
        id_exemplar: idEnviado,
        inativo_exemplar: false,
        status_exemplar: "Dispon_vel",
      },
      include: { livro: true },
    });

    // Se não for exemplar direto, busca uma cópia disponível associada ao ID do livro
    if (!exemplar) {
      exemplar = await db.exemplar.findFirst({
        where: {
          fk_livro_id_livro: idEnviado,
          inativo_exemplar: false,
          status_exemplar: "Dispon_vel",
        },
        include: { livro: true },
      });
    }

    if (!exemplar) {
      return NextResponse.json(
        { error: "Não há cópias disponíveis deste livro para empréstimo no momento." },
        { status: 409 },
      );
    }

    const bibliotecario = await db.bibliotecario.findFirst({
      where: { inativo_bibliotecario: false },
    });

    if (!bibliotecario) {
      return NextResponse.json(
        { error: "Nenhum bibliotecário ativo encontrado." },
        { status: 404 },
      );
    }

    const dataEmprestimo = new Date();
    const dataDevolucao = new Date(dataEmprestimo);
    dataDevolucao.setDate(dataEmprestimo.getDate() + prazoDias);

    const [novoEmprestimo] = await db.$transaction([
      db.emprestimo.create({
        data: {
          dta_emprestimo: dataEmprestimo,
          dta_devolucao: dataDevolucao,
          fk_bibliotecario_id_bibliotecario: bibliotecario.id_bibliotecario,
          fk_exemplar_id_exemplar: exemplar.id_exemplar,
          fk_frequentador_id_freq: fkFrequentador,
        },
      }),
      db.exemplar.update({
        where: { id_exemplar: exemplar.id_exemplar },
        data: { status_exemplar: "Em_posse" },
      }),
    ]);

    revalidatePath("/bibliotecario/emprestimos");
    revalidatePath("/bibliotecario/acervo");

    return NextResponse.json({ emprestimo: novoEmprestimo }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar empréstimo:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar empréstimo." },
      { status: 500 },
    );
  }
}
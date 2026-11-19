
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { db } from "@/app/db";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";

function formatarData(data: Date | string | null) {
  if (!data) return "-";

  const dataObj = new Date(data);

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dataObj);
}

function obterDataAtual() {
  const dataAtual = new Date();
  const ano = dataAtual.getFullYear();
  const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
  const dia = String(dataAtual.getDate()).padStart(2, "0");

  return new Date(`${ano}-${mes}-${dia}T00:00:00.000Z`);
}

async function obterBibliotecarioAutenticado() {
  const cookieStore = await cookies();
  const valorCookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!valorCookie) return null;

  const sessao = decodeSession(valorCookie);

  if (!sessao || sessao.role !== "bibliotecario") {
    return null;
  }

  return db.bibliotecario.findFirst({
    where: {
      id_bibliotecario: sessao.id,
      inativo_bibliotecario: false,
    },
    select: {
      id_bibliotecario: true,
    },
  });
}

async function concluirMultasVencidas(dataAtual: Date) {
  const multasVencidas = await db.multa.findMany({
    where: {
      inativo_multa: false,
      tipomulta: "ATRASO",
      dta_termino_multa: { lte: dataAtual },
    },
    select: {
      fk_frequentador_id_frequentador: true,
    },
  });

  if (multasVencidas.length === 0) return;

  const frequentadoresAfetados = new Set(
    multasVencidas.map(
      (multa) => multa.fk_frequentador_id_frequentador,
    ),
  );

  await db.$transaction(async (tx) => {
    await tx.multa.updateMany({
      where: {
        inativo_multa: false,
        tipomulta: "ATRASO",
        dta_termino_multa: { lte: dataAtual },
      },
      data: { inativo_multa: true },
    });

    for (const frequentadorId of frequentadoresAfetados) {
      const multasAtivas = await tx.multa.count({
        where: {
          fk_frequentador_id_frequentador: frequentadorId,
          inativo_multa: false,
        },
      });

      if (multasAtivas === 0) {
        await tx.frequentador.update({
          where: { id_freq: frequentadorId },
          data: { suspensao_freq: false },
        });
      }
    }
  });
}

export async function GET(request: Request) {
  try {
    const dataAtual = obterDataAtual();
    await concluirMultasVencidas(dataAtual);

    const searchParams = new URL(request.url).searchParams;

    const usuario = searchParams.get("usuario")?.trim();
    const data = searchParams.get("data")?.trim();
    const status = searchParams.get("status")?.trim().toUpperCase();
    const tipo = searchParams.get("tipo")?.trim().toUpperCase();

    const frequentadorIdParam = searchParams.get(
      "fk_frequentador_id_frequentador",
    );

    const frequentadorId = frequentadorIdParam
      ? Number(frequentadorIdParam)
      : undefined;

    if (
      frequentadorIdParam &&
      (!Number.isInteger(frequentadorId) || frequentadorId! <= 0)
    ) {
      return NextResponse.json(
        { erro: "Identificador do frequentador inválido." },
        { status: 400 },
      );
    }

    const statusNormalizado =
      status === "PAGA" ? "CANCELADA" : status;

    const tipoNormalizado = tipo || undefined;

    const dataInicio = data
      ? new Date(`${data}T00:00:00.000Z`)
      : undefined;

    if (data && (!dataInicio || Number.isNaN(dataInicio.getTime()))) {
      return NextResponse.json(
        { erro: "Data inválida." },
        { status: 400 },
      );
    }

    const dataFim = dataInicio
      ? new Date(dataInicio.getTime() + 24 * 60 * 60 * 1000)
      : undefined;

    // IMPORTANTE:
    // Sem status selecionado, não aplicamos filtro de situação.
    // Assim, multas pendentes, concluídas e canceladas são retornadas.
    const filtroStatus: Prisma.multaWhereInput =
      !statusNormalizado
        ? {}
        : statusNormalizado === "PENDENTE"
          ? {
            inativo_multa: false,
          }
          : statusNormalizado === "CONCLUÍDA" ||
            statusNormalizado === "CONCLUIDA"
            ? {
              inativo_multa: true,
              tipomulta: "ATRASO",
              dta_termino_multa: { lte: dataAtual },
            }
            : statusNormalizado === "CANCELADA"
              ? {
                inativo_multa: true,
                NOT: {
                  tipomulta: "ATRASO",
                  dta_termino_multa: { lte: dataAtual },
                },
              }
              : {
                id_multa: -1,
              };

    const where: Prisma.multaWhereInput = {
      ...filtroStatus,

      ...(frequentadorId !== undefined
        ? {
          fk_frequentador_id_frequentador: frequentadorId,
        }
        : {}),

      ...(usuario
        ? {
          frequentador: {
            nome_freq: {
              contains: usuario,
              mode: "insensitive",
            },
          },
        }
        : {}),

      ...(tipoNormalizado
        ? {
          tipomulta: {
            equals: tipoNormalizado,
            mode: "insensitive",
          },
        }
        : {}),

      ...(dataInicio && dataFim
        ? {
          OR: [
            {
              dta_inicio_multa: {
                gte: dataInicio,
                lt: dataFim,
              },
            },
            {
              dta_termino_multa: {
                gte: dataInicio,
                lt: dataFim,
              },
            },
          ],
        }
        : {}),
    };

    const [multas, frequentadores, totaisAtivos] = await Promise.all([
      db.multa.findMany({
        where,
        include: { frequentador: true },
        orderBy: { dta_inicio_multa: "desc" },
      }),

      db.frequentador.findMany({
        where: { inativo_freq: false },
        select: {
          id_freq: true,
          nome_freq: true,
        },
        orderBy: { nome_freq: "asc" },
      }),

      db.multa.findMany({
        where: { inativo_multa: false },
        select: { tipomulta: true },
      }),
    ]);

    const multasFormatadas = multas.map((multa) => ({
      id: multa.id_multa,
      usuario: multa.frequentador.nome_freq,

      diasPunicao: Math.max(
        1,
        Math.ceil(
          (new Date(multa.dta_termino_multa).getTime() -
            new Date(multa.dta_inicio_multa).getTime()) /
          (1000 * 60 * 60 * 24),
        ),
      ),

      status: multa.inativo_multa
        ? multa.tipomulta.toUpperCase() === "ATRASO" &&
          multa.dta_termino_multa <= dataAtual
          ? "Concluída"
          : "Cancelada"
        : "Pendente",

      tipo: multa.tipomulta,
      dataInicio: formatarData(multa.dta_inicio_multa),
      dataTermino: formatarData(multa.dta_termino_multa),
    }));

    const contarPorTipo = (tipo: string) =>
      totaisAtivos.filter(
        (multa) => multa.tipomulta.toUpperCase() === tipo,
      ).length;

    return NextResponse.json({
      multas: multasFormatadas,
      frequentadores,
      tipos: ["ATRASO", "DEPREDAÇÃO", "EXTRAVIO"],
      tiposCadastro: ["DEPREDAÇÃO", "EXTRAVIO"],

      totais: {
        atraso: contarPorTipo("ATRASO"),
        depredacao: contarPorTipo("DEPREDAÇÃO"),
        extravio: contarPorTipo("EXTRAVIO"),
      },
    });
  } catch (error) {
    console.error("Erro ao consultar multas:", error);

    return NextResponse.json(
      { erro: "Erro ao carregar as multas." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const idMulta = Number(body.id_multa);

    if (!idMulta) {
      return NextResponse.json(
        { erro: "O id da multa é obrigatório." },
        { status: 400 },
      );
    }

    const multa = await db.multa.findUnique({
      where: { id_multa: idMulta },
    });

    if (!multa) {
      return NextResponse.json(
        { erro: "Multa não encontrada." },
        { status: 404 },
      );
    }

    if (multa.inativo_multa) {
      return NextResponse.json(
        { erro: "Esta multa já foi encerrada." },
        { status: 409 },
      );
    }

    const dataAtual = obterDataAtual();

    await db.$transaction(async (tx) => {
      await tx.multa.update({
        where: { id_multa: idMulta },
        data: { inativo_multa: true },
      });

      const multasAtivas = await tx.multa.count({
        where: {
          fk_frequentador_id_frequentador:
            multa.fk_frequentador_id_frequentador,
          inativo_multa: false,
        },
      });

      if (multasAtivas === 0) {
        await tx.frequentador.update({
          where: {
            id_freq: multa.fk_frequentador_id_frequentador,
          },
          data: { suspensao_freq: false },
        });
      }
    });

    revalidatePath("/bibliotecario/multas");

    return NextResponse.json({
      mensagem:
        multa.tipomulta.toUpperCase() === "ATRASO" &&
          multa.dta_termino_multa <= dataAtual
          ? "Multa concluída com sucesso."
          : "Multa cancelada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao cancelar multa:", error);

    return NextResponse.json(
      { erro: "Erro ao cancelar a multa." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const bibliotecario = await obterBibliotecarioAutenticado();

    if (!bibliotecario) {
      return NextResponse.json(
        {
          erro: "Acesso negado. Entre com uma conta ativa de bibliotecário.",
        },
        { status: 401 },
      );
    }

    const text = await request.text();

    if (!text) {
      return NextResponse.json(
        {
          erro: "O corpo da requisição está vazio. Envie um JSON válido.",
        },
        { status: 400 },
      );
    }

    let body: Record<string, unknown>;

    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        {
          erro: "O corpo da requisição deve ser um JSON válido.",
        },
        { status: 400 },
      );
    }

    const {
      dta_termino_multa,
      tipomulta,
      fk_frequentador_id_frequentador,
    } = body;

    const tiposPermitidos = ["ATRASO", "DEPREDAÇÃO", "EXTRAVIO"];

    const tipoTratado = String(tipomulta || "")
      .trim()
      .toUpperCase();

    if (tipoTratado === "ATRASO") {
      return NextResponse.json(
        {
          erro: "Multas de atraso são criadas automaticamente após a devolução do empréstimo atrasado.",
        },
        { status: 409 },
      );
    }

    const inicio = obterDataAtual();

    const terminoInformado = dta_termino_multa
      ? new Date(`${String(dta_termino_multa)}T00:00:00.000Z`)
      : null;

    const frequentadorId = Number(fk_frequentador_id_frequentador);

    const prazoAutomatico =
      tipoTratado === "DEPREDAÇÃO"
        ? 15
        : tipoTratado === "EXTRAVIO"
          ? 30
          : undefined;

    const termino = prazoAutomatico
      ? new Date(
        inicio.getTime() + prazoAutomatico * 24 * 60 * 60 * 1000,
      )
      : terminoInformado;

    if (
      !tiposPermitidos.includes(tipoTratado) ||
      !Number.isInteger(frequentadorId) ||
      frequentadorId <= 0 ||
      !termino ||
      Number.isNaN(termino.getTime()) ||
      termino < inicio
    ) {
      return NextResponse.json(
        { erro: "Informe dados válidos para a multa." },
        { status: 400 },
      );
    }

    const frequentador = await db.frequentador.findFirst({
      where: {
        id_freq: frequentadorId,
        inativo_freq: false,
      },
      select: { id_freq: true },
    });

    if (!frequentador) {
      return NextResponse.json(
        { erro: "Frequentador não encontrado ou inativo." },
        { status: 404 },
      );
    }

    const [novaMulta] = await db.$transaction([
      db.multa.create({
        data: {
          dta_inicio_multa: inicio,
          dta_termino_multa: termino,
          tipomulta: tipoTratado,
          fk_bibliotecario_id_bibliotecario:
            bibliotecario.id_bibliotecario,
          fk_frequentador_id_frequentador: frequentadorId,
        },
      }),

      db.frequentador.update({
        where: { id_freq: frequentadorId },
        data: { suspensao_freq: true },
      }),
    ]);

    revalidatePath("/bibliotecario/multas");

    return NextResponse.json(
      {
        mensagem: "Multa aplicada e frequentador suspenso com sucesso!",
        multa: novaMulta,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Erro ao cadastrar multa:", error);

    return NextResponse.json(
      {
        erro: "Erro no servidor",
        detalhe: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

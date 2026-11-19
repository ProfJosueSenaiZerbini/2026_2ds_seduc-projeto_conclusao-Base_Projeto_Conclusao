import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { db } from "@/app/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      senhaMaster,
      codigoIdentificacaoUsuario,
      novaSenhaUsuario,
      tipoUsuario,
    } = body;

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

    const tipoUsuarioNormalizado =
      typeof tipoUsuario === "string" ? tipoUsuario.trim().toLowerCase() : "bibliotecario";

    const tipoSuportado =
      tipoUsuarioNormalizado === "frequentador" || tipoUsuarioNormalizado === "usuario"
        ? "frequentador"
        : "bibliotecario";

    const idUsuario = Number(codigoIdentificacaoUsuario);
    const novaSenhaNormalizada = novaSenhaUsuario.trim();

    if (tipoSuportado === "bibliotecario") {
      const bibliotecarioAtual = await db.bibliotecario.findUnique({
        where: {
          id_bibliotecario: idUsuario,
        },
        select: {
          senha_bibliotecario: true,
          inativo_bibliotecario: true,
        },
      });

      if (!bibliotecarioAtual) {
        return NextResponse.json(
          { erro: "Bibliotecário não encontrado." },
          { status: 404 }
        );
      }

      if (bibliotecarioAtual.inativo_bibliotecario) {
        return NextResponse.json(
          { erro: "Bibliotecário inativo não pode redefinir senha." },
          { status: 400 }
        );
      }

      const senhaIgualAtual = await bcrypt.compare(
        novaSenhaNormalizada,
        bibliotecarioAtual.senha_bibliotecario,
      );

      if (senhaIgualAtual) {
        return NextResponse.json(
          { erro: "A nova senha deve ser diferente da senha atual." },
          { status: 400 }
        );
      }

      const novaSenhaHash = await bcrypt.hash(novaSenhaNormalizada, 10);

      const bibliotecario = await db.bibliotecario.update({
        where: {
          id_bibliotecario: idUsuario,
          inativo_bibliotecario: false,
        },
        data: {
          senha_bibliotecario: novaSenhaHash,
        },
      });

      return NextResponse.json(
        {
          mensagem: "Senha redefinida com sucesso!",
          usuarioId: bibliotecario.id_bibliotecario,
          tipoUsuario: "bibliotecario",
        },
        { status: 200 }
      );
    }

    const frequentadorAtual = await db.frequentador.findUnique({
      where: {
        id_freq: idUsuario,
      },
      select: {
        senha_freq: true,
        inativo_freq: true,
      },
    });

    if (!frequentadorAtual) {
      return NextResponse.json(
        { erro: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    if (frequentadorAtual.inativo_freq) {
      return NextResponse.json(
        { erro: "Usuário inativo não pode redefinir senha." },
        { status: 400 }
      );
    }

    const senhaIgualAtual = await bcrypt.compare(
      novaSenhaNormalizada,
      frequentadorAtual.senha_freq,
    );

    if (senhaIgualAtual) {
      return NextResponse.json(
        { erro: "A nova senha deve ser diferente da senha atual." },
        { status: 400 }
      );
    }

    const novaSenhaHash = await bcrypt.hash(novaSenhaNormalizada, 10);

    const frequentador = await db.frequentador.update({
      where: {
        id_freq: idUsuario,
        inativo_freq: false,
      },
      data: {
        senha_freq: novaSenhaHash,
      },
    });

    return NextResponse.json(
      {
        mensagem: "Senha redefinida com sucesso!",
        usuarioId: frequentador.id_freq,
        tipoUsuario: "frequentador",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const mensagemErro = error instanceof Error ? error.message : "Consulte os logs";

    console.error("Erro ao redefinir senha:", mensagemErro);
    return NextResponse.json(
      { erro: `Erro no servidor: ${mensagemErro}` },
      { status: 500 }
    );
  }
}
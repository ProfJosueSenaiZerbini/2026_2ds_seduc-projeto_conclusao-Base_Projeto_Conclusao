import { NextResponse } from "next/server";

import { encodeSession } from "@/lib/auth";
import { authenticateUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const codigoIdentificacao = Number(body?.codigoIdentificacao);
    const senha = String(body?.senha ?? "");
    const perfil = body?.perfil;

    if (
      !Number.isSafeInteger(codigoIdentificacao) ||
      codigoIdentificacao <= 0 ||
      !senha ||
      (perfil !== "bibliotecario" && perfil !== "frequentador")
    ) {
      return NextResponse.json(
        { erro: "Informe um código, uma senha e um perfil válidos." },
        { status: 400 },
      );
    }

    const resultado = await authenticateUser(codigoIdentificacao, senha);

    if (!resultado.ok) {
      return NextResponse.json({ erro: resultado.message }, { status: 401 });
    }

    // Confere o perfil antes de emitir o cookie da sessão.
    if (resultado.user.role !== perfil) {
      return NextResponse.json(
        { erro: "Este usuário não pertence ao perfil selecionado." },
        { status: 403 },
      );
    }

    const response = NextResponse.json(
      {
        mensagem: "Login realizado com sucesso.",
        usuario: resultado.user,
      },
      { status: 200 },
    );

    response.cookies.set("corujateca_session", encodeSession(resultado.user), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);

    return NextResponse.json(
      { erro: "Não foi possível realizar o login." },
      { status: 500 },
    );
  }
}

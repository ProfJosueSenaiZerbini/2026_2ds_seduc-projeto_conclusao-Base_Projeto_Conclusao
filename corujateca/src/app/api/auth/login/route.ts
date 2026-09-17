import { NextResponse } from "next/server";

import { encodeSession } from "@/lib/auth";
import { authenticateUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const codigoIdentificacao = Number(body?.codigoIdentificacao);
    const senha = String(body?.senha ?? "");

    const resultado = await authenticateUser(codigoIdentificacao, senha);

    if (!resultado.ok) {
      return NextResponse.json({ erro: resultado.message }, { status: 401 });
    }

    const response = NextResponse.json(
      {
        mensagem: "Login realizado com sucesso.",
        usuario: resultado.user,
      },
      { status: 200 }
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
      { status: 500 }
    );
  }
}

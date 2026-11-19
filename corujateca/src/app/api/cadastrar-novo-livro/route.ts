import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ mensagem: "Endpoint de cadastro de livro em desenvolvimento." }, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return NextResponse.json(
    {
      mensagem: "Cadastro de livro em desenvolvimento.",
      recebido: body,
    },
    { status: 200 }
  );
}
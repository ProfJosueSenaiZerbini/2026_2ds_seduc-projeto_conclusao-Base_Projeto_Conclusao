import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();

  try {
    const { id } = await params;
    const idFreq = parseInt(id, 10);

    if (isNaN(idFreq)) {
      return NextResponse.json({ erro: "ID inválido." }, { status: 400 });
    }

    const body = await request.json();
    const { nome, ddd, telefone } = body;

    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { erro: "O nome é obrigatório." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // 1. Atualiza Nome
    await client.query(
      `UPDATE frequentador 
       SET nome_freq = $1 
       WHERE id_freq = $2`,
      [nome, idFreq]
    );

    // 2. Atualiza Telefone
    if (ddd !== undefined && telefone !== undefined && ddd !== "" && telefone !== "") {
      const dddLimpo = String(ddd).replace(/\D/g, "");
      const telLimpo = String(telefone).replace(/\D/g, "");

      const checkTel = await client.query(
        `SELECT id_tel_freq FROM tel_freq WHERE fk_frequentador_id_freq = $1`,
        [idFreq]
      );

      if (checkTel.rows.length > 0) {
        await client.query(
          `UPDATE tel_freq 
           SET ddd_freq = $1, numtel_freq = $2 
           WHERE fk_frequentador_id_freq = $3`,
          [dddLimpo, telLimpo, idFreq]
        );
      } else {
        await client.query(
          `INSERT INTO tel_freq (ddd_freq, numtel_freq, fk_frequentador_id_freq) 
           VALUES ($1, $2, $3)`,
          [dddLimpo, telLimpo, idFreq]
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json(
      { mensagem: "Frequentador atualizado com sucesso!" },
      { status: 200 }
    );
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("ERRO DETALHADO DO BANCO:", error.message || error);
    
    return NextResponse.json(
      { erro: `Erro ao atualizar no banco: ${error.message || "Erro desconhecido"}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  try {
    const queryText = `
      SELECT 
        f.id_freq, 
        f.nome_freq, 
        f.inativo_freq, 
        f.suspensao_freq,
        t.ddd_freq,
        t.numtel_freq
      FROM frequentador f
      LEFT JOIN tel_freq t ON f.id_freq = t.fk_frequentador_id_freq
      WHERE f.inativo_freq = false 
      ORDER BY f.nome_freq ASC
    `;
    const result = await pool.query(queryText);

    const usuariosFormatados = result.rows.map((user) => ({
      id: user.id_freq,
      nome: user.nome_freq,
      inativo: user.inativo_freq,
      suspenso: user.suspensao_freq,
      ddd: user.ddd_freq || "",
      telefone: user.numtel_freq || "",
    }));

    return NextResponse.json(usuariosFormatados, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar frequentadores:", error);
    return NextResponse.json(
      { erro: "Erro ao buscar a lista de frequentadores no banco de dados." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, senha, ddd, telefone } = body;

    // 1. Validação de presença do nome
    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json(
        { erro: "O nome é obrigatório." },
        { status: 400 }
      );
    }

    // 2. Validação de presença da senha
    if (!senha || typeof senha !== "string") {
      return NextResponse.json(
        { erro: "A senha é obrigatória." },
        { status: 400 }
      );
    }

    // 3. Trava estrita de tamanho mínimo de 8 caracteres
    const senhaTratada = senha.trim();
    if (senhaTratada.length < 8) {
      return NextResponse.json(
        { erro: "A senha deve ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    // Hash da senha com bcrypt
    const senhaHash = await bcrypt.hash(senhaTratada, 10);

    // Conexão com banco
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Inserção do usuário
      const queryFrequentador = `
        INSERT INTO frequentador (nome_freq, senha_freq) 
        VALUES ($1, $2) 
        RETURNING id_freq, nome_freq
      `;
      const resFrequentador = await client.query(queryFrequentador, [
        nome.trim(),
        senhaHash,
      ]);
      const novoUsuario = resFrequentador.rows[0];

      // Inserção do telefone
      if (ddd && telefone) {
        const dddLimpo = String(ddd).replace(/\D/g, "");
        const telLimpo = String(telefone).replace(/\D/g, "");

        if (dddLimpo && telLimpo) {
          const queryTelefone = `
            INSERT INTO tel_freq (ddd_freq, numtel_freq, fk_frequentador_id_freq) 
            VALUES ($1, $2, $3)
          `;
          await client.query(queryTelefone, [
            dddLimpo,
            telLimpo,
            novoUsuario.id_freq,
          ]);
        }
      }

      await client.query("COMMIT");

      return NextResponse.json(
        { id: novoUsuario.id_freq, nome: novoUsuario.nome_freq },
        { status: 201 }
      );
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao cadastrar frequentador:", error);
    return NextResponse.json(
      { erro: "Erro ao cadastrar frequentador no banco de dados." },
      { status: 500 }
    );
  }
}
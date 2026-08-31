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
                b.id_bibliotecario, 
                b.nome_bibliotecario, 
                b.inativo_bibliotecario, 
                t.ddd_bibliotecario,
                t.numtel_bibliotecario
            FROM bibliotecario b
            LEFT JOIN tel_bibliotecario t 
                ON b.id_bibliotecario = t.fk_bibliotecario_id_bibliotecario
            WHERE b.inativo_bibliotecario = false 
            ORDER BY b.nome_bibliotecario ASC
        `;

        const result = await pool.query(queryText);

        const usuariosFormatados = result.rows.map((user) => ({
            id: user.id_bibliotecario,
            nome: user.nome_bibliotecario,
            inativo: user.inativo_bibliotecario,
            telefone: user.numtel_bibliotecario
                ? `(${user.ddd_bibliotecario}) ${user.numtel_bibliotecario}`
                : null,
        }));

        return NextResponse.json(usuariosFormatados, {
            status: 200,
        });
    } catch (error) {
        console.error("Erro ao buscar bibliotecarios:", error);

        return NextResponse.json(
            {
                erro: "Erro ao buscar a lista de bibliotecarios no banco de dados.",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    let client;

    try {
        const body = await request.json();

        const {
            senhaMaster,
            nome,
            senha,
            ddd,
            telefone,
        } = body;

        // 1. Verifica se a senha master foi enviada
        if (
            typeof senhaMaster !== "string" ||
            senhaMaster.trim() === ""
        ) {
            return NextResponse.json(
                {
                    erro: "A senha do usuário master é obrigatória.",
                },
                { status: 400 }
            );
        }

        // 2. Verifica se MASTER_SECRET existe no servidor
        if (!process.env.MASTER_SECRET) {
            console.error("MASTER_SECRET não configurada.");

            return NextResponse.json(
                {
                    erro: "Erro de configuração do servidor.",
                },
                { status: 500 }
            );
        }

        // 3. Verifica a senha master
        if (senhaMaster !== process.env.MASTER_SECRET) {
            return NextResponse.json(
                {
                    erro: "Senha do usuário master incorreta.",
                },
                { status: 401 }
            );
        }

        // 4. Valida nome e senha do novo usuário
        if (
            typeof nome !== "string" ||
            typeof senha !== "string" ||
            nome.trim() === "" ||
            senha.trim() === ""
        ) {
            return NextResponse.json(
                {
                    erro: "Nome e senha são obrigatórios.",
                },
                { status: 400 }
            );
        }

        // 5. Valida senha
        if (senha.length < 8) {
            return NextResponse.json(
                {
                    erro: "A senha deve ter pelo menos 8 caracteres.",
                },
                { status: 400 }
            );
        }

        // 6. Valida telefone
        if ((ddd && !telefone) || (!ddd && telefone)) {
            return NextResponse.json(
                {
                    erro: "Informe o DDD e o telefone completos.",
                },
                { status: 400 }
            );
        }

        if (ddd && !/^\d{2}$/.test(ddd)) {
            return NextResponse.json(
                {
                    erro: "DDD inválido.",
                },
                { status: 400 }
            );
        }

        if (telefone && !/^\d{8,9}$/.test(telefone)) {
            return NextResponse.json(
                {
                    erro: "Telefone inválido.",
                },
                { status: 400 }
            );
        }

        // 7. Cria o hash da senha do novo usuário
        const senhaHash = await bcrypt.hash(senha, 10);

        // 8. Conecta ao banco
        client = await pool.connect();

        await client.query("BEGIN");

        // 9. Insere bibliotecário
        const queryBibliotecario = `
            INSERT INTO bibliotecario (
                nome_bibliotecario,
                senha_bibliotecario
            ) 
            VALUES ($1, $2) 
            RETURNING 
                id_bibliotecario,
                nome_bibliotecario
        `;

        const resBibliotecario = await client.query(
            queryBibliotecario,
            [nome.trim(), senhaHash]
        );

        const novoUsuario = resBibliotecario.rows[0];

        // 10. Insere telefone, se informado
        if (ddd && telefone) {
            const queryTelefone = `
                INSERT INTO tel_bibliotecario (
                    ddd_bibliotecario,
                    numtel_bibliotecario,
                    fk_bibliotecario_id_bibliotecario
                ) 
                VALUES ($1, $2, $3)
            `;

            await client.query(
                queryTelefone,
                [
                    ddd,
                    telefone,
                    novoUsuario.id_bibliotecario,
                ]
            );
        }

        await client.query("COMMIT");

        return NextResponse.json(
            {
                id: novoUsuario.id_bibliotecario,
                nome: novoUsuario.nome_bibliotecario,
            },
            { status: 201 }
        );

    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Erro ao executar ROLLBACK:",
                    rollbackError
                );
            }
        }

        console.error(
            "Erro ao cadastrar bibliotecario:",
            error
        );

        return NextResponse.json(
            {
                erro: "Erro ao cadastrar bibliotecario no banco de dados.",
            },
            { status: 500 }
        );

    } finally {
        client?.release();
    }
}


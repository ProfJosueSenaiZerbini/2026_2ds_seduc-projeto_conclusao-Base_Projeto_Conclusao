import bcrypt from "bcrypt";

import { db } from "@/app/db";
import type { UserSession } from "@/lib/auth";

export async function comparePassword(inputPassword: string, storedPassword: string): Promise<boolean> {
  if (!storedPassword) {
    return false;
  }

  if (storedPassword.startsWith("$2")) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  return inputPassword === storedPassword;
}

export async function authenticateUser(
  id: number,
  password: string
): Promise<{ ok: true; user: UserSession } | { ok: false; message: string }> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: "Código de identificação inválido." };
  }

  if (!password || password.trim().length === 0) {
    return { ok: false, message: "A senha é obrigatória." };
  }

  try {
    const [bibliotecario, frequentador] = await Promise.all([
      db.bibliotecario.findUnique({
        where: { id_bibliotecario: id },
      }),
      db.frequentador.findUnique({
        where: { id_freq: id },
      }),
    ]);

    const candidatos = await Promise.all([
      bibliotecario && !bibliotecario.inativo_bibliotecario
        ? comparePassword(password, bibliotecario.senha_bibliotecario).then((senhaCorreta) =>
            senhaCorreta
              ? {
                  id: bibliotecario.id_bibliotecario,
                  nome: bibliotecario.nome_bibliotecario,
                  role: "bibliotecario" as const,
                }
              : null
          )
        : Promise.resolve(null),
      frequentador && !frequentador.inativo_freq
        ? comparePassword(password, frequentador.senha_freq).then((senhaCorreta) =>
            senhaCorreta
              ? {
                  id: frequentador.id_freq,
                  nome: frequentador.nome_freq,
                  role: "frequentador" as const,
                }
              : null
          )
        : Promise.resolve(null),
    ]);

    const usuariosAutenticados = candidatos.filter(
      (candidato): candidato is NonNullable<typeof candidato> => candidato !== null
    );

    if (usuariosAutenticados.length === 1) {
      return { ok: true, user: usuariosAutenticados[0] };
    }

    if (usuariosAutenticados.length > 1) {
      return {
        ok: false,
        message: "Não foi possível identificar unicamente o usuário. Procure a biblioteca.",
      };
    }

    if (bibliotecario?.inativo_bibliotecario || frequentador?.inativo_freq) {
      return { ok: false, message: "Este usuário está inativo." };
    }

    return { ok: false, message: "ID ou senha incorretos." };
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    return { ok: false, message: "Erro ao validar login no servidor." };
  }
}

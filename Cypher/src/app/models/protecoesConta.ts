import type Database from "better-sqlite3";
import { consultaPreparada } from "./consultaPreparada.js";
import {
  dataAtualCadastro,
  idadeNaData,
  validarNascimento,
} from "../validators/validarIdentidade.js";
type Banco = Database.Database;

export function contaEncerrada(db: Banco, id: string): boolean {
  return Boolean(
    consultaPreparada(db, "SELECT 1 FROM encerramentos_conta WHERE usuario_id=?").get(id)
  );
}

export function menorProtegido(
  db: Banco,
  id: string,
  hoje = dataAtualCadastro()
): boolean {
  const perfil = consultaPreparada(db, "SELECT nascimento FROM perfis WHERE usuario_id=?")
    .get(id) as { nascimento: string } | undefined;
  return Boolean(
    perfil?.nascimento &&
    !validarNascimento(perfil.nascimento, hoje) &&
    idadeNaData(perfil.nascimento, hoje) < 18
  );
}

// As preferências não autorizam mensagens entre adultos e menores.
export function contatoEtarioPermitido(
  db: Banco,
  ator: string,
  alvo: string
): boolean {
  return (
    !contaEncerrada(db, ator) &&
    !contaEncerrada(db, alvo) &&
    menorProtegido(db, ator) === menorProtegido(db, alvo)
  );
}

export function preferenciasPrivacidadePermitidas(
  db: Banco,
  id: string,
  preferencias: {
    profilePublic: boolean;
    locationPublic: boolean;
    contactPublic: boolean;
    skillsPublic?: boolean;
  }
) {
  const conta = db
    .prepare("SELECT tipo_conta FROM usuarios WHERE id=?")
    .get(id) as { tipo_conta: string } | undefined;
  return conta?.tipo_conta === "consumidor" ||
    contaEncerrada(db, id) ||
    menorProtegido(db, id)
    ? { profilePublic: false, locationPublic: false, contactPublic: false, skillsPublic: false }
    : preferencias;
}

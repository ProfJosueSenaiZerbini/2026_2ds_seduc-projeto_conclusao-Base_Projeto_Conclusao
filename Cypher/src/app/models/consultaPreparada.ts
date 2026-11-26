import type Database from "better-sqlite3";

const porConexao = new WeakMap<
  Database.Database,
  Map<string, Database.Statement>
>();

// Reserve para consultas fixas chamadas repetidamente ao montar catálogos.
export function consultaPreparada(db: Database.Database, sql: string) {
  let consultas = porConexao.get(db);
  if (!consultas) porConexao.set(db, (consultas = new Map()));
  let consulta = consultas.get(sql);
  if (!consulta) consultas.set(sql, (consulta = db.prepare(sql)));
  return consulta;
}

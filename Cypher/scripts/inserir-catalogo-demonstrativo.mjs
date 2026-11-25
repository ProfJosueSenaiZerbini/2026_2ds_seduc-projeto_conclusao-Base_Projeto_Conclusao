import fs from "node:fs";
import path from "node:path";
import {
  inicializarBancoCypher,
  conexaoInternaCypher,
  fecharBancoCypher,
  caminhoBancoCypher,
} from "../src/app/models/bancoDados.ts";
import { semearCatalogoCena } from "../src/app/models/catalogoCena.ts";
inicializarBancoCypher();
try {
  const pasta = path.join(path.dirname(caminhoBancoCypher()), "backups");
  fs.mkdirSync(pasta, { recursive: true });
  const destino = path.join(
    pasta,
    "antes-cena-" + new Date().toISOString().replace(/[:.]/g, "-") + ".sqlite"
  );
  await conexaoInternaCypher().backup(destino);
  const resultado = semearCatalogoCena();
  console.log(
    JSON.stringify({
      backup: destino,
      ...resultado,
      integridade:
        conexaoInternaCypher().pragma("foreign_key_check").length === 0,
    })
  );
} finally {
  fecharBancoCypher();
}

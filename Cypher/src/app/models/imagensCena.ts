import fs from "node:fs";
import path from "node:path";
const arquivo = path.resolve("public/img/cena/acervo.json");
let acervo: Record<string, string> = {};
let atualizadoEm = -1;
export function imagemCena(id: string) {
  const versao = fs.existsSync(arquivo) ? fs.statSync(arquivo).mtimeMs : 0;
  if (versao !== atualizadoEm) {
    acervo = versao ? JSON.parse(fs.readFileSync(arquivo, "utf8")) : {};
    atualizadoEm = versao;
  }
  return acervo[id];
}

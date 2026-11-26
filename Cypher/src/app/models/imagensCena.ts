import fs from "node:fs";
import path from "node:path";
const arquivo = path.resolve("public/img/cena/acervo.json");
let acervo: Record<string, string> = {};
let atualizadoEm = -1;
let revalidarEm = 0;
export function imagemCena(id: string) {
  const agora = Date.now();
  if (agora >= revalidarEm) {
    const versao = fs.statSync(arquivo, { throwIfNoEntry: false })?.mtimeMs ?? 0;
    if (versao !== atualizadoEm) {
      acervo = versao ? JSON.parse(fs.readFileSync(arquivo, "utf8")) : {};
      atualizadoEm = versao;
    }
    revalidarEm = agora + 1000;
  }
  return acervo[id];
}

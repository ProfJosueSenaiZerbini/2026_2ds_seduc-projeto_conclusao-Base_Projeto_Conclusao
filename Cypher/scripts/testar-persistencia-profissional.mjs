import assert from "node:assert/strict";
import {
  profissaoPodeSelecionarVertentes,
  profissoesElegiveisParaVertentes,
  vertentesProfissionais,
  vertenteProfissionalPermitida,
} from "../dist/src/app/models/modeloProfissionalPersistido.js";

assert.equal(
  vertentesProfissionais.length,
  16,
  "Devem existir exatamente 16 vertentes profissionais"
);
assert.equal(
  new Set(vertentesProfissionais).size,
  16,
  "As vertentes profissionais devem ser únicas"
);
assert.deepEqual(
  [...profissoesElegiveisParaVertentes],
  ["rapper"]
);

for (const profissao of profissoesElegiveisParaVertentes) {
  assert.equal(profissaoPodeSelecionarVertentes(profissao), true);
}
for (const profissao of [
  "mc",
  "freestyleiro",
  "beatmaker",
  "produtor",
  "organizador-eventos",
  "dj",
]) {
  assert.equal(profissaoPodeSelecionarVertentes(profissao), false);
}

assert.equal(vertenteProfissionalPermitida("Trap"), true);
assert.equal(vertenteProfissionalPermitida("Drill"), true);
assert.equal(vertenteProfissionalPermitida("Rap"), false);
assert.equal(vertenteProfissionalPermitida("Outro"), false);

console.log(
  "OK: persistência profissional define 16 vertentes e elegibilidade exclusiva de Rapper."
);

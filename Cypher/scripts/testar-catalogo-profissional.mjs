import assert from "node:assert/strict";
import {
  listarGruposProfissionais,
  listarProfissoesCatalogo,
  obterProfissaoCatalogo,
} from "../dist/src/app/models/modeloPerfil.js";

const grupos = listarGruposProfissionais();
const profissoes = listarProfissoesCatalogo();

assert.equal(grupos.length, 7, "O catálogo deve ter exatamente 7 grupos");
assert.equal(
  profissoes.length,
  26,
  "O catálogo deve ter exatamente 26 profissões"
);
assert.equal(
  new Set(grupos.map(grupo => grupo.id)).size,
  grupos.length,
  "IDs de grupos devem ser únicos"
);
assert.equal(
  new Set(profissoes.map(profissao => profissao.id)).size,
  profissoes.length,
  "IDs de profissões devem ser únicos"
);
assert.ok(
  profissoes.every(profissao =>
    grupos.some(grupo => grupo.id === profissao.grupoId)
  ),
  "Toda profissão deve apontar para um grupo existente"
);
assert.equal(obterProfissaoCatalogo("rapper")?.rotulo, "Rapper");
assert.equal(
  obterProfissaoCatalogo("organizador-eventos")?.rotulo,
  "Organizador(a) de eventos"
);
assert.equal(obterProfissaoCatalogo("produtor-musical"), undefined);
assert.equal(obterProfissaoCatalogo("freestyleiro")?.rotulo, "Freestyleiro");
for (const id of ["freestyler", "muralista", "artista-digital", "manager", "produtor-executivo", "critico-musical", "social-media", "educador", "pesquisador-cultural", "articulador-cultural", "diretor-audiovisual"]) {
  assert.equal(obterProfissaoCatalogo(id), undefined, `${id} não deve reaparecer no catálogo`);
}

console.log(
  "OK: catálogo profissional com 7 grupos, 26 profissões e IDs estáveis."
);

import { Router } from "express";
import * as c from "../controllers/controladorColaboracoes.js";
const r = Router(),
  s = c.seguro;
r.get("/colaboracoes", s(c.lista));
r.get("/colaboracoes/new", s(c.novo));
r.post("/colaboracoes", s(c.criar));
r.get("/colaboracoes/:id", s(c.detalhe));
r.post("/colaboracoes/:id/avaliacoes", s(c.avaliar));
r.post("/colaboracoes/:id/contestar", s(c.contestar));
r.post("/colaboracoes/:id/acoes/:acao", s(c.agir));
r.post("/colaboracoes/casos/:caso/manifestar", s(c.manifestar));
r.get("/reputacao/:identificador", s(c.reputacao));
r.get("/admin/reputacao", s(c.fila));
r.get("/admin/reputacao/:id", s(c.caso));
r.post("/admin/reputacao/:id", s(c.decidir));
r.post("/admin/reputacao/:id/inspecionar", s(c.inspecionar));
export default r;

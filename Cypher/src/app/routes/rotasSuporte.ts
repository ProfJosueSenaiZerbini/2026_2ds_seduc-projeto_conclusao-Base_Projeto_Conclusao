import { Router } from "express";
import * as c from "../controllers/controladorSuporte.js";
const r = Router(),
  s = c.seguro;
r.get("/suporte", s(c.lista));
r.get("/suporte/new", s(c.novo));
r.post("/suporte", s(c.criar));
r.get("/suporte/:id", s(c.detalhe));
r.post("/suporte/:id/reply", s(c.responder));
r.post("/suporte/:id/appeal", s(c.recorrer));
r.get("/admin/moderacao", s(c.fila));
r.get("/admin/moderacao/:id", s(c.caso));
r.post("/admin/moderacao/:id/assign", s(c.assumir));
r.post("/admin/moderacao/:id/decision", s(c.decidir));
r.post("/admin/moderacao/:id/evidence", s(c.evidencia));
export default r;

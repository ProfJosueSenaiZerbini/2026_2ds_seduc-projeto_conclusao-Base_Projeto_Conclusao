import { Router, raw } from "express";
import * as c from "../controllers/controladorMidiasRepresentacao.js";
const r = Router(),
  s = c.seguro;
r.use(c.preparar);
r.post("/profile/selo", s(c.salvarSelo));
r.get("/publicacoes/:tipo/:id/midias", s(c.midias));
r.post(
  "/publicacoes/:tipo/:id/midias",
  raw({ type: "application/octet-stream", limit: "25mb" }),
  s(c.upload)
);
r.get("/publication-media/:id", s(c.arquivo));
r.post("/publication-media/:id/retirar", s(c.retirar));
r.get("/representacoes", s(c.representacoes));
r.post("/representacoes", s(c.convidar));
r.post("/representacoes/:id", s(c.responder));
export default r;

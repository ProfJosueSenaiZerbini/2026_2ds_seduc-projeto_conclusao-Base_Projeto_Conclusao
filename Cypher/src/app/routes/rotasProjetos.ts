import { Router, raw } from "express";
import * as c from "../controllers/controladorProjetos.js";
const r = Router(),
  s = c.seguro;
r.get("/work-projects", s(c.lista));
r.get("/work-projects/new", s(c.novo));
r.post("/work-projects", s(c.salvar));
r.get("/work-projects/:id/edit", s(c.editar));
r.post("/work-projects/:id/edit", s(c.salvar));
r.post("/work-projects/:id/withdraw", s(c.retirar));
r.get("/work-projects/:id", s(c.detalhe));
r.post(
  "/work-media",
  raw({ type: "application/octet-stream", limit: "25mb" }),
  s(c.upload)
);
r.get("/work-media/:id", s(c.arquivo));
r.post("/work-media/:id/visibility", s(c.visibilidadeMidia));
r.post("/work-media/:id/delete", s(c.removerMidia));
export default r;

import { Router } from "express";
import * as c from "../controllers/controladorCentral.js";
const r = Router(),
  s = c.seguro;
r.get("/central", s(c.central));
r.post("/central/privacy", s(c.privacidade));
r.get("/central/:slug", s(c.artigo));
r.post("/central/:slug/feedback", s(c.feedback));
r.get("/admin/central", s(c.conteudos));
r.get("/admin/central/new", s(c.novo));
r.get("/admin/central/quality", s(c.qualidade));
r.get("/admin/central/searches", s(c.pesquisas));
r.get("/admin/central/reviews", s(c.revisoes));
r.post("/admin/central", s(c.salvar));
r.get("/admin/central/:id/edit", s(c.editar));
r.get("/admin/central/:id/preview",s(c.preview));
r.post("/admin/central/:id", s(c.salvar));
r.post("/admin/central/:id/state", s(c.transicionar));
export default r;

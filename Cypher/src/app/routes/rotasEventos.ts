import { Router } from "express";
import * as c from "../controllers/controladorParticipacaoEventos.js";
const r = Router(),
  s = c.seguro;
r.get("/events/map", s(c.mapa));
r.get("/events/:id", s(c.detalhe));
r.post("/events/:id/follow", s(c.seguir));
r.post("/events/:id/register", s(c.inscrever));
r.post("/events/:id/register/cancel", s(c.cancelarInscricao));
r.post("/events/:id/registrations/:usuarioId/decision", s(c.decidir));
r.post("/events/:id/registrations/:usuarioId/attendance", s(c.presenca));
r.post("/events/:id/cancel", s(c.cancelar));
r.post("/events/:id/feedback", s(c.avaliar));
r.post("/events/:id/complaints", s(c.reclamar));
r.post("/events/:id/complaints/:reclamacao/reply", s(c.responder));
r.post("/events/:id/complaints/:reclamacao/escalate", s(c.encaminhar));
export default r;

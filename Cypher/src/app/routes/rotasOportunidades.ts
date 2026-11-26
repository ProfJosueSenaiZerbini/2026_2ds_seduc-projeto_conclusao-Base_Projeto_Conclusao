import { Router, raw } from "express";
import * as c from "../controllers/controladorOportunidades.js";
const r = Router(),
  s = c.seguro;
r.get("/opportunities", s(c.explorar));
r.get("/my-opportunities", s(c.explorar));
r.get("/my-applications", s(c.explorar));
r.get("/opportunities/new", s(c.novo));
r.post("/opportunities", s(c.salvar));
r.get("/opportunities/:id/edit", s(c.editar));
r.post("/opportunities/:id/edit", s(c.salvar));
r.get("/opportunities/:id", s(c.detalhe));
r.post("/opportunities/:id/state", s(c.estado));
r.post("/opportunities/:id/applications", s(c.aplicar));
for (const base of [
  "/opportunities/applications",
  "/admin/oportunidades/candidaturas",
]) {
  r.get(base + "/:id", s(c.negociacao));
  r.post(base + "/:id/decision", s(c.decisao));
  r.post(base + "/:id/proposals", s(c.proposta));
  r.post(base + "/:id/response", s(c.aceite));
  r.post(base + "/:id/release", s(c.desistir));
}
r.get("/service-requests", s(c.pedidos));
r.get("/service-requests/new", s(c.novo));
r.post("/service-requests", s(c.solicitar));
r.get("/service-requests/:id", s(c.pedido));
r.post("/service-requests/:id", s(c.esclarecer));
r.get("/admin/oportunidades", s(c.pedidos));
r.get("/admin/oportunidades/pedidos/:id", s(c.pedido));
r.post("/admin/oportunidades/pedidos/:id", s(c.revisar));
r.get("/admin/oportunidades/:id", s(c.detalhe));
r.post("/admin/oportunidades/:id/state", s(c.estado));
r.get("/messages", s(c.mensagens));
r.post("/messages/preferences", s(c.preferencias));
r.post("/messages/block", s(c.bloquear));
r.post("/messages/start", s(c.iniciarMensagem));
r.post("/messages/:id/hide", s(c.ocultarMensagem));
for (const base of ["/messages", "/admin/oportunidades/mensagens"]) {
  r.get(base + "/attachments/:attachmentId", s(c.baixarAnexo));
  r.post(base + "/:id/attachments", raw({ type: "application/octet-stream", limit: "25mb" }), s(c.anexarMensagem));
}
for (const base of ["/messages", "/admin/oportunidades/mensagens"]) {
  r.get(base + "/:id", s(c.mensagem));
  r.post(base + "/:id", s(c.enviar));
}
r.get("/service-mediation", s(c.mediadores));
r.post("/service-mediation", s(c.mediar));
export default r;

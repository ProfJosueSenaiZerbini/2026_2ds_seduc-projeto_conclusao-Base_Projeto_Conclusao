import { Router, raw } from "express";
import * as c from "../controllers/controladorLicenciamentoBeats.js";
const r = Router(),
  s = c.seguro;
r.get("/purchases", s(c.compras));
r.get("/purchases/:id", s(c.pedido));
r.post("/purchases/:id/checkout", s(c.checkout));
r.get("/purchases/:id/checkout", s(c.revisarCompra));
r.post("/purchases/:id/confirm", s(c.confirmarCompra));
r.post("/purchases/:id/refresh", s(c.atualizar));
r.get("/purchases/:id/license", s(c.licenca));
r.get("/purchases/:id/files/:arquivoId", s(c.download));
r.get("/beats/:id/manage", s(c.gestao));
r.post(
  "/beats/:id/files",
  raw({ type: "application/octet-stream", limit: "50mb" }),
  s(c.upload)
);
r.get("/beats/:id/files/:arquivoId", s(c.arquivoProdutor));
r.get("/beats/:id/preview", s(c.previa));
r.post("/beats/:id/availability", s(c.disponibilidade));
r.post("/beats/:id/offers", s(c.oferta));
r.post("/beats/:id/offers/:ofertaId", s(c.oferta));
r.post("/beats/:id/offers/:ofertaId/withdraw", s(c.retirarOferta));
r.post("/beats/:id/offers/:ofertaId/acquire", s(c.adquirir));
// Não captura /beats/new: o formulário de metadados permanece na rota específica.
r.get("/beats/:id", (req, res, next) =>
  req.params.id === "new" ? next() : s(c.ficha)(req, res, next)
);
export default r;

import { Router } from "express";
import * as c from "../controllers/controladorInteracoes.js";

const rotas = Router();
rotas.use(c.prepararInteracoes);
rotas.get("/colecoes", c.seguro(c.colecoes));
rotas.post("/colecoes/importar-beats", c.seguro(c.importarBeats));
rotas.get(
  "/interacoes/:tipo/:id",
  c.seguro((req, res) => c.ficha(req, res))
);
rotas.post("/interacoes/:tipo/:id/comentarios", c.seguro(c.publicar));
rotas.post(
  "/interacoes/:tipo/:id/comentarios/:cid/editar",
  c.seguro(c.salvarComentario(false))
);
rotas.post(
  "/interacoes/:tipo/:id/comentarios/:cid/excluir",
  c.seguro(c.salvarComentario(true))
);
rotas.post("/interacoes/:tipo/:id/:acao", c.seguro(c.acao));
export default rotas;

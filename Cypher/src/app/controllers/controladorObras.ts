export { catalogoObras as obras } from "./controladorEspacoTrabalho.js";
/** Entry points do domínio de obras e seus créditos. */
export {
  novaObra,
  editarObra,
  criarObra,
  atualizarObra,
  excluirObra,
} from "./controladorCompatibilidade.js";

import type { Request, Response } from "express";
import { definirCurtidaObra } from "../models/catalogoObras.js";

export function curtirObra(req: Request, res: Response) {
  if (!res.locals.usuario?.id) return res.status(401).json({ erro: "Entre para curtir." });
  if (typeof req.body?.curtida !== "boolean") return res.status(400).json({ erro: "Curtida inválida." });
  const resultado = definirCurtidaObra(String(req.params.id), res.locals.usuario.id, req.body.curtida);
  if (!resultado) return res.status(404).json({ erro: "Obra indisponível." });
  return res.json(resultado);
}

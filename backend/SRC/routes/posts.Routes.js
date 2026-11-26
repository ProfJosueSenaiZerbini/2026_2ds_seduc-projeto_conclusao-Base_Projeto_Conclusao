const express = require("express");
const router = express.Router();

const {
    listarPublicos, 
    buscarPublicos, 
    criar,
    atualizarPost,
    excluirPost,
    alternarCurtida,
    statusCurtida
} = require("../controllers/postController");

const {
    listarComentarios,
    adicionarComentario
} = require("../controllers/comentarios.controller");

const authMiddleware = require("../middleware/authMiddleware");
const { authOpcional } = require("../middleware/authMiddleware");

// Rotas de postagens
router.get("/", listarPublicos);
router.get("/:id", buscarPublicos);
router.post("/criar", authMiddleware, criar);
router.put("/:id", authMiddleware, atualizarPost);
router.delete("/:id", authMiddleware, excluirPost);

// ✦ REDE SOCIAL: Rotas de curtidas
router.post("/:id/curtir", authMiddleware, alternarCurtida);
router.get("/:id/curtidas", authOpcional, statusCurtida);

// ✦ REDE SOCIAL: Rotas de comentários delegadas ao controlador de comentários
router.get("/:id/comentarios", listarComentarios);
router.post("/:id/comentarios", authMiddleware, adicionarComentario);

module.exports = router;

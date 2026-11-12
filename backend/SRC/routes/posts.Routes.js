const express = require("express");
const router = express.Router();

const {
    listarPublicos, 
    buscarPublicos, 
    criar,
    alternarCurtida,
    statusCurtida,
    listarComentarios,
    adicionarComentario
} = require("../controllers/postController");

const authMiddleware = require("../middleware/authMiddleware");
const { authOpcional } = require("../middleware/authMiddleware");

// Rotas de postagens
router.get("/", listarPublicos);
router.get("/:id", buscarPublicos);
router.post("/criar", authMiddleware, criar);

// ✦ REDE SOCIAL: Rotas de curtidas
router.post("/:id/curtir", authMiddleware, alternarCurtida);
router.get("/:id/curtidas", authOpcional, statusCurtida);

// ✦ REDE SOCIAL: Rotas de comentários
router.get("/:id/comentarios", listarComentarios);
router.post("/:id/comentarios", authMiddleware, adicionarComentario);

module.exports = router;

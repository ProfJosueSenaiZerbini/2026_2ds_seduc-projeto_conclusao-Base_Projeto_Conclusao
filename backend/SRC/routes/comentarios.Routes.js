const express = require("express");
const router = express.Router();

const {
    listarComentarios,
    adicionarComentario,
    excluirComentario
} = require("../controllers/comentarios.controller");

const authMiddleware = require("../middleware/authMiddleware");
const { authOpcional } = require("../middleware/authMiddleware");

// GET /api/comentarios/:postId -> Lista comentários do post
router.get("/:postId", listarComentarios);

// POST /api/comentarios/:postId -> Adiciona comentário ao post (precisa de login ou token)
router.post("/:postId", authMiddleware, adicionarComentario);

// DELETE /api/comentarios/:id -> Exclui comentário
router.delete("/:id", authMiddleware, excluirComentario);

module.exports = router;

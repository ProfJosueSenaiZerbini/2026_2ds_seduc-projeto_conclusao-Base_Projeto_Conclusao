const express = require('express');
const notificacaoController = require('../controllers/notificacaoController');
const { autenticar, verificarDono } = require('../middlewares/auth');

const router = express.Router();

router.get('/usuario/:id/notificacao', autenticar, verificarDono, notificacaoController.listarNotificacoes);

module.exports = router;

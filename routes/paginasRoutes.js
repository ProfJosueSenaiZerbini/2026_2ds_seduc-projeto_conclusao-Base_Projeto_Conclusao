import express from 'express';

const router = express.Router();

// Páginas institucionais: públicas, abrem com ou sem login (o cadastro aponta para elas antes de existir sessão).
router.get('/termos', (req, res) => res.render('termos'));
router.get('/privacidade', (req, res) => res.render('privacidade'));
router.get('/ajuda', (req, res) => res.render('ajuda'));

export default router;

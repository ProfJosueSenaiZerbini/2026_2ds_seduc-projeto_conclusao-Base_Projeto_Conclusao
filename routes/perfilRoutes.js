import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
    exibirPerfil,
    atualizarPerfil,
    atualizarSenha,
    exibirPerfilPublico,
    salvarFoto,
    removerFoto,
    servirFoto,
    recusarFoto,
    MENSAGENS_FOTO
} from '../controllers/perfilController.js';
import { TAMANHO_MAXIMO_FOTO } from '../services/fotoPerfil.js';

const router = express.Router();

// Upload da foto de perfil: um arquivo só, em memória, até 2 MB. Os erros do multer (arquivo grande demais,
// campo inesperado...) viram o alerta da página de perfil em vez do 413/400 genérico.
const receberFoto = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: TAMANHO_MAXIMO_FOTO, files: 1 }
}).single('foto');

const receberFotoComAlerta = (req, res, next) => {
    receberFoto(req, res, (erro) => {
        if (!erro) return next();
        if (erro instanceof multer.MulterError) {
            const mensagem = erro.code === 'LIMIT_FILE_SIZE' ? MENSAGENS_FOTO.grandeDemais : MENSAGENS_FOTO.semArquivo;
            return recusarFoto(req, res, mensagem);
        }
        return next(erro);
    });
};

// Perfil público de trabalhador ou contratante: exige autenticação e retorna somente dados públicos.
router.get('/publico/:id', requireAuth, exibirPerfilPublico);

// Como esta rota já é montada com /perfil no app.js:
// GET /perfil -> Exibe a página do perfil
router.get('/', requireAuth, exibirPerfil);

// Suporta também acessar /perfil/perfil se necessário
router.get('/perfil', requireAuth, exibirPerfil);

// Formulário e Ação de edição de perfil
router.get('/editar', requireAuth, (_req, res) => res.redirect('/perfil'));

// ⬇️ POST /perfil/editar -> Processa a atualização do Modal!
router.post('/editar', requireAuth, atualizarPerfil);

// Também aceita se a requisição bater em /perfil/perfil/editar por garantia
router.post('/perfil/editar', requireAuth, atualizarPerfil);

// Formulário e ação de alteração de senha
router.get('/alterar-senha', requireAuth, (_req, res) => res.redirect('/perfil'));
router.post('/alterar-senha', requireAuth, atualizarSenha);

// Foto de perfil: enviar, remover e exibir (a exibição também exige login, como o perfil público).
router.post('/foto', requireAuth, receberFotoComAlerta, salvarFoto);
router.post('/foto/remover', requireAuth, removerFoto);
router.get('/:id/foto', requireAuth, servirFoto);

export default router;

import pool from './config/database.js';
import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. IMPORTANTE: Importando o seu arquivo de rotas
import authRoutes from './routes/authRoutes.js'; 
import bicoRoutes from './routes/bicoRoutes.js';
import carteiraRoutes from './routes/carteiraRoutes.js'; 
dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuração do express e EJS (Views)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Fluxo de login/configuração de sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'chave-secreta-araponga',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// Disponibiliza as informações da sessão para todas as views (.ejs)
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});


// 2. CONECTANDO AS SUAS ROTAS:
// Isso faz o Express ler o authRoutes.js para responder por /login e /cadastrar
app.use('/', authRoutes);
app.use('/bicos', bicoRoutes);
app.use('/carteira', carteiraRoutes);

// 3. ROTA INICIAL:
// Se o usuário acessar a raiz (/), nós mandamos ele para a URL /login
app.get('/', (req, res) => {
    res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ta rodando? http://localhost:${PORT}`);
});
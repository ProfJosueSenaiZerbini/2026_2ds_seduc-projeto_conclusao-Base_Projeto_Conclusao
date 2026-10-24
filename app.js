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
import perfilRoutes from './routes/perfilRoutes.js';
dotenv.config();

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error('Configure SESSION_SECRET com pelo menos 32 caracteres antes de iniciar o servidor.');
}

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
}

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
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction
    }
}));

// Disponibiliza as informações da sessão para todas as views (.ejs)
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
    // Disponibiliza a rota atual para destacar o item correto no menu.
    res.locals.rotaAtual = req.path;
  next();
});


// 2. CONECTANDO AS SUAS ROTAS:
// Isso faz o Express ler o authRoutes.js para responder por /login e /cadastrar
app.use('/', authRoutes);
app.use('/bicos', bicoRoutes);
app.use('/carteira', carteiraRoutes);
app.use('/perfil', perfilRoutes);

// Se o usuário acessar a raiz (/), nós mandamos ele para a URL /login
app.get('/', (req, res) => {
    res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ta rodando? http://localhost:${PORT}`);
});
# ✧ Lumina — Blog Editorial & Rede Social Cultural

Plataforma web que combina a profundidade editorial de uma revista cultural com a dinâmica de uma rede social, inspirada na estética visual **Y2K (anos 2000)** com arquitetura moderna fullstack.

---

## 👥 Integrantes
* Anna Clara Mansano Santos
* Haifa Cecilia Rios Antunes
* Sofia Vicente de Souza
* Rotxibel Daniela Cabello Ramirez
* Victor Kauã Silva Figueredo

---

## 📖 Descrição do Projeto

O **Lumina** foi concebido como um espaço de lazer, partilha e conexão cultural. O sistema permite o compartilhamento de saberes por meio de artigos, resenhas de livros/filmes/moda, interações em comunidade (curtidas, comentários), chat público, perfis personalizados e uma assistente virtual de recomendações culturais.

### Principais Funcionalidades:
* ✧ **Feed Editorial & Categorias**: Moda & Estilo, Cinema, Literatura, Música e Teatro.
* ✧ **Rede Social Integrada**: Curtidas em tempo real, contagem de comentários e perfis autorais.
* ✧ **Comentários Centralizados**: Sistema de comentários gerenciado diretamente pelo backend.
* ✧ **Comunidade & Chat**: Sala de bate-papo pública entre assinantes e recomendações com IA.
* ✧ **Autenticação Segura**: Senhas com hash bcrypt e tokens de acesso JWT.
* ✧ **Banco de Dados na Nuvem**: Conexão com Supabase (PostgreSQL Online) e suporte a MySQL local.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend**: React 18, Tailwind CSS, Lucide React, React Router 6, Vite.
* **Backend**: Node.js, Express 5, JWT, BcryptJS, @supabase/supabase-js, MySQL2.
* **Banco de Dados**: Supabase (Online) / MySQL (XAMPP local).
* **Testes**: Playwright E2E.

---

## 🚀 Como Instalar e Rodar o Projeto

### 1. Clonar o Repositório
```bash
git clone https://github.com/ProfJosueSenaiZerbini/projeto-conclusao-blog.git
cd projeto-conclusao-blog
```

### 2. Instalar Dependências
```bash
# Na raiz:
npm install

# No backend:
cd backend
npm install
cd ..

# No frontend:
cd frontend-react
npm install
cd ..
```

### 3. Configurar as Variáveis de Ambiente
Verifique ou crie o arquivo `backend/.env` baseado no `backend/.env.example`:
```env
PORT=3000

# Conexão com o Supabase Online
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
SUPABASE_SECRET_KEY=sua_chave_secreta

# Segurança
JWT_SECRET=

# Administrador Inicial
ADMIN_NOME=
ADMIN_EMAIL=
ADMIN_SENHA=
```

### 4. Inicializar o Usuário Administrador
```bash
npm run criar-admin
```
*(Ou `cd backend` e `npm run criar-admin`)*

---

## 🖥️ Como Executar a Aplicação

### Modo 1: Servidor Único Unificado (Recomendado)
O backend Express serve a aplicação completa (frontend compilado + APIs) na porta **3000**:
```bash
npm start
```
Acesse no navegador: **http://localhost:3000**

---

### Modo 2: Desenvolvimento com Hot-Reload (Opcional)
Se estiver editando o visual das telas do React com recarregamento instantâneo:

1. **Terminal 1 (Backend):**
   ```bash
   cd backend
   npm start
   ```
2. **Terminal 2 (Frontend):**
   ```bash
   cd frontend-react
   npm run dev
   ```
Acesse no navegador: **http://localhost:5173**

---

## 📁 Estrutura de Diretórios

```
projeto-conclusao-blog/
├── backend/                  # Servidor Node.js / Express
│   ├── scripts/              # Scripts utilitários (ex: criarAdmin.js)
│   ├── SRC/
│   │   ├── controllers/      # Controladores (auth, posts, comentarios)
│   │   ├── DATABASE/         # Adaptador e conexão (Supabase / MySQL)
│   │   ├── middleware/       # Middlewares (autenticação JWT)
│   │   ├── routes/           # Rotas da API (/api/...)
│   │   └── server.js         # Ponto de entrada do servidor unificado
│   ├── .env                  # Variáveis de ambiente (ignorado no git)
│   └── .env.example          # Modelo de configuração
├── DB/                       # Scripts e documentação SQL
│   ├── supabase.sql          # Script de criação de tabelas no Supabase
│   ├── db.config             # Script de criação no MySQL
│   └── README.md             # Guia de configuração do banco
├── Docs/                     # Documentação de TCC, diagramas e wireframes
│   ├── Diagramas/            # Modelos conceituais e lógicos
│   ├── Scripts Banco Dados/  # Backup de scripts
│   ├── Testes/               # Casos de teste
│   ├── Trabalho Conclusão/   # Modelo do relatório do TCC
│   └── Wireframes/           # Telas e capturas de protótipos
├── frontend-react/           # Aplicação cliente (React + Vite)
│   ├── dist/                 # Build de produção servido pelo backend
│   ├── src/
│   │   ├── components/       # Componentes visuais reutilizáveis
│   │   ├── pages/            # Páginas e views da aplicação
│   │   ├── services/         # Cliente HTTP (api.js)
│   │   └── App.jsx           # Roteamento SPA
│   └── package.json
└── package.json              # Configurações e scripts da raiz
```

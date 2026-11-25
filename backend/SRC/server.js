const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes.routes");
const postRoutes = require("./routes/posts.Routes");
const adminRoutes = require("./routes/admin.Routes");
const userRoutes = require("./routes/user.Routes");
const chatRoutes = require("./routes/chat.Routes");
const comentariosRoutes = require("./routes/comentarios.Routes");
const app = express();

// Permite requisições de origens cruzadas (caso use desenvolvimento separado com Vite)
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Rota de verificação da API
app.get("/api", (req, res) => {
    res.json({
        mensagem: "API funcionando"
    });
});

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin/posts", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/comentarios", comentariosRoutes);

// Rotas de compatibilidade (sem prefixo /api)
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/admin/posts", adminRoutes);
app.use("/users", userRoutes);
app.use("/chat", chatRoutes);
app.use("/comentarios", comentariosRoutes);

// ✦ UNIFICAÇÃO: Serve os arquivos estáticos compilados do Frontend (React)
const frontendDistPath = path.resolve(__dirname, "../../frontend-react/dist");
app.use(express.static(frontendDistPath));

// Qualquer rota GET de navegação (ex: /login, /home, /perfil, /chat) é entregue ao React Router
app.use((req, res) => {
    if (req.method === "GET") {
        return res.sendFile(path.join(frontendDistPath, "index.html"));
    }
    res.status(404).json({ mensagem: "Rota não encontrada na API" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`servidor unificado funcionando em http://localhost:${PORT}`);
});

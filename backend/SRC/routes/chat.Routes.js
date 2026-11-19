const express = require("express");
const router = express.Router();
const database = require("../DATABASE/connection");
const authMiddleware = require("../middleware/authMiddleware");
const { authOpcional } = require("../middleware/authMiddleware");
const { gerarRespostaIA } = require("../services/aiService");

// Estrutura de armazenamento em memória/contingência caso tabelas SQL não existam no momento
let publicMessagesMemory = [
  {
    id: 1,
    usuario_id: 1,
    autor: "Juliana Mendes",
    autor_foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    texto: "Meninas, alguém assistiu ao novo documentário de moda? Achei a fotografia deslumbrante! ✧",
    criado_em: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: 2,
    usuario_id: 2,
    autor: "Beatriz Vasconcelos",
    autor_foto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop",
    texto: "Eu assisti ontem! O figurino retrô dos anos 2000 me inspirou a voltar a fazer scrapbook analógico.",
    criado_em: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: 3,
    usuario_id: 3,
    autor: "Camila Duarte",
    autor_foto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop",
    texto: "Sejam bem-vindas todas as novas assinantes! Esse espaço é todo nosso para trocar referências e cafés virtuais ☕✨",
    criado_em: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  }
];

let privateMessagesMemory = {};

// 1. Obter mensagens do Chat Público da Comunidade
router.get("/publico", async (req, res) => {
  try {
    try {
      const [rows] = await database.query(`
        SELECT 
          m.id, 
          m.usuario_id, 
          m.texto, 
          m.criado_em, 
          u.nome AS autor, 
          u.foto AS autor_foto
        FROM chat_publico m
        JOIN usuario u ON u.id = m.usuario_id
        ORDER BY m.criado_em ASC
        LIMIT 100
      `);

      if (rows && rows.length > 0) {
        return res.json(rows);
      }
    } catch (sqlErr) {
      // Se a tabela ainda não existir no MySQL, usa a lista em memória
    }

    return res.json(publicMessagesMemory);
  } catch (err) {
    console.error("Erro no chat público:", err);
    return res.json(publicMessagesMemory);
  }
});

// 2. Enviar mensagem no Chat Público
router.post("/publico", authOpcional, async (req, res) => {
  try {
    const { texto, usuarioId, autor, autor_foto } = req.body;
    const remetenteId = req.usuario?.id || usuarioId || 1;
    const nomeAutor = req.usuario?.nome || autor || "Membro Lumina";

    if (!texto || !texto.trim()) {
      return res.status(400).json({ mensagem: "A mensagem não pode ser vazia." });
    }

    const novaMensagem = {
      id: Date.now(),
      usuario_id: remetenteId,
      autor: nomeAutor,
      autor_foto: autor_foto || "",
      texto: texto.trim(),
      criado_em: new Date().toISOString()
    };

    try {
      await database.query(`
        CREATE TABLE IF NOT EXISTS chat_publico (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          texto TEXT NOT NULL,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const [resInsert] = await database.query(
        "INSERT INTO chat_publico (usuario_id, texto) VALUES (?, ?)",
        [remetenteId, texto.trim()]
      );
      novaMensagem.id = resInsert.insertId;
    } catch (dbErr) {
      // Fallback em memória
    }

    publicMessagesMemory.push(novaMensagem);
    return res.status(201).json(novaMensagem);
  } catch (err) {
    console.error("Erro ao enviar mensagem pública:", err);
    return res.status(500).json({ mensagem: "Erro ao enviar mensagem." });
  }
});

// 3. Obter mensagens do Chat Privado / Individual entre duas usuárias
router.get("/privado/:outroId", authOpcional, async (req, res) => {
  try {
    const { outroId } = req.params;
    const usuarioLogadoId = req.usuario?.id || req.query.meuId || 1;

    const conversaKey = [String(usuarioLogadoId), String(outroId)].sort().join("_");
    const msgs = privateMessagesMemory[conversaKey] || [];

    return res.json(msgs);
  } catch (err) {
    console.error("Erro ao carregar mensagens privadas:", err);
    return res.json([]);
  }
});

// 4. Enviar mensagem no Chat Privado / Individual
router.post("/privado/:outroId", authOpcional, async (req, res) => {
  try {
    const { outroId } = req.params;
    const { texto, usuarioId, autor, destinatarioNome } = req.body;
    const remetenteId = req.usuario?.id || usuarioId || 1;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ mensagem: "Mensagem vazia." });
    }

    const conversaKey = [String(remetenteId), String(outroId)].sort().join("_");
    if (!privateMessagesMemory[conversaKey]) {
      privateMessagesMemory[conversaKey] = [];
    }

    const novaMensagem = {
      id: Date.now(),
      remetente_id: remetenteId,
      destinatario_id: outroId,
      autor: autor || "Você",
      destinatarioNome: destinatarioNome || "Amiga Lumina",
      texto: texto.trim(),
      criado_em: new Date().toISOString()
    };

    privateMessagesMemory[conversaKey].push(novaMensagem);

    return res.status(201).json(novaMensagem);
  } catch (err) {
    console.error("Erro ao enviar mensagem privada:", err);
    return res.status(500).json({ mensagem: "Erro ao enviar mensagem privada." });
  }
});

// 5. Conversa Diária com a IA Lumina (Assistente Inteligente estilo ChatGPT / Gemini)
router.post("/ia", async (req, res) => {
  try {
    const { mensagem, nomeUsuario, historico } = req.body;

    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ mensagem: "Mensagem vazia." });
    }

    const resposta = await gerarRespostaIA({
      mensagem: mensagem.trim(),
      nomeUsuario,
      historico: Array.isArray(historico) ? historico : []
    });

    return res.json({
      resposta,
      criado_em: new Date().toISOString()
    });
  } catch (err) {
    console.error("Erro na resposta da IA:", err);
    return res.json({
      resposta: "Olá! Tive uma pequena oscilação na conexão, mas estou aqui para você. Me envie sua mensagem novamente!",
      criado_em: new Date().toISOString()
    });
  }
});

module.exports = router;

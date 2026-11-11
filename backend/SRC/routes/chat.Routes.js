const express = require("express");
const router = express.Router();
const database = require("../DATABASE/connection");
const authMiddleware = require("../middleware/authMiddleware");
const { authOpcional } = require("../middleware/authMiddleware");

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

// 5. Conversa Diária com a IA Lumina (Assistente Cultural & Diária)
router.post("/ia", async (req, res) => {
  try {
    const { mensagem, nomeUsuario } = req.body;
    const nome = nomeUsuario || "amiga";

    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ mensagem: "Mensagem vazia." });
    }

    const msgLower = mensagem.toLowerCase();
    let resposta = "";

    if (msgLower.includes("filme") || msgLower.includes("cinema") || msgLower.includes("assistir")) {
      resposta = `Ah, adoro recomendações cinematográficas! ✧ Se você quer algo com nostalgia dos anos 2000, recomendo 'As Patricinhas de Beverly Hills', 'Meninas Malvadas' ou 'Encontros e Desencontros' da Sofia Coppola. Se preferir algo mais intimista e poético, assista a 'Aftersun' ou 'Retrato de uma Jovem em Chamas'. Prepare um chá aconchegante e aproveite a sessão!`;
    } else if (msgLower.includes("livro") || msgLower.includes("leitura") || msgLower.includes("ler")) {
      resposta = `Que delícia falar de livros, ${nome}! 📖 Para leituras acolhedoras e reflexivas, sugiro 'Tudo Sobre o Amor' da bell hooks ou 'A Elegância do Ouriço' de Muriel Barbery. Se quiser ficção contemporânea envolvente, 'Pessoas Normais' da Sally Rooney ou 'Torto Arado' do Itamar Vieira Junior são leituras inesquecíveis. O que você gosta mais de ler?`;
    } else if (msgLower.includes("hobby") || msgLower.includes("hobbies") || msgLower.includes("fazer") || msgLower.includes("tedio") || msgLower.includes("tédio")) {
      resposta = `Para um momento de desaceleração hoje, que tal experimentar um hobby analógico? Você pode começar um diário visual (scrapbook) com recortes de revistas antigas e ingressos guardados, modelar um porta-joias de cerâmica fria ou visitar um sebo/café com luz natural no centro da cidade. Na nossa nova aba 'Hobbies' na Navbar você encontra um guia completo! ✧`;
    } else if (msgLower.includes("dia") || msgLower.includes("cansada") || msgLower.includes("ansiosa") || msgLower.includes("triste") || msgLower.includes("desabafo")) {
      resposta = `Sinto muito que o dia tenha sido desafiador, ${nome}. 🌿 Respire fundo: você não precisa dar conta de tudo o tempo todo. Que tal colocar o celular no silencioso por 15 minutinhos, tomar um banho morno, preparar uma xícara de camomila e apenas ouvir sua playlist favorita? Estou aqui com você para quando quiser conversar.`;
    } else if (msgLower.includes("bom dia") || msgLower.includes("boa tarde") || msgLower.includes("boa noite") || msgLower.includes("olá") || msgLower.includes("oi")) {
      resposta = `Olá, ${nome}! ✧ É um prazer imenso ter você aqui na nossa comunidade. Como está sendo seu dia hoje? Me conte o que você tem lido, assistido ou como posso te inspirar com novas ideias para a sua rotina!`;
    } else {
      resposta = `Adorei refletir sobre isso com você, ${nome}! ✧ Viver com mais arte, calma e sensibilidade é justamente a essência da nossa revista Lumina. O que acha de anotarmos essa ideia ou sensação no seu diário hoje? Me conte mais sobre como isso tem tocado a sua rotina.`;
    }

    return res.json({
      resposta,
      criado_em: new Date().toISOString()
    });
  } catch (err) {
    console.error("Erro na resposta da IA:", err);
    return res.json({
      resposta: "Estou aqui sempre para ouvir suas reflexões diárias, querida leitora! ✧ Como posso ajudar você hoje?",
      criado_em: new Date().toISOString()
    });
  }
});

module.exports = router;

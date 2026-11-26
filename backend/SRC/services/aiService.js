require("dotenv").config();

const SYSTEM_PROMPT = `Você é a Lumina IA, uma assistente de inteligência artificial completa, cult, inteligente, acolhedora e perspicaz, integrada à revista editorial e comunidade Lumina (inspirada na estética e nostalgia dos anos 2000, combinada com discussões modernas sobre cinema, literatura, moda, comportamento, tecnologia e bem-estar).
Você age como os modelos de ponta (ChatGPT e Google Gemini):
1. Responde a qualquer pergunta ou assunto com profundidade, clareza, inteligência e empatia.
2. Pode dar sugestões, criar roteiros, indicar filmes, livros, músicas, ajudar em estudos, redação, código e reflexões cotidianas.
3. Se comunica em português de forma fluida, elegante, amigável e usando toques sutis de delicadeza editorial (ex: ✧, ✨, 🌿, 📖) sem exageros.
4. Chame a pessoa pelo nome sempre que souber.`;

/**
 * Gera resposta de IA conectando a provedores reais (Gemini, OpenAI, Groq ou Free AI Engine)
 */
async function gerarRespostaIA({ mensagem, nomeUsuario = "leitora", historico = [] }) {
    const nome = nomeUsuario || "amiga";

    // 1. Provedor: Google Gemini API (se GEMINI_API_KEY estiver configurada)
    if (process.env.GEMINI_API_KEY) {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

            const contents = [
                {
                    role: "user",
                    parts: [{ text: `${SYSTEM_PROMPT}\n\nA usuária atual se chama ${nome}.` }]
                },
                {
                    role: "model",
                    parts: [{ text: `Entendido! Sou a Lumina IA e vou conversar com ${nome} de forma inteligente, acolhedora e prestativa.` }]
                }
            ];

            // Adiciona histórico recente para manter a memória do chat
            if (Array.isArray(historico) && historico.length > 0) {
                historico.slice(-6).forEach((h) => {
                    contents.push({
                        role: h.remetente === "usuario" ? "user" : "model",
                        parts: [{ text: h.texto }]
                    });
                });
            }

            contents.push({
                role: "user",
                parts: [{ text: mensagem }]
            });

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.75,
                        maxOutputTokens: 1000
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply && reply.trim()) {
                    return reply.trim();
                }
            } else {
                console.warn("[Gemini API] Falha na resposta:", await res.text());
            }
        } catch (err) {
            console.warn("[Gemini API] Erro na requisição:", err.message);
        }
    }

    // 2. Provedor: OpenAI API (se OPENAI_API_KEY estiver configurada)
    if (process.env.OPENAI_API_KEY) {
        try {
            const messages = [
                { role: "system", content: `${SYSTEM_PROMPT}\nUsuária: ${nome}` }
            ];

            if (Array.isArray(historico) && historico.length > 0) {
                historico.slice(-6).forEach((h) => {
                    messages.push({
                        role: h.remetente === "usuario" ? "user" : "assistant",
                        content: h.texto
                    });
                });
            }

            messages.push({ role: "user", content: mensagem });

            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages,
                    temperature: 0.75
                })
            });

            if (res.ok) {
                const data = await res.json();
                const reply = data.choices?.[0]?.message?.content;
                if (reply && reply.trim()) {
                    return reply.trim();
                }
            }
        } catch (err) {
            console.warn("[OpenAI API] Erro:", err.message);
        }
    }

    // 3. Provedor: Groq API (se GROQ_API_KEY estiver configurada)
    if (process.env.GROQ_API_KEY) {
        try {
            const messages = [
                { role: "system", content: `${SYSTEM_PROMPT}\nUsuária: ${nome}` }
            ];
            if (Array.isArray(historico) && historico.length > 0) {
                historico.slice(-6).forEach((h) => {
                    messages.push({
                        role: h.remetente === "usuario" ? "user" : "assistant",
                        content: h.texto
                    });
                });
            }
            messages.push({ role: "user", content: mensagem });

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages,
                    temperature: 0.7
                })
            });

            if (res.ok) {
                const data = await res.json();
                const reply = data.choices?.[0]?.message?.content;
                if (reply && reply.trim()) {
                    return reply.trim();
                }
            }
        } catch (err) {
            console.warn("[Groq API] Erro:", err.message);
        }
    }

    // 4. Provedor Gratuito Imediato (Baseado em modelos OpenAI / LLMs públicas, sem necessidade de chave)
    try {
        let contextoPrevio = "";
        if (Array.isArray(historico) && historico.length > 0) {
            contextoPrevio = historico.slice(-4).map((h) => `${h.remetente === "usuario" ? nome : "Lumina"}: ${h.texto}`).join("\n");
        }

        const promptCompleto = `${SYSTEM_PROMPT}\n\nA usuária é ${nome}.\n${contextoPrevio ? "Histórico recente:\n" + contextoPrevio + "\n\n" : ""}Nova mensagem de ${nome}: "${mensagem}"\n\nResponda agora diretamente a ${nome}:`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const url = `https://text.pollinations.ai/${encodeURIComponent(promptCompleto)}?model=openai`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const text = await res.text();
            if (text && text.trim() && !text.includes("SERVICE_UNAVAILABLE") && !text.startsWith("<!DOCTYPE")) {
                return text.trim();
            }
        }
    } catch (err) {
        console.warn("[Free AI Engine] Fallback acionado:", err.message);
    }

    // 5. Fallback humanizado de alta qualidade
    return gerarRespostaFallback(mensagem, nome);
}

function gerarRespostaFallback(mensagem, nome) {
    const msgLower = (mensagem || "").toLowerCase();

    if (msgLower.includes("filme") || msgLower.includes("cinema") || msgLower.includes("assistir")) {
        return `Adoro recomendações de cinema, ${nome}! 🎬✨ Se você quiser algo com a estética clássica dos anos 2000, recomendo 'As Patricinhas de Beverly Hills', 'Meninas Malvadas' ou 'Encontros e Desencontros' da Sofia Coppola. Se preferir um drama mais poético e contemplativo, assista a 'Aftersun' ou 'Retrato de uma Jovem em Chamas'. Que estilo de filme você costuma preferir?`;
    }

    if (msgLower.includes("livro") || msgLower.includes("leitura") || msgLower.includes("ler")) {
        return `Que delícia falar de literatura, ${nome}! 📖 Para leituras reflexivas e acolhedoras, sugiro 'Tudo Sobre o Amor' da bell hooks ou 'A Elegância do Ouriço' de Muriel Barbery. Para ficção envolvente com personagens marcantes, 'Pessoas Normais' da Sally Rooney ou 'Torto Arado' de Itamar Vieira Junior são inesquecíveis. O que você gostaria de explorar hoje?`;
    }

    if (msgLower.includes("hobby") || msgLower.includes("hobbies") || msgLower.includes("tedio") || msgLower.includes("tédio")) {
        return `Para um momento de desaceleração e criatividade, ${nome}, que tal experimentar um hobby analógico? Criar um scrapbook (diário visual) com colagens de recortes, ingressos e fitas, praticar bordado ou visitar um sebo no fim de semana são formas lindas de viver com mais calma. ✧`;
    }

    if (msgLower.includes("dia") || msgLower.includes("cansada") || msgLower.includes("ansiosa") || msgLower.includes("triste") || msgLower.includes("desabafo")) {
        return `Sinto muito que esteja se sentindo assim, ${nome}. 🌿 Respire fundo: você não precisa carregar o mundo nas costas o tempo todo. Que tal um banho morno, uma xícara de chá e colocar sua música favorita para relaxar um pouquinho? Estou aqui para o que você precisar conversar!`;
    }

    return `Olá, ${nome}! ✧ É um prazer imenso conversar com você. Estou aqui para refletir sobre arte, cinema, literatura, rotina, tirar qualquer dúvida ou simplesmente bater um papo leve. O que você gostaria de debater ou criar hoje?`;
}

module.exports = {
    gerarRespostaIA
};

const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            mensagem: "token nao informado"
        });
    }

    const partes = authorization.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return res.status(401).json({
            mensagem: "Token invalido"
        });
    }

    const token = partes[1];

    try {
        const dados = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = dados;
        next();
    } catch (e) {
        return res.status(401).json({ mensagem: "Token invalido ou expirado." });
    }
}

function authOpcional(req, res, next) {
    const authorization = req.headers.authorization;
    if (authorization) {
        const partes = authorization.split(" ");
        if (partes.length === 2 && partes[0] === "Bearer") {
            try {
                const dados = jwt.verify(partes[1], process.env.JWT_SECRET);
                req.usuario = dados;
            } catch (e) {
                // Token inválido/expirado é ignorado em rotas opcionais
            }
        }
    }
    next();
}

module.exports = authMiddleware;
module.exports.authOpcional = authOpcional;

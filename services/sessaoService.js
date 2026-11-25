import { createHash } from 'node:crypto';

// Troca o id da sessão e zera os dados dela (express-session). Usado no login, para evitar fixação de
// sessão (#161), e na troca de senha, para a sessão atual seguir com um id novo (#162).
export const renovarSessao = (req) =>
    new Promise((resolve, reject) => {
        req.session.regenerate((erro) => (erro ? reject(erro) : resolve()));
    });

// "Versão" da senha guardada na sessão (#162). O hash bcrypt muda a cada troca de senha (salt novo), então
// um resumo dele basta para saber se a senha mudou depois do login, sem coluna nova no banco. É um resumo
// sha256 do hash, nunca o hash em si, e fica em req.session.versaoSenha (fora de req.session.usuario, que
// vai para as views).
export const versaoDaSenha = (hashDaSenha) =>
    createHash('sha256').update(String(hashDaSenha)).digest('hex').slice(0, 16);

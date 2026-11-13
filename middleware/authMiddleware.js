// Garante que apenas usuarios autenticados continuem no fluxo solicitado.
export const requireAuth = (req, res, next) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    return next();
};

// Restringe uma rota a um ou mais perfis cadastrados no sistema.
export const requireRole = (...rolesPermitidos) => (req, res, next) => {
    const perfilAtual = req.session?.usuario?.tipo_perfil?.trim().toLowerCase();
    const perfisNormalizados = rolesPermitidos.map((role) => role.trim().toLowerCase());

    if (!perfilAtual) {
        return res.redirect('/login');
    }

    if (!perfisNormalizados.includes(perfilAtual)) {
        return res.status(403).send('Acesso negado para o perfil desta conta.');
    }

    return next();
};

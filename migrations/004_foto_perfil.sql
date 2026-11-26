-- Migração 004: foto de perfil.
-- Para bancos db_bico já criados com um schema.sql anterior. Quem criar o banco do zero
-- com o schema.sql atual NÃO precisa executar este script.
--
-- Cria a tabela fotos_perfil (uma foto por usuário, até 2 MB, JPEG, PNG ou WebP). Quem não tem foto
-- continua aparecendo com as iniciais do nome. A tabela usuarios não muda.
--
-- Executar uma única vez, com o banco selecionado (USE db_bico).

USE db_bico;

CREATE TABLE IF NOT EXISTS fotos_perfil (
    usuario_id INT PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL,
    dados MEDIUMBLOB NOT NULL,
    atualizado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    CONSTRAINT fk_fotos_perfil_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

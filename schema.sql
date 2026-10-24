CREATE DATABASE IF NOT EXISTS db_bico;
USE db_bico;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    idade INT NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_perfil VARCHAR(50) NOT NULL,
    saldo_simulado DECIMAL(10, 2) DEFAULT 0.00,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de Bicos (Vagas)
CREATE TABLE IF NOT EXISTS bicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contratante_id INT NOT NULL,
    trabalhador_id INT DEFAULT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_servico DATE NOT NULL,
    horario VARCHAR(20) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    status ENUM('Aberto', 'Em andamento', 'Finalizado', 'Cancelado') DEFAULT 'Aberto',
    CONSTRAINT fk_bicos_contratante FOREIGN KEY (contratante_id) REFERENCES usuarios(id),
    CONSTRAINT fk_bicos_trabalhador FOREIGN KEY (trabalhador_id) REFERENCES usuarios(id)
);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bico_id INT NOT NULL,
    avaliador_id INT NOT NULL,
    avaliado_id INT NOT NULL,
    nota TINYINT NOT NULL,
    comentario VARCHAR(500) DEFAULT NULL,
    data_atualizacao TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_avaliacoes_bico UNIQUE (bico_id),
    CONSTRAINT chk_avaliacoes_nota CHECK (nota BETWEEN 1 AND 5),
    CONSTRAINT fk_avaliacoes_bico
        FOREIGN KEY (bico_id) REFERENCES bicos(id),
    CONSTRAINT fk_avaliacoes_avaliador
        FOREIGN KEY (avaliador_id) REFERENCES usuarios(id),
    CONSTRAINT fk_avaliacoes_avaliado
        FOREIGN KEY (avaliado_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- Eventos de status e outras ações relacionadas aos bicos
CREATE TABLE IF NOT EXISTS historico_eventos_bicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bico_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    status_anterior ENUM('Aberto', 'Em andamento', 'Finalizado', 'Cancelado') DEFAULT NULL,
    status_novo ENUM('Aberto', 'Em andamento', 'Finalizado', 'Cancelado') DEFAULT NULL,
    observacao VARCHAR(255) DEFAULT NULL,
    data_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eventos_bico FOREIGN KEY (bico_id)
        REFERENCES bicos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_eventos_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

-- Tabela de Candidaturas
-- Relaciona o trabalhador ao bico e armazena o status atual da candidatura
CREATE TABLE IF NOT EXISTS candidaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bico_id INT NOT NULL,
    trabalhador_id INT NOT NULL,
    status ENUM('Pendente', 'Aceito', 'Recusado', 'Cancelado') DEFAULT 'Pendente',
    mensagem TEXT DEFAULT NULL, -- Mensagem opcional do trabalhador ao se candidatar
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Restrições de Chave Estrangeira
    CONSTRAINT fk_candidaturas_bico FOREIGN KEY (bico_id) 
	REFERENCES bicos(id) ON DELETE CASCADE,
    CONSTRAINT fk_candidaturas_trabalhador FOREIGN KEY (trabalhador_id) 
	REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT uk_bico_trabalhador UNIQUE (bico_id, trabalhador_id)
      -- Impede que o mesmo trabalhador se candidate mais de uma vez ao mesmo bico
);

-- Mensagens vinculadas à candidatura aceita que representa a conversa
CREATE TABLE IF NOT EXISTS mensagens_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidatura_id INT NOT NULL,
    remetente_id INT NOT NULL,
    texto TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensagens_chat_candidatura FOREIGN KEY (candidatura_id)
        REFERENCES candidaturas(id) ON DELETE CASCADE,
    CONSTRAINT fk_mensagens_chat_remetente FOREIGN KEY (remetente_id)
        REFERENCES usuarios(id)
);

-- Tabela de Histórico de Status da Candidatura
CREATE TABLE IF NOT EXISTS historico_candidaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidatura_id INT NOT NULL,
    status_anterior ENUM('Pendente', 'Aceito', 'Recusado', 'Cancelado') DEFAULT NULL,
    status_novo ENUM('Pendente', 'Aceito', 'Recusado', 'Cancelado') NOT NULL,
    alterado_por INT NOT NULL, -- ID do usuário (Contratante ou Trabalhador) que fez a alteração
    observacao VARCHAR(255) DEFAULT NULL,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_candidatura FOREIGN KEY (candidatura_id) 
	REFERENCES candidaturas(id) ON DELETE CASCADE,
    CONSTRAINT fk_historico_alterado_por FOREIGN KEY (alterado_por) 
	REFERENCES usuarios(id)
);

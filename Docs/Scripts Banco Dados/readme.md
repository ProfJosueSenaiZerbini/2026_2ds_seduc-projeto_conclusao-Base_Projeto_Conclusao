## Acrescentar nesta pasta

- Scripts de criação do banco de dados e tabelas com extesnão .sql

CREATE DATABASE db_bico;
USE db_bico;

-- Tabela de Usuários
CREATE TABLE usuarios (
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

-- Tabela de Bicos
CREATE TABLE bicos (
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



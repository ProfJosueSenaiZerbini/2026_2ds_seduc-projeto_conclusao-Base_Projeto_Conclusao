-- ==============================================================
-- SCRIPT DE CRIAÇÃO / ATUALIZAÇÃO DO BANCO NO SUPABASE (ONLINE)
-- Execute este script no SQL Editor do painel do Supabase:
-- https://supabase.com/dashboard/project/sujfguorzowifvtqymzs/sql/new
-- ==============================================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    bio TEXT,
    headline VARCHAR(255),
    localizacao VARCHAR(150) DEFAULT 'São Paulo, Brasil',
    foto TEXT,
    capa TEXT,
    status_tag VARCHAR(100) DEFAULT '#CRIADORA ATIVA',
    interesses TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adiciona colunas caso a tabela usuario já tenha sido criada anteriormente
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS headline VARCHAR(255);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS localizacao VARCHAR(150) DEFAULT 'São Paulo, Brasil';
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS foto TEXT;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS capa TEXT;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS status_tag VARCHAR(100) DEFAULT '#CRIADORA ATIVA';
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS interesses TEXT;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. TABELA DE POSTS
CREATE TABLE IF NOT EXISTS public.posts (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    resumo VARCHAR(255),
    conteudo TEXT NOT NULL,
    imagem TEXT,
    categoria VARCHAR(100) DEFAULT 'MODA & ESTILO',
    publicado BOOLEAN NOT NULL DEFAULT TRUE,
    criando_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL REFERENCES public.usuario(id) ON DELETE CASCADE
);

-- Adiciona coluna categoria caso a tabela posts já exista
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'MODA & ESTILO';

-- 3. TABELA DE CURTIDAS
CREATE TABLE IF NOT EXISTS curtidas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, post_id)
);

-- 4. TABELA DE COMENTÁRIOS
CREATE TABLE IF NOT EXISTS public.comentarios (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE CHAT PÚBLICO
CREATE TABLE IF NOT EXISTS chat_publico (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Desativa RLS para facilitar acesso do backend em desenvolvimento acadêmico
ALTER TABLE usuario DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE curtidas DISABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_publico DISABLE ROW LEVEL SECURITY;

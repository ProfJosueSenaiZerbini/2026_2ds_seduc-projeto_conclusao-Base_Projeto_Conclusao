export const esquemaBeats = `
CREATE TABLE IF NOT EXISTS beat_catalogo (
 beat_id TEXT PRIMARY KEY REFERENCES beats(id) ON DELETE RESTRICT,
 disponivel INTEGER NOT NULL DEFAULT 1 CHECK(disponivel IN(0,1)),
 retirado INTEGER NOT NULL DEFAULT 0 CHECK(retirado IN(0,1)),
 versao INTEGER NOT NULL DEFAULT 1, previa_id TEXT,
 atualizado_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS beat_arquivos (
 id TEXT PRIMARY KEY, beat_id TEXT NOT NULL REFERENCES beats(id) ON DELETE RESTRICT,
 autor_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
 nome TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL CHECK(bytes>0),
 finalidade TEXT NOT NULL CHECK(finalidade IN('previa','entrega')), criado_em INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS beat_arquivos_beat ON beat_arquivos(beat_id,finalidade);
CREATE TABLE IF NOT EXISTS beat_oferta_versoes (
 id TEXT PRIMARY KEY, oferta_id TEXT NOT NULL REFERENCES ofertas_beats(id) ON DELETE RESTRICT,
 numero INTEGER NOT NULL, modalidade TEXT NOT NULL CHECK(modalidade IN('free','premium','exclusiva')),
 preco_centavos INTEGER NOT NULL CHECK(preco_centavos>=0), termos_json TEXT NOT NULL,
 arquivos_json TEXT NOT NULL, criado_em INTEGER NOT NULL,
 UNIQUE(oferta_id,numero)
);
CREATE TABLE IF NOT EXISTS beat_pedidos (
 id TEXT PRIMARY KEY, comprador_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
 beat_id TEXT NOT NULL REFERENCES beats(id) ON DELETE RESTRICT,
 versao_oferta_id TEXT NOT NULL REFERENCES beat_oferta_versoes(id) ON DELETE RESTRICT,
 snapshot_json TEXT NOT NULL, valor_centavos INTEGER NOT NULL,
 estado TEXT NOT NULL CHECK(estado IN('criando','pendente','aprovado','rejeitado','cancelado','reembolsado','contestado')),
 chave_envio TEXT NOT NULL, preferencia_id TEXT UNIQUE, pagamento_id TEXT UNIQUE,
 checkout_url TEXT NOT NULL DEFAULT '', recebedor_id TEXT NOT NULL DEFAULT '',
 criado_em INTEGER NOT NULL, atualizado_em INTEGER NOT NULL, UNIQUE(comprador_id,chave_envio)
);
CREATE INDEX IF NOT EXISTS beat_pedidos_comprador ON beat_pedidos(comprador_id,criado_em DESC);
CREATE TABLE IF NOT EXISTS beat_licencas (
 id TEXT PRIMARY KEY, pedido_id TEXT NOT NULL UNIQUE REFERENCES beat_pedidos(id) ON DELETE RESTRICT,
 concedida_em INTEGER NOT NULL, suspensa_em INTEGER, motivo TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS beat_pagamentos (
 id TEXT PRIMARY KEY, pedido_id TEXT NOT NULL REFERENCES beat_pedidos(id) ON DELETE RESTRICT,
 estado TEXT NOT NULL, atualizado_origem TEXT NOT NULL, verificado_em INTEGER NOT NULL
);
CREATE TRIGGER IF NOT EXISTS beat_versao_imutavel_update BEFORE UPDATE ON beat_oferta_versoes BEGIN SELECT RAISE(ABORT,'Versões de termos são imutáveis.'); END;
CREATE TRIGGER IF NOT EXISTS beat_versao_imutavel_delete BEFORE DELETE ON beat_oferta_versoes BEGIN SELECT RAISE(ABORT,'Versões de termos devem ser preservadas.'); END;
CREATE TRIGGER IF NOT EXISTS beat_pedido_snapshot_imutavel BEFORE UPDATE OF comprador_id,beat_id,versao_oferta_id,snapshot_json,valor_centavos,chave_envio,criado_em ON beat_pedidos BEGIN SELECT RAISE(ABORT,'O aceite original do pedido é imutável.'); END;
CREATE TRIGGER IF NOT EXISTS beat_pedido_preservado BEFORE DELETE ON beat_pedidos BEGIN SELECT RAISE(ABORT,'O histórico de aquisição deve ser preservado.'); END;
`;

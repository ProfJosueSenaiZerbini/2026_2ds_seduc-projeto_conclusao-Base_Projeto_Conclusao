// Foto de perfil: regras do arquivo aceito e da URL pública.
// O tipo é detectado pelos bytes iniciais do arquivo, nunca pelo Content-Type nem pela extensão que o
// navegador informa: um texto ou SVG renomeado para .png é recusado.

export const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024; // 2 MB (cabe com folga no MEDIUMBLOB)
export const TIPOS_FOTO_ACEITOS = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);

const comecaCom = (buffer, bytes, deslocamento = 0) =>
    buffer.length >= deslocamento + bytes.length && bytes.every((byte, i) => buffer[deslocamento + i] === byte);

const ASCII = (texto) => [...texto].map((c) => c.charCodeAt(0));

// Devolve 'image/jpeg', 'image/png', 'image/webp' ou null.
export const detectarTipoImagem = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;

    if (comecaCom(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
    if (comecaCom(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
    if (comecaCom(buffer, ASCII('RIFF')) && comecaCom(buffer, ASCII('WEBP'), 8)) return 'image/webp';

    return null;
};

// URL da foto com a versão (momento da última troca): muda a cada envio, então o navegador não mostra a
// foto antiga do cache. Sem foto, devolve null (a tela mostra as iniciais).
export const urlDaFoto = (usuarioId, atualizadoEm) => {
    if (!atualizadoEm) return null;
    const versao = new Date(atualizadoEm).getTime();
    return `/perfil/${Number(usuarioId)}/foto${Number.isFinite(versao) ? `?v=${versao}` : ''}`;
};

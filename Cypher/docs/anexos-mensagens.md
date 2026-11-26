# Anexos em mensagens privadas

Uma mensagem pode ter texto, um anexo ou ambos. Os anexos ficam em `anexos-mensagens` ao lado do banco SQLite; a tabela `mensagens_anexos` guarda o vínculo com a mensagem, nome, MIME e tamanho. O histórico e a notificação usam a mesma conversa persistente.

São aceitos PNG/JPEG (até 8 MB), MP3/WAV/OGG/WebM de áudio, MP4/WebM de vídeo, TXT/MD (até 1 MB), PDF e DOCX. Cada arquivo pode ter até 25 MB e cada autor dispõe de 250 MB de anexos. O servidor verifica conteúdo e extensão, rejeita tipos não permitidos e guarda os documentos com download forçado. Cada envio leva um arquivo e pode incluir legenda de até 1.000 caracteres; vários arquivos são enviados em mensagens separadas. O menu do compositor separa imagens, vídeos e arquivos/áudios. A gravação pelo microfone usa WebM ou OGG conforme o navegador e, após parar, fica pronta para revisão e envio.

Somente participantes da conversa podem abrir o arquivo, inclusive após ocultar a conversa. Bloqueios e restrições impedem novos envios, sem apagar o histórico autorizado. Um arquivo de mensagem sob medida de moderação deixa de ser servido. A exclusão individual ou coletiva de mensagens e anexos continua dependente de uma regra própria de retenção.

O upload usa `POST /messages/:id/attachments` com corpo binário, token CSRF e metadados em cabeçalhos. A leitura usa `GET /messages/attachments/:id`; as rotas administrativas correspondentes ficam em `/admin/oportunidades/mensagens`.

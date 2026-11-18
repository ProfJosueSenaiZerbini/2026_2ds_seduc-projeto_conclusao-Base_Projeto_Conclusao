# Integração de e-mail — Gmail

Configurada em 16/11/2026, após a etapa 2, por solicitação do usuário.

Remetente oficial: `og.cypher.ofc@gmail.com`. A senha de app permanece exclusivamente em `Cypher/.env.local`, ignorado pelo Git. A senha comum previamente registrada foi removida desse arquivo. O acesso administrativo não foi alterado.

## Comportamento

O transporte usa Nodemailer, Gmail SMTP na porta 465 com TLS e validação normal de certificado. Cadastro, reenvio, confirmação do novo e-mail e aviso ao endereço anterior usam a integração. As rotas aguardam as operações assíncronas; a conexão de rede ocorre fora das transações SQLite.

Falha de envio não ativa a conta nem altera o endereço atual. O token cuja entrega falhou é invalidado; o usuário pode solicitar novo envio após o limite existente. Erros SMTP privados não são exibidos nem registrados. O aviso ao endereço anterior é uma tentativa posterior à confirmação; falha desse aviso não desfaz a alteração confirmada e gera registro genérico no servidor. Não há fila de retentativas desse aviso.

`NODE_ENV=test` força entrega local em arquivos temporários, mesmo com SMTP configurado na máquina. Fora de testes, `CYPHER_EMAIL_TRANSPORT=smtp` habilita envio real. O modo local continua disponível para desenvolvimento. Produção exige SMTP e `CYPHER_PUBLIC_ORIGIN` HTTPS; antes de publicar, informar a URL real nesse campo. No desenvolvimento os links usam localhost e a porta do servidor.

## Configuração privada

Campos: `CYPHER_EMAIL_TRANSPORT`, `CYPHER_EMAIL_FROM`, `CYPHER_SMTP_USER`, `CYPHER_SMTP_PASSWORD` e, quando houver domínio, `CYPHER_PUBLIC_ORIGIN`. A aplicação carrega a configuração local independentemente de já existir Super Admin. Nunca copiar a configuração privada para frontend, relatórios ou repositório.

Reiniciar o servidor após alterar a configuração.

## Validação

- Compilação TypeScript aprovada.
- `npm run email:verify`: TLS e autenticação reais aceitos pelo Gmail; não envia mensagens.
- `npm run test:email`: transporte simulado, confirmação, erro de envio com token invalidado e bloqueio de origem HTTP em produção; nenhum destinatário externo.
- Regressões `test:identity-http`, `test:admin-ui` e `test:security-http` aprovadas em bancos e caixas locais temporários.

A autenticação real foi verificada; entrega na caixa de entrada não foi testada nesta execução. A aceitação SMTP não garante que uma mensagem chegue à caixa principal em vez do spam.

Este documento substitui a pendência de transporte exclusivamente local descrita no relatório original da etapa 2. Referência técnica: https://nodemailer.com/smtp

## Teste real de ponta a ponta — 16/11/2026

Executado por solicitação explícita do usuário. Uma confirmação real foi enviada exclusivamente à própria conta oficial da Cypher. O teste criou um servidor e banco temporários, cadastrou Consumidor pela rota HTTP real, localizou somente a nova mensagem do teste via IMAP em modo de leitura, confirmou que chegou à Caixa de entrada (não ao spam), usou o token recebido, verificou a rejeição da reutilização e realizou login com sucesso. Nenhuma conta pública foi adicionada ao banco principal. A mensagem de teste permanece na caixa de e-mail; o banco e servidor temporários foram removidos/encerrados.

Reexecução manual e com envio real: node scripts/testar-email-real.mjs --enviar, dentro de Cypher. O script aceita somente o endereço oficial como destinatário e limita a leitura às novas mensagens recebidas do próprio remetente após o início do teste. ImapFlow é dependência de desenvolvimento utilizada somente para verificar a recepção.

Também foi ampliado o teste de falha do aviso ao endereço anterior: a troca já confirmada continua válida, o token permanece consumido e o registro contém somente mensagem genérica. Build, check e os 12 scripts de regressão passaram após as atualizações compatíveis de body-parser e qs. npm audit terminou com zero vulnerabilidades conhecidas nas 159 dependências auditadas. Isso não garante ausência de vulnerabilidades desconhecidas ou indisponibilidade futura do Gmail.

Esta verificação substitui a observação anterior de que a chegada na caixa não havia sido testada. Antes de publicar para usuários externos, configurar CYPHER_PUBLIC_ORIGIN com o domínio HTTPS real; localhost é apenas para desenvolvimento.


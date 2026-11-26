# Banco e validação da entrega

## Gerar o pacote demonstrativo

Na pasta `Cypher`, com as dependências instaladas:

```sh
npm run build
node scripts/preparar-banco-entrega.mjs ../CYPHER-Demo-v39
```

Use uma pasta que ainda não exista. O gerador inicializa um banco novo; não lê o banco de trabalho, os backups ou conversas da equipe. Ele exporta `cypher.sqlite`, `schema.sql`, o dicionário extraído do SQLite e `arquivos-beats/`. Mantenha a pasta de áudio junto ao banco. O schema SQL recria a estrutura, não os dados. Para recriar os dados, rode o gerador novamente em outra pasta.

Execute a aplicação a partir de `Cypher`, mantendo o restante do repositório disponível para as mídias públicas. No PowerShell:

```powershell
$env:CYPHER_DB_PATH = (Resolve-Path ../CYPHER-Demo-v39/cypher.sqlite).Path
npm start
```

No Bash:

```sh
CYPHER_DB_PATH=../CYPHER-Demo-v39/cypher.sqlite npm start
```

O pacote usa dados da curadoria, sem contas pessoais importadas, sessões, administradores ou mensagens privadas. Crie uma conta de ensaio no ambiente isolado. Datas, locais e vínculos demonstrativos não são anúncios oficiais. A configuração de administrador e o envio de e-mails são locais à aplicação; não inclua arquivos de ambiente nem a caixa de e-mails na entrega.

## Qual versão o relatório descreve?

O DOCX publicado descreve um recorte anterior, **v27 (30 tabelas)**. O SQLite que já estava publicado na pasta de documentação é **v37 (96 tabelas)**. Não são a mesma base. A aplicação e este gerador usam **v39**. No texto e no DER, identifique a versão da evidência: não substitua apenas as contagens de um diagrama v27 pelas do pacote v39. O `schema.sql` e o dicionário gerados documentam a estrutura física do v39.

## Roteiro de ensaio

1. Abrir a Descoberta com uma conta de ensaio e acessar um perfil público.
2. Pesquisar um beat e conferir prévia, oferta e indicação de disponibilidade.
3. Abrir um evento futuro e conferir inscrição, situação e vagas.
4. Abrir Oportunidades, Portfólio e Mensagens pela navegação; usar contas descartáveis para ensaiar interações.
5. Validar a aquisição local na demonstração. O checkout externo do Mercado Pago exige credenciais de teste e homologação separada; não confunda a simulação local com pagamento homologado.

O catálogo novo mantém os nove eventos selecionados pelo projeto. Os três encontros retirados na reestruturação de 26/11 não foram reintroduzidos. Em bases anteriores, os nove registros legados reconhecidos continuam sendo migrados sem sobrescrever eventos não demonstrativos.

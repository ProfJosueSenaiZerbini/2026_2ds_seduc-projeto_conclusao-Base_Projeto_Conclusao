# CorujaTeca — Sistema de Gerenciamento de Biblioteca Física

O **CorujaTeca** é um sistema web responsivo para gerenciar bibliotecas físicas escolares. Ele organiza o acervo, controla empréstimos e devoluções, acompanha multas e suspensões e permite que frequentadores consultem o acervo e acompanhem seus próprios empréstimos.

O projeto segue o modelo MVC no back-end e foi desenvolvido como trabalho de conclusão do curso Técnico em Desenvolvimento de Sistemas do SENAI Zerbini.

---

## Sumário

* [Funcionalidades](#funcionalidades)
* [Regras de negócio](#regras-de-negócio)
* [Tecnologias](#tecnologias)
* [Estrutura do repositório](#estrutura-do-repositório)
* [Pré-requisitos](#pré-requisitos)
* [Instalação e execução](#instalação-e-execução)
* [Variáveis de ambiente](#variáveis-de-ambiente)
* [Banco de dados](#banco-de-dados)
* [Comandos úteis](#comandos-úteis)
* [Solução de problemas](#solução-de-problemas)
* [Equipe](#equipe)
* [Licença](#licença)

---

## Funcionalidades

### Bibliotecário

* Cadastro de livros pelo ISBN, com preenchimento automático de dados por APIs externas (BrasilAPI e Google Books);
* Cadastro de exemplares (cópias físicas) de cada livro, com status *Disponível*, *Em posse* ou *Danificado*;
* Registro de empréstimos, com escolha de prazo (7, 15 ou 30 dias) e registro de devoluções, com cálculo automático de atraso;
* Cadastro de multas (atraso, depredação e extravio) e cancelamento de multas;
* Cadastro, edição, desativação e reativação de frequentadores e bibliotecários;
* Painel com resumos, empréstimos do dia e livros mais emprestados.

### Frequentador

* Consulta ao acervo com filtros (título, autor, gênero etc.), com visualização de disponibilidade e localização de cada livro;
* Acompanhamento dos próprios empréstimos, com data de devolução e situação de cada um;
* Visualização das próprias multas e da situação da conta;
* Página de ajuda e configurações da conta.

### Regras gerais

* Acesso separado por perfil (bibliotecário ou frequentador), com proteção de rotas por middleware;
* Exclusão lógica: usuários, livros e exemplares são marcados como inativos, não apagados, o que preserva o histórico;
* Senhas armazenadas com hash bcrypt;
* Recuperação de senha protegida pela senha mestra definida no ambiente.

---

## Regras de negócio

As regras abaixo estão implementadas no back-end.

**Empréstimos**

* Um frequentador pode ter no máximo **2 empréstimos ativos** ao mesmo tempo;
* Um frequentador com **multa ativa** não pode fazer novos empréstimos;
* O prazo do empréstimo pode ser de **7, 15 ou 30 dias**;
* Ao registrar um empréstimo, o exemplar passa a *Em posse*. Na devolução, volta a *Disponível*.

**Atraso e suspensão**

* Ao devolver um livro após o prazo, o sistema gera uma multa do tipo **ATRASO**, com início na data da devolução e duração igual ao número de dias de atraso;
* Enquanto houver multa de atraso em aberto, o frequentador fica **suspenso** e não pode pegar novos livros;
* Multas de atraso vencidas são encerradas automaticamente.

**Depredação e extravio**

* Multa de **depredação**: 15 dias de penalidade;
* Multa de **extravio**: 30 dias de penalidade.

**Cadastros**

* Não é possível cadastrar dois livros com o mesmo ISBN; o ISBN é único no banco;
* Usuários, livros e exemplares não são apagados fisicamente. Eles são desativados e podem ser reativados.

---

## Tecnologias

### Dependências de execução

| Pacote | Versão | Utilização |
| --- | --- | --- |
| `next` | 16.3.0 | Framework web (App Router), páginas e rotas de API |
| `react` / `react-dom` | 19.2.8 | Construção da interface |
| `prisma` | ^7.9.1 | CLI do Prisma (geração do client e sincronização do banco) |
| `@prisma/client` | ^7.9.1 | Client usado pelo back-end para acessar o banco |
| `@prisma/adapter-pg` | ^7.9.1 | Adaptador que conecta o Prisma ao PostgreSQL via `pg` |
| `bcrypt` | ^6.0.0 | Hash e comparação de senhas |
| `lucide-react` | ^1.31.0 | Ícones da interface |

### Dependências de desenvolvimento

| Pacote | Versão | Utilização |
| --- | --- | --- |
| `typescript` | ^5 | Tipagem e compilação |
| `tailwindcss` / `@tailwindcss/postcss` | ^4 | Estilização da interface |
| `eslint` / `eslint-config-next` | ^9 / 16.3.0 | Análise estática e regras do Next.js |
| `@types/react`, `@types/react-dom`, `@types/node`, `@types/bcrypt` | — | Tipagens para TypeScript |

A lista completa, com todas as versões fixadas, está em `corujateca/package.json` e `corujateca/package-lock.json`.

---

## Estrutura do repositório

```text
projeto-conclusao-corujateca/
├── corujateca/              # Aplicação Next.js (código do sistema)
│   ├── prisma/
│   │   └── schema.prisma    # Modelo de dados (referência do banco)
│   ├── src/
│   │   ├── app/             # Páginas e rotas de API (App Router)
│   │   ├── components/      # Componentes reutilizáveis
│   │   └── lib/             # Autenticação e utilitários
│   ├── public/images/       # Logos, capas padrão e ilustrações
│   ├── middleware.ts        # Proteção de rotas por perfil
│   └── package.json
├── Docs/                    # Documentação do trabalho
│   ├── Diagramas/           # Diagramas de casos de uso, classes e modelos
│   ├── Testes/              # Casos de teste
│   ├── Wireframes/          # Wireframes das telas
│   └── Scripts Banco Dados/ # Scripts SQL antigos (ver observação em Banco de dados)
└── readme.md
```

---

## APIs utilizadas

### APIs externas

| API | Uso no sistema | Chave necessária |
| --- | --- | --- |
| **[BrasilAPI — ISBN](https://brasilapi.com.br/docs#tag/ISBN)** (`/api/isbn/v1/{isbn}`) | Fonte principal para preencher os dados do livro ao cadastrar pelo ISBN | Não |
| **[Google Books API](https://developers.google.com/books/docs/v1/using)** (`/books/v1/volumes?q=isbn:{isbn}`) | Fonte de contingência, usada quando a BrasilAPI não responde ou não encontra o livro | Não (usa a cota pública) |
| **Google Fonts** (via `next/font/google`) | Fontes Geist e Geist Mono, baixadas no build | Não |

A consulta pelo ISBN é feita pela rota interna `GET /api/google-books?isbn=...`. Ela tenta a BrasilAPI primeiro e, se falhar, consulta o Google Books. Nenhuma chave de API precisa ser configurada.

### API interna (rotas do Next.js)

O front-end se comunica com o back-end por rotas de API em `corujateca/src/app/api/`, organizadas por recurso:

| Recurso | Rotas principais |
| --- | --- |
| Autenticação | `POST /api/auth/login`, `GET/POST /api/auth/logout` |
| Recuperação de senha | `POST /api/esqueci-senha` |
| Livros | `GET/POST /api/livros`, `GET/PUT /api/livros/{id}`, `PATCH /api/livros/{id}/desativar`, `PATCH /api/livros/{id}/reativar`, `GET /api/livros/reativar-livros`, `GET /api/livros/quantidade`, `GET /api/livros/mais-emprestados`, `GET /api/livros/genero-semana` |
| Cadastro de livro | `GET/POST /api/cadastrar-novo-livro` |
| Exemplares | `GET/POST /api/exemplares`, `PATCH /api/exemplares/{id}/desativar`, `PATCH /api/exemplares/{id}/reativar` |
| Empréstimos | `GET/POST /api/emprestimos`, `PATCH /api/emprestimos/{id}`, `PATCH /api/emprestimos/{id}/desativar` |
| Multas | `GET/POST/PATCH /api/multas` |
| Frequentadores | `GET/POST /api/frequentador`, `GET/PUT/DELETE /api/frequentador/{id}`, `PATCH /api/frequentador/{id}/desativar`, `PATCH /api/frequentador/{id}/reativar`, `GET /api/frequentador/emprestimos-hoje`, `GET /api/frequentador/resumo` |
| Bibliotecários | `GET/POST /api/bibliotecario`, `POST/PUT /api/bibliotecario/{id}/atualizar`, `PATCH /api/bibliotecario/{id}/desativar`, `PATCH /api/bibliotecario/{id}/reativar`, `GET /api/bibliotecario/emprestimos-hoje`, `GET /api/bibliotecario/resumo` |
| Conta do usuário logado | `DELETE /api/conta` |

As rotas trabalham com JSON. Algumas verificam a sessão do usuário, como `GET /api/emprestimos`, que só responde a frequentadores autenticados.

---

## Pré-requisitos

* **Node.js 20.9 ou superior** (exigido pelo Next.js 16)
* **npm**
* **Git**
* **PostgreSQL**, local ou hospedado em algum serviço

Para verificar as versões instaladas:

```bash
node --version
npm --version
git --version
```

---

## Instalação e execução

Todos os comandos abaixo devem ser executados dentro da pasta da aplicação, `corujateca/`.

### 1. Clonar o repositório

```bash
git clone https://github.com/ProfJosueSenaiZerbini/projeto-conclusao-corujateca.git
cd projeto-conclusao-corujateca/corujateca
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Criar o arquivo `.env`

Crie o arquivo `.env` dentro da pasta `corujateca/` e preencha as variáveis de ambiente (veja [Variáveis de ambiente](#variáveis-de-ambiente)). Escolha uma das opções abaixo:

**Opção 1: copiar o arquivo de exemplo pelo terminal**

No Linux ou macOS:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

**Opção 2: renomear o arquivo de exemplo**

Renomeie o arquivo `.env.example` para `.env`, pelo explorador de arquivos ou pelo editor de código.

**Opção 3: criar o arquivo manualmente**

Crie um novo arquivo chamado `.env` na pasta `corujateca/` e cole o conteúdo abaixo, substituindo os valores pelos seus:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO"
MASTER_SECRET="uma-senha-forte-so-do-administrador"
```

> Após criar o arquivo, preencha `DATABASE_URL` e `MASTER_SECRET` com valores reais. O `.env` não deve ser enviado ao GitHub.

### 4. Gerar o Prisma Client

```bash
npx prisma generate
```

### 5. Criar as tabelas no banco

O projeto ainda não possui a pasta de migrations. Para criar as tabelas a partir do `schema.prisma`, use:

```bash
npx prisma db push
```

### 6. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O sistema ficará disponível em **http://localhost:3000**.

---

## Variáveis de ambiente

O arquivo `.env` fica na pasta `corujateca/` e não deve ser versionado (ele já está listado no `.gitignore`). Use o `.env.example` como modelo.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | URL de conexão com o PostgreSQL |
| `MASTER_SECRET` | Sim | Senha mestra usada no cadastro de bibliotecários e na recuperação de senha |

Exemplo:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO"
MASTER_SECRET="uma-senha-forte-so-do-administrador"
```

> Não compartilhe o `.env` nem publique `DATABASE_URL` ou `MASTER_SECRET` em repositórios públicos. Se uma credencial já foi publicada, troque-a no provedor do banco.

---

## Banco de dados

O sistema usa **PostgreSQL** com **Prisma**. O arquivo `corujateca/prisma/schema.prisma` é a referência oficial da estrutura do banco.

| Tabela | Finalidade |
| --- | --- |
| `bibliotecario` | Usuários com perfil de bibliotecário |
| `frequentador` | Usuários frequentadores, com flag de suspensão |
| `livro` | Dados bibliográficos, identificados por ISBN único |
| `exemplar` | Cada unidade física de um livro, com status |
| `emprestimo` | Empréstimos, com data prevista e data real de devolução |
| `multa` | Multas aplicadas a frequentadores |
| `tel_bibliotecario` / `tel_freq` | Telefones dos usuários |

Os status de exemplar são `Em posse`, `Disponível` e `Danificado`.

> **Observação:** a pasta `Docs/Scripts Banco Dados/` contém um script SQL em **MySQL** criado nas fases iniciais do projeto. Ele não corresponde ao modelo atual, que é PostgreSQL com Prisma. Para criar o banco, use `npx prisma db push`, conforme descrito acima.

### Alterando o modelo de dados

Sempre que o `schema.prisma` for alterado, atualize o Prisma Client:

```bash
npx prisma generate
```

Para aplicar a alteração no banco durante o desenvolvimento:

```bash
npx prisma db push
```

Se o projeto passar a usar migrations versionadas, substitua o comando acima por `npx prisma migrate dev --name descricao_da_alteracao`.

---

## Comandos úteis

| Comando | Função |
| --- | --- |
| `npm install` | Instala as dependências |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm start` | Executa a versão de produção (após o `build`) |
| `npm run lint` | Executa o ESLint |
| `npx prisma generate` | Gera o Prisma Client |
| `npx prisma db push` | Sincroniza o banco com o `schema.prisma` |
| `npx prisma studio` | Abre a interface gráfica para visualizar os dados |

---

## Solução de problemas

**Erro: `DATABASE_URL não foi definida no arquivo .env`**
Confirme que o arquivo `.env` está dentro da pasta `corujateca/` e que a variável está preenchida. Depois, reinicie o `npm run dev`.

**Erro ao conectar ao PostgreSQL**
Verifique se o servidor está em execução, se usuário, senha, porta e nome do banco estão corretos e, no caso de banco remoto, se o provedor permite conexões externas.

**Erro relacionado ao Prisma Client**
Execute `npx prisma generate` e reinicie o servidor. Se a estrutura do banco também mudou, execute `npx prisma db push`.

**Erro: `MASTER_SECRET não foi configurada`**
Defina a variável `MASTER_SECRET` no `.env` e reinicie o servidor. Sem ela, o cadastro de bibliotecários e a recuperação de senha não funcionam.

**Tabelas não encontradas**
O banco está vazio. Execute `npx prisma db push` para criar as tabelas.

---

## Equipe

Projeto desenvolvido como trabalho de conclusão do curso Técnico em Desenvolvimento de Sistemas.

* Alexandra Marques Santos Pereira
* Enzo Henrique Barbino de Sousa
* Maria Luiza Dias Brito da Silva
* Rogério Malto Giardini dos Anjos
* Stephanny Borrozzino

Product Owner: Josué Rosário. Scrum Master: Stephanny Borrozzino.

---

## Licença

Este projeto foi desenvolvido para fins acadêmicos. Consulte os responsáveis pelo projeto antes de utilizar, modificar ou distribuir o sistema para outras finalidades.

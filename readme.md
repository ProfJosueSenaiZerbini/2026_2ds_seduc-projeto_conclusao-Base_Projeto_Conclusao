# Sistema de Gerenciamento de Biblioteca Física - CorujaTeca

O **Corujateca** é um sistema web desenvolvido para auxiliar na gestão de uma biblioteca, permitindo o controle de usuários, livros, empréstimos, devoluções, multas e demais informações relacionadas ao funcionamento do acervo.

O sistema foi desenvolvido com foco em facilitar o gerenciamento das atividades realizadas pelos bibliotecários e permitir que os frequentadores consultem e acompanhem suas informações.

---

## Sumário

* [Sobre o projeto](#sobre-o-projeto)
* [Tecnologias utilizadas](#tecnologias-utilizadas)
* [Pré-requisitos](#pré-requisitos)
* [Instalação](#instalação)
* [Configuração do arquivo `.env`](#configuração-do-arquivo-env)
* [Configuração do banco de dados](#configuração-do-banco-de-dados)
* [Banco de dados local](#banco-de-dados-local)
* [Banco de dados remoto/online](#banco-de-dados-remotoonline)
* [Configuração do Prisma](#configuração-do-prisma)
* [Atualizando o Prisma Client](#atualizando-o-prisma-client)
* [Migrations](#migrations)
* [Executando o projeto](#executando-o-projeto)
* [Comandos úteis](#comandos-úteis)
* [Solução de problemas](#solução-de-problemas)
* [Equipe](#equipe)

---

# Sobre o projeto

O **Corujateca** foi desenvolvido para informatizar o gerenciamento de uma biblioteca, centralizando informações relacionadas ao acervo e aos usuários.

Entre as principais funcionalidades do sistema estão:

* Gerenciamento de livros;
* Gerenciamento de frequentadores;
* Gerenciamento de bibliotecários;
* Controle de empréstimos;
* Controle de devoluções;
* Gerenciamento de multas;
* Pesquisa de informações;
* Visualização de dados do sistema;
* Controle de acesso de usuários.

O sistema possui diferentes áreas de acordo com o tipo de usuário, permitindo que cada perfil tenha acesso às funcionalidades necessárias para suas atividades.

---

# Tecnologias utilizadas

O projeto utiliza as seguintes tecnologias:

| Tecnologia       | Utilização                       |
| ---------------- | -------------------------------- |
| **Next.js**      | Desenvolvimento do sistema web   |
| **React**        | Construção da interface          |
| **TypeScript**   | Tipagem e desenvolvimento        |
| **Tailwind CSS** | Estilização da interface         |
| **Prisma ORM**   | Comunicação com o banco de dados |
| **PostgreSQL**   | Banco de dados                   |
| **Node.js**      | Ambiente de execução             |
| **Git**          | Controle de versão               |

---

# Pré-requisitos

Antes de iniciar a instalação, certifique-se de possuir as seguintes ferramentas instaladas:

* **Node.js**
* **npm**
* **Git**
* **PostgreSQL**, caso utilize um banco local

Também é necessário possuir acesso a um banco de dados PostgreSQL, seja ele:

* Local;
* Remoto;
* Hospedado em algum serviço de banco de dados.

Para verificar se o Node.js está instalado:

```bash
node --version
```

Para verificar o npm:

```bash
npm --version
```

Para verificar o Git:

```bash
git --version
```

---

# Instalação

## 1. Clonar o repositório

Primeiramente, clone o repositório do projeto:

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do projeto:

```bash
cd corujateca
```

> Substitua `URL_DO_REPOSITORIO` pela URL real do repositório.

---

## 2. Instalar as dependências

Execute:

```bash
npm install
```

Esse comando instala todas as dependências necessárias para executar o projeto.

---

# Configuração do arquivo `.env`

O projeto utiliza variáveis de ambiente para armazenar informações de configuração, principalmente os dados necessários para conexão com o banco de dados.

Na raiz do projeto, deve existir um arquivo:

```text
.env
```

Exemplo:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO"
```

# Configuração do banco de dados

O Corujateca utiliza **PostgreSQL** como banco de dados e **Prisma ORM** para realizar a comunicação entre a aplicação e o banco.

A conexão é configurada através da variável:

```env
DATABASE_URL
```

O formato padrão da URL de conexão é:

```text
postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

Exemplo:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/corujateca"
```

Os principais componentes são:

| Parte           | Descrição                             |
| --------------- | ------------------------------------- |
| `postgresql://` | Indica que o banco utiliza PostgreSQL |
| `postgres`      | Usuário do banco                      |
| `123456`        | Senha do banco                        |
| `localhost`     | Endereço do servidor                  |
| `5432`          | Porta padrão do PostgreSQL            |
| `corujateca`    | Nome do banco                         |

---

# Banco de dados local

Para utilizar um banco PostgreSQL localmente, primeiro é necessário instalar o PostgreSQL.

Depois de instalado, crie um banco para o projeto.

Exemplo:

```text
Nome: corujateca
Usuário: postgres
Porta: 5432
```

O `.env` poderá ficar semelhante a:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/corujateca"
```

Substitua `SUA_SENHA` pela senha definida durante a instalação do PostgreSQL.

Depois de configurar a conexão, execute:

```bash
npx prisma generate
```

E, caso o projeto utilize migrations:

```bash
npx prisma migrate dev
```

---

# Banco de dados remoto/online

Também é possível utilizar um banco PostgreSQL hospedado remotamente.

Nesse caso, o provedor escolhido fornecerá uma URL de conexão semelhante a:

```text
postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

Essa URL deve ser colocada no arquivo `.env`:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO"
```

### Exemplo

```env
DATABASE_URL="postgresql://usuario:senha@servidor.exemplo.com:5432/corujateca"
```

> A URL apresentada acima é apenas um exemplo. Utilize a URL fornecida pelo seu serviço de hospedagem de PostgreSQL.

Após configurar a variável, gere o Prisma Client:

```bash
npx prisma generate
```

Caso o banco remoto esteja vazio e o projeto possua migrations:

```bash
npx prisma migrate deploy
```

---

# Configuração do Prisma

O projeto utiliza o **Prisma ORM** para realizar a comunicação com o PostgreSQL.

O arquivo principal de configuração do schema é:

```text
prisma/schema.prisma
```

A configuração do datasource utiliza PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
}
```

O Prisma utiliza a variável `DATABASE_URL` definida no `.env` para realizar a conexão com o banco.

---

# Atualizando o Prisma Client

Sempre que houver alterações no arquivo:

```text
prisma/schema.prisma
```

é necessário atualizar o Prisma Client utilizado pela aplicação.

Execute:

```bash
npx prisma generate
```

Esse comando gera/atualiza o Prisma Client com base no schema atual do projeto.

### Exemplo

Se um novo campo for adicionado a um model:

```prisma
model usuario {
  id      Int    @id @default(autoincrement())
  nome    String
  email   String
}
```

Após alterar o schema, execute:

```bash
npx prisma generate
```

Dessa forma, o Prisma Client passa a reconhecer as alterações realizadas.

---

# Migrations

Quando uma alteração no `schema.prisma` também precisa ser aplicada ao banco de dados, deve ser criada uma migration.

Durante o desenvolvimento, utilize:

```bash
npx prisma migrate dev --name nome_da_migration
```

Exemplo:

```bash
npx prisma migrate dev --name adicionar_email_usuario
```

Esse comando:

1. Detecta as alterações no schema;
2. Cria uma migration;
3. Aplica a alteração ao banco;
4. Atualiza o Prisma Client.

---

## Aplicando migrations em produção

Em ambientes de produção, utilize:

```bash
npx prisma migrate deploy
```

Esse comando aplica as migrations existentes que ainda não foram executadas no banco de dados.

---

# Fluxo recomendado após alterar o Prisma

Sempre que modificar o:

```text
prisma/schema.prisma
```

verifique se a alteração precisa modificar o banco.

### Alteração apenas no Client

Caso seja necessário apenas atualizar o Prisma Client:

```bash
npx prisma generate
```

### Alteração estrutural no banco durante desenvolvimento

Utilize:

```bash
npx prisma migrate dev --name descricao_da_alteracao
```

### Atualização do banco em produção

Utilize:

```bash
npx prisma migrate deploy
```

---

# Executando o projeto

Depois de configurar o `.env`, instalar as dependências e preparar o banco de dados, execute:

```bash
npm run dev
```

O Next.js iniciará o servidor de desenvolvimento.

Por padrão, o sistema estará disponível em:

```text
http://localhost:3000
```

# Comandos úteis

## Instalar dependências

```bash
npm install
```

## Executar o projeto

```bash
npm run dev
```

## Gerar o Prisma Client

```bash
npx prisma generate
```

## Criar uma migration

```bash
npx prisma migrate dev --name nome_da_migration
```

## Aplicar migrations em produção

```bash
npx prisma migrate deploy
```

## Abrir o Prisma Studio

```bash
npx prisma studio
```

O Prisma Studio permite visualizar e manipular os dados do banco através de uma interface gráfica.

## Verificar a versão do Prisma

```bash
npx prisma --version
```

---

# Solução de problemas

## Erro: `DATABASE_URL não foi definida`

Verifique se existe um arquivo `.env` na raiz do projeto:

```text
corujateca/
├── .env
├── .gitignore
└── ...
```

E confirme se ele possui:

```env
DATABASE_URL="sua_url_de_conexao"
```

Depois, reinicie o servidor:

```bash
npm run dev
```

---

## Erro ao conectar ao PostgreSQL

Verifique:

* Se o PostgreSQL está em execução;
* Se o usuário está correto;
* Se a senha está correta;
* Se o nome do banco está correto;
* Se a porta está correta;
* Se o servidor remoto permite conexões externas;
* Se a `DATABASE_URL` está corretamente configurada.

---

## Prisma Client desatualizado

Caso a aplicação apresente erros relacionados ao Prisma Client após alterações no `schema.prisma`, execute:

```bash
npx prisma generate
```

Se a alteração também modificar a estrutura do banco:

```bash
npx prisma migrate dev --name atualizacao
```

---

## Banco de dados sem as tabelas

Se o banco ainda não possui as tabelas necessárias, verifique as migrations do projeto.

Durante o desenvolvimento:

```bash
npx prisma migrate dev
```

Em produção:

```bash
npx prisma migrate deploy
```

---

# Segurança

Nunca compartilhe informações sensíveis do banco de dados.

Evite publicar:

```env
DATABASE_URL="postgresql://usuario:senha@servidor/banco"
```

em repositórios públicos.

O arquivo `.env` deve permanecer protegido e fora do controle de versão.

Para facilitar a configuração de novos desenvolvedores, recomenda-se disponibilizar um arquivo de exemplo:

```text
.env.example
```

Exemplo:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO"
```

O desenvolvedor deverá copiar o arquivo:

```bash
cp .env.example .env
```

e preencher os valores de acordo com o banco utilizado.

---

# Fluxo completo de instalação

Para configurar o projeto em uma máquina nova:

```bash
git clone URL_DO_REPOSITORIO
cd corujateca
npm install
```

Configure o arquivo:

```text
.env
```

com:

```env
DATABASE_URL="SUA_URL_DO_POSTGRESQL"
```

Depois execute:

```bash
npx prisma generate
```

Para ambiente de desenvolvimento com migrations:

```bash
npx prisma migrate dev
```

Por fim:

```bash
npm run dev
```

O sistema estará disponível em:

```text
http://localhost:3000
```

---

# Equipe

Projeto desenvolvido por:

**Corujateca — Sistema de Gestão de Biblioteca**

Desenvolvido como projeto acadêmico do curso Técnico em Desenvolvimento de Sistemas.

## Nome dos integrantes

- Alexandra Marques Santos Pereira 
- Enzo Henrique Barbino de Sousa 
- Maria Luiza Dias Brito da Silva 
- Rogério Malto Giardini Dos Anjos 
- Stephanny Borrozzino 

---

# Licença

Este projeto foi desenvolvido para fins acadêmicos.

Consulte os responsáveis pelo projeto antes de utilizar, modificar ou distribuir o sistema para outras finalidades.

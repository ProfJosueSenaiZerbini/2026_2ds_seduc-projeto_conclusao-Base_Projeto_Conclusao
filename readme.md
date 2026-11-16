# 🛠️ iBico

O **iBico** é uma plataforma desenvolvida para conectar **contratantes** a **prestadores de serviços rápidos (bicos)** de forma simples, direta e segura.

---

## 👥 Integrantes

- **Guilherme Iscaro** — [GitHub](https://github.com/iscaroo)
- **Pedro Henrique** — [GitHub](https://github.com/Pedrin-com)
- **Bruno Henrique** — [GitHub](https://github.com/araujonascimentobrunohentique-crypto)
- **Francisco Kaique** — [GitHub](https://github.com/francisco292)
- **Victor Barros** — [GitHub](https://github.com/usuario4)

---

## 🛠️ Tecnologias

- **Backend:** Node.js + Express
- **Banco de dados:** MySQL / MariaDB
- **Modelagem:** DBML / dbdiagram.io

---

## 🚀 Instalação

### 📋 Pré-requisitos

Antes de começar, tenha instalado:

- [Node.js](https://nodejs.org/)
- MySQL ou MariaDB
- XAMPP (opcional, caso utilize o MySQL pelo XAMPP)
- Git

### 1. 📥 Clone o projeto

```bash
git clone https://github.com/ProfJosueSenaiZerbini/projeto-conclusao-ibico.git
```

Entre na pasta do projeto:

```bash
cd projeto-conclusao-ibico
```

### 2. 📦 Instale as dependências

Execute:

```bash
npm install
```

### 3. 🗄️ Configure o banco de dados

Execute o arquivo `schema.sql`, localizado na raiz do projeto, para criar o banco de dados `db_bico` e suas tabelas.

Pelo terminal:

```bash
mysql -u seu_usuario -p < schema.sql
```

Substitua `seu_usuario` pelo usuário do seu banco de dados. O terminal solicitará a senha.

Ou, pelo **phpMyAdmin / MySQL Workbench**, abra o arquivo `schema.sql` e execute o script completo.

### 4. 🔐 Configure as variáveis de ambiente

Crie um arquivo chamado `.env` na raiz do projeto com as seguintes variáveis:

```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=db_bico
DB_PORT=3306
PORT=3000
NODE_ENV=development
SESSION_SECRET=
```

Substitua os valores do banco de dados pelas suas próprias configurações.

**Gere sua própria `SESSION_SECRET`:**

Execute o comando abaixo no terminal do VS Code:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie a chave gerada e coloque-a na variável `SESSION_SECRET` do seu arquivo `.env`.

Cada integrante deve gerar sua própria chave e manter o arquivo `.env` privado.

> ⚠️ **Importante:** não compartilhe o arquivo `.env` nem envie credenciais ou chaves secretas para o GitHub.

### 5. ▶️ Inicie o projeto

Para iniciar o servidor:

```bash
npm start
```

Ou, se o projeto possuir um script de desenvolvimento configurado:

```bash
npm run dev
```

### 6. 🌐 Acesse a aplicação

Após iniciar o servidor, abra no navegador:

http://localhost:3000

---

## 📌 Status

🚧 **Em desenvolvimento**

Projeto desenvolvido para fins educacionais.
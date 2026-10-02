# 🛠️ iBico

O **iBico** é uma plataforma desenvolvida para conectar **contratantes** a **prestadores de serviços rápidos (bicos)** de forma simples, direta e segura.

---

## 👥 Integrantes

* **Guilherme Iscaro** — [GitHub](https://github.com/iscaroo)
* **Pedro Henrique** —  [GitHub](https://github.com/Pedrin-com)
* **Bruno Henrique** — [GitHub](https://github.com/araujonascimentobrunohentique-crypto)
* **Francisco Kaique** — [GitHub](https://github.com/francisco292)
* **Victor Barros** — [GitHub](https://github.com/usuario4)

---

## 🛠️ Tecnologias

* **Backend:** Node.js + Express
* **Banco de Dados:** MySQL / MariaDB
* **Modelagem:** DBML / dbdiagram.io

---

# 🚀 Instalação

## 📋 Pré-requisitos

Antes de começar, tenha instalado:
* MySQL ou MariaDB
* XAMPP *(opcional, caso utilize o MySQL pelo XAMPP)*

---

## 1. 📥 Clone o projeto

```bash
git clone https://github.com/ProfJosueSenaiZerbini/projeto-conclusao-ibico.git
```

Entre na pasta:

```bash
cd projeto-conclusao-ibico
```

---

## 2. 📦 Instale as dependências

Execute:

```bash
npm install
```

---

## 3. 🗄️ Configure o banco de dados
Execute o arquivo `schema.sql` (localizado na raiz do projeto) no seu gerenciador de banco de dados para criar a base `db_bico` e toda a estrutura das tabelas.

Pelo Terminal:
```Bash
mysql -u seu_usuario -p < schema.sql
```
ou

Pelo phpMyAdmin / MySQL Workbench: Abra o arquivo schema.sql no seu cliente MySQL e execute todo o script.

---

## 4. 🔐 Configure o `.env`

Crie um arquivo `.env` na raiz do projeto:

```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=db_bico
DB_PORT=3306
PORT=3000
NODE_ENV=development
SESSION_SECRET=troque-por-um-segredo-forte
```

> ⚠️ Não compartilhe o arquivo `.env` nem envie suas credenciais para o GitHub.

---

## 5. ▶️ Inicie o projeto

Para iniciar o servidor:

```bash
npm start
```

Ou, caso o projeto possua o script de desenvolvimento:

```bash
npm run dev
```

---

## 🌐 Acesse

Após iniciar o servidor, abra:

**http://localhost:3000**

---

## 📌 Status

🚧 **Em desenvolvimento**

Projeto desenvolvido para fins educacionais.

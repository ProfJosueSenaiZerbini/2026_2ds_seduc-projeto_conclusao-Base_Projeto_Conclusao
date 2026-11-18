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

> **Banco já criado antes do cancelamento de bico?** Execute uma vez `migrations/001_estorno.sql` (adiciona o tipo `ESTORNO` à tabela `movimentacoes_carteira`). Quem criou o banco com o `schema.sql` atual não precisa.

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

### 7. 📸 Gerar as capturas de tela (opcional)

Com o MariaDB ligado, execute `node scripts/prints-tcc.js`. O script cria dados fictícios em um banco separado (`db_bico_prints`, sem tocar no `db_bico`) e salva as imagens em `Docs/Prints/`.

---

## 🧹 Padrão de código

O projeto usa **Prettier** (formatação), **ESLint** (JavaScript) e **Stylelint** (CSS), todos instalados como dependências de desenvolvimento pelo `npm install`.

| Comando | O que faz |
| --- | --- |
| `npm run format` | Formata o projeto com o Prettier (grava as mudanças). |
| `npm run format:check` | Só confere a formatação, sem alterar nada (usado no GitHub Actions). |
| `npm run lint` | Analisa o JavaScript com o ESLint. |
| `npm run lint:css` | Analisa o CSS de `public/css` com o Stylelint. |
| `npm run test:unit` | Testes unitários. |
| `npm test` | Testes E2E (Playwright). O próprio Playwright sobe o servidor com `CEP_FAKE=1`, então a porta 3000 precisa estar livre. |

**Regras principais**

- JavaScript: 4 espaços, aspas simples, ponto e vírgula, sem vírgula final e linhas de até 120 caracteres. CSS, JSON, YAML, Markdown e HTML: 2 espaços. Views `.ejs` e scripts `.sql` não são formatados.
- Fim de linha sempre **LF**, inclusive no Windows (garantido pelo `.gitattributes` e pelo `.editorconfig`).
- CSS: classes em kebab-case ou BEM (`.wallet__card--primary`). Cores devem usar variáveis (`var(--...)`); hex e `rgba()` só na definição das variáveis. Por enquanto, cor solta gera **aviso**, não erro.

**Extensões recomendadas do VS Code** (o editor sugere ao abrir o projeto, por causa do `.vscode/extensions.json`):

- Prettier – Code formatter (`esbenp.prettier-vscode`)
- ESLint (`dbaeumer.vscode-eslint`)
- Stylelint (`stylelint.vscode-stylelint`)

Com elas, o `.vscode/settings.json` formata o arquivo ao salvar e mostra os avisos do ESLint e do Stylelint no editor.

**GitHub Actions:** o workflow `.github/workflows/testes.yml` roda, a cada push na `main` e a cada pull request, a conferência de formatação, os dois linters, os testes unitários e os E2E, usando um MariaDB 11 com o `schema.sql`. Se os E2E falharem, o relatório do Playwright fica disponível como artifact.

---

## 📌 Status

🚧 **Em desenvolvimento**

Projeto desenvolvido para fins educacionais.
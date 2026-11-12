## Integrantes
* Anna Clara Mansano Santos
* Haifa Cecilia Rios Antunes
* Sofia Vicente de Souza
* Rotxibel Daniela Cabello Ramirez
* Victor Kauã Silva Figueredo


## Descrição Resumida do Projeto

Este projeto consiste no desenvolvimento de uma plataforma web que combina as funcionalidades de um blog com a dinâmica de uma rede social, voltada essencialmente para o público feminino. O sistema surge como um espaço de lazer e conexão, permitindo o compartilhamento de saberes por meio de artigos, resenhas e interações pessoais entre as usuárias.

O principal diferencial do projeto é o resgate da estética visual dos anos 2000 (Y2K), unindo a nostalgia dessa época a uma arquitetura de software moderna. Para garantir uma boa navegabilidade e organização do conteúdo, a aplicação é dividida em seções temáticas, permitindo que as usuárias explorem tópicos de interesse, criem publicações e interajam em comunidade.



# Como Instalar e Rodar o Sistema

> *Tutorial de instalação em desenvolvimento.*

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

* [Node.js](https://nodejs.org/)
* [React](https://react.dev/)
* [MySQL](https://www.mysql.com/)
* [Git](https://git-scm.com/)

---

## Passo a Passo de Instalação

### 1. Clonar o repositório

Abra o terminal e execute o comando abaixo para clonar o projeto:

```bash
git clone https://github.com/ProfJosueSenaiZerbini/projeto-conclusao-blog
```

## Entre na pasta do projeto:

```bash
cd projeto-conclusao-blog

```

### 2. Instalar as dependências

Execute:

```bash
npm install

```

### 3. Configurar o banco de dados

Crie um banco de dados no MySQL e configure os dados de conexão no projeto.

Exemplo:

* **Banco:** blog
* **Usuário:** root
* **Senha:** sua_senha
* **Porta:** 3000

### 4. Iniciar o sistema

Siga a ordem dos comandos para preparar e rodar a aplicação:

* **Criar o usuário administrador:**
```bash
npm run criar-admin

```

* **Iniciar o Back-end:**
```bash
npm start

```

  * ** inicia O Frontend ** *
    
```bash
npm run dev

```



Após iniciar, acesse no navegador o endereço informado pelo terminal, geralmente:

http://localhost:5173

Pronto! O sistema estará rodando localmente na sua máquina.

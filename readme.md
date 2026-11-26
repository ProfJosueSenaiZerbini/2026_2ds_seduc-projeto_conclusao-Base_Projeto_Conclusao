# CorujaTeca — Sistema de Gerenciamento de Biblioteca Física

O **CorujaTeca** é um sistema web responsivo para gerenciar bibliotecas físicas escolares. Ele organiza o acervo, controla empréstimos e devoluções, acompanha multas e suspensões e permite que frequentadores consultem o acervo e acompanhem seus próprios empréstimos.

Desenvolvido com **Next.js**, o projeto utiliza uma arquitetura híbrida (full-stack) que integra interface e regras de negócio no mesmo ecossistema, separando a camada de apresentação das rotas de API e serviços de dados. Foi criado como trabalho de conclusão do curso Técnico em Desenvolvimento de Sistemas do SENAI Zerbini.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Regras de negócio](#regras-de-negócio)
- [Tecnologias](#tecnologias)
- [Estrutura do repositório](#estrutura-do-repositório)
- [APIs utilizadas](#apis-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução](#instalação-e-execução)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Comandos úteis](#comandos-úteis)
- [Solução de problemas](#solução-de-problemas)
- [Equipe](#equipe)
- [Licença](#licença)

---

## Funcionalidades

### Bibliotecário

- Cadastro de livros pelo ISBN, com preenchimento automático de dados por APIs externas (BrasilAPI e Google Books);
- Cadastro de exemplares (cópias físicas) de cada livro, com status *Disponível*, *Em posse* ou *Danificado*;
- Registro de empréstimos, com escolha de prazo (7, 15 ou 30 dias) e registro de devoluções, com cálculo automático de atraso;
- Cadastro de multas (atraso, depredação e extravio) e cancelamento de multas;
- Cadastro, edição, desativação e reativação de frequentadores e bibliotecários;
- Painel com resumos, empréstimos do dia e livros mais emprestados.

### Frequentador

- Consulta ao acervo com filtros (título, autor, gênero etc.), com visualização de disponibilidade e localização de cada livro;
- Acompanhamento dos próprios empréstimos, com data de devolução e situação de cada um;
- Visualização das próprias multas e da situação da conta;
- Página de ajuda e configurações da conta.

### Regras gerais

- Acesso separado por perfil (bibliotecário ou frequentador), com proteção de rotas por middleware;
- Exclusão lógica: usuários, livros e exemplares são marcados como inativos, não apagados, o que preserva o histórico;
- Senhas armazenadas com hash bcrypt;
- Recuperação de senha protegida pela senha mestra definida no ambiente.

---

## Regras de negócio

As regras abaixo estão implementadas no back-end.

**Empréstimos**

- Um frequentador pode ter no máximo **2 empréstimos ativos** ao mesmo tempo;
- Um frequentador com **multa ativa** não pode fazer novos empréstimos;
- O prazo do empréstimo pode ser de **7, 15 ou 30 dias**;
- Ao registrar um empréstimo, o exemplar passa a *Em posse*. Na devolução, volta a *Disponível*.

**Atraso e suspensão**

- Ao devolver um livro após o prazo, o sistema gera uma multa do tipo **ATRASO**, com início na data da devolução e duração igual ao número de dias de atraso;
- Enquanto houver multa de atraso em aberto, o frequentador fica **suspenso** e não pode pegar novos livros;
- Multas de atraso vencidas são encerradas automaticamente.

**Depredação e extravio**

- Multa de **depredação**: 15 dias de penalidade;
- Multa de **extravio**: 30 dias de penalidade.

**Cadastros**

- Não é possível cadastrar dois livros com o mesmo ISBN; o ISBN é único no banco;
- Usuários, livros e exemplares não são apagados fisicamente. Eles são desativados e podem ser reativados.

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

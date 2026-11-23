# Definição da Stack Tecnológica do TCC Cypher

## Stack consolidada

| Camada         | Tecnologias                           |
| -------------- | ------------------------------------- |
| Backend        | Node.js, TypeScript e Express         |
| Frontend       | EJS, CSS modular e JavaScript vanilla |
| Banco de dados | SQLite                                |

## Arquitetura

O Cypher segue o padrão MVC (Model–View–Controller). As rotas associam as requisições aos controladores, com middlewares e validadores aplicados conforme necessário. Os controladores coordenam o processamento das requisições, os modelos representam os dados e as views são renderizadas com EJS.

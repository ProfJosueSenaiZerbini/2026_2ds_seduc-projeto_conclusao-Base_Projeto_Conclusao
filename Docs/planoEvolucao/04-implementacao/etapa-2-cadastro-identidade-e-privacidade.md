# Etapa 2 — Cadastro, identidade e privacidade

Concluída em 16/11/2026 para o ambiente de desenvolvimento.

## Documentação reavaliada

Foram relidos os requisitos organizados e os novos arquivos `expressoesProfissionais.md` e `Reestruturação Relacional e Informativa/regras-complementares.md`. Os 24 arquivos duplicados entre a organização anterior e as pastas de reestruturação foram comparados e são iguais. Os dois novos documentos acrescentam decisões que prevalecem sobre pontos antes pendentes.

- A proposta etária é 16 anos, condicionada às proteções para menores. Como essas proteções ainda não existem, aplica-se a alternativa temporária documentada de 18 anos. Nascimento é privado e não pode ser alterado pelo formulário comum.
- Confirmação obrigatória de e-mail, token individual com validade de 30 minutos, uso único e reenvio limitado. Troca mantém o endereço anterior até a confirmação do novo e invalida as sessões após efetivada.
- Identificador de 3–24 letras ASCII, números, ponto e sublinhado, sem distinção entre maiúsculas e minúsculas. O usuário confirmou intervalo de 30 dias e preservação dos endereços anteriores. Exceções administrativas exigem motivo e auditoria.
- Portfólio deve ser unificado e multimodal, contemplando contribuições técnicas, gestão, representação e créditos confirmados. Não transformar cada profissão em um módulo independente nem conceder publicação musical para compensar lacunas.

## Implementação funcional

Cadastro nas modalidades Consumidor e Profissional, mantendo os dados comuns ao alternar. Nome informado, vulgo, nome público e @ possuem funções distintas. Quando o vulgo é escolhido, o nome informado não aparece na busca, perfil público ou créditos. Rótulos profissionais respeitam a preferência de tratamento.

Cadastro profissional exige somente tempo de atuação por profissão; os demais eixos continuam disponíveis na edição. Apenas Rapper recebe seleção de vertentes. Os dados são validados no servidor e persistidos nas relações canônicas das 26 profissões.

Consumidor tem espaço privado e não aparece como profissional. A conversão para Profissional ocorre na mesma conta, exige confirmação explícita, mantém ID/e-mail/senha/@ e não consome a primeira alteração livre de profissões. As alterações seguintes respeitam 60 dias. Não foi criado retorno automático a Consumidor.

Configurações reorganizadas em conta e segurança, identidade, privacidade, descoberta e aparência. Tema é persistido por conta e aplicado antes da renderização; região preferida alimenta o filtro inicial de eventos; interesses geram atalhos de busca. Isso não constitui um motor de recomendação.

Perfis públicos, busca e seleção de colaboradores exigem conta profissional com e-mail confirmado. Respostas visíveis a colaboradores exigem crédito confirmado. Redirecionamentos de @ antigo respeitam a privacidade atual e os endereços ficam reservados à conta original.

## E-mail no desenvolvimento

As mensagens são gravadas em `Cypher/data/emails/*.eml` (ou `CYPHER_EMAIL_DIR`). Abra o arquivo da mensagem e copie o link de confirmação para o navegador. A origem usa `CYPHER_PUBLIC_ORIGIN`, ou `http://localhost:PORT`. Esses arquivos são privados e ignorados pelo Git.

Não há envio externo configurado. Em `NODE_ENV=production`, o cadastro permanece bloqueado até existir um transporte de e-mail real. Não considerar a entrega por e-mail pronta para lançamento público.

## Banco e recuperação

Schema 22 aplicado ao banco local após testar a migração em cópia. As identidades administrativas foram comparadas integralmente, incluindo seus dados de acesso, e permaneceram iguais. A configuração privada do Super Admin não foi modificada. Backup anterior em `_seguranca/etapa-2-2026-11-16/cypher-antes.sqlite`; fontes anteriores no mesmo diretório. A base não recebeu os usuários dos testes.

`Cypher/scripts/migrar-etapa-2.mjs` verifica a migração em cópia; `--aplicar` também inicializa o banco local. Não substitui backup prévio.

## Verificação

Compilação e checagem TypeScript aprovadas. Passaram os testes de banco/políticas, catálogo, questionários, persistência, relações, integração do cadastro, fundação, administração HTTP e segurança HTTP.

O novo `npm run test:identity-http` cobre cadastro inválido sem registros parciais, limites de idade/data/@, confirmação/expiração/reenvio de e-mail, troca de e-mail e revogação de sessões, privacidade do consumidor, nome privado, conversão irreversível, seleção profissional, intervalos de 30/60 dias, reserva/redirecionamento de @, exceções por papel e preferências. Todos os testes HTTP usam banco e caixa de mensagens temporários.

No navegador foram verificados alternância de modalidades, preservação dos campos, Rapper + Letrista com duas perguntas de tempo, vertentes apenas de Rapper, desktop e largura de 375 px sem transbordamento horizontal. Tema escuro foi verificado por persistência e HTML nos testes HTTP; não houve revisão visual completa das telas escuras nesta entrega.

## Continuação

Próxima etapa: fase 3, navegação/sidebar e transição da página inicial. Permanecem para as fases correspondentes: portfólio multimodal, representação profissional, confirmação de créditos ampliada, chat, denúncias/bloqueios completos, lembretes e recomendações. A etapa 2 não resolve as lacunas de expressão listadas no domínio.

## Atualização posterior — Gmail

O envio SMTP foi implementado e a autenticação real validada. Consulte [integração de e-mail Gmail](integracao-email-gmail.md), que substitui a limitação de entrega exclusivamente local descrita acima. Em produção continua sendo necessário configurar a URL pública HTTPS dos links.


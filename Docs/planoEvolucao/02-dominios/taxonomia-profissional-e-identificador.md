# Taxonomia profissional e identificador público

## 1. Catálogo oficial
1.1. O catálogo vigente tem **26 profissões em 7 áreas**. A relação canônica, os removidos e a descrição de cada profissão estão em [01-Profissoes-e-Relacoes](../Reestrutura%C3%A7%C3%A3o%20Relacional%20e%20Informativa/01-Profissoes-e-Relacoes.md).
1.2. Manter **Rapper separado de MC**, **Compositor(a) de Letrista**, **Produtor(a) musical de Produtor(a) cultural** (a desambiguação visual “musical” é recomendação, não renomeação técnica aprovada).
1.3. Padronizar **Freestyleiro**, substituindo a variante antiga **Freestyler** em telas e registros sem perder associações.
1.4. Profissões eliminadas não voltam a ser opções válidas. Auditar cadastros legados antes da migração, preservando histórico e trabalhos legítimos.

## 2. Vertentes de Rapper
2.1. Apresentar seleção adicional **somente para Rapper**. MC e Freestyleiro têm funções próprias e **não** exigem esse questionário.
2.2. Conjunto de 16 opções: **Boom bap, Gangsta rap, G-Funk, R&B, Gospel, Jazz rap, Trap, Grime, Drill, Plug, PluggnB, Rage, Melodic rap, Detroit rap, Jersey Club Rap, Trap soul**.
2.3. Múltiplas opções, sem exigir exclusividade. Ao remover a profissão Rapper, impedir que suas vertentes sejam exibidas como próprias de MC/Freestyleiro; preservar histórico relevante.
2.4. A identidade musical do **perfil** não restringe o gênero/vertente de **cada obra**. Um rapper com Trap/Drill no perfil pode registrar obra Boom bap.
2.5. A classificação entre gênero, subgênero, vertente e influência ainda exige decisão de modelo; preservar o conjunto atual enquanto isso.

## 3. Taxonomia e propostas
3.1. Usar catálogo centralizado e validado no servidor para profissões, gêneros/vertentes e tipos de obra.
3.2. Não oferecer campo de texto livre **Outro** nessas taxonomias; apresentar **Sugerir nova profissão / vertente / gênero / tipo** para criar solicitação à equipe.
3.3. A sugestão não se torna opção global nem muda categoria do autor até aprovação por autoridade competente.
3.4. Aplicar a taxonomia em Cadastro, Editar perfil, Busca, Publicar, cards, Créditos, Portfólio e Cypher Central, com migração de valores antigos.

## 4. Alteração de profissões
4.1. Primeira alteração após cadastro: livre. Depois, **uma alteração a cada 60 dias** contados da última mudança válida.
4.2. Requisição anterior ao prazo pode virar **pedido de exceção**, com justificativa e decisão administrativa auditável; não aplicar mudança silenciosamente.
4.3. Regra se aplica ao servidor e a situações de concorrência, não apenas ao botão desabilitado.

## 5. Identificador público `@`
5.1. O `@` é identificador **único e compartilhável**, diferente de nome informado ou vulgo. Solicitar no cadastro; não gerar uma sequência aparentemente aleatória como apresentação padrão.
5.2. Regra proposta: **3–30 caracteres**, letras latinas minúsculas, números, `-` e `_`, sem espaços; comparar sem distinção de caixa. Exemplos: `@djjoao`, `@joao-beats`, `@produtora_luana`.
5.3. Bloquear palavras reservadas/rotas, por exemplo **admin, login, register, profile, settings, api, support, cypher**; lista centralizada no backend.
5.4. Exibir disponibilidade na interface e **garantir unicidade no banco/servidor**, inclusive em concorrência.
5.5. Alteração do @: **30 dias é prazo sugerido, ainda a confirmar**. Informar próxima data, permitir análise excepcional pelo Moderador e registrar histórico.
5.6. Preservar URLs anteriores (`/p/@antigo` ou sintaxe definida pelo roteamento), redirecionando à identidade atual e impedindo apropriação indevida dos handles anteriores.
5.7. Relacionamentos de obras, créditos, seguidores, notificações e selos devem apontar para **usuario_id imutável**, jamais depender do texto editável do @. Se houver referências legadas por texto, migrar transacionalmente.

## 6. Forma de tratamento
6.1. A opção **Masculino / Feminino / Outro** citada nos textos refere-se à forma de tratamento/concordância, não a gênero musical, profissão ou orientação sexual.
6.2. Aplicar flexão pertinente à preferência, inclusive B-boy/B-girl, evitando inferir capacidades ou dados pessoais a partir disso. Não apagar a opção Outro deste campo.

## 7. Critérios de aceite
7.1. Catálogo consistente em todas as áreas, 26 opções vigentes e removidos ausentes. Valores antigos migrados sem ruptura de vínculos.
7.2. Vertentes aparecem somente para Rapper; filtros de obras continuam independentes do perfil.
7.3. Testes de @ duplicado, reservado, inválido, alteração sob prazo, redirecionamento e preservação de créditos.

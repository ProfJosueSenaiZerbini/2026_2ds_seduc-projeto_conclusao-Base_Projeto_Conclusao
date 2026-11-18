# Cadastro interativo — interface

## 1. Uma tela, duas modalidades
1.1. Apresentar **Profissional | Consumidor** na região superior da mesma experiência de cadastro.
1.2. Ao alternar, fazer uma transição breve inspirada em **carta virando**, como duas faces do mesmo cartão. A animação pode aproveitar identidade de stickers/tags underground, mas não deve criar um segundo fluxo de conta.
1.3. Preservar dados comuns preenchidos ao trocar de modalidade; não inverter visualmente o texto nem confundir o foco do teclado. Respeitar movimento reduzido.
1.4. A modalidade Consumidor não mostra seleção profissional nem questionário. A modalidade Profissional explica, sem texto extenso, a possibilidade de apresentar trabalhos e colaborar.

## 2. Etapas enxutas
2.1. **Dados comuns:** nome, e-mail, data de nascimento, identificador `@`, senha e confirmação; vulgo opcional.
2.2. Substituir envio inicial por **Próximo**; separar os dados comuns e profissionais em etapas curtas, com progresso claro e retorno sem perda de dados.
2.3. Profissional: escolher **área → profissão → vertentes somente para Rapper → tempo de atuação por profissão**. Uma pergunta por vez, indicando profissão atual e quantas faltam.
2.4. Consumidor: finalizar cadastro após os dados comuns, sem área de atuação. Interesse em gêneros musicais pode ser opcional, sem virar categoria profissional.
2.5. Após o cadastro profissional, convidar a **Completar meu perfil** para registrar detalhes não obrigatórios.

## 3. Escolha visual de profissões
3.1. Exibir áreas e profissões em **cards selecionáveis** com ilustração/ícone, título e descrição curta; permitir múltiplas escolhas em vários grupos.
3.2. Mostrar resumo editável das profissões escolhidas; não estender indefinidamente a tela quando o usuário marca vários cargos.
3.3. Vertentes do Rapper aceitam múltiplas escolhas. Não criar campos de vertente para MC ou Freestyleiro; não usar campo aberto **Outro** para profissão ou gênero musical.
3.4. A mesma linguagem de seleção deve ser reutilizada em **Editar perfil**, respeitando a regra de mudança de profissão.

## 4. Nome e vulgo
4.1. Ao lado de Nome, incluir **Possui vulgo?** em ambas as modalidades. Quando marcado, exibir campo Vulgo e controle **Mostrar meu vulgo como nome público**.
4.2. Explicar a diferença: **Nome informado** (cadastro), **Vulgo** (identidade pública opcional) e **@** (identificador único e compartilhável).
4.3. Se o vulgo for usado publicamente, não deixar o nome informado vazar por cards, comentários ou outros componentes.

## 5. Feedback e acessibilidade
5.1. Campos com erro identificável e valores válidos preservados. O indicador do formulário deve acompanhar as etapas reais, sem falsa barra de progresso.
5.2. Ações da transição e cards operáveis por teclado/leitor de tela, com estados selecionados explícitos.
5.3. Validação de idade, unicidade do @, categoria e senha **não se resolve só visualmente**; detalhes em [01-Tipos-de-Conta-Cadastro-e-Permissoes](../Reestrutura%C3%A7%C3%A3o%20T%C3%A9cnica/01-Tipos-de-Conta-Cadastro-e-Permissoes.md) e `02-Categorias-Profissionais-e-Identificador-Publico.md`.

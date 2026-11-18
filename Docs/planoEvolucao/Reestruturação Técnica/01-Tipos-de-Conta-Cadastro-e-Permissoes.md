# Tipos de conta, cadastro e permissões

## 1. Identidades distintas
1.1. **Consumidor (Público/Ouvinte/Fã):** usa descoberta, busca, conteúdos, eventos e interações permitidas; não recebe categoria profissional nem capacidade de publicar trabalhos.
1.2. **Profissional:** cadastra uma ou mais das 26 profissões ativas; pode publicar e administrar **somente os tipos de registro autorizados**.
1.3. **Administrativo:** identidade de acesso interno, sem perfil artístico público, criada e gerenciada em fluxo protegido. Nunca aparece como escolha de cadastro geral.
1.4. O catálogo de profissões **não é** a tabela de cargos administrativos. Profissão, papel num crédito, tipo de conta e permissão operacional são conceitos separados.

## 2. Registro comum
2.1. **Profissional | Consumidor** na mesma experiência, sem criar contas paralelas ao alternar a modalidade. Persistir somente após conclusão e validação.
2.2. Dados previstos: **nome, e-mail, `@`, data de nascimento, senha, confirmação de senha**; vulgo opcional e preferência de nome público.
2.3. Validar unicidade de e-mail e `@`, senha e confirmação, formato, data de nascimento real e tipo de conta, incluindo na camada servidor/banco.
2.4. **Idade mínima e políticas específicas para menores ainda não foram fixadas.** Não selecionar arbitrariamente um número; a proteção deve estar definida antes de aceitar cadastros afetados.
2.5. Confirmar exigência/fluxo de **verificação de e-mail, termos e consentimento** antes da execução. Não presumir funcionalidades implementadas.
2.6. A conclusão pode criar sessão ou solicitar login, conforme decisão de produto. Não registrar senha em claro nem expor tokens/sessões.

## 3. Etapa profissional
3.1. Selecionar áreas e profissões (múltiplas) e **uma resposta obrigatória por profissão: tempo de atuação**; se Rapper, selecionar vertentes de rap, de forma múltipla.
3.2. Perguntas adicionais sobre trajetória, atividades, publicações, coletivos e equipamentos ficam em **Editar perfil**.
3.3. **Primeira alteração das profissões depois do cadastro é livre**. A partir dessa alteração, aguardar **60 dias** para outra mudança confirmada, salvo exceção administrativa registrada.
3.4. Mudanças de profissão exigem controle transacional, carimbo de data e hora, histórico e nova avaliação das capacidades. Remover profissão não elimina automaticamente trabalhos/créditos históricos.

## 4. Consumidor: privacidade e alcance
4.1. Conta Consumidor **privada por padrão**; perfil profissional **público por padrão**, com controles claros para dados individuais.
4.2. Consumidor não aparece na busca de profissionais, não recebe seguidores nem tem contador de seguidores; em comentário/mensagem é identificável somente por foto, `@` e **nome público** permitido.
4.3. Pode seguir/curtir profissionais, comentar, salvar e compartilhar conteúdo, trocar mensagens com quem aceite público e acompanhar eventos; salvos, interesses pessoais e histórico de navegação não são expostos publicamente.
4.4. Não pode criar/editar obras, beats ou eventos; ter portfólio/selo profissional; declarar crédito de autoria, administrar inscrições, atribuir avaliações de colaboradores ou acessar área administrativa.
4.5. Contato do Consumidor com profissional depende de autorização/preferência do destinatário, verificada em cada tentativa.

## 5. Profissionalização da mesma conta
5.1. Disponibilizar **Tornar-me Profissional** / **Ativar perfil profissional** nas configurações ou no perfil.
5.2. Explicar consequências e exigir confirmação, selecionar profissão(s), tempo de atuação e vertentes pertinentes. Conceder capacidades após validações e persistência.
5.3. Preservar **usuario_id, e-mail, senha, @, nome/vulgo, foto, curtidas, comentários, salvos, seguidos, mensagens e histórico de eventos**.
5.4. **A transição Consumidor → Profissional é irreversível segundo `Comportamento-ContaPublico.md`**: não criar retorno automático nem apagar conteúdo profissional para simular retorno. A redação do plano geral mais antigo deixava esse ponto em aberto; prevalece a regra específica.

## 6. Matriz de capacidades
6.1. Elaborar matriz explícita **tipo de conta × profissão × ação** (ver, cadastrar, editar, excluir, administrar, aceitar participação). A pessoa pode acumular profissões sem precisar escolher Rapper para exercer Beatmaker.
6.2. Exemplos de capacidades a revisar: Beatmaker → cadastrar beat; Organizador de eventos → criar/gerir evento; músicos e outros participantes → criar obra ou registrar contribuição segundo função e vínculo. Não considerar esses exemplos a matriz completa.
6.3. Permissão é validada **em toda requisição**, incluindo POST direto; o menu só espelha a capacidade. Acesso à edição/exclusão depende também de propriedade/autoridade.
6.4. Uma categoria autodeclarada não prova credenciais nem concede, por si só, validação de crédito, licença, acesso administrativo ou reputação.

## 7. Dados pessoais e segurança
7.1. **Nome informado, vulgo e @** são campos distintos. Se o usuário escolher usar vulgo como nome público, ocultar nome informado de outros usuários inclusive em listagens, comentários, notificações e dados expostos.
7.2. Data de nascimento completa não é pública. Diferenciar localização usada para recomendar eventos da localização exibida no perfil.
7.3. Dados profissionais podem ter níveis **Público / Colaboradores autorizados / Privado**, exigindo definição operacional de colaborador (não basta seguir ou curtir).
7.4. Mudanças de privacidade precisam propagar-se a Busca, Descoberta, portfólio, links e mídias sem vazamento por caminho alternativo.

## 8. Verificações mínimas
8.1. Criar conta em cada modalidade; alternar antes de concluir sem duplicação; validar entrada inválida; impedir tipo administrativo via formulário.
8.2. Testar consumidor tentando publicação/edição por URL; público não encontrado em busca profissional; profissionalização sem perda de histórico; regras dos 60 dias e exceções.
8.3. Testar vazamento do nome informado ou nascimento e controle de acesso a dados privados.

# Ajustes técnicos gerais

## 1. Integração e integridade
1.1. Inspecionar o código antes de executar cada pacote. A documentação menciona **Node.js, TypeScript, Express, EJS, SQLite, JavaScript vanilla e MVC simples**, mas este ZIP **não contém o repositório** para verificação.
1.2. Concluir cada funcionalidade com rotas, view, controller, model, validação no servidor, autorização, migração (se necessária), persistência, tratamento de erro e testes de fluxo. Botão sem operação real não equivale a funcionalidade implementada.
1.3. Preservar os registros úteis e os relacionamentos de usuários; não criar camadas, dependências ou serviços adicionais sem necessidade demonstrada.
1.4. **Registro de origem ≠ exibição em vitrine ≠ crédito validado ≠ estado de moderação.** Essas entidades não podem ser confundidas.

## 2. Exclusões integrais
2.1. **Visão Geral antiga:** remover rota/apresentação e seus cards/indicadores/referências exclusivos; substituir funcionalmente por Descoberta.
2.2. **Status profissional da sidebar:** eliminar controles, lógica e referências exclusivas.
2.3. **Status de obras:** eliminar Em produção, Lançado, Rascunho, card Em andamento, filtros, validações e persistência exclusivamente ligados a essa classificação; **não instituir outro status artístico equivalente**.
2.4. Remover opções livres **Outro** para profissões, gêneros/vertentes musicais e tipos de trabalho. Preservar **Outro** em forma de tratamento e **Outro motivo** no feedback de artigos.
2.5. Não apagar indevidamente estados próprios de eventos, inscrições, solicitações, créditos, mensagens ou artigos, nem dados históricos necessários à integridade.

## 3. Links públicos
3.1. Gerar links compartilháveis para **perfil, obra, beat, evento, galeria e conteúdos pertinentes** com destino estável e controle de visibilidade.
3.2. Perfil utiliza `@` no endereço, mas vínculos internos usam **ID imutável**; URLs antigas do usuário devem redirecionar após mudança de `@`.
3.3. Um link compartilhado **não publica** um item privado.

## 4. Auditoria de estatísticas
4.1. Localizar todos os números, KPIs, gráficos e cards que se apresentam como reais; incluir **Seu rastro na cena** e demais telas.
4.2. Para cada indicador: fonte do banco, definição, unidade, período, agregação, atualização e política para ausência de dados.
4.3. Remover ou identificar inequivocamente valores demonstrativos; não preencher contadores com números inventados.
4.4. Diferenciar seguidores, curtidas, visualizações, interessados, inscritos, confirmados, participantes, créditos confirmados e feedback de artigos.

## 5. Segurança e testes gerais
5.1. Verificar sessão, propriedade do recurso, proteção das ações de escrita, privacidade e condições de corrida nos cadastros/alterações.
5.2. Testar cenários positivos e negativos, tentativa sem autorização, recurso inexistente, envio repetido, falha de persistência e regressões de telas dependentes.
5.3. Dados privados não podem ser revelados em HTML, JSON, buscas, metadados, links ou notificações de terceiros.

## 6. Decisões ainda não fechadas
6.1. **Idade mínima e regras para menores**, consentimento/termos e confirmação de e-mail.
6.2. **Prazo proposto de 30 dias** entre mudanças do `@` (a confirmar); 60 dias entre mudanças de profissão **já previstos**, com primeira livre.
6.3. Matriz final **profissão × capacidade**; critérios exatos de colaboradores autorizados; tratamento de profissões antigas persistidas.
6.4. Políticas de mídia (formatos, limites, armazenamento, direitos), denúncias, recursos, bloqueios e retenção.
6.5. Nome definitivo de **Publicar** e eventual renomeação de **Oportunidades para Eventos** após auditoria de conteúdo/rotas.
6.6. Frequência de lembretes no intervalo de 30 dias e e-mails; provedor de mapas.
6.7. Fluxos de confirmação de crédito, selo histórico e reputação — ver documentos relacionais.

## 7. Ponto de atenção do material
7.1. `Plano-de-Evolucao.md` cita um DOCX com referências visuais, **mas esse arquivo não está neste ZIP**. Foram usados somente os requisitos textuais disponíveis; imagens externas não foram verificadas.
7.2. `Casos-de-Uso.md` descreve partes como “implementadas” com base em uma análise anterior. **Os estados de implementação não foram auditados nesta reorganização**.

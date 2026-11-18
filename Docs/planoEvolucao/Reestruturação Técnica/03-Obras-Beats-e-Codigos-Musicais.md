# Obras, beats, créditos técnicos e identificadores musicais

## 1. Eliminação do status artístico das obras
1.1. Remover integralmente **Em produção, Lançado, Rascunho, Em andamento** e seus campos, filtros, validações, rótulos e lógica exclusiva.
1.2. Não reintroduzir situação equivalente com os nomes “publicado”, “finalizado” ou similares para classificar a etapa artística da obra.
1.3. **Data de lançamento factual**, visibilidade, denúncia e revisão de crédito são conceitos distintos; não devem ser apagados só porque o status de obra foi removido.

## 2. Registro e catálogo de obras
2.1. Cada obra deve ter um **registro de origem único**, com proprietário/autoria e créditos associados, sem duplicação ao aparecer em perfil, Busca, Descoberta e portfólio.
2.2. Cadastro de obra usa gêneros e vertentes da classificação atual; **não limita as opções aos estilos do perfil do criador**.
2.3. As permissões de cadastro respeitam as funções profissionais reconhecidas e a matriz de capacidades. O criador do registro não é automaticamente autor de todas as partes da obra.
2.4. Edição/exclusão exige titularidade ou autorização administrativa explícita; registrar obra e múltiplos créditos em transação.
2.5. Ficha técnica apresenta **BPM, data/hora de lançamento, papéis e colaboradores, ISRC/ISWC quando existentes**; dados inaplicáveis não aparecem.

## 3. Composição, gravação e códigos
3.1. **Composição** é a obra musical de letra/melodia; pode ter diversas gravações. **Fonograma** é uma gravação específica.
3.2. **ISWC** é identificador opcional da composição; **ISRC** é identificador opcional de cada fonograma. A Cypher **não cria, reserva nem emite** esses códigos.
3.3. Aceitar somente código informado pelo usuário que já tenha sido concedido externamente; validar formato e detectar conflitos internos quando adequado, sem afirmar autenticidade ou titularidade oficial.
3.4. Se a mesma composição possui duas gravações, cada fonograma pode ter ISRC distinto associado à composição com ISWC próprio.
3.5. **Produtor fonográfico** identifica a responsabilidade sobre a gravação, **não** uma profissão adicional obrigatória para cadastro.
3.6. Orientações citadas no material: [IFPI — ISRC](https://isrc.ifpi.org/why-use-isrc/using-isrc), [Abramus — ISRC](https://www.abramus.org.br/noticias/28841/me-ajuda-abramus-isrc-o-que-e-como-gerar-e-cadastrar/), [CISAC — ISWC](https://www.cisac.org/Newsroom/news-releases/cisac-launches-major-project-upgrade-international-musical-work-identifier). Referências informativas, não APIs emissoras.
3.7. **Pendente:** modelagem definitiva de composição/fonograma, tipo de registro, titularidade e direitos; não improvisar equivalências entre os códigos.

## 4. Créditos como relações
4.1. Crédito registra **pessoa + trabalho + papel exercido**: composição, letra, beat, interpretação, mixagem, masterização, vídeo, capa, organização etc.
4.2. Texto de crédito mencionado por terceiros não equivale a participação validada; proposta, confirmação, rejeição e contestação são detalhadas em `Reestruturação Relacional e Informativa/03-Creditos-Colaboracoes-e-Selos.md`.
4.3. Profissão cadastrada não deve ser confundida com o papel real num trabalho. Beatmaker pode cadastrar beat e aparecer num fonograma sem ser Rapper/MC.

## 5. Banco de Beats
5.1. **Beat** é registro próprio de instrumental, distinto de música/gravação final; pode ser associado a obras e créditos quando a relação existir.
5.2. Metadados previstos: título, gênero/estilo, BPM, tom, duração, descrição e condições de uso quando disponíveis.
5.3. Preservar ofertas múltiplas, licenciamento e sinalização de exclusividade **somente quando houver suporte real de dados**.
5.4. Não apresentar botão de compra, pagamento, transferência automática ou selo Vendido se **checkout/transação/entrega/posse** não estiverem implementados.
5.5. Upload de áudio, prévia protegida, player e negociação são temas a especificar antes de afirmar que o Banco de Beats os oferece.

## 6. Testes essenciais
6.1. Cadastro por profissional elegível e negativa a consumidor; créditos de terceiros sem prova de confirmação; transação falha sem gravação parcial.
6.2. ISRC associado ao fonograma certo, ISWC à composição, campos opcionais e códigos não inventados.
6.3. Busca global por campos/rótulos de status de obras removidos e regressão de listagens e fichas.

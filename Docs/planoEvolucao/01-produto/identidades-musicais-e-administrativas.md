## Identificadores musicais — ISRC e ISWC

A Cypher deve permitir armazenar ISRC e ISWC como informações técnicas associadas às obras e gravações cadastradas. A plataforma não deve gerar esses códigos por conta própria nem depender de APIs de terceiros para emiti-los.

### ISRC — identificação da gravação

O ISRC identifica um fonograma ou uma gravação específica. Deve ser associado à gravação correspondente, não usado como identificador da composição.

Permitir que o usuário informe um ISRC já atribuído por uma entidade, agência, distribuidora ou agente autorizado. O campo deve ser opcional: a ausência do código não deve impedir o cadastro de uma obra ou gravação na Cypher.

A Cypher pode verificar o formato do código e impedir que o mesmo ISRC seja associado a gravações diferentes dentro da plataforma. Essa checagem não deve ser apresentada como confirmação oficial da validade ou titularidade do código.

“Produtor Fonográfico” deve ser tratado como uma responsabilidade relacionada à gravação, e não como uma profissão obrigatória para criar conta ou cadastrar conteúdo. A pessoa física ou jurídica responsável pela gravação deve poder ser identificada nos dados do fonograma. Um artista independente pode exercer essa responsabilidade quando for o titular ou responsável econômico pela gravação.

A Cypher deve oferecer orientação sobre como obter um ISRC por canais autorizados, sem emitir, reservar ou inventar códigos.

### ISWC — identificação da composição

O ISWC identifica a obra musical composta, como letra e melodia. Deve ser associado ao registro da composição e informado pelo usuário quando já tiver sido atribuído por uma agência autorizada.

O ISWC também deve ser opcional. A Cypher não deve criar números próprios nem indicar que um código foi oficialmente atribuído quando isso não ocorreu.

### Relação entre composição e gravações

Uma composição pode estar relacionada a várias gravações. O registro da composição pode armazenar seu ISWC; cada fonograma relacionado pode armazenar seu próprio ISRC.

A ficha técnica deve apresentar os códigos com rótulos distintos e contextualizados, evitando tratar ISRC e ISWC como campos equivalentes. Quando houver múltiplas gravações de uma composição, a Cypher deve permitir associar cada ISRC à gravação correta.

### Conta do público — ouvinte ou fã

O público ouvinte/fã deve ter um tipo de conta próprio, separado das profissões. Não deve ser necessário selecionar uma profissão para criar uma conta de público.

A conta de público pode acessar as funcionalidades destinadas a ouvintes, como acompanhar profissionais, salvar obras e eventos e receber notificações pertinentes, de acordo com as permissões definidas para essa modalidade.

Se uma pessoa que começou como ouvinte passar a atuar profissionalmente, deve poder completar ou ativar seu perfil profissional na mesma conta, selecionar suas profissões e acessar os recursos correspondentes sem criar uma segunda conta. A conta de público não deve conceder automaticamente permissões para cadastrar obras, beats ou oportunidades profissionais.

O nível de exposição pública do perfil de ouvinte e a lista final de funcionalidades dessa modalidade ainda precisam ser definidos.

### Conta administrativa

A conta administrativa deve ser uma identidade de acesso restrito, sem perfil profissional público e sem opção de criação no cadastro convencional. Administradores não devem aparecer como artistas, profissionais recomendados ou participantes das métricas profissionais.

O acesso administrativo deve ocorrer por uma rota protegida, como /admin, e direcionar a pessoa autorizada ao painel administrativo. Usuários sem permissão devem ser impedidos de acessar as telas e operações administrativas no servidor.

A primeira conta administrativa deve ser criada por um processo inicial controlado pelo projeto. A inclusão de administradores posteriores deve depender de uma pessoa com autorização para convidá-los ou conceder-lhes permissões, com registro das alterações.

Após entrar, o administrador deve receber uma navegação própria, adequada às responsabilidades autorizadas, como analisar solicitações de profissões ou exceções ao prazo de alteração, moderar conteúdo, gerenciar eventos e atualizar a Cypher Central. A matriz de cargos e permissões administrativas deve ser definida antes da implementação; ela não deve ser misturada com a lista de profissões.

### Separação dos tipos de conta

A criação de conta deve distinguir claramente:

- **Ouvinte ou fã:** acompanha o ecossistema e usa os recursos destinados ao público.
    
- **Profissional:** seleciona uma ou mais profissões e recebe os recursos correspondentes.
    
- **Administrador:** acessa a área administrativa somente por autorização interna.
    

A administração não deve aparecer como profissão nem como opção pública de cadastro. A Cypher pode reutilizar a infraestrutura de autenticação, desde que mantenha permissões, navegação e exposição de perfil separadas para cada modalidade.

### Referências para orientação dos usuários

- [Orientações da IFPI sobre ISRC](https://isrc.ifpi.org/why-use-isrc/using-isrc)
    
- [Como a Abramus gera e cadastra ISRC](https://www.abramus.org.br/noticias/28841/me-ajuda-abramus-isrc-o-que-e-como-gerar-e-cadastrar/)
    
- [Informações da CISAC sobre ISWC](https://www.cisac.org/Newsroom/news-releases/cisac-launches-major-project-upgrade-international-musical-work-identifier)
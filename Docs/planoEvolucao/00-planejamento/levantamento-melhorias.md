# **CYPHER — Levantamento de melhorias do sistema**

## **Diretrizes gerais de implementação**

Estas diretrizes devem ser consideradas em todas as solicitações:

* ELIMINAR: quando uma solicitação enfatizar essa palavra, significa remover completamente a funcionalidade do sistema, sem deixar vestígios. Isso inclui interface, componentes, lógica, validações, rotas, controladores, modelos, referências, estruturas e registros relacionados, conforme aplicável.  
* Sistema em desenvolvimento: o Cypher ainda não foi lançado. Portanto, não é necessário preservar funcionalidades antigas por compatibilidade. É permitido modificar, substituir, reestruturar ou eliminar integralmente implementações existentes quando necessário.  
* Não manter estruturas obsoletas, funcionalidades residuais ou soluções de compatibilidade desnecessárias.  
* Preservar a proposta e a identidade underground do Cypher.

## **1\. Cadastro — `/Register`**

### **1.1. Seleção profissional**

* Melhorar a estética e a escolha de cores da aba de seleção profissional.  
* Reforçar a identidade visual underground do Cypher.  
* Evitar uma estética excessivamente leve, minimalista ou clean. A interface deve transmitir uma identidade mais agressiva, urbana e alinhada à cultura hip-hop.

### **1.2. Questionário profissional**

* Reduzir o questionário apresentado após a seleção das profissões.  
* Manter apenas uma pergunta obrigatória por profissão: há quanto tempo o usuário exerce aquela atividade?  
* As demais informações profissionais deverão ser preenchidas deliberadamente pelo usuário após a criação da conta, na edição do perfil.  
* Após o cadastro, apresentar um alerta de perfil incompleto, incentivando o usuário a concluir a configuração da conta.

### **1.3. Seleção de vertentes profissionais**

* Para profissões que possuem vertentes, apresentar também a seleção das vertentes em que o usuário atua.  
* Essa seleção deverá fazer parte do fluxo posterior à escolha profissional, junto à etapa de conclusão das informações do perfil.

Atualizar a relação de vertentes para:

1. Boom bap  
2. Jazz rap  
3. G-Funk  
4. Gangsta rap  
5. R\&B  
6. Gospel  
7. Trap  
8. Trap soul  
9. Grime  
10. Drill  
11. Detroit rap  
12. Jersey Club Rap  
13. Plug  
14. PluggnB  
15. Melodic rap  
16. Rage

## **2\. Perfil do usuário e edição de perfil**

### **2.1. Reformulação da edição de perfil**

* Reformular a aba de edição de perfil, tornando-a mais completa e organizada.  
* Preparar sua estrutura para futuras funcionalidades, como inclusão de foto de perfil.  
* Transferir para essa etapa o preenchimento das informações profissionais que deixaram de ser obrigatórias durante o cadastro.  
* Considerar o aviso de perfil incompleto como incentivo para o usuário preencher as informações pendentes.

## **3\. Configurações — Privacidade**

### **3.1. Visibilidade padrão do perfil**

* Alterar o comportamento padrão dos novos perfis para públicos.  
* Atualmente, o perfil é criado como privado e o usuário precisa acessar as configurações e utilizar o menu de três pontos para torná-lo público.  
* Inverter esse comportamento, considerando que boa parte do público-alvo do Cypher é composta por artistas e figuras públicas.

### **3.2. Reformulação da funcionalidade de privacidade**

* Tratar melhor a funcionalidade de privacidade.  
* Revisar sua apresentação e experiência de utilização, dando maior atenção à forma como o usuário compreende e controla a visibilidade do próprio perfil \- discuta isso comigo para chegarmos num consenso de melhor UX, baseado no contexto do projeto e em seu objetivo\!

## **4\. Cadastro de obras**

### **4.1. Gêneros e vertentes**

* Atualizar as opções de gêneros e vertentes utilizadas no cadastro de obras, pois ainda estão seguindo a classificação antiga.  
* Remover completamente o sistema de outros tipos de trabalhos e outros gêneros.  
* Manter exclusivamente as opções nativas disponibilizadas pelo sistema.  
* Caso o usuário não encontre uma opção adequada, deverá poder reportar essa necessidade à equipe do Cypher.

### **4.2. Sistema de status das obras**

ELIMINAR POR COMPLETO

* Eliminar integralmente o sistema de status das obras.  
* Remover completamente as opções atuais: "Em produção", "Lançado" e "Rascunho".  
* Remover todas as regras, validações, componentes, referências, estruturas e registros relacionados a esse sistema.  
* Não substituir por outra lógica de status.  
* Não deixar vestígios da implementação anterior.

## **5\. Criação de conteúdo — Nova página independente**

Direção confirmada \- Consultar antes de decidir nome da pagina\!

### **5.1. Centralização das funcionalidades de criação**

* Criar uma nova página independente, acessível por um item próprio na sidebar esquerda.  
* Essa página será dedicada à criação e publicação de conteúdos pelos usuários que possuem autorização para realizar essas ações.  
* Centralizar nela as diferentes modalidades de criação disponíveis no ecossistema Cypher.

Modalidades contempladas:

* Obras e músicas;  
* Beats;  
* Oportunidades;  
* Eventos;  
* Galerias e trabalhos visuais;  
* Outras modalidades de publicação pertinentes ao ecossistema.

### **5.2. Abrangência profissional**

* A página não deverá ser pensada exclusivamente para artistas musicais.  
* Considerar também artistas visuais e outros profissionais que utilizam a plataforma para apresentar e divulgar seus trabalhos.  
* Contemplar a futura implementação de galerias nos perfis profissionais, permitindo que artistas visuais publiquem e organizem seus trabalhos por meio dessa área centralizada.

## **6\. Configurações — Aparência**

### **6.1. Alternância de temas**

* Reformular a maneira como o usuário alterna entre os temas claro e escuro.  
* A apresentação atual é muito básica, estática e visualmente pouco trabalhada.  
* Adicionar dinamismo e personalidade à interação.  
* Utilizar JavaScript, animações e, se contribuírem efetivamente para o resultado visual, bibliotecas auxiliares.

A intenção é tornar a alternância de temas mais interessante e coerente com a identidade visual do Cypher.

## **7\. Configurações — Descoberta**

### **7.1. Reformulação e valorização da seção**

Seção atualmente identificada:

> DESCOBERTA  
> Informações profissionais  
> Essas informações ajudam a apresentar seu trabalho no Cypher.

> Região principal  
> Não informada

> Gêneros e estilos  
> Não informados

> Atualizar informações

* Reformular essa seção, pois atualmente está muito avulsa e pouco desenvolvida dentro das configurações do aplicativo.  
* Dar maior autonomia e atenção à área de Descoberta, considerando sua importância para o funcionamento do Cypher.

### **7.2. Valorização das informações geográficas**

A localização possui papel importante no ecossistema da plataforma, especialmente para:

* Descoberta de artistas e profissionais próximos;  
* Identificação de profissionais da mesma região;  
* Descoberta e divulgação de eventos locais;  
* Conexões e oportunidades geograficamente relevantes.

A seção deverá receber um tratamento mais dedicado às informações que influenciam a descoberta de profissionais e conteúdos, com atenção especial à localização.

## **8\. Página de obras — `/works`**

### **8.1. Remoção de elementos relacionados aos status**

* Remover também o card "Em andamento", pois ele está diretamente relacionado ao sistema de status cuja eliminação já foi solicitada.  
* Eliminar quaisquer outros elementos da página que dependam exclusivamente dessa lógica de status.

### **8.2. Cards de obras e participações**

* Reformular os cards de Obras e Participações, pois atualmente apresentam uma aparência muito genérica e pouco integrada à identidade visual da plataforma.  
* Dar maior atenção à composição visual, hierarquia das informações e apresentação desses elementos.  
* Adicionar mais dinamismo e personalidade, mantendo a coerência com a identidade underground do Cypher.

## **9\. Navegação — Sidebar**

### **9.1. Sidebar minimizável**

* Tornar a sidebar esquerda minimizável, permitindo que o usuário recolha sua estrutura expandida.  
* Quando minimizada, deverá permanecer visível apenas uma barra compacta com os ícones de navegação.  
* Manter os ícones intuitivos e facilmente identificáveis, garantindo que as funcionalidades de navegação continuem acessíveis.  
* Permitir alternar entre os estados expandido e minimizado.

Diretriz de remoção: solicitações de eliminação devem ser objetivas, mas abranger também os elementos que dependem diretamente da funcionalidade removida. Não é necessário repetir uma lista extensa de arquivos e estruturas em cada ocorrência.

## **10\. FILTROS — REESTRUTURAÇÃO VISUAL E FUNCIONAL GLOBAL**

* Reformular a apresentação visual e a experiência de utilização dos filtros em todo o sistema Cypher  
* Atualmente, os filtros apresentam uma estrutura muito convencional, baseada em campos select e formulários estáticos.  
* Buscar uma apresentação mais visualmente agradável, dinâmica e integrada à identidade underground da plataforma.  
* Priorizar praticidade, facilidade de utilização e agilidade na aplicação dos filtros.  
* Explorar alternativas visuais e interativas aos selects tradicionais, sem comprometer a clareza das opções disponíveis.  
* Garantir uma experiência consistente entre as diferentes páginas, respeitando as particularidades de cada tipo de filtro.

Referência visual: utilizar a seção de filtros da página `/opportunities` por exemplo, que precisa ser reformulada.

Direção: os filtros devem deixar de parecer formulários administrativos convencionais e passar a fazer parte de uma experiência de navegação mais fluida, intuitiva e dinâmica. A prioridade é facilitar a descoberta e a localização de conteúdos, profissionais e oportunidades, sem adicionar complexidade desnecessária.

## **11\. DADOS ESTATÍSTICOS — AUDITORIA E IMPLEMENTAÇÃO FUNCIONAL**

Realizar uma varredura completa em todo o sistema Cypher para identificar indicadores, estatísticas, métricas e painéis informativos que atualmente não possuem funcionamento real.

* Identificar todos os elementos dessa natureza que apresentam números fictícios, informações estáticas, dados demonstrativos ou indicadores sem integração com as atividades reais dos usuários.  
* Tornar todos esses elementos efetivamente funcionais, utilizando dados persistidos no banco de dados e informações reais do sistema.  
* Garantir que os indicadores sejam atualizados conforme as ações e atividades realizadas pelos usuários.  
* Eliminar números demonstrativos e informações que aparentem representar estatísticas reais sem efetivamente representá-las.  
* Verificar tanto os painéis gerais quanto os indicadores individuais presentes nas diferentes páginas e perfis.

Referência visual: card "Seu rastro na cena", presente na página `/opportunities`, que apresenta um histórico de participações em eventos.

Esse card é apenas um exemplo. A solicitação abrange todos os dados estatísticos e indicadores existentes no Cypher, independentemente da página em que estejam.

Objetivo: fazer com que todas as estatísticas apresentadas pela plataforma representem informações reais, verificáveis e coerentes com as atividades dos usuários. Quero dinamismo na UX.

## **12\. SISTEMA DE AVALIAÇÃO E REPUTAÇÃO — REFORMULAÇÃO CONCEITUAL**

Stand-by — Debate futuro

Isolar o sistema de avaliação e reputação para uma discussão específica antes de sua implementação ou reformulação.

* Analisar a estrutura atual do sistema de avaliação e reputação.  
* Evitar implementar ou consolidar regras de avaliação antes de definirmos como funcionarão as colaborações dentro do Cypher.  
* Considerar que a reputação profissional deverá estar relacionada a experiências e interações reais entre usuários, especialmente colaborações realizadas pela plataforma.  
* Deixar a definição dos critérios, mecanismos de avaliação, condições para avaliar e consequências para a reputação para uma discussão posterior.

Dependência conceitual: precisamos definir primeiro como o Cypher reconhecerá, registrará e validará as colaborações entre profissionais. Essa definição será fundamental para estabelecer um sistema de avaliação confiável, evitando avaliações sem fundamento ou experiências que não possam ser verificadas.

## **13\. CONFIGURAÇÕES — REESTRUTURAÇÃO DA PÁGINA**

### **13.1. Reformulação estrutural e visual**

* Reformular a página de configurações, tornando-a mais séria, organizada e imersiva.  
* Atualmente, a página utiliza uma estrutura one-page, apresentando praticamente todas as configurações de forma extensa em uma única tela.  
* Substituir essa apresentação por uma organização mais estruturada, proporcionando uma experiência de navegação mais agradável e menos carregada.  
* Dar maior atenção à hierarquia das seções, distribuição dos conteúdos e apresentação das opções, mantendo a identidade visual underground do Cypher.

### **13.2. Card — Ajuda e Sobre / Cypher Central**

* Remover o card atual da apresentação convencional dentro da página.  
* Transformá-lo em um elemento flutuante ou posicionado estrategicamente na página de configurações.  
* Utilizar o símbolo visual da aba Cypher Central para identificá-lo.  
* Manter a finalidade de direcionar o usuário à Central da Cypher, onde estão disponíveis os guias e as respostas sobre a plataforma.

Referência do card atual:

> AJUDA E SOBRE  
> Continue no caminho  
> Cypher Central  
> Guias e respostas da plataforma

Direção: transformar esse acesso em um elemento mais integrado à interface, visualmente discreto, mas facilmente identificável e acessível, sem ocupar espaço desnecessário na estrutura principal das configurações.


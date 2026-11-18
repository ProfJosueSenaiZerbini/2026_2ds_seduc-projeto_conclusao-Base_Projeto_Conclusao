# Publicação multimídia, galerias e distribuição dos registros

## 1. Central de publicação
1.1. Implantar módulo único de **entrada na criação**, com formulários e entidades separados por tipo. Nome visível **Publicar** é proposta ainda sujeita à decisão do grupo.
1.2. Modalidades previstas: **obras musicais, beats, eventos, trabalhos/galerias visuais e materiais audiovisuais**, além de novos tipos pertinentes aprovados.
1.3. Somente contas com capacidade real acessam criação/edição. Uma pessoa de Artes Visuais não deve precisar cadastrar música para divulgar imagem; dança e audiovisual precisam de formatos adequados.
1.4. Retornar à ficha do registro após sucesso; mostrar erro real se validação/armazenamento falhar. Não publicar apenas na memória do navegador.

## 2. Origem e apresentação
2.1. Criar **um registro canônico por trabalho** com autor e vínculos de participação. Descoberta, Busca, perfil, galeria e portfólio são diferentes formas de consultá-lo.
2.2. Ocultar uma vitrine não elimina a origem. Alteração de privacidade/moderação precisa refletir-se em todas as apresentações e links.
2.3. Separar modelos específicos — obra, beat, evento, trabalho visual/audiovisual — para não diluir regras num objeto genérico sem validação.

## 3. Arquivos de imagem e vídeo
3.1. Prevê-se **foto/capa de perfil, capa de obra, capa de beat, cartaz e galeria de evento, galeria de grafite/ilustração/design/fotografia e miniaturas audiovisuais**.
3.2. Definir antes da implementação **armazenamento (servidor ou links), extensão/MIME, peso, dimensões, quantidade, exclusão, titularidade, privacidade e moderação**.
3.3. Garantir associação de cada mídia com registro de origem, criador, autor/créditos, ordem e eventual controle de exibição.
3.4. Upload de foto e capa deve permitir prévia e recorte quando suportado; conteúdo inexistente usa fallback, não arquivos fictícios.
3.5. Preferir arquivos e recursos já compatíveis com a arquitetura simples; biblioteca extra apenas quando necessária e justificada.

## 4. Acesso, exclusão e integridade
4.1. Validar permissões por arquivo, publicação e relação usuário–registro, inclusive para URLs diretas de mídia privada.
4.2. Distinguir retirar imagem da galeria, ocultar trabalho, moderar, apagar publicação e eliminar arquivo físico; não realizar exclusão em cascata inadvertida.
4.3. Se uma obra aparece em múltiplas seções/portfólios, exclusão da vitrine altera apenas a associação, não apaga registro de terceiro.
4.4. Registrar autoria, alterações relevantes e moderação quando aplicável, sem transformar um arquivo enviado em comprovação legal de propriedade.

## 5. Integrações
5.1. A interface da central e das fichas está documentada em [05-Publicar-Obras-Eventos-e-Galerias](../Reestrutura%C3%A7%C3%A3o%20Visual/05-Publicar-Obras-Eventos-e-Galerias.md).
5.2. Vínculos automáticos de portfólio e critérios de créditos em `Reestruturação Relacional e Informativa/04-Portfolio-Manual-e-Inteligente.md`.
5.3. Testar acesso indevido, upload inválido, mudança de visibilidade, remoção de vitrine e apresentação em várias páginas sem duplicação.

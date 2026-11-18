# Identificador público do Cypher

## Objetivo

Durante o cadastro, além do nome do perfil, cada pessoa poderá escolher um **identificador público**, também conhecido como *username*, *nick* ou *handle*. Esse identificador será utilizado para localizar o perfil dentro da plataforma e formar o endereço público da conta.

Exemplo:

```text
Nome do perfil: João da Silva
Vulgo artístico: DJ João
Identificador público: @djjoao
```

O identificador público deverá substituir a geração automática de nomes aparentemente aleatórios, como `@organizator-99ca61`, permitindo que cada pessoa escolha uma identificação mais coerente com sua presença artística, profissional ou cultural.

## Diferença entre nome, vulgo e identificador

O **nome do perfil** é a forma como a pessoa deseja ser apresentada. Ele pode conter espaços, acentos e informações mais completas:

```text
João da Silva
```

O **vulgo ou nome artístico** representa a identidade pela qual a pessoa é conhecida no meio cultural ou profissional:

```text
DJ João
João Beats
Organizador Cultural
```

O **identificador público** é um código curto e exclusivo utilizado pelo sistema para encontrar o perfil. Ele deve ser simples, único e fácil de compartilhar:

```text
@djjoao
@joaobeats
@organizador-cultural
```

Esses três campos podem ser semelhantes, mas não precisam ser iguais. Uma pessoa pode se chamar João da Silva, ser conhecida artisticamente como DJ João e utilizar `@djjoao` como identificador público.

## Preenchimento durante o cadastro

O identificador deverá ser solicitado já no cadastro da conta, com uma explicação breve sobre sua finalidade. O campo deve deixar claro que o `@` não é necessariamente o nome civil nem o vulgo artístico da pessoa.

### Texto sugerido para o cadastro

> **Escolha seu identificador público**
>
> Seu identificador público é o nome único que será usado para encontrar e compartilhar seu perfil no Cypher. Ele aparece com o símbolo `@` e não precisa ser igual ao seu nome ou ao seu vulgo artístico.
>
> Por exemplo:
>
> - Nome: João da Silva
> - Vulgo: DJ João
> - Identificador público: `@djjoao`
>
> Use apenas letras, números, hífen ou sublinhado, sem espaços. Esse identificador deve ser exclusivo e poderá ser alterado posteriormente, respeitando o intervalo definido nas configurações da conta.

### Texto curto de ajuda

> Seu `@` é seu identificador único no Cypher. Ele é diferente do seu nome e do seu vulgo artístico e será usado nos links do seu perfil, créditos e compartilhamentos.

## Regras do identificador

O identificador deverá:

- não conter espaços;
- utilizar letras minúsculas, números, hífen ou sublinhado;
- ter entre 3 e 30 caracteres;
- não conter símbolos fora do conjunto permitido;
- não conter palavras ofensivas ou inadequadas;
- não utilizar palavras reservadas do sistema;
- estar disponível exclusivamente para uma conta.

### Exemplos válidos

```text
@djjoao
@joao-beats
@produtora_luana
@cultura-norte
```

### Exemplos inválidos

```text
@João da Silva
@dj joao
@organizador!
@dj/joao
```

A comparação deverá ignorar letras maiúsculas e minúsculas. Portanto, os identificadores abaixo deverão ser tratados como iguais:

```text
@Organizador
@organizador
@ORGANIZADOR
```

## Verificação de disponibilidade

Durante o cadastro, o Cypher poderá verificar automaticamente se o identificador está disponível. Caso ele já esteja sendo utilizado, a pessoa deverá receber uma mensagem clara:

> Este identificador já está em uso. Escolha outro.

A disponibilidade deverá ser confirmada também no servidor no momento da criação da conta. A validação do navegador não é suficiente, pois duas pessoas podem tentar registrar o mesmo identificador simultaneamente.

A regra deve ser absoluta:

> Apenas uma conta pode possuir cada identificador ativo.

## Palavras reservadas

Alguns identificadores deverão ser bloqueados para evitar conflitos com rotas, funções internas e futuras áreas do sistema. Exemplos:

```text
@admin
@login
@register
@profile
@settings
@api
@support
@cypher
```

A lista de palavras reservadas deverá ser centralizada no servidor e poderá ser ampliada conforme novas funcionalidades forem adicionadas.

## Alteração do identificador

Depois do cadastro, o identificador poderá ser alterado dentro das configurações da conta, respeitando um intervalo mínimo entre mudanças. A sugestão é permitir uma alteração a cada **30 dias**.

Essa limitação ajuda a:

- evitar mudanças constantes;
- reduzir confusão entre os usuários;
- preservar a identidade pública da conta;
- diminuir problemas com links e créditos compartilhados.

Ao alterar o identificador, o sistema deverá informar quando uma nova alteração estará disponível.

Exemplo:

> Seu identificador foi alterado para `@organizador`. Você poderá alterá-lo novamente em 15/12/2026.

Alterações excepcionais poderão ser avaliadas por administradores em casos de erro de cadastro, necessidade de moderação ou conflito de marca.

## Preservação de links antigos

A alteração do identificador não deverá quebrar o histórico do perfil.

Se uma conta mudar de:

```text
@organizator-99ca61
```

para:

```text
@organizador
```

O endereço anterior deverá continuar funcionando e redirecionar para o novo perfil:

```text
/p/organizator-99ca61
```

redirecionando para:

```text
/p/organizador
```

O identificador antigo deverá permanecer registrado no histórico e, de preferência, reservado para o mesmo usuário. Assim, outra conta não poderá assumir o identificador antigo e causar confusão com links ou referências existentes.

## Preservação de obras e créditos

As obras, créditos e participações também deverão continuar vinculados à mesma conta. O sistema não deve depender permanentemente do texto do `@`; cada relação deverá permanecer associada ao identificador interno e imutável do usuário.

Dessa forma, quando o identificador mudar:

```text
Antes:  @organizator-99ca61
Depois: @organizador
```

as obras antigas continuarão apontando para o mesmo perfil e passarão a exibir o novo identificador automaticamente.

Para compatibilidade com os dados atuais, a implementação deverá migrar ou atualizar os créditos existentes durante a alteração, dentro de uma transação. Assim, não haverá risco de atualizar apenas algumas obras e deixar outras com o identificador antigo.

## Mensagens de validação sugeridas

### Identificador disponível

> Este identificador está disponível.

### Identificador em uso

> Este identificador já está em uso. Escolha outro.

### Formato inválido

> Use de 3 a 30 caracteres, sem espaços, utilizando apenas letras, números, hífen ou sublinhado.

### Palavra reservada

> Este identificador não pode ser utilizado. Escolha outra opção.

### Alteração bloqueada pelo intervalo

> Você poderá alterar seu identificador novamente em [data].

## Diretriz técnica recomendada

A implementação deve separar claramente o identificador público do identificador interno da conta:

```text
usuario_id interno: permanente e imutável
identificador público: editável, exclusivo e versionado
```

O `usuario_id` deverá ser a referência principal de obras, créditos, notificações, relações profissionais e demais registros. O identificador público deverá ser utilizado para apresentação, busca e endereços compartilháveis.

Essa separação permite que o `@` mude sem quebrar o histórico do usuário.

## Resumo da proposta

O modelo recomendado para o Cypher é:

1. solicitar o identificador público durante o cadastro;
2. explicar sua diferença em relação ao nome e ao vulgo artístico;
3. permitir apenas caracteres controlados e identificadores legíveis;
4. garantir unicidade absoluta;
5. verificar disponibilidade no navegador e no servidor;
6. limitar alterações a uma vez a cada 30 dias;
7. manter histórico dos identificadores anteriores;
8. preservar links antigos por meio de redirecionamento;
9. manter obras e créditos vinculados ao `usuario_id`;
10. atualizar automaticamente a exibição do novo identificador;
11. bloquear palavras reservadas;
12. registrar data, usuário e histórico de cada alteração.

Essa solução deixa claro para o usuário que o nome, o vulgo e o `@` têm funções diferentes, além de tornar o cadastro mais profissional e preparar o Cypher para crescimento sem perder referências históricas.

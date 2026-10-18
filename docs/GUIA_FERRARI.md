# Guia de desenvolvimento — Ferrari

Responsável: Ferrari. Branch de trabalho: ferrari. Tech lead: Pandini.
Este guia organiza o trabalho combinado; não autoriza implementar tudo de uma vez.

## Atualização — 16/10/2026

Pandini implementou a navegação inicial: o app abre Login e o botão Entrar vai diretamente para Home, inclusive com campos vazios. Os alertas e a espera artificial foram removidos. Ainda não há autenticação ou sessão. Preserve essa decisão; não reintroduza validações, atrasos ou alertas de sucesso sem combinar com Pandini. As validações citadas como objetivo futuro abaixo dependem dessa nova combinação.

## 1. Seu objetivo

Você continua o Login que já começou e depois trabalha em Cadastro de produto e Orçamentos salvos.
O app atende vendedores da Mister MotoPlace: consultar estoque, selecionar produtos e preparar orçamentos.

| Sua entrega | O que inclui |
| --- | --- |
| Login | Visual, campos, mostrar/ocultar senha e validações simples; entregar para Pandini integrar. |
| Cadastro de produto | Formulário, validações e uso da função comum de salvar quando estiver disponível. |
| Orçamentos salvos | Lista, estado vazio, status e abertura do orçamento escolhido. |

## 2. Divisão da equipe

- Ferrari: visual/validações do Login, Cadastro de produto e Orçamentos salvos.
- Danner: refatoração da Home e tela de Produtos.
- Pandini: navegação, sessão/autenticação, dados compartilhados, banco, carrinho, detalhe do orçamento, venda, recibo e scanner.

Pandini cuida de src/app/, src/data/ e src/context/. Combine com ele antes de alterar esses locais.
Não mexa nas telas de Danner nem implemente as telas de Pandini para conseguir terminar a sua.

## 3. Antes de começar

Os caminhos abaixo partem da raiz Git, que contém README.md e a pasta MisterGestao/.

1. Execute git status e git branch --show-current. Trabalhe na branch ferrari, nunca diretamente na main.
2. Se houver alterações que você não reconhece, pare e pergunte antes de descartar, trocar de branch ou atualizar.
3. Combine com Pandini qual versão da main usar como base. Não use reset --hard nem force push.
4. Peça à IA que leia os AGENTS.md aplicáveis, MisterGestao/package.json e os arquivos da tarefa.
5. Consulte a referência da tela fornecida por Pandini. Se ela não estiver disponível, peça acesso; não invente que a consultou.
6. Peça um plano para um único arquivo. Leia o plano antes de aprovar a edição.

Para comandos do app, entre na pasta MisterGestao/, onde está package.json. Mantenha npm e as versões atuais.

## 4. Ordem das entregas

### Entrega 1 — Concluir sua parte do Login

Arquivo: MisterGestao/src/view/Login.js.

- Preserve o trabalho existente e alinhe o visual com a referência aprovada.
- Mantenha campos de e-mail e senha. Nesta fase, campos vazios não impedem a navegação; validações entram somente quando combinadas.
- Inclua mostrar/ocultar senha e cuide da usabilidade com o teclado aberto.
- Exiba carregamento e erro de forma clara quando a integração fornecer esses estados.
- Não crie cadastro de usuário, recuperação de senha ou perfil de cliente sem combinar.
- Elementos de apresentação do protótipo, como Simular offline, não representam funcionalidades nativas; combine a retirada com Pandini.
- Preserve a navegação direta de Entrar para Home. Não adicione espera artificial ou alerta de sucesso.

Pandini assume a função de entrar, autenticação, sessão, redirecionamento e proteção das rotas. Combine a passagem do arquivo antes de ele começar a integração, evitando duas pessoas editando Login.js ao mesmo tempo.

Teste da sua parte: campos vazios continuam permitindo entrar; confira digitação do e-mail, mostrar/ocultar senha quando implementado e formulário utilizável com teclado aberto. Login válido/inválido de verdade será testado com Pandini após a integração.

### Entrega 2 — Cadastro de produto

Arquivo existente: MisterGestao/src/view/CadastroProduto.js. Complete esse arquivo; não crie outra tela equivalente.

- Campos: nome, categoria, marca, medida, preço, saldo e estoque mínimo.
- Nome obrigatório; preço positivo; saldo e mínimo inteiros não negativos. Combine outras obrigatoriedades com Pandini.
- Foto e código podem começar opcionais. Não implemente upload ou câmera nessa entrega.
- Mostre mensagens curtas para dados inválidos, sem apagar o que a pessoa já digitou.
- Aceite o formato de preço combinado para a interface brasileira; não use uma conversão que transforme 54,90 em 54 ou em 5490 reais.
- Envie o preço em centavos inteiros para a função comum: R$ 54,90 corresponde a 5490.
- Use a função de salvar disponibilizada por Pandini. Não grave no Firebase diretamente nem crie outra lista permanente na tela.
- Só mostre sucesso e limpe/feche o formulário depois de o salvamento funcionar.
- Não adicione edição, exclusão, marcas ou categorias em telas próprias sem combinar.

Se a função de salvar ainda não existir, conclua o formulário e suas validações e informe essa pendência. Não mostre Produto salvo quando nada foi salvo.

Teste: nome vazio; preço inválido/zero; saldo negativo ou fracionado; mínimo negativo; cadastro válido. Após integrar, confira se o produto aparece em Produtos e se a Home reflete o estoque baixo quando aplicável.

### Entrega 3 — Orçamentos salvos

Arquivo previsto: MisterGestao/src/view/Orcamentos.js. Confirme antes se já existe uma tela equivalente.

- Liste os orçamentos disponibilizados pelos dados comuns: número, cliente, data/validade, status e total.
- Mostre estado vazio e acesso para começar um orçamento quando a rota estiver disponível.
- Ao tocar em um registro, abra o detalhe pelo ID usando a rota confirmada por Pandini.
- Não passe um objeto inteiro serializado pela URL.
- Não crie outra cópia permanente dos orçamentos nem uma segunda camada de persistência.
- Aprovação, cancelamento, compartilhamento e conversão ficam no detalhe, sob responsabilidade de Pandini.
- Orçamento vencido precisa ser identificado pela validade conforme a regra combinada; não invente novos status persistidos.

Se a lista/rota ainda não existir, combine dados temporários com Pandini para revisar o visual e sinalize que a integração está pendente.

Teste: lista vazia; dois orçamentos com valores/clientes diferentes; abertura do registro correto. A lista, por si só, não altera estoque.

## 5. Acordos técnicos simples

- JavaScript com JSX nas views e StyleSheet no próprio arquivo; preserve Expo Router e a estrutura atual.
- Sem Redux, Zustand, arquitetura nova ou componentes extraídos apenas para dividir arquivos.
- Não instale dependências, não atualize versões e não altere package.json/package-lock.json sem combinar.
- Nada de Firebase, autenticação própria ou credenciais nas suas telas. Pandini assume essa integração.
- Produtos, carrinho e orçamentos usam os dados comuns do time, inicialmente demonstrativos. A decisão de antecipar autenticação real fica com Pandini.
- Dinheiro nos dados comuns é centavo inteiro; formate para reais apenas na interface.
- Sem bibliotecas de formulário ou validação para esses campos simples.
- Confira os dados recebidos e as funções disponíveis antes de escrever chamadas. Não invente APIs do projeto.
- Antes de usar APIs Expo/React Native, a IA deve consultar a documentação correspondente à versão instalada, conforme AGENTS.md.

## 6. Prompts para usar com IA

Copie o primeiro prompt no começo da conversa:

> Estou no projeto MisterGestão, na branch ferrari. Leia docs/GUIA_FERRARI.md, todos os AGENTS.md aplicáveis e o package.json do app. Confira git status e os arquivos da tarefa sem alterar nada. Minha responsabilidade é visual/validações do Login, Cadastro de produto e Orçamentos salvos. Pandini cuida de navegação, autenticação e dados compartilhados. Explique o estado atual e proponha a menor alteração em um único arquivo. Espere minha aprovação. Não instale dependências nem edite arquivos de outros responsáveis.

Para continuar o Login:

> Analise somente MisterGestao/src/view/Login.js e proponha uma melhoria pequena no visual, preservando o código existente e a navegação direta para Home feita por Pandini. Não reintroduza validações, atrasos ou alertas; autenticação e sessão ficam para uma etapa futura com Pandini. Não instale Firebase. Explique a alteração e espere minha aprovação.

Para Cadastro de produto:

> Vamos planejar MisterGestao/src/view/CadastroProduto.js, aproveitando o arquivo existente. Quero campos simples, mensagens curtas e validação de nome, preço positivo e estoque/mínimo inteiros não negativos. Confira a função comum de salvar antes de usá-la. Se ela não existir, liste a dependência sem simular sucesso. Dinheiro deve chegar à função em centavos inteiros. Proponha um único arquivo e espere aprovação.

Para Orçamentos salvos:

> Vamos planejar MisterGestao/src/view/Orcamentos.js. Confira primeiro a origem dos dados e a rota de detalhe disponíveis. Quero lista com número, cliente, data/validade, status, total e estado vazio. A abertura deve usar o ID. Não implemente geração, cancelamento, conversão, persistência ou um contexto novo. Liste o que depende de Pandini e espere aprovação antes de editar.

Depois de aprovar uma mudança:

> Pode aplicar apenas a alteração proposta nesse arquivo. Preserve minhas alterações anteriores. Ao terminar, explique o diff, as verificações feitas e um teste manual curto. Diferencie o que funciona do que aguarda integração e espere meu retorno antes de editar outro arquivo.

Para revisar e entender:

> Revise o diff sem editar. Há algo fora do meu escopo, código complicado, conversão de preço errada ou sucesso exibido sem salvar? Explique também o fluxo principal em linguagem de iniciante para eu conseguir apresentar o código ao Pandini.

## 7. Checklist de entrega ao Pandini

- [ ] Revisei o diff e sei explicar a mudança.
- [ ] Só alterei os arquivos combinados.
- [ ] Executei npm run lint e npx tsc --noEmit na pasta do app, como pede AGENTS.md; registrei falhas anteriores e novas separadamente.
- [ ] Testei o que era possível e informei se foi web ou celular.
- [ ] Listei as funções e rotas que ainda aguardam integração.
- [ ] Não incluí credenciais, arquivos .env ou alterações de dependências sem acordo.
- [ ] Combinei com Pandini a passagem do Login antes de começarmos a editar o mesmo arquivo.
- [ ] Pedi revisão antes de continuar a próxima entrega.

Envie esta mensagem com a entrega:

> Entrega: [parte concluída]. Arquivos: [lista]. Como testar: [passos]. Verificações: [resultado]. Pendências para Pandini: [lista ou nenhuma].

Faça commits pequenos na sua branch, revisando e selecionando os arquivos. A IA só deve fazer commit/push quando você pedir explicitamente. A integração na main fica com Pandini. Não execute git add . sem conferir o que será incluído.

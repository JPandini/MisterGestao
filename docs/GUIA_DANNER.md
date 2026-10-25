# Atualização de 25/10/2026

Pandini autorizou migrar para React Navigation e integrar produtos ao Firestore. Esta decisão substitui as instruções históricas de manter mocks ou aguardar integração; veja `Pandini.md`, `TODO.md` e `FIREBASE.md` para o contrato atual. A implementação feita nesta entrega afeta Home e Produtos.

# Guia de desenvolvimento — Danner

Responsável: Danner. Branch de trabalho: danner. Tech lead: Pandini.
Este guia organiza o trabalho combinado; não autoriza implementar tudo de uma vez.

## 1. Seu objetivo

Você cuida da Home e da tela de Produtos. Entregue uma parte pequena, teste e peça revisão antes de passar à próxima.
O app atende vendedores da Mister MotoPlace: consultar estoque, selecionar produtos e preparar orçamentos.

| Sua entrega | O que inclui |
| --- | --- |
| Refatorar Home | Simplificar o código existente, ajustar o visual e os alertas de estoque. |
| Produtos | Lista, pesquisa, preço, saldo, adicionar ao carrinho e acesso ao cadastro/carrinho. |
| Integração das suas telas | Usar os dados e as funções disponibilizados por Pandini e validar os botões. |

## 2. Divisão da equipe

- Danner: Home e Produtos.
- Ferrari: visual/validações do Login, Cadastro de produto e Orçamentos salvos.
- Pandini: navegação, sessão/autenticação, dados compartilhados, banco, carrinho, detalhe do orçamento, venda, recibo e scanner.

Pandini cuida de src/app/, src/data/ e src/context/. Combine com ele antes de alterar esses locais.
Não mexa nas telas de Ferrari nem implemente as telas de Pandini para conseguir terminar a sua.

## 3. Antes de começar

Os caminhos abaixo partem da raiz Git, que contém README.md e a pasta MisterGestao/.

1. Execute git status e git branch --show-current. Trabalhe na branch danner, nunca diretamente na main.
2. Se houver alterações que você não reconhece, pare e pergunte antes de descartar, trocar de branch ou atualizar.
3. Combine com Pandini qual versão da main usar como base. Não use reset --hard nem force push.
4. Peça à IA que leia os AGENTS.md aplicáveis, MisterGestao/package.json e os arquivos da tarefa.
5. Consulte a referência da tela fornecida por Pandini. Se ela não estiver disponível, peça acesso; não invente que a consultou.
6. Peça um plano para um único arquivo. Leia o plano antes de aprovar a edição.

Para comandos do app, entre na pasta MisterGestao/, onde está package.json. Mantenha npm e as versões atuais.

## 4. Ordem das entregas

### Entrega 1 — Refatorar a Home existente

Arquivo: MisterGestao/src/view/Home.js.

- Entenda o arquivo antes de reescrever. Reaproveite o visual aprovado.
- Use nomes claros, funções pequenas e StyleSheet no próprio arquivo.
- Remova estilos ou trechos sem uso somente depois de conferir que realmente não são usados.
- Prepare os atalhos Monte um orçamento, Orçamentos salvos, Produtos, Nova venda e Scanner conforme o combinado visual com Pandini.
- Ligue um botão somente quando a rota correspondente existir e tiver sido confirmada por Pandini.
- Estoque baixo significa stock <= minimum; não use um limite fixo igual para todos os produtos.
- Não apresente sincronização, pagamentos ou métricas demonstrativas como dados reais.
- Troque os mocks locais pelos dados comuns quando Pandini disponibilizar essa integração. Até lá, informe a dependência e evite criar outro contexto.

Teste: a tela abre, o conteúdo pode ser rolado e os cards continuam legíveis no celular. Depois da integração, confira os alertas com os produtos de referência: Câmara Rinaldi com saldo 3/mínimo 3 e WD-40 com saldo 2/mínimo 3.

### Entrega 2 — Criar Produtos

Arquivo previsto: MisterGestao/src/view/Produtos.js. Confirme antes se já existe uma tela equivalente.

- Mostre nome, medida, preço e estoque de cada produto.
- Permita pesquisar por nome e medida, sem instalar biblioteca de busca.
- Mostre uma mensagem curta quando a lista ou a pesquisa estiver vazia.
- Inclua Adicionar, acesso ao carrinho com contador e acesso ao cadastro de produto.
- Reutilize a lista de produtos e o carrinho que Pandini disponibilizar.
- Adicionar o mesmo produto deve aumentar sua quantidade, sem criar linhas duplicadas.
- Adicionar ao carrinho não reduz estoque.
- Não crie um carrinho separado dentro dessa tela.

Se as funções comuns ainda não existirem, entregue o visual com dados demonstrativos combinados e informe exatamente quais ações aguardam integração. Não simule salvamento ou inclusão com um alerta de sucesso.

Teste: buscar por nome, buscar por medida e buscar algo inexistente. Com o carrinho integrado, adicionar duas vezes o mesmo produto e conferir uma linha com quantidade dois e estoque inalterado.

### Entrega 3 — Integrar e revisar

Um arquivo por vez: Home.js ou Produtos.js.
Combine os nomes das rotas e funções com Pandini. Confira os acessos a produtos, cadastro, carrinho e orçamentos. A escolha inicial de menu é uma proposta do time; não monte outro navegador dentro das views.

## 5. Acordos técnicos simples

- JavaScript com JSX nas views; preserve Expo Router e a estrutura atual.
- Sem Redux, Zustand, arquitetura nova ou componentes extraídos apenas para dividir arquivos.
- Não instale dependências, não atualize versões e não altere package.json/package-lock.json sem combinar.
- Nada de Firebase ou credenciais nas suas telas. Pandini assume essa integração.
- Dados monetários comuns usam centavos inteiros: 47090 representa R$ 470,90. Formate na exibição e evite dividir duas vezes.
- Os dados demonstrativos devem seguir a referência comum do time. Não invente catálogos diferentes para cada tela.
- Confira os dados recebidos e as funções disponíveis antes de escrever chamadas. Não invente APIs do projeto.
- Antes de usar APIs Expo/React Native, a IA deve consultar a documentação correspondente à versão instalada, conforme AGENTS.md.

## 6. Prompts para usar com IA

Copie o primeiro prompt no começo da conversa:

> Estou no projeto MisterGestão, na branch danner. Leia docs/GUIA_DANNER.md, todos os AGENTS.md aplicáveis e o package.json do app. Confira git status e os arquivos da tarefa sem alterar nada. Minha responsabilidade é Home e Produtos; Pandini cuida de navegação, dados, sessão, carrinho e banco. Explique o estado atual e proponha a menor alteração em um único arquivo. Espere minha aprovação. Não instale dependências nem edite arquivos de outros responsáveis.

Para começar a Home:

> Vamos trabalhar somente em MisterGestao/src/view/Home.js. Analise a refatoração mínima preservando o visual aprovado. Aponte código sem uso, alertas de estoque e botões sem integração. Não crie rotas, contexto ou Firebase. Explique o que pretende mudar e espere minha aprovação.

Para começar Produtos:

> Vamos planejar MisterGestao/src/view/Produtos.js. Primeiro verifique os dados, funções e rotas já existentes. Quero lista, busca por nome/medida, preço, estoque e ações de adicionar, abrir carrinho e cadastro. Não crie outro carrinho nem invente funções compartilhadas. Se faltar algo de Pandini, liste a dependência. Proponha um único arquivo e espere aprovação.

Depois de aprovar uma mudança:

> Pode aplicar apenas a alteração proposta nesse arquivo. Preserve minhas alterações anteriores. Ao terminar, explique o diff, as verificações feitas e um teste manual curto. Diferencie o que funciona do que aguarda integração e espere meu retorno antes de editar outro arquivo.

Para revisar e entender:

> Revise o diff sem editar. Há algo fora do meu escopo, código complicado, preço formatado errado ou funcionalidade simulada como pronta? Explique também o fluxo principal em linguagem de iniciante para eu conseguir apresentar o código ao Pandini.

## 7. Checklist de entrega ao Pandini

- [ ] Revisei o diff e sei explicar a mudança.
- [ ] Só alterei os arquivos combinados.
- [ ] Executei npm run lint e npx tsc --noEmit na pasta do app, como pede AGENTS.md; registrei falhas anteriores e novas separadamente.
- [ ] Testei o que era possível e informei se foi web ou celular.
- [ ] Listei os botões e funções que ainda aguardam integração.
- [ ] Não incluí credenciais, arquivos .env ou alterações de dependências sem acordo.
- [ ] Pedi revisão antes de continuar a próxima entrega.

Envie esta mensagem com a entrega:

> Entrega: [parte concluída]. Arquivos: [lista]. Como testar: [passos]. Verificações: [resultado]. Pendências para Pandini: [lista ou nenhuma].

Faça commits pequenos na sua branch, revisando e selecionando os arquivos. A IA só deve fazer commit/push quando você pedir explicitamente. A integração na main fica com Pandini. Não execute git add . sem conferir o que será incluído.

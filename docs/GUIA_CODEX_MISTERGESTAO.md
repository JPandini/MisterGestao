# MisterGestão — guia para desenvolver com o Codex

Preparado em 16/10/2026 para João Vitor Pandini.

**Atualização:** este roteiro é uma referência histórica. Em 25/10/2026, Pandini autorizou substituir Expo Router por React Navigation, usar somente JavaScript, criar componentes reutilizáveis e conectar o cadastro/lista de produtos ao Cloud Firestore. Para o estado atual e as etapas pendentes, siga `Pandini.md`, `TODO.md` e `FIREBASE.md`; quando este documento divergir, prevalecem essas decisões recentes.

**Regra principal: código muito simples, dados mockados agora, uma tela por vez e um arquivo por confirmação. Firebase somente em uma etapa futura autorizada.**

## 1. Como começar

1. Extraia o pacote deste guia.
2. Copie seu conteúdo para a raiz do repositório `JPandini/MisterGestao`: a pasta que contém `README.md`, `LICENSE` e a subpasta `MisterGestao/`.
3. Preserve o `MisterGestao/AGENTS.md` que já existe. O `AGENTS.md` deste pacote fica na raiz externa e complementa as regras existentes. Se já houver outro arquivo nesse destino, mescle o conteúdo em vez de sobrescrevê-lo.
4. Abra essa raiz no VS Code e inicie uma conversa com o Codex.
5. Cole o conteúdo de `INICIAR_NO_CODEX.txt`.
6. No primeiro retorno, o Codex deve apenas analisar o projeto, resumir a situação e propor o primeiro arquivo. Não deve implementar nada antes da sua resposta.

O guia não é uma ordem para construir todas as funcionalidades de uma vez. É um roteiro de pequenas entregas aprovadas pelo João.

## 2. Contexto do produto

O **MisterGestão** é um aplicativo mobile da disciplina Soluções Mobile, voltado inicialmente ao atendimento da **Mister MotoPlace**, que vende pneus, peças e acessórios para motos.

O vendedor atende presencialmente e por WhatsApp/Instagram. Precisa consultar produtos e estoque com agilidade, montar orçamentos, compartilhar com o cliente e registrar a venda depois da aprovação.

Fluxo prioritário:

1. O cliente pede alguns produtos na conversa.
2. O vendedor entra no aplicativo e seleciona os itens.
3. Os itens entram em um carrinho de orçamento.
4. O vendedor ajusta quantidades, cliente, desconto, frete e validade.
5. O aplicativo gera um orçamento para compartilhar.
6. Se o cliente aprovar, o vendedor pode converter o orçamento em venda.

O cliente que recebe o orçamento não precisa instalar o aplicativo para esse fluxo funcionar.

**Escopo desta primeira entrega:** operação do vendedor/administrador. Perfil de cliente, e-commerce, compras, financeiro completo, múltiplas lojas e outras expansões devem ser confirmados separadamente. Não implementar essas expansões por dedução.

## 3. Estado real do repositório consultado

Repositório: https://github.com/JPandini/MisterGestao

Commit inspecionado: `b8a39527cda57c2fcd3d32fdc644b60d2a7848e9`.

O código local do João pode ter avançado. O Codex deve ler o diretório atual e o diff antes de aplicar este roteiro. A tabela abaixo registra a consulta, não substitui a leitura atual.

| Arquivo, relativo à raiz Git | Situação encontrada |
| --- | --- |
| `MisterGestao/package.json` | Expo `~57.0.30`, React Native `0.86.3`, React `19.2.3`, Expo Router `~57.0.28`. |
| `MisterGestao/src/app/index.tsx` | Importa Login e Home, mas renderiza apenas Home. |
| `MisterGestao/src/view/Login.js` | Tela visual. Verifica campos vazios, simula espera e mostra um alerta; não autentica nem navega. |
| `MisterGestao/src/view/Home.js` | Tela visual com `MOCK_DATA` dentro do arquivo; vários botões ainda sem ação. |
| `MisterGestao/src/view/CadastroProduto.js` | Praticamente vazio. |
| `MisterGestao/src/global.css` | Variáveis de fontes para web; não é um tema nativo completo. |
| `MisterGestao/AGENTS.md` | Regras Expo já existentes, incluindo consulta à documentação, Expo Router e verificações. Preservar. |
| `MisterGestao/package-lock.json` | npm já está em uso. Não trocar de gerenciador. |

Não encontrei Firebase nem AsyncStorage nas dependências consultadas, nem um `src/app/_layout.tsx` versionado.

**Ponto para conferir antes de começar:** `app.json` referencia imagens em `assets/`, mas essa pasta não apareceu no checkout consultado. Verificar se os arquivos existem no computador do João. Se faltar algum, apresentar a correção mínima e pedir autorização; não apagar configurações ou regenerar o projeto inteiro.

## 4. Como consultar o protótipo

### Link do GPT Site

https://mister-motoplace-prototipo.jpandini.chatgpt.site

Esse link pode exigir acesso pela conta do João. Não presumir que o Codex consegue acessar a sessão do ChatGPT, o histórico desta conversa ou o Figma.

### Cópia local incluída no pacote

Arquivo: `referencias/prototipo/index.html`.

É uma referência web interativa gerada a partir do código do protótipo, com React, estilos, fonte e logo incorporados. Não precisa instalar dependências para abrir a referência. Abra no navegador e use **Explorar demonstração**.

Para servir localmente, execute da raiz Git, se Python estiver disponível:

```bash
python -m http.server 4173 --directory referencias/prototipo
```

Depois abra `http://localhost:4173`. No Windows, `py -m http.server 4173 --directory referencias/prototipo` é uma alternativa se o comando `python` não existir.

Abrir o HTML diretamente também permite consultar as telas, mas funções como copiar/compartilhar podem depender do navegador e do contexto de segurança. O estado de demonstração fica nesse navegador. Compartilhamento nativo e envio ao WhatsApp/Instagram dependem dos aplicativos disponíveis; não há envio automático.

**Para o Codex:** se tiver ferramenta de navegador habilitada, abra a referência local para conferir a tela. Se não tiver, leia os arquivos em `referencias/prototipo/fonte/` e peça ao João somente a captura da tela atual quando necessário. Não afirmar que visualizou algo que apenas leu no código.

| Tela desejada | Como encontrá-la no protótipo |
| --- | --- |
| Login | Primeira tela. |
| Home | **Explorar demonstração** ou **Hoje**. |
| Produtos | **Monte um orçamento** ou **Produtos**. |
| Cadastro de produto | Botão **+** em Produtos; abre um painel. |
| Carrinho | Adicione produtos e abra o ícone do carrinho. |
| Orçamento pronto | No carrinho, revise os dados e toque em **Gerar orçamento**. |
| Lista de orçamentos | Aba **Orçamentos** ou **Orçamentos salvos**. |
| Nova venda | **Nova venda** na Home ou aba **Venda**. |
| Finalizar venda | Adicione itens à venda e continue para pagamento; também acessível pela conversão de orçamento. |
| Recibo | Confirme uma venda demonstrativa. |
| Scanner | **Escanear**; a leitura é simulada na referência web. |

O arquivo `fonte/page.tsx` contém o fluxo geral; `fonte/quote-screens.tsx` contém as telas de orçamento. `mvp-model.ts` e `quote-model.ts` registram as regras e os produtos usados na demonstração. `globals.css` registra o visual e `quote-card.ts` o card web.

**Esses arquivos são referência, não arquitetura para copiar.** O aplicativo final usa componentes React Native. Não levar HTML, CSS, canvas de navegador, `localStorage`, Next.js/Vinext ou APIs de `document` para o app nativo.

Limites da referência: login, câmera e sincronização são demonstrativos; os dados são fictícios. O protótipo não prova que uma integração real já existe. A cópia local foi empacotada e checada estruturalmente, sem revisão visual automatizada neste ambiente.

## 5. Identidade visual

- Marca do app: **MisterGestão**. Loja atendida: **Mister MotoPlace**.
- Laranja principal: `#EB580C`; ação mais escura, quando necessário para contraste: `#B83F00`.
- Preto: `#17191C`; branco: `#FFFFFF`; fundo suave: `#F6F7F9`.
- Visual limpo, com pouco texto, preços legíveis, cards simples e botões confortáveis no celular.
- Logo: `referencias/assets/mistergestao-logo.png`.
- Conceito do ícone: `referencias/assets/mistergestao-icone.png`.
- Fonte da referência: Manrope. Usar a fonte do sistema inicialmente é aceitável; fonte personalizada só se João quiser nessa etapa.

Não copiar a barra lateral de apresentação do protótipo para o aplicativo. Ela serve apenas para explorar as telas no computador.

## 6. Estrutura mínima — não criar tudo agora

Preservar `src/view/`, os componentes já escritos em JavaScript e o Expo Router já instalado.

| Local, dentro de `MisterGestao/` | Responsabilidade |
| --- | --- |
| `src/app/` | Rotas e layout de navegação; arquivos pequenos que apresentam as views. |
| `src/view/` | Telas com JSX, seus estados locais e `StyleSheet` no mesmo arquivo. |
| `src/data/dados.js` | Dados fictícios e poucas funções de leitura/gravação; futura entrada para Firebase. |
| `src/context/AppContext.js` | Um único contexto para sessão demonstrativa e os dados compartilhados necessários, especialmente o carrinho. |
| `assets/images/` | Logo e ícone, quando sua inclusão for aprovada. |

Criar cada arquivo apenas na etapa em que for usado. Um componente compartilhado só deve virar outro arquivo quando a repetição real justificar; não criar uma pasta de componentes antecipadamente.

**Não adicionar:** Redux, Zustand, Clean Architecture, DDD, MVVM, repositories, services encadeados, interfaces genéricas, DTOs, factories, injeção de dependência, backend próprio ou um hook para cada ação.

Também não usar código minificado, ternários difíceis ou linhas enormes para parecer curto. Simples significa fácil de ler e alterar. Preferir funções pequenas, nomes claros, `useState`, `useContext`, `useEffect` quando necessário e validações diretas. Não migrar todo o app para TypeScript nem criar tipos genéricos.

### Uma separação suficiente para o Firebase depois

As telas não precisam saber se os dados vêm do mock ou do Firebase. Devem usar funções diretas de `dados.js`, quando precisarem de dados persistentes, e o contexto para compartilhar o carrinho/sessão.

Exemplos de nomes, criados somente quando necessários:

```js
entrar(email, senha)
listarProdutos()
salvarProduto(produto)
listarOrcamentos()
salvarOrcamento(orcamento)
atualizarOrcamento(id, alteracoes)
registrarVenda(venda)
```

Essas funções podem ser `async` desde o começo para manter a forma de uso ao trocar a implementação. Agora trabalham com arrays e objetos locais; depois seus corpos podem usar Firebase. Não criar uma interface, adaptador, flag de backend ou duas implementações em paralelo.

O contexto mantém o estado que as telas precisam compartilhar e atualiza esse estado após as operações. Evitar duas fontes de estado concorrentes e evitar copiar o carrinho para cada tela. Filtros, campos de formulário e abrir/fechar modal ficam na tela correspondente.

## 7. Mocks agora; Firebase depois

Nesta fase:

- Não instalar Firebase nem inicializar projeto, Auth, Firestore, Storage, emuladores ou `.env`.
- Login deve usar uma conta fictícia explícita: `demo@mistergestao.app` / `mister123`.
- Os mesmos produtos devem aparecer na Home, catálogo, carrinho e orçamento; retirar gradualmente os mocks duplicados das views.
- Alterações devem refletir nas outras telas na mesma execução do app.
- Antes da etapa de persistência local, dados em memória podem reiniciar ao fechar/recarregar. Informar isso claramente ao João.
- Não adicionar atrasos artificiais, respostas de API falsas, bibliotecas de mock ou simulações complexas de rede.

Na etapa de persistência, pode-se usar AsyncStorage para salvar os dados fictícios no aparelho. Essa instalação e o arquivo afetado precisam de aprovação. Não chamar isso de sincronização com Firebase.

Na futura integração, adicionar somente o necessário para Firebase Auth/Firestore e substituir as funções de `dados.js`. Conferir as opções atuais de SDK e persistência na documentação antes de escolher. Não presumir que trocar arrays por Firestore entrega automaticamente autenticação, segurança, transações ou sincronização offline.

## 8. Dados e regras essenciais

Usar objetos JavaScript simples. Não criar classes ou arquivos de entidades só para descrevê-los.

| Objeto | Campos mínimos sugeridos |
| --- | --- |
| Usuário mock | `id`, `name`, `email`; sem tratar a senha mock como segurança real. |
| Produto | `id`, `name`, `category`, `brand`, `measure`, `sku`, `code`, `price`, `stock`, `minimum`, `photo` opcional. |
| Item do carrinho | `productId`, `quantity`; consultar o produto para nome e preço enquanto o orçamento é rascunho. |
| Orçamento | `id`, `createdAt`, `validUntil`, `customer`, `items`, `discount`, `freight`, `total`, `notes`, `status`, `saleId` opcional. |
| Item do orçamento salvo | `productId`, `name`, `measure`, `quantity`, `price`; guardar uma cópia dos valores apresentados ao cliente. |
| Venda | `id`, `quoteId` opcional, cliente, itens, desconto, frete, total, pagamento e data. |

**Dinheiro:** `price`, `discount`, `freight` e `total` em centavos inteiros. Ex.: R$ 470,90 = `47090`. Converter apenas na entrada/saída da interface. O Home atual formata valores em reais; ajustar essa função quando começar a usar os dados comuns, sem dividir duas vezes.

Produtos fictícios de referência:

| Produto | Medida | Preço | Saldo | Mínimo | Código |
| --- | --- | --- | --- | --- | --- |
| Pneu Borilli EXC Soft (T) | 110/100-18 | R$ 470,90 | 10 | 3 | DEMO-001 |
| Óleo Repsol Smarter Sport 4T | 15W50 · 1 litro | R$ 54,90 | 18 | 5 | DEMO-002 |
| Câmara reforçada Rinaldi | RD18 | R$ 136,78 | 3 | 3 | DEMO-003 |
| WD-40 Multiuso | 300 ml | R$ 54,90 | 2 | 3 | DEMO-004 |

São dados de demonstração, não uma tabela comercial atualizada da loja.

Regras que não podem ser perdidas:

1. Quantidade inteira e positiva; remover o item quando o usuário decidir excluí-lo.
2. Adicionar de novo o mesmo produto aumenta a quantidade, sem criar linhas duplicadas.
3. Subtotal = soma de preço unitário × quantidade. Total = subtotal − desconto + frete.
4. Desconto de zero até o subtotal; frete não negativo; validar entradas inválidas com mensagem curta.
5. **Gerar, salvar ou compartilhar orçamento não baixa nem reserva estoque.**
6. Um orçamento salvo conserva os itens e preços enviados; uma futura mudança de preço no catálogo não altera o documento antigo.
7. Na conversão, conferir disponibilidade de novo e levar cliente, itens, preços, desconto e frete para a venda.
8. Não converter orçamento cancelado, vencido ou já convertido. Explicar o motivo ao usuário.
9. Só confirmar a venda baixa o estoque. Dois toques no botão não podem registrar duas vendas.
10. Na fase mock, isso é controle local. Na fase Firebase, a garantia entre aparelhos exigirá uma operação atômica/validação correspondente, a ser implementada nessa etapa.
11. Cliente pode ser informado rapidamente por nome e contato opcional; não exigir um CRUD de clientes para conseguir orçar.
12. Status inicial: `open`; aprovação: `approved`; cancelamento: `cancelled`. Uma venda vinculada deve identificar o orçamento como convertido e impedir repetição.

## 9. Como o Codex deve conversar e pedir aprovação

O João quer acompanhar e entender a implementação. Este roteiro exige confirmação por decisão de implementação e por arquivo alterado.

### Antes de editar

O Codex pode ler arquivos, consultar documentação e executar verificações não destrutivas sem interromper a cada leitura. Antes de uma alteração, deve dizer:

> Estamos na etapa [número/tela]. O próximo arquivo é `[caminho]`. Vou [alteração concreta] porque [motivo curto]. Isso permite [resultado]. Posso fazer somente essa alteração?

Esperar a resposta. Aprovar uma tela não significa aprovar automaticamente todos os arquivos da lista. Se o usuário responder apenas “pode”, aplicar a alteração concreta recém-proposta, não o projeto inteiro.

Instalar dependências, atualizar versões, alterar arquitetura, excluir arquivos e fazer commit/push precisam ser apresentados e autorizados separadamente. Consultar o diff para não sobrescrever trabalho do João.

### Depois de editar

1. Explicar a mudança em poucas linhas, referenciando o arquivo.
2. Verificar o que for possível com as dependências atuais.
3. Dar um teste manual curto e específico.
4. Informar pendências reais; não dizer que testou no celular se não testou.
5. Pedir que João valide e confirmar o próximo arquivo antes de continuar.

Formato de fechamento:

> Arquivo feito: [...]. Para testar: [...]. Verificações: [...]. Esta parte ficou como você queria? O próximo arquivo seria [...] para [...]; posso seguir?

Se a execução falhar no próprio arquivo autorizado, pode corrigir esse mesmo arquivo dentro do escopo combinado e informar o ajuste. Se a correção exigir outro arquivo ou instalação, explicar e pedir a nova confirmação antes.

Não encerrar uma etapa afirmando que o fluxo inteiro está pronto quando ainda existem rotas ou botões pendentes. Não pular para a próxima tela sem retorno do João.

## 10. Roteiro de implementação

Todos os caminhos a seguir são relativos à pasta **do app**, `MisterGestao/`. São arquivos candidatos, não uma lista para gerar antecipadamente. Se o código local tiver equivalente funcional, reutilizar e reduzir o plano.

### Etapa 0 — analisar e combinar o primeiro passo

Sem editar arquivos:

1. Ler todos os `AGENTS.md` aplicáveis, este guia e `package.json`.
2. Confirmar a pasta do app e ver `git status`/diff.
3. Ler `src/app/index.tsx`, Login, Home, CadastroProduto e `app.json`.
4. Conferir arquivos de imagens ausentes e a configuração de navegação.
5. Consultar o protótipo local da tela Login.
6. Dizer o que já existe e propor a menor alteração inicial. Esperar aprovação.

Não recriar o Expo, rodar `reset-project`, mudar o SDK ou reorganizar pastas.

### Etapa 1 — Login mock e navegação mínima

Objetivo: abrir no Login e entrar na Home com a conta fictícia.

Ordem sugerida, **um arquivo por aprovação**:

1. `src/data/dados.js`: criar somente o usuário mock e a função simples de login.
2. `src/context/AppContext.js`: criar o contexto apenas com usuário, entrar e sair; o carrinho entra depois.
3. `src/app/_layout.tsx`: colocar o provider e o navegador necessários, conforme o Router instalado.
4. `src/app/home.tsx`: rota pequena para a Home já existente.
5. `src/view/Login.js`: reaproveitar o visual, remover a espera artificial e ligar o login mock à navegação; tratar campos vazios/credenciais inválidas e mostrar/ocultar senha.
6. `src/app/index.tsx`: apresentar Login e direcionar o usuário conforme a sessão mock. Não deixar a rota Home contornar o controle de sessão combinado.

Concluir a proteção/retorno de rota no arquivo de layout ou rota pertinente, com nova confirmação se necessário. Não inventar um sistema de autenticação real.

Teste com João: campo vazio; credencial inválida; entrar; voltar pelo sistema; sair e tentar voltar à Home. Confirmar antes se a sessão deve sobreviver ao fechamento — padrão inicial: não precisa.

### Etapa 2 — Home do administrador

Objetivo: reaproveitar `src/view/Home.js` e incluir a entrada **Monte um orçamento**.

Arquivos, em ordem:

1. `src/data/dados.js`: adicionar os produtos mockados de referência e a consulta simples.
2. `src/context/AppContext.js`: compartilhar os produtos quando necessário para as próximas telas.
3. `src/view/Home.js`: retirar o `MOCK_DATA` duplicado, consultar os dados compartilhados e exibir alertas conforme `stock <= minimum`.

Manter a tela enxuta; não criar um dashboard financeiro. Nesta entrega, botões de telas ainda não implementadas são pendências, não funcionalidades concluídas. Ligar cada ação na etapa da sua rota.

Teste: conferir nome, marca, valores iniciais e os dois produtos de estoque baixo. Comparar a aparência no celular com a referência. Pedir validação.

### Etapa 3 — Produtos e entrada no carrinho

Objetivo: consultar produtos, pesquisar e escolher o que o cliente pediu.

1. `src/context/AppContext.js`: adicionar `carrinho` e operações claras de adicionar, alterar quantidade e remover. Não usar um segundo carrinho nesta primeira versão nativa; confirmar se João quiser separar vendas diretas e orçamentos.
2. `src/view/Produtos.js`: lista com nome, medida, preço, saldo, pesquisa e botão adicionar. Usar os mesmos dados da Home.
3. `src/app/produtos.tsx`: rota pequena para a view.
4. `src/view/Home.js`: ligar **Monte um orçamento** e o acesso a produtos.

Não instalar biblioteca de busca. Categoria simples pode entrar nessa tela se João aprovar. Mostrar quantidade de itens escolhidos; o acesso ao carrinho será ligado quando sua rota existir.

Teste: buscar nome/medida, pesquisa sem resultado, adicionar o mesmo produto duas vezes e conferir uma linha com quantidade dois. Não alterar estoque.

### Etapa 4 — Cadastro de produto

Objetivo: completar o arquivo que já existe, sem criar uma segunda tela equivalente.

1. `src/data/dados.js`: função simples de salvar produto no mock.
2. `src/context/AppContext.js`: atualização compartilhada da lista depois do cadastro.
3. `src/view/CadastroProduto.js`: nome, categoria/marca/medida, preço, quantidade e estoque mínimo; foto e código podem começar opcionais.
4. `src/app/cadastro-produto.tsx`: rota para a tela.
5. `src/view/Produtos.js`: ligar o botão **+** à rota criada.

Preço positivo; saldo/mínimo inteiros não negativos. Não incluir edição, exclusão, upload de foto e cadastro de marcas sem combinar. Usar imagem opcional/placeholder inicialmente; assets reais só quando aprovados.

Teste: cadastrar um produto válido e vê-lo na lista; impedir campos obrigatórios vazios e números inválidos. Verificar se a Home reflete um produto abaixo do mínimo.

### Etapa 5 — Carrinho e revisão do orçamento

Objetivo: mostrar a seleção e reunir os dados mínimos do orçamento.

1. `src/view/Carrinho.js`: itens, quantidade +/−, remover, subtotal, cliente opcional, desconto, frete, validade e observações. Estados de formulário ficam na tela; ao gerar, produzir uma cópia salva com esses valores.
2. `src/app/carrinho.tsx`: rota para a view.
3. `src/view/Produtos.js`: ligar o botão/ícone do carrinho com contador; incluir **Adicionar mais produtos** no fluxo pelo arquivo pertinente.

Sem cadastros adicionais para conseguir orçar. Sem criar objetos genéricos de formulário. Não salvar orçamento ainda se essa operação depender da próxima etapa; informar a pendência em vez de fingir geração.

Teste: alterar quantidade, excluir um item, carrinho vazio e totais. Exemplo verificável: 2 pneus de R$ 470,90 + 1 óleo de R$ 54,90 − R$ 20,00 de desconto + R$ 15,00 de frete = **R$ 991,70**.

### Etapa 6 — Gerar e visualizar o orçamento

Objetivo: transformar o carrinho em um documento com valores preservados.

1. `src/data/dados.js`: incluir salvar/listar orçamento e gerar ID simples. Copiar dados dos itens, sem guardar referência mutável ao preço do catálogo.
2. `src/context/AppContext.js`: atualizar a lista compartilhada após salvar; limpar o rascunho/carrinho somente depois do salvamento bem-sucedido.
3. `src/view/Orcamento.js`: card com logo, número, cliente, validade, itens, valores e total. Receber/consultar o orçamento por ID; não passar um objeto inteiro serializado pela URL.
4. `src/app/orcamento.tsx`: rota do orçamento.
5. `src/view/Carrinho.js`: ligar **Gerar orçamento**, validar os dados, salvar e navegar ao documento criado.

Teste: gerar o exemplo anterior, conferir total de R$ 991,70 e confirmar que o estoque permanece igual. Alterar um preço no mock de forma controlada para verificar que o orçamento salvo não muda.

### Etapa 7 — Compartilhar o orçamento

Objetivo: enviar um conteúdo legível pelo compartilhamento do aparelho.

1. `src/view/Orcamento.js`: começar com compartilhamento do resumo em texto, usando a API apropriada do React Native após consultar a documentação. O contato e o aplicativo de destino são escolhidos pelo usuário.
2. Card em imagem: apresentar a menor solução compatível com o Expo atual e as dependências necessárias; instalar somente após aprovação. Se justificar separar, criar um único `src/components/CardOrcamento.js`; não criar uma biblioteca inteira de componentes.
3. No arquivo pertinente, capturar o card/renderização com a solução aprovada e compartilhar o arquivo pela API compatível. Não usar o canvas do protótipo web no React Native.

Confirmar texto/WhatsApp primeiro; depois validar imagem/Instagram no aparelho. Compartilhar texto não significa que o card em imagem está pronto. Não prometer envio direto ao Instagram ou contato escolhido sem verificar o suporte.

Teste: abrir menu de compartilhamento; cancelar sem erro; compartilhar texto; quando autorizado e implementado, compartilhar a imagem e conferir se o card inteiro aparece. Isso não deve registrar venda nem baixar estoque.

### Etapa 8 — Orçamentos salvos

1. `src/view/Orcamentos.js`: lista com cliente, data/validade, status e total; estado vazio com acesso a novo orçamento.
2. `src/app/orcamentos.tsx`: rota da lista.
3. `src/view/Home.js`: ligar **Orçamentos salvos**.
4. `src/data/dados.js`: atualização simples de status, se ainda não existir.
5. `src/view/Orcamento.js`: aprovação/cancelamento conforme combinado, preservando o documento.

Teste: criar dois orçamentos, abrir o correto pelo ID e conferir seus itens. Cancelar não altera estoque. Antes de AsyncStorage, explicar que essa lista é mantida apenas durante a execução.

**Marco do MVP prioritário:** Login → Home → Produtos → Carrinho → Orçamento → Compartilhar → Consultar salvos. Validar esse fluxo com João antes de expandir.

### Etapa 9 — Nova venda e conversão de orçamento

1. `src/data/dados.js`: validar se orçamento pode ser convertido, inclusive validade, cancelamento e conversão anterior.
2. `src/context/AppContext.js`: preparar a venda com os itens/preços do orçamento e vincular seu ID; ainda sem baixa de estoque.
3. `src/view/NovaVenda.js`: revisar itens e cliente. Reutilizar o que de fato se repetir; não duplicar todo o carrinho sem necessidade.
4. `src/app/nova-venda.tsx`: rota da venda.
5. `src/view/Orcamento.js`: ligar **Converter em venda**.
6. `src/view/Home.js`: ligar **Nova venda**, se venda direta estiver aprovada no escopo.

Se já houver uma venda/carrinho em andamento, avisar antes de substituir seus itens. Voltar da venda não deve apagar o orçamento salvo.

Teste: conversão mantém cliente, preços, desconto e frete; estoque ainda igual; conversão inválida mostra mensagem clara.

### Etapa 10 — Finalizar venda

1. `src/data/dados.js`: registro mock com verificação de estoque, identificação única e proteção contra repetição.
2. `src/context/AppContext.js`: atualizar produtos e vendas em conjunto após confirmação, e vincular a venda ao orçamento.
3. `src/view/FinalizarVenda.js`: retirada/entrega, frete, endereço quando necessário, meio de pagamento e confirmação. Registro demonstrativo, sem processar pagamento.
4. `src/app/finalizar-venda.tsx`: rota da confirmação.
5. `src/view/NovaVenda.js`: ligar o botão continuar.

Teste: conferir estoque imediatamente antes de registrar; impedir saldo negativo, desconto inválido e confirmação duplicada; falha não pode deixar parte da venda registrada e parte do estoque alterado. A fase mock é local, não uma garantia de concorrência entre aparelhos.

### Etapa 11 — Recibo e resumo da Home

1. `src/view/Recibo.js`: recibo demonstrativo com dados da venda efetivamente salva.
2. `src/app/recibo.tsx`: rota por ID.
3. `src/view/FinalizarVenda.js`: navegar somente após confirmação bem-sucedida.
4. `src/view/Home.js`: calcular vendas/recebimentos do dia usando as vendas locais; filtrar pela data, não somar todo o histórico.

Teste: número, itens e total do recibo correspondem à venda; compartilhar não duplica a venda. O app não deve apresentar recibo demonstrativo como nota fiscal.

### Etapa 12 — Scanner e recursos do aparelho

Somente após o fluxo manual estar aprovado:

1. Confirmar instalação do módulo compatível e ler a documentação do SDK instalado.
2. `src/view/Scanner.js`: pedir permissão da câmera quando o recurso for aberto; tratar recusa e oferecer busca manual; procurar o produto pelo código.
3. `src/app/scanner.tsx`: rota.
4. `src/view/Produtos.js` ou `Home.js`: ligar o atalho, um arquivo por vez.

Impedir que uma única leitura repetida dispare inclusões sem controle. Diferenciar código não encontrado de permissão negada.

Foto de produto e abertura de rota de entrega no mapa são incrementos independentes. GPS/cálculo automático de frete não são necessários para montar o primeiro orçamento; só entram quando João aprovar.

### Etapa 13 — Persistência local e teste sem internet

Confirmar o escopo antes de instalar AsyncStorage.

1. Dependência compatível, após aprovação.
2. `src/data/dados.js`: carregar/salvar produtos, orçamentos e vendas fictícias em uma chave versionada simples. Evitar sobrescrever os dados salvos com mocks antes de terminar a leitura inicial.
3. `src/context/AppContext.js`: refletir o carregamento e evitar interações que dependam de dados ainda não prontos.

Teste: criar orçamento, fechar e reabrir; dados continuam; modo avião não bloqueia consultas locais nem orçamento. Não gravar senha em texto puro. Não criar fila de sincronização com um backend que ainda não existe.

**Offline real com nuvem** será outra entrega: escolher e validar estratégia do SDK, operações pendentes, conflitos de estoque e tentativas sem duplicar vendas. O badge “sincronizado” exige confirmação real do backend.

### Etapa 14 — Firebase, somente quando João solicitar

Antes de editar: perguntar se o fluxo mock já está aprovado e quais dados fictícios devem ser preservados/descartados. Isso não está autorizado nesta fase.

Roteiro futuro: confirmar SDK compatível; configurar Firebase; implementar Auth e Firestore nas funções de dados; proteger as coleções por usuário/loja; validar a persistência da sessão; registrar venda/estoque com integridade; testar erros, reconexão e concorrência. Não levar senha mock ou regras abertas para produção.

Só nessa etapa criar configuração Firebase e arquivos extras que realmente forem necessários. Não reescrever todas as telas nem criar servidor próprio para justificar a integração.

## 11. Verificação de cada incremento

- Rodar os checks já exigidos pelo `MisterGestao/AGENTS.md`, incluindo lint e typecheck. Distinguir erros anteriores dos introduzidos pelo arquivo atual.
- Rodar comandos na pasta que contém o `package.json` do app: `MisterGestao/`.
- Não instalar ferramentas de teste nem mudar versões apenas para obter um resultado verde sem combinar.
- Testar no celular quando a mudança depender de teclado, câmera, compartilhamento ou persistência nativa. Expo web não prova o comportamento nativo.
- Para valores/estoque, verificar os casos de borda relevantes; evitar testes que apenas reproduzam o próprio código.
- Se uma etapa ainda não pode ser testada inteira porque a próxima rota não existe, dizer exatamente o que foi verificado e qual ligação falta.
- Pedir validação visual do João antes de seguir para outra tela.

## 12. Primeira resposta esperada do Codex

> Li o guia e as regras do repositório. Encontrei [situação atual]. Nesta fase usaremos somente dados mockados, mantendo Firebase para depois. Vou preservar `src/view/` e o Expo Router. Para começar pelo Login, proponho [um único arquivo e alteração]. Posso fazer esse primeiro arquivo?

Não precisa repetir o guia inteiro nem gerar uma nova arquitetura. O objetivo é começar por uma alteração pequena que João consiga entender e testar.

## 13. Fontes e limites da preparação

- Código consultado diretamente no repositório Git, no commit registrado na seção 3. Não foi alterado nem enviado commit para o repositório do João.
- Referência visual e funcional: cópia do código do GPT Site fornecida junto deste guia. O protótipo completo é mais amplo que o primeiro marco de orçamento; não implementar todas as suas telas no primeiro pedido.
- Instruções do Codex: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- SDK consultado: https://docs.expo.dev/versions/v57.0.0/
- Navegação: https://docs.expo.dev/router/introduction/
- Integração futura com Firebase: https://docs.expo.dev/guides/using-firebase/

Antes de programar uma API Expo/React Native, reler a versão do projeto e sua documentação correspondente. Os links gerais podem mudar com novos SDKs. Não atualizar o app por existir uma versão mais recente.
